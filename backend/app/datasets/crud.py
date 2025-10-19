"""CRUD operations for datasets (in-memory stub)."""

from .models import Dataset
from typing import List

_DB: List[Dataset] = []


def list_datasets():
    return _DB


def create_dataset(ds: Dataset):
    ds.id = len(_DB) + 1
    _DB.append(ds)
    return ds

