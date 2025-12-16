"""Generator API endpoints."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import logging
import uuid
from pathlib import Path
from typing import Optional, Dict, Any

# Third-party
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session
from sqlmodel import select


# Local - Core
from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.core.validators import validate_uuid
from app.database.database import SessionLocal

# Local - Storage
from app.storage.s3 import (
    get_storage_service,
    S3ConfigurationError,
    S3StorageError,
)

# Local - Services
from app.datasets.repositories import get_dataset_by_id
from app.evaluations.repositories import list_evaluations_by_generator
from app.services.llm.compliance_writer import ComplianceWriter
from app.services.privacy.dp_config_validator import DPConfigValidator
from app.services.privacy.privacy_report_service import PrivacyReportService

# Local - Module
from .models import Generator
from .repositories import (
    get_generators,
    create_generator,
    get_generator_by_id,
    update_generator_status,
    delete_generator
)
from .schemas import (
    SchemaInput,
    MLGenerationConfig,
    GeneratorResponse,
    GeneratorCreateRequest,
    GeneratorDeleteResponse,
    GenerationStartRequest,
    GenerationStartResponse
)
from .services import generate_synthetic_data, _generate_from_schema

# Jobs integration
from app.jobs.models import Job
from app.jobs.repositories import create_job, update_job_status

# NOTE: train_generator_task is imported inside the route function to avoid circular import

# ============================================================================
# SETUP
# ============================================================================

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generators", tags=["generators"])

# S3 storage flag
_s3_available: Optional[bool] = None

def is_s3_available() -> bool:
    """Check if S3 storage is configured."""
    global _s3_available
    if _s3_available is None:
        try:
            get_storage_service()
            _s3_available = True
        except S3ConfigurationError:
            _s3_available = False
    return _s3_available

# ============================================================================
# ENDPOINTS
# ============================================================================

def _list_generators_impl(
    dataset_id: Optional[str],
    skip: int,
    limit: int,
    db: Session,
    current_user
) -> list[GeneratorResponse]:
    """Implementation for listing generators."""
    # SECURITY: Filter to only return generators created by current user
    statement = select(Generator).where(Generator.created_by == current_user.id)
    
    # Optional filter by dataset
    if dataset_id:
        validate_uuid(dataset_id, "dataset_id")
        statement = statement.where(Generator.dataset_id == uuid.UUID(dataset_id))
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    
    generators = db.exec(statement).all()
    return generators


@router.get("", response_model=list[GeneratorResponse])
@router.get("/", response_model=list[GeneratorResponse])
def list_generators(
    dataset_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> list[GeneratorResponse]:
    """List all generators for the current user."""
    return _list_generators_impl(dataset_id, skip, limit, db, current_user)


@router.get("/{generator_id}", response_model=GeneratorResponse)
def get_generator(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> GeneratorResponse:
    """Get a specific generator by ID."""
    validate_uuid(generator_id, "generator_id")
    
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # SECURITY: Ownership check
    if generator.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this generator")
    
    return generator


@router.delete("/{generator_id}")
def delete_generator_endpoint(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> GeneratorDeleteResponse:
    """Delete a generator and its associated model from S3."""
    validate_uuid(generator_id, "generator_id")
    
    # Get generator first to access S3 key
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # SECURITY: Ownership check
    if generator.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this generator")
    
    # Delete model from S3 if exists
    if is_s3_available() and generator.s3_model_key:
        try:
            storage = get_storage_service()
            storage.delete_file(generator.s3_model_key)
            logger.info(f"Deleted model from S3: {generator.s3_model_key}")
        except S3StorageError as e:
            logger.warning(f"S3 model delete failed: {e}")
    
    # Delete local model file if exists
    if generator.model_path:
        model_path = Path(generator.model_path)
        if model_path.exists():
            model_path.unlink()
            logger.info(f"Deleted local model: {model_path}")
    
    # Delete from database
    deleted = delete_generator(db, generator_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    return GeneratorDeleteResponse(
        message="Generator deleted successfully",
        id=generator_id
    )


@router.get("/{generator_id}/download-model")
def download_generator_model(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Download the trained model file for a generator.
    
    Returns a presigned S3 URL (valid for 1 hour) or falls back to local file.
    """
    validate_uuid(generator_id, "generator_id")
    
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # SECURITY: Ownership check
    if generator.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to download this model")
    
    # Check if model exists
    if generator.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Model not ready. Generator status: {generator.status}"
        )
    
    if not generator.model_path and not generator.s3_model_key:
        raise HTTPException(
            status_code=404,
            detail="No trained model found for this generator"
        )
    
    # Try S3 first
    if is_s3_available() and generator.s3_model_key:
        try:
            storage = get_storage_service()
            download_url = storage.generate_download_url(
                key=generator.s3_model_key,
                filename=f"{generator.name}_{generator.type}.pkl",
                expires_in=3600
            )
            return {
                "download_url": download_url,
                "expires_in": 3600,
                "filename": f"{generator.name}_{generator.type}.pkl",
                "storage": "s3"
            }
        except S3StorageError as e:
            logger.warning(f"S3 download failed, checking local: {e}")
    
    # Fallback to local file info
    if generator.model_path:
        model_path = Path(generator.model_path)
        if model_path.exists():
            return {
                "message": "Model available locally. Use /download-model-file endpoint.",
                "filename": model_path.name,
                "size_bytes": model_path.stat().st_size,
                "storage": "local"
            }
    
    raise HTTPException(
        status_code=404,
        detail="Model file not found in S3 or local storage"
    )


