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
from .services import get_all_datasets, process_uploaded_file

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("/", response_model=list[Dataset])
def list_datasets(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_all_datasets(db)


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

