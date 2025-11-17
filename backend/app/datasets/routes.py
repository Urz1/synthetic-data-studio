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

    # For now, assume synthetic data is stored as CSV in uploads
    # TODO: Implement proper file storage and retrieval
    file_path = UPLOAD_DIR / f"{dataset.name}.csv"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=file_path, filename=f"{dataset.name}.csv", media_type='text/csv')


@router.post("/upload", response_model=Dataset)
async def upload_dataset(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Upload a dataset file (CSV/JSON) and create dataset record.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file extension
    allowed_extensions = {".csv", ".json"}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only CSV and JSON files allowed")

    # Save file
    file_path = UPLOAD_DIR / f"{current_user.id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process file and create dataset
    try:
        dataset = await process_uploaded_file(
            file_path=file_path,
            filename=file.filename,
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


