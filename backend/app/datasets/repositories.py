"""CRUD operations for datasets."""

import uuid
import datetime
import logging
from sqlmodel import Session
from .models import Dataset,DatasetFile
from pathlib import Path

logger = logging.getLogger(__name__)

def get_datasets(db: Session):
    return db.query(Dataset).all()


def get_dataset_by_id(db: Session, dataset_id: str):
    return db.get(Dataset, uuid.UUID(dataset_id))


def create_dataset(db: Session, dataset: Dataset):
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


def delete_dataset(db: Session, dataset_id: str):
    """Delete a dataset (hard delete - removes file and database record)."""
    
    
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        return None
    
    # Delete the physical file if it exists
    if dataset.original_filename:
        try:
            from app.core.config import settings
            upload_dir = Path(settings.upload_dir)
            file_path = upload_dir / dataset.original_filename
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted file: {file_path}")
        except Exception as e:
            logger.warning(f"Could not delete file {dataset.original_filename}: {e}")
    
    # Delete related dataset_files first (cascade delete to avoid FK constraint)
    db.query(DatasetFile).filter(DatasetFile.dataset_id == dataset.id).delete()
    
    # Set deleted_at timestamp (for audit trail before hard delete)
    dataset.deleted_at = datetime.datetime.utcnow()
    
    # Hard delete from database
    db.delete(dataset)
    db.commit()
    
    return dataset
