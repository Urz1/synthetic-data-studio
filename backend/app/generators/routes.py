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


@router.get("/{generator_id}/privacy-report")
def get_privacy_report(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get comprehensive privacy report for a DP-enabled generator."""
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # Check if this is a DP model
    if not generator.type.startswith('dp-'):
        raise HTTPException(
            status_code=400,
            detail="Privacy reports are only available for DP-enabled generators (dp-ctgan, dp-tvae)"
        )
    
    # Check if training has completed
    if not generator.privacy_spent:
        return {
            "status": "not_trained",
            "message": "Model not trained yet. No privacy budget spent.",
            "generator_id": generator_id,
            "model_type": generator.type
        }
    
    # Generate comprehensive privacy report
    from app.services.privacy.privacy_report_service import PrivacyReportService
    
    report = PrivacyReportService.generate_privacy_report(
        generator_id=generator.id,
        model_type=generator.type,
        privacy_config=generator.privacy_config or {},
        privacy_spent=generator.privacy_spent or {},
        training_metadata=generator.training_metadata or {}
    )
    
    return report


@router.post("/dp/validate-config")
def validate_dp_config(
    dataset_id: str,
    generator_type: str,
    epochs: int,
    batch_size: int,
    target_epsilon: float = 10.0,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Validate DP configuration before training to prevent privacy failures.
    Returns validation results and recommendations.
    """
    # Verify dataset exists
    from app.datasets.crud import get_dataset_by_id
    import pandas as pd
    from pathlib import Path
    from app.core.config import settings
    
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Load dataset to get size
    file_path = Path(settings.upload_dir) / dataset.original_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file not found")
    
    df = pd.read_csv(file_path)
    dataset_size = len(df)
    
    # Validate configuration
    from app.services.privacy.dp_config_validator import DPConfigValidator
    
    is_valid, errors, warnings = DPConfigValidator.validate_config(
        dataset_size=dataset_size,
        epochs=epochs,
        batch_size=batch_size,
        target_epsilon=target_epsilon
    )
    
    # Get recommended config
    recommended = DPConfigValidator.get_recommended_config(
        dataset_size=dataset_size,
        target_epsilon=target_epsilon,
        desired_quality="balanced"
    )
    
    return {
        "is_valid": is_valid,
        "errors": errors,
        "warnings": warnings,
        "requested_config": {
            "dataset_size": dataset_size,
            "epochs": epochs,
            "batch_size": batch_size,
            "target_epsilon": target_epsilon,
            "sampling_rate": f"{batch_size / dataset_size:.1%}"
        },
        "recommended_config": recommended
    }


@router.get("/dp/recommended-config")
def get_recommended_config(
    dataset_id: str,
    target_epsilon: float = 10.0,
    desired_quality: str = "balanced",  # "high_privacy", "balanced", "high_quality"
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get recommended DP configuration for a dataset.
    Quality options: high_privacy (ε<5), balanced (ε≈10), high_quality (ε≈15)
    """
    # Verify dataset exists
    from app.datasets.crud import get_dataset_by_id
    import pandas as pd
    from pathlib import Path
    from app.core.config import settings
    
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Load dataset to get size
    file_path = Path(settings.upload_dir) / dataset.original_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file not found")
    
    df = pd.read_csv(file_path)
    dataset_size = len(df)
    
    # Get recommended config
    from app.services.privacy.dp_config_validator import DPConfigValidator
    
    recommended = DPConfigValidator.get_recommended_config(
        dataset_size=dataset_size,
        target_epsilon=target_epsilon,
        desired_quality=desired_quality
    )
    
    return {
        "dataset_id": dataset_id,
        "dataset_name": dataset.name,
        "dataset_size": dataset_size,
        "desired_quality": desired_quality,
        "recommended_config": recommended
    }


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
