"""Routes for dataset endpoints."""

import os
import shutil
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlmodel import Session
from app.core.dependencies import get_db, get_current_user
from .models import Dataset
from .services import get_all_datasets, process_uploaded_file, profile_uploaded_dataset, detect_dataset_pii

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("/", response_model=list[Dataset])
def list_datasets(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_all_datasets(db)


@router.get("/{dataset_id}")
def get_dataset(dataset_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from .crud import get_dataset_by_id
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.get("/{dataset_id}/download")
def download_dataset(dataset_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Download synthetic dataset as CSV."""
    from fastapi.responses import FileResponse
    from .crud import get_dataset_by_id

    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Use the original_filename stored in the database
    file_path = UPLOAD_DIR / dataset.original_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {dataset.original_filename}")

    return FileResponse(path=file_path, filename=dataset.original_filename, media_type='text/csv')


@router.post("/upload", response_model=Dataset)
async def upload_dataset(
    file: UploadFile = File(...),
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Upload a dataset file (CSV/JSON) and create dataset record.
    
    Args:
        file: CSV or JSON file to upload
        project_id: Optional project ID (defaults to 'default-project')
    """
    # Use default project if not provided
    if not project_id:
        project_id = "00000000-0000-0000-0000-000000000001"  # Default project UUID
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file extension
    allowed_extensions = {".csv", ".json"}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only CSV and JSON files allowed")

    # Save file with UUID prefix for uniqueness
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = UPLOAD_DIR / unique_filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process file and create dataset
    try:
        dataset = await process_uploaded_file(
            file_path=file_path,
            filename=file.filename,
            unique_filename=unique_filename,
            project_id=uuid.UUID(project_id),
            uploader_id=current_user.id,
            db=db
        )
        return dataset
    except Exception as e:
        # Clean up file on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@router.post("/{dataset_id}/profile")
def create_dataset_profile(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
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
    current_user=Depends(get_current_user)
):
    """
    Retrieve existing profiling results for a dataset.
    """
    from .crud import get_dataset_by_id
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
    current_user=Depends(get_current_user)
):
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
    current_user=Depends(get_current_user)
):
    """
    Retrieve existing PII detection results for a dataset.
    """
    from .crud import get_dataset_by_id
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
    current_user=Depends(get_current_user)
):
    """Enhanced PII detection using LLM for contextual analysis
    
    Goes beyond regex patterns to identify:
    - Encoded or obfuscated PII
    - Indirect identifiers (user codes, customer IDs)
    - Quasi-identifiers that could enable re-identification
    - Context-based PII detection
    
    Returns detailed risk assessment with recommendations.
    """
    import logging
    import pandas as pd
    from .crud import get_dataset_by_id
    from app.services.llm.enhanced_pii_detector import EnhancedPIIDetector
    
    logger = logging.getLogger(__name__)
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
