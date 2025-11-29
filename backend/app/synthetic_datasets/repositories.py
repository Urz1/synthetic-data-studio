"""Repositories for synthetic datasets module (data access layer)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import List, Optional
import uuid

# Third-party
from sqlmodel import Session, select

# Local - Core
from app.datasets.models import Dataset

# ============================================================================
# REPOSITORIES
# ============================================================================

def list_synthetic_datasets(db: Session) -> List[Dataset]:
    """
    List all synthetic datasets.
    
    Note: Synthetic datasets are stored in the datasets table with
    a specific flag or naming convention to identify them.
    """
    # Get all datasets - synthetic ones are created by generators
    return db.exec(select(Dataset)).all()


def get_synthetic_dataset_by_id(db: Session, dataset_id: uuid.UUID) -> Optional[Dataset]:
    """Get a specific synthetic dataset by ID."""
    return db.get(Dataset, dataset_id)


def create_synthetic_dataset(db: Session, dataset: Dataset) -> Dataset:
    """Create a new synthetic dataset record."""
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


def delete_synthetic_dataset(db: Session, dataset_id: uuid.UUID) -> bool:
    """Delete a synthetic dataset."""
    dataset = db.get(Dataset, dataset_id)
    if not dataset:
        return False
    
    db.delete(dataset)
    db.commit()
    return True
