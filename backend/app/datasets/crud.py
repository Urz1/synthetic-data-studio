"""CRUD operations for datasets."""

from sqlmodel import Session
from .models import Dataset


def get_datasets(db: Session):
    return db.query(Dataset).all()


def create_dataset(db: Session, dataset: Dataset):
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset

