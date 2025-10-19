"""Routes for dataset endpoints."""

from fastapi import APIRouter
from .models import Dataset
from .services import get_all_datasets, create_new_dataset

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("/", response_model=list[Dataset])
def list_datasets():
    return get_all_datasets()


@router.post("/", response_model=Dataset)
def create_dataset_endpoint(item: Dataset):
    return create_new_dataset(item)

