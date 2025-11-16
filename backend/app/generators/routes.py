from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session
from app.core.dependencies import get_db, get_current_user
from .models import Generator, SchemaInput
from .crud import get_generators, create_generator, get_generator_by_id, update_generator_status
from .services import generate_synthetic_data, _generate_from_schema
from app.datasets.models import Dataset

router = APIRouter(prefix="/generators", tags=["generators"])


@router.get("/", response_model=list[Generator])
def list_generators(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_generators(db)


@router.get("/{generator_id}", response_model=Generator)
def get_generator(generator_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    return generator


@router.post("/", response_model=Generator)
def create_new_generator(generator: Generator, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    generator.created_by = current_user.id
    return create_generator(db, generator)


@router.post("/schema/generate", response_model=Dataset)
def generate_from_schema(
    schema_input: SchemaInput,
    num_rows: int = 1000,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Generate synthetic data directly from schema without creating a generator record."""
    # Create a temporary generator object
    temp_generator = Generator(
        dataset_id=None,
        schema_json=schema_input.columns,
        type="schema",
        parameters_json={"num_rows": num_rows},
        name="schema_generated",
        created_by=current_user.id
    )

    return _generate_from_schema(temp_generator, db)


@router.post("/{generator_id}/generate")
def start_generation(
    generator_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Start synthetic data generation for a generator."""
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")

    # Update status to running
    update_generator_status(db, generator_id, "running")

    # Add background task
    background_tasks.add_task(_generate_in_background, generator_id, db)

    return {"message": "Generation started", "generator_id": generator_id}


def _generate_in_background(generator_id: str, db: Session):
    """Background task to generate synthetic data."""
    try:
        generator = get_generator_by_id(db, generator_id)
        if not generator:
            return

        # Generate the data
        output_dataset = generate_synthetic_data(generator, db)

        # Update generator with completed status and output dataset
        update_generator_status(db, generator_id, "completed", str(output_dataset.id))

    except Exception as e:
        # Update status to failed
        update_generator_status(db, generator_id, "failed")
        print(f"Generation failed for {generator_id}: {str(e)}")
