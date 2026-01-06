"""Dataset API endpoints."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import datetime
import json
import logging
import shutil
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

# Third-party
import pandas as pd
from fastapi import (
    APIRouter, BackgroundTasks, Depends, File, Form, HTTPException,
    UploadFile, status
)
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from sqlmodel import Session, select

# Internal - Core
from app.core.config import settings
from app.core.dependencies import get_current_user, get_db
from app.core.security import check_resource_ownership
from app.core.validators import validate_file_extension, validate_filename, validate_uuid

# Internal - Services
from app.generators.models import Generator
from app.projects.repositories import get_project_by_id
from app.services.llm.enhanced_pii_detector import EnhancedPIIDetector

# Internal - Storage
from app.storage.s3 import (
    S3ConfigurationError,
    S3StorageError,
    get_storage_service,
)

# Internal - Module
from .models import Dataset
from .repositories import delete_dataset as delete_dataset_repo, get_dataset_by_id
from .schemas import DatasetDeleteResponse, DatasetResponse
from .services import (
    detect_dataset_pii,
    get_all_datasets,
    process_uploaded_file,
    profile_uploaded_dataset,
)


# ============================================================================
# SETUP
# ============================================================================

logger = logging.getLogger(__name__)

# Use absolute path from settings or default to backend/uploads
UPLOAD_DIR = Path(settings.upload_dir).absolute()
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

router = APIRouter(prefix="/datasets", tags=["datasets"])

# S3 storage flag - checked at runtime
_s3_available: Optional[bool] = None

def is_s3_available() -> bool:
    """Check if S3 storage is configured and available."""
    global _s3_available
    if _s3_available is None:
        try:
            get_storage_service()
            _s3_available = True
            logger.info("S3 storage is available")
        except S3ConfigurationError:
            _s3_available = False
            logger.warning("S3 not configured, using local storage")
    return _s3_available

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("", response_model=list[DatasetResponse])
@router.get("/", response_model=list[DatasetResponse])
def list_datasets(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> list[DatasetResponse]:
    """List all datasets for the current user."""
    # SECURITY: Filter to only return datasets uploaded by current user
    statement = select(Dataset).where(Dataset.uploader_id == current_user.id)
    datasets = db.exec(statement).all()
    return [DatasetResponse.from_dataset(d) for d in datasets]


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> DatasetResponse:
    """Get a specific dataset by ID."""
    dataset_uuid = validate_uuid(dataset_id, "dataset_id")
    dataset = get_dataset_by_id(db, str(dataset_uuid))
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Security: Verify ownership
    check_resource_ownership(dataset, current_user.id)
    
    return DatasetResponse.from_dataset(dataset)


@router.get("/{dataset_id}/download")
def download_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Download a dataset file. Returns presigned S3 URL or local file."""
    dataset_uuid = validate_uuid(dataset_id, "dataset_id")
    dataset = get_dataset_by_id(db, str(dataset_uuid))
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Security: Verify ownership
    check_resource_ownership(dataset, current_user.id)
    
    # Try S3 first if configured and dataset has s3_key
    if is_s3_available() and dataset.s3_key:
        try:
            storage = get_storage_service()
            # Stream directly from S3 to user
            file_stream = storage.get_file_stream(dataset.s3_key)
            return StreamingResponse(
                file_stream,
                media_type='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename="{dataset.original_filename}"'
                }
            )
        except S3StorageError as e:
            logger.warning(f"S3 download failed, falling back to local: {e}")
    
    # Fallback to local file
    file_path = UPLOAD_DIR / dataset.original_filename
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {dataset.original_filename}"
        )

    return FileResponse(
        path=file_path,
        filename=dataset.original_filename,
        media_type='text/csv'
    )


