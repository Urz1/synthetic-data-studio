"""Business logic for datasets."""

from .models import Dataset
from .crud import list_datasets, create_dataset


def get_all_datasets():
    return list_datasets()


def create_new_dataset(data: Dataset):
    # Add validation or profiling logic here
    return create_dataset(data)

