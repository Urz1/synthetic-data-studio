"""CRUD operations for datasets."""

import uuid
import datetime
from sqlmodel import Session
from .models import Dataset


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
    """Soft delete a dataset by setting deleted_at timestamp."""
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        return None
    
    # Check if already deleted
    if dataset.deleted_at:
        return None
    
    # Soft delete by setting deleted_at
    dataset.deleted_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(dataset)
    return dataset