@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> DatasetResponse:
    """
    Upload a dataset file (CSV/JSON) and create dataset record.
    
    Args:
        file: CSV or JSON file to upload (max 100MB)
        project_id: Project ID to associate dataset with
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Created dataset object
    """
    # Maximum file size: 50MB (optimal for CTGAN training memory)
    MAX_FILE_SIZE = 50 * 1024 * 1024
    
    # Verify project exists
    project = get_project_by_id(db, uuid.UUID(project_id))
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate and sanitize filename
    safe_filename = validate_filename(file.filename)
    validate_file_extension(safe_filename, {".csv", ".json"})

    # Save file with UUID prefix for uniqueness
    unique_filename = f"{uuid.uuid4()}_{safe_filename}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Stream file and check size
    total_size = 0
    with open(file_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):  # Read 1MB chunks
            total_size += len(chunk)
            if total_size > MAX_FILE_SIZE:
                buffer.close()
                file_path.unlink()  # Clean up partial file
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
                )
            buffer.write(chunk)
    
    # Upload to S3 if available
    s3_key = None
    if is_s3_available():
        try:
            storage = get_storage_service()
            with open(file_path, "rb") as f:
                result = storage.upload_dataset(
                    file_obj=f,
                    user_id=str(current_user.id),
                    filename=safe_filename,
                    content_type="text/csv" if safe_filename.endswith(".csv") else "application/json",
                )
                s3_key = result["key"]
                logger.info(f"Uploaded to S3: {s3_key}")
        except S3StorageError as e:
            logger.warning(f"S3 upload failed, using local storage: {e}")

    # Process file and create dataset
    try:
        dataset = await process_uploaded_file(
            file_path=file_path,
            filename=safe_filename,
            unique_filename=unique_filename,
            project_id=uuid.UUID(project_id),
            uploader_id=current_user.id,
            db=db,
            s3_key=s3_key,  # Pass S3 key if uploaded
        )
        return dataset
    except Exception as e:
        # Log full error with traceback
        logger.exception(f"Failed to process uploaded file {safe_filename}")
        # Clean up file on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process file: {str(e)}"
        )


    return DatasetResponse.from_dataset(dataset)


