"""Business logic for datasets."""

import pandas as pd
import json
import hashlib
from pathlib import Path
from typing import Optional
import uuid
from sqlmodel import Session
from .models import Dataset, DatasetFile
from .crud import get_datasets, create_dataset


async def process_uploaded_file(file_path: Path, filename: str, project_id: uuid.UUID, uploader_id: uuid.UUID, db: Session):
    """Process uploaded file, detect schema, and create dataset record."""

    # Read file and detect schema
    if filename.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif filename.endswith('.json'):
        with open(file_path, 'r') as f:
            data = json.load(f)
        if isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = pd.DataFrame([data])
    else:
        raise ValueError("Unsupported file format")

    # Calculate checksum
    checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()

    # Basic schema detection
    schema = {}
    for col in df.columns:
        dtype = str(df[col].dtype)
        if dtype == 'object':
            # Check if looks like date
            try:
                pd.to_datetime(df[col].head())
                schema[col] = 'datetime'
            except:
                schema[col] = 'string'
        elif 'int' in dtype:
            schema[col] = 'integer'
        elif 'float' in dtype:
            schema[col] = 'float'
        else:
            schema[col] = dtype

    # Create dataset record
    dataset = Dataset(
        project_id=project_id,
        name=filename,
        original_filename=filename,
        size_bytes=file_path.stat().st_size,
        row_count=len(df),
        schema_data=schema,
        checksum=checksum
    )

    # Save to DB
    db_dataset = create_dataset(db, dataset)

    # Create dataset file record
    dataset_file = DatasetFile(
        dataset_id=db_dataset.id,
        uploader_id=uploader_id,
        file_path=str(file_path),
        size_bytes=file_path.stat().st_size,
        checksum=checksum
    )

    db.add(dataset_file)
    db.commit()

    return db_dataset


def get_all_datasets(db: Session):
    """Get all datasets for current user."""
    return get_datasets(db)