@router.get("/{generator_id}/download-model-file")
def download_generator_model_file(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Download the trained model file directly (for local storage fallback).
    
    Use /download-model first to get presigned S3 URL when available.
    """
    from fastapi.responses import FileResponse
    
    validate_uuid(generator_id, "generator_id")
    
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # SECURITY: Ownership check
    if generator.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to download this model")
    
    if not generator.model_path:
        raise HTTPException(status_code=404, detail="No model path found")
    
    model_path = Path(generator.model_path)
    if not model_path.exists():
        raise HTTPException(status_code=404, detail="Model file not found on disk")
    
    return FileResponse(
        path=model_path,
        filename=f"{generator.name}_{generator.type}.pkl",
        media_type="application/octet-stream"
    )


@router.get("/{generator_id}/details")
@router.get("/{generator_id}/details/")
def get_generator_details(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get generator with dataset and evaluations in a single call.
    OPTIMIZATION: Reduces multiple API calls to 1.
    """
    # Get generator and verify ownership
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    if generator.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get source dataset
    dataset = None
    if generator.dataset_id:
        dataset = get_dataset_by_id(db, str(generator.dataset_id))
    
    # Get evaluations for this generator
    evaluations = list_evaluations_by_generator(db, generator_id)
    
    return {
        "generator": generator,
        "dataset": dataset,
        "evaluations": evaluations,
        "stats": {
            "evaluation_count": len(evaluations)
        }
    }


@router.post("/", response_model=GeneratorResponse)
def create_new_generator(
    request: GeneratorCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> GeneratorResponse:
    """Create a new generator."""
    # Convert request schema to DB model
    generator_data = request.dict(exclude_unset=True)
    generator = Generator(**generator_data)
    generator.created_by = current_user.id
    
    return create_generator(db, generator)


@router.post("/schema/generate")
def generate_from_schema(
    schema_input: SchemaInput,
    num_rows: int = 1000,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate synthetic data directly from schema.
    
    Creates a 'schema' type Generator record to track the lineage/source 
    of this synthetic dataset, ensuring it appears in listing endpoints.
    """
    # Create persistent generator record
    dataset_name = schema_input.dataset_name or "schema_generated"
    
    generator = Generator(
        dataset_id=None,
        schema_json=schema_input.columns,
        type="schema",
        parameters_json={
            "num_rows": num_rows,
            "project_id": str(schema_input.project_id) if schema_input.project_id else None,
            "dataset_name": dataset_name
        },
        name=f"Schema: {dataset_name}",
        created_by=current_user.id,
        status="running" # Set initial status
    )
    
    db.add(generator)
    db.commit()
    db.refresh(generator)
    
    try:
        # Generate data
        output_dataset = _generate_from_schema(generator, db)
        
        # Update generator with linkage and status
        generator.output_dataset_id = output_dataset.id
        generator.status = "completed"
        db.add(generator)
        db.commit()
        
        # EXPLICITLY RETURN DICT to avoid serialization issues
        return {
            "id": str(output_dataset.id),
            "name": output_dataset.name,
            "status": output_dataset.status,
            "row_count": output_dataset.row_count,
            "output_dataset_id": str(output_dataset.id), # Explicitly satisfy frontend expectation
            "type": "schema"
        }
        
    except Exception as e:
        # Mark generator as failed if something goes wrong
        generator.status = "failed"
        db.add(generator)
        db.commit()
        raise e


@router.post("/dataset/{dataset_id}/generate")
def generate_from_dataset(
    dataset_id: str,
    config: MLGenerationConfig,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate synthetic data from an existing dataset.
    
    Args:
        dataset_id: ID of the dataset to use for training
        config: Configuration parameters (model type, epochs, privacy, etc.)
    """
    # Extract parameters from config
    generator_type = config.model_type
    num_rows = config.num_rows
    epochs = config.epochs
    batch_size = config.batch_size
    target_epsilon = config.target_epsilon if config.use_differential_privacy else None
    
    # Verify dataset exists
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Validate num_rows
    if num_rows is not None:
        if num_rows < 100:
            raise HTTPException(status_code=400, detail="num_rows must be at least 100")
        if num_rows > 1_000_000:
            raise HTTPException(status_code=400, detail="num_rows cannot exceed 1,000,000")

    # Create a generator record
    generator = Generator(
        dataset_id=uuid.UUID(dataset_id),
        type=generator_type,
        parameters_json={
            "num_rows": num_rows,
            "epochs": epochs,
            "batch_size": batch_size,
            "target_epsilon": target_epsilon,
            "use_differential_privacy": config.use_differential_privacy,
            "max_grad_norm": config.max_grad_norm
        },
        name=f"{dataset.name}_{generator_type}_{uuid.uuid4().hex[:4]}",
        created_by=current_user.id
    )

    generator = create_generator(db, generator)

    # Create Job record to track this task
    job = Job(
        project_id=dataset.project_id,
        initiated_by=current_user.id,
        dataset_id=uuid.UUID(dataset_id),
        generator_id=generator.id,
        type="training",
        status="pending"
    )
    job = create_job(db, job)

    # Start generation
    update_generator_status(db, str(generator.id), "queued")
    update_job_status(db, str(job.id), "queued")

    # Dispatch to Celery (lazy import to avoid circular import)
    from app.tasks.generators import train_generator_task
    task = train_generator_task.delay(str(generator.id), str(job.id))
    
    # Update job with Celery task ID
    job.celery_task_id = task.id
    db.add(job)
    db.commit()

    return {
        "message": "Generation queued",
        "generator_id": str(generator.id),
        "job_id": str(job.id),
        "task_id": task.id
    }


@router.post("/{generator_id}/generate")
def start_generation(
    generator_id: str,
    request: Optional[GenerationStartRequest] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> GenerationStartResponse:
    """Start synthetic data generation for a generator."""
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # SECURITY: Ownership check
    if generator.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to generate from this model")

    # Update generator parameters with request data if provided
    if request:
        params = generator.parameters_json or {}
        if request.num_rows:
            params['num_rows'] = request.num_rows
        if request.dataset_name:
            params['dataset_name'] = request.dataset_name
        if request.project_id:
            params['project_id'] = request.project_id
        generator.parameters_json = params
        db.add(generator)
        db.commit()
        db.refresh(generator)

    # Create Job record to track this task
    job = Job(
        project_id=generator.dataset_id if generator.dataset_id else uuid.uuid4(),  # Use dataset's project or create temp
        initiated_by=current_user.id,
        generator_id=uuid.UUID(generator_id),
        type="generation",
        status="pending"
    )
    job = create_job(db, job)

    # Update status to running
    update_generator_status(db, generator_id, "running")
    update_job_status(db, str(job.id), "running")

    # Add background task (don't pass db session, create new one in background)
    background_tasks.add_task(_generate_in_background, generator_id, str(job.id))

    return GenerationStartResponse(
        message="Generation started",
        generator_id=generator_id,
        job_id=str(job.id)
    )


@router.get("/{generator_id}/privacy-report")
def get_privacy_report(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get comprehensive privacy report for a DP-enabled generator."""
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # SECURITY: Ownership check
    if generator.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this privacy report")
    
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
    report = PrivacyReportService.generate_privacy_report(
        generator_id=generator.id,
        model_type=generator.type,
        privacy_config=generator.privacy_config or {},
        privacy_spent=generator.privacy_spent or {},
        training_metadata=generator.training_metadata or {}
    )
    
    return report


@router.get("/dp/parameter-limits/{dataset_id}")
def get_dp_parameter_limits(
    dataset_id: str,
    target_epsilon: float = 10.0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get strict parameter limits for DP generators based on dataset size.
    
    Call this BEFORE submitting a generation request to show valid ranges in the UI.
    
    Returns:
        - batch_size: min, max, recommended
        - epochs: min, max, recommended
        - epsilon: min, max, recommended_range
        - auto_adjusted: If user's intended params are out of range, shows corrected values
    """
    from app.services.privacy.dp_config_validator import DPConfigValidator
    
    # Verify dataset exists
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Get dataset size
    try:
        df = pd.read_csv(dataset.file_path)
        dataset_size = len(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read dataset: {str(e)}")
    
    # Get parameter limits
    limits = DPConfigValidator.get_parameter_limits(dataset_size, target_epsilon)
    
    # Get recommended config
    recommended = DPConfigValidator.get_recommended_config(
        dataset_size=dataset_size,
        target_epsilon=target_epsilon,
        desired_quality="balanced"
    )
    
    return {
        "dataset_id": dataset_id,
        "dataset_name": dataset.name,
        "dataset_size": dataset_size,
        "parameter_limits": limits,
        "recommended_config": recommended,
        "notes": {
            "batch_size": "Must be between min and max. Larger batches = fewer steps but harder to achieve target epsilon.",
            "epochs": "More epochs = better model quality but consumes more privacy budget.",
            "epsilon": "Lower = stronger privacy but lower data quality. Range 1-20 recommended for most use cases.",
            "force": "Set force=true to proceed despite soft validation errors (not recommended)."
        }
    }


@router.post("/dp/validate-config")
def validate_dp_config(
    dataset_id: str,
    generator_type: str,
    epochs: int,
    batch_size: int,
    target_epsilon: float = 10.0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Validate DP configuration before training to prevent privacy failures.
    Returns validation results and recommendations.
    """
    # Verify dataset exists
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
    desired_quality: str = "balanced",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get recommended DP configuration for a dataset.
    Quality options: high_privacy (ε<5), balanced (ε≈10), high_quality (ε≈15)
    """
    # Verify dataset exists
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


@router.post("/{generator_id}/model-card")
async def generate_model_card(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate comprehensive model card for a generator.
    
    Uses LLM to create professional, compliance-ready documentation including:
    - Model details and purpose
    - Intended use cases and limitations
    - Performance metrics
    - Privacy and ethical considerations
    - Compliance framework mappings
    """
    logger.info(f"Generating model card for generator {generator_id}")
    
    # Get generator
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # Get dataset info
    dataset = get_dataset_by_id(db, str(generator.dataset_id)) if generator.dataset_id else None
    
    # Get latest evaluation if available
    evaluations = list_evaluations_by_generator(db, generator_id)
    latest_eval = evaluations[0] if evaluations else None
    
    # Build metadata
    metadata = {
        "generator_id": str(generator.id),
        "type": generator.type,
        "name": generator.name,
        "created_at": generator.created_at.isoformat() if generator.created_at else None,
        "dataset_info": {
            "name": dataset.name if dataset else "Unknown",
            "rows": dataset.row_count if dataset else None,
            "columns": len(dataset.schema_data) if dataset and dataset.schema_data else None
        } if dataset else {},
        "training_config": generator.parameters_json or {},
        "privacy_config": generator.privacy_config or {},
        "privacy_spent": generator.privacy_spent or {},
        "evaluation_results": latest_eval.report if latest_eval else None
    }
    
    # Generate model card using LLM
    try:
        writer = ComplianceWriter()
        model_card = await writer.generate_model_card(metadata)
        
        logger.info(f"✓ Model card generated for {generator_id}")
        
        return {
            "generator_id": generator_id,
            "model_card": model_card,
            "format": "markdown",
            "requires_review": True,
            "disclaimer": "AI-generated content. Requires legal review before distribution."
        }
    except Exception as e:
        logger.error(f"Model card generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Model card generation failed: {str(e)}"
        )


@router.get("/{generator_id}/audit-narrative")
async def generate_audit_narrative(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate human-readable audit narrative for a generator.
    
    Converts technical audit logs into a professional narrative suitable
    for compliance documentation and auditor review.
    """
    logger.info(f"Generating audit narrative for generator {generator_id}")
    
    # Get generator
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # Build audit log from generator history
    audit_log = [
        {
            "timestamp": generator.created_at.strftime("%Y-%m-%d %H:%M:%S") if generator.created_at else "Unknown",
            "action": "generator_created",
            "details": {
                "type": generator.type,
                "name": generator.name
            }
        }
    ]
    
    # Add training event if completed
    if generator.status == "completed":
        audit_log.append({
            "timestamp": generator.updated_at.strftime("%Y-%m-%d %H:%M:%S") if generator.updated_at else "Unknown",
            "action": "training_completed",
            "details": {
                "output_dataset_id": str(generator.output_dataset_id) if generator.output_dataset_id else None,
                "privacy_spent": generator.privacy_spent
            }
        })
    
    # Generate narrative using LLM
    try:
        writer = ComplianceWriter()
        narrative = await writer.generate_audit_narrative(audit_log)
        
        logger.info(f"✓ Audit narrative generated for {generator_id}")
        
        return {
            "generator_id": generator_id,
            "narrative": narrative,
            "format": "markdown",
            "events_count": len(audit_log)
        }
    except Exception as e:
        logger.error(f"Audit narrative generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Audit narrative generation failed: {str(e)}"
        )


@router.post("/{generator_id}/compliance-report")
async def generate_compliance_report(
    generator_id: str,
    framework: str = "GDPR",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate compliance framework mapping for a generator.
    
    Maps generator configuration to specific compliance requirements
    for frameworks like GDPR, HIPAA, CCPA, or SOC 2.
    
    Args:
        generator_id: Generator ID
        framework: Compliance framework (GDPR, HIPAA, CCPA, SOC2)
    """
    # Validate framework
    valid_frameworks = ["GDPR", "HIPAA", "CCPA", "SOC2"]
    if framework.upper() not in valid_frameworks:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid framework. Must be one of: {', '.join(valid_frameworks)}"
        )
    
    logger.info(f"Generating {framework} compliance report for generator {generator_id}")
    
    # Get generator
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # Build metadata
    metadata = {
        "generator_id": str(generator.id),
        "type": generator.type,
        "privacy_config": generator.privacy_config or {},
        "privacy_spent": generator.privacy_spent or {},
        "training_config": generator.parameters_json or {}
    }
    
    # Generate compliance report using LLM
    try:
        writer = ComplianceWriter()
        report = await writer.generate_compliance_report(metadata, framework.upper())
        
        logger.info(f"✓ {framework} compliance report generated for {generator_id}")
        
        return report
    except Exception as e:
        logger.error(f"Compliance report generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Compliance report generation failed: {str(e)}"
        )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _generate_in_background(generator_id: str, job_id: str) -> None:
    """Background task to generate synthetic data."""
    # Create a new database session for the background task
    db = SessionLocal()
    
    try:
        generator = get_generator_by_id(db, generator_id)
        if not generator:
            update_job_status(db, job_id, "failed", error_message="Generator not found")
            return

        # Generate the data
        output_dataset = generate_synthetic_data(generator, db)

        # Update generator with completed status and output dataset
        update_generator_status(db, generator_id, "completed", str(output_dataset.id))
        
        # Update job with completed status and result
        update_job_status(
            db,
            job_id,
            "completed",
            synthetic_dataset_id=output_dataset.id
        )
        
        logger.info(f"✓ Generation completed for {generator_id}, job {job_id}")

    except Exception as e:
        # Update both generator and job status to failed
        update_generator_status(db, generator_id, "failed")
        update_job_status(db, job_id, "failed", error_message=str(e))
        logger.error(f"Generation failed for {generator_id}: {str(e)}")
    finally:
        # Always close the database session
        db.close()