@router.get("/{dataset_id}/details")
def get_dataset_details(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get dataset with profiling and related generators in a single call.
    OPTIMIZATION: Reduces multiple API calls to 1.
    """    
    # Get dataset and verify ownership
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    check_resource_ownership(dataset, current_user.id)
    
    # Get generators that use this dataset
    generators_stmt = select(Generator).where(
        Generator.dataset_id == dataset.id,
        Generator.created_by == current_user.id
    )
    generators = db.exec(generators_stmt).all()
    
    return {
        "dataset": DatasetResponse.from_dataset(dataset),
        "generators": generators,
        "stats": {
            "generator_count": len(generators)
        }
    }


@router.post("/{dataset_id}/profile")
def create_dataset_profile(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate comprehensive statistical profile for a dataset.
    
    Includes:
    - Column-level statistics (mean, median, std, etc.)
    - Outlier detection (IQR and Isolation Forest)
    - Correlation analysis
    - Missing value patterns
    - Distribution histograms
    """
    try:
        profiling_results = profile_uploaded_dataset(dataset_id, db)
        return profiling_results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profiling failed: {str(e)}")


@router.get("/{dataset_id}/profile")
def get_dataset_profile(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Retrieve existing profiling results for a dataset."""
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if not dataset.profiling_data:
        raise HTTPException(
            status_code=404,
            detail="No profiling data available. Run POST /{dataset_id}/profile first."
        )
    
    return dataset.profiling_data


@router.post("/{dataset_id}/pii-detection")
def detect_pii_in_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Detect PII/PHI in a dataset using heuristic pattern matching.
    
    Detects:
    - Email addresses
    - Phone numbers
    - Social Security Numbers
    - Credit card numbers
    - Names and identifiers
    - Medical record numbers
    
    Returns flagged columns with confidence levels and redaction recommendations.
    """
    try:
        pii_results = detect_dataset_pii(dataset_id, db)
        return pii_results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PII detection failed: {str(e)}")


@router.get("/{dataset_id}/pii-flags")
def get_pii_flags(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Retrieve existing PII detection results for a dataset."""
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if not dataset.pii_flags:
        raise HTTPException(
            status_code=404,
            detail="No PII flags available. Run POST /{dataset_id}/pii-detection first."
        )
    
    return dataset.pii_flags


@router.post("/{dataset_id}/pii-detection-enhanced")
async def detect_pii_enhanced(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Enhanced PII detection using LLM for contextual analysis.
    
    Goes beyond regex patterns to identify:
    - Encoded or obfuscated PII
    - Indirect identifiers (user codes, customer IDs)
    - Quasi-identifiers that could enable re-identification
    - Context-based PII detection
    
    Returns detailed risk assessment with recommendations.
    """
    logger.info(f"Running enhanced PII detection for dataset {dataset_id}")
    
    # Get dataset
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Load data
    try:
        if dataset.file_path:
            df = pd.read_csv(dataset.file_path)
        else:
            file_path = UPLOAD_DIR / dataset.original_filename
            df = pd.read_csv(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load dataset: {str(e)}"
        )
    
    # Prepare column data for analysis
    columns_data = {}
    for col in df.columns:
        # Get sample values (first 10, non-null)
        samples = df[col].dropna().head(10).tolist()
        
        # Get basic stats
        stats = {
            "dtype": str(df[col].dtype),
            "null_count": int(df[col].isnull().sum()),
            "unique_count": int(df[col].nunique()),
            "total_count": len(df)
        }
        
        # Add numeric stats if applicable
        if pd.api.types.is_numeric_dtype(df[col]):
            stats.update({
                "mean": float(df[col].mean()) if not df[col].isnull().all() else None,
                "std": float(df[col].std()) if not df[col].isnull().all() else None
            })
        
        columns_data[col] = {
            "samples": samples,
            "stats": stats
        }
    
    # Run enhanced PII detection
    try:
        detector = EnhancedPIIDetector()
        analysis = await detector.analyze_dataset(columns_data)
        
        logger.info(f"✓ Enhanced PII detection complete: {analysis['overall_risk_level']} risk")
        
        return {
            "dataset_id": dataset_id,
            "analysis": analysis,
            "disclaimer": "AI-generated analysis. Manual review recommended for production use."
        }
    except Exception as e:
        logger.error(f"Enhanced PII detection failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Enhanced PII detection failed: {str(e)}"
        )


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> DatasetDeleteResponse:
    """
    Delete a dataset from both S3 and local storage.
    
    Args:
        dataset_id: Dataset UUID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Success message with deleted dataset info
    """
    # Validate UUID format
    dataset_uuid = validate_uuid(dataset_id, "dataset_id")
    
    # Security: Check ownership before deleting
    dataset = get_dataset_by_id(db, str(dataset_uuid))
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    check_resource_ownership(dataset, current_user.id)
    
    # Delete from S3 if available
    if is_s3_available() and dataset.s3_key:
        try:
            storage = get_storage_service()
            storage.delete_file(dataset.s3_key)
            logger.info(f"Deleted from S3: {dataset.s3_key}")
        except S3StorageError as e:
            logger.warning(f"S3 delete failed: {e}")
    
    # Delete local file if exists
    if dataset.original_filename:
        local_path = UPLOAD_DIR / dataset.original_filename
        if local_path.exists():
            local_path.unlink()
            logger.info(f"Deleted local file: {local_path}")
    
    # Delete the dataset from database
    deleted_dataset = delete_dataset_repo(db, str(dataset_uuid))
    
    if not deleted_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return DatasetDeleteResponse(
        message="Dataset deleted successfully",
        dataset_id=str(deleted_dataset.id),
        deleted_at=deleted_dataset.deleted_at
    )
