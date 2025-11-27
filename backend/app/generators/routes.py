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

# Local - Core
from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.core.validators import validate_uuid

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
    GeneratorDeleteResponse,
    GenerationStartResponse
)
from .services import generate_synthetic_data, _generate_from_schema

# ============================================================================
# SETUP
# ============================================================================

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generators", tags=["generators"])

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/", response_model=list[Generator])
def list_generators(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> list[Generator]:
    """List all generators."""
    return get_generators(db)


@router.get("/{generator_id}", response_model=Generator)
def get_generator(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Generator:
    """Get a specific generator by ID."""
    validate_uuid(generator_id, "generator_id")
    
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    return generator


@router.delete("/{generator_id}")
def delete_generator_endpoint(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> GeneratorDeleteResponse:
    """Delete a generator."""
    validate_uuid(generator_id, "generator_id")
    
    generator = delete_generator(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    return GeneratorDeleteResponse(
        message="Generator deleted successfully",
        id=generator_id
    )


@router.post("/", response_model=Generator)
def create_new_generator(
    generator: Generator,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Generator:
    """Create a new generator."""
    generator.created_by = current_user.id
    return create_generator(db, generator)


@router.post("/schema/generate")
def generate_from_schema(
    schema_input: SchemaInput,
    num_rows: int = 1000,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate synthetic data directly from schema without creating a generator record."""
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
    current_user = Depends(get_current_user)
) -> GenerationStartResponse:
    """Start synthetic data generation for a generator."""
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")

    # Update status to running
    update_generator_status(db, generator_id, "running")

    # Add background task
    background_tasks.add_task(_generate_in_background, generator_id, db)

    return GenerationStartResponse(
        message="Generation started",
        generator_id=generator_id
    )


@router.post("/dataset/{dataset_id}/generate")
def generate_from_dataset(
    dataset_id: str,
    generator_type: str = "ctgan",
    num_rows: Optional[int] = None,
    epochs: int = 50,
    batch_size: int = 500,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate synthetic data from an existing dataset.
    
    Args:
        dataset_id: ID of the dataset to use for training
        generator_type: Type of generator (ctgan, tvae, dp-ctgan, dp-tvae, etc.)
        num_rows: Number of synthetic rows to generate. If None, matches original dataset size.
        epochs: Number of training epochs
        batch_size: Batch size for training
    
    Note:
        num_rows validation:
        - Minimum: 100 rows
        - Maximum: 1,000,000 rows
        - If None: matches original dataset row count
    """
    # Verify dataset exists
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Determine num_rows
    if num_rows is None:
        try:
            df = pd.read_csv(dataset.file_path)
            num_rows = len(df)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not read dataset: {str(e)}")
    
    # Validate num_rows
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
            return {
                "message": "Generation completed",
                "generator_id": str(generator.id),
                "output_dataset_id": str(output_dataset.id)
            }
        except Exception as e:
            update_generator_status(db, str(generator.id), "failed")
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


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

def _generate_in_background(generator_id: str, db: Session) -> None:
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
        logger.error(f"Generation failed for {generator_id}: {str(e)}")
