"""CRUD operations for datasets."""

import uuid
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

