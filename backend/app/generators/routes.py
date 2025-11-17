from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session
from app.core.dependencies import get_db, get_current_user
from .models import Generator, SchemaInput
from .crud import get_generators, create_generator, get_generator_by_id, update_generator_status
from .services import generate_synthetic_data, _generate_from_schema
from app.datasets.models import Dataset
import uuid

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


@router.post("/dataset/{dataset_id}/generate")
def generate_from_dataset(
    dataset_id: str,
    generator_type: str = "ctgan",
    num_rows: int = 1000,
    epochs: int = 50,
    batch_size: int = 500,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Generate synthetic data from an existing dataset."""
    # Verify dataset exists
    from app.datasets.crud import get_dataset_by_id
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Create a generator record
    generator = Generator(
        dataset_id=uuid.UUID(dataset_id),
        type=generator_type,
        parameters_json={
            "num_rows": num_rows,
            "epochs": epochs,
            "batch_size": batch_size
        },
        name=f"{dataset.name}_{generator_type}_gen",
        created_by=current_user.id
    )

    generator = create_generator(db, generator)

    # Start generation
    update_generator_status(db, str(generator.id), "running")

    if background_tasks:
        background_tasks.add_task(_generate_in_background, str(generator.id), db)
        return {"message": "Generation started", "generator_id": str(generator.id)}
    else:
        # Synchronous generation for testing
        try:
            output_dataset = generate_synthetic_data(generator, db)
            update_generator_status(db, str(generator.id), "completed", str(output_dataset.id))
            return {"message": "Generation completed", "generator_id": str(generator.id), "output_dataset_id": str(output_dataset.id)}
        except Exception as e:
            update_generator_status(db, str(generator.id), "failed")
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


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
