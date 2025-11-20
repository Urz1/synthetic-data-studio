"""Business logic for datasets."""

import pandas as pd
import json
import hashlib
from pathlib import Path
from typing import Optional, Dict, Any
import uuid
from sqlmodel import Session
from .models import Dataset, DatasetFile
from .crud import get_datasets, create_dataset, get_dataset_by_id
from app.services.profiling import profile_dataset
from app.services.pii_detector import detect_pii, get_pii_recommendations
import logging

logger = logging.getLogger(__name__)


async def process_uploaded_file(file_path: Path, filename: str, unique_filename: str, project_id: uuid.UUID, uploader_id: uuid.UUID, db: Session):
    """Process uploaded file, detect schema, and create dataset record.
    
    Args:
        file_path: Full path to uploaded file
        filename: Original filename from user
        unique_filename: Unique filename with UUID prefix (what's actually on disk)
        project_id: Project ID
        uploader_id: User ID who uploaded
        db: Database session
    """

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
                pd.to_datetime(df[col].head(), errors='coerce')
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
    # IMPORTANT: Store unique_filename so we can find the file later!
    dataset = Dataset(
        project_id=project_id,
        name=filename,
        original_filename=unique_filename,  # Store the UUID-prefixed filename
        file_path=str(file_path),  # Store full path
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


def profile_uploaded_dataset(dataset_id: str, db: Session) -> Dict[str, Any]:
    """
    Generate comprehensive profile for an uploaded dataset.
    
    Args:
        dataset_id: UUID of the dataset to profile
        db: Database session
        
    Returns:
        Profiling results dictionary
    """
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")
    
    # Load the dataset file
    from app.datasets.routes import UPLOAD_DIR
    file_path = UPLOAD_DIR / dataset.original_filename
    
    if not file_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {file_path}")
    
    # Load data based on file type
    if dataset.original_filename.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif dataset.original_filename.endswith('.json'):
        df = pd.read_json(file_path)
    else:
        raise ValueError("Unsupported file format")
    
    # Generate profile
    logger.info(f"Profiling dataset {dataset_id}")
    profiling_results = profile_dataset(df)
    
    # Store profiling results in dataset
    dataset.profiling_data = profiling_results
    db.commit()
    db.refresh(dataset)
    
    return profiling_results


def detect_dataset_pii(dataset_id: str, db: Session) -> Dict[str, Any]:
    """
    Detect PII/PHI in an uploaded dataset.
    
    Args:
        dataset_id: UUID of the dataset to analyze
        db: Database session
        
    Returns:
        PII detection results dictionary
    """
    dataset = get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")
    
    # Load the dataset file
    from app.datasets.routes import UPLOAD_DIR
    file_path = UPLOAD_DIR / dataset.original_filename
    
    if not file_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {file_path}")
    
    # Load data based on file type
    if dataset.original_filename.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif dataset.original_filename.endswith('.json'):
        df = pd.read_json(file_path)
    else:
        raise ValueError("Unsupported file format")
    
    # Detect PII
    logger.info(f"Detecting PII in dataset {dataset_id}")
    pii_results = detect_pii(df)
    recommendations = get_pii_recommendations(df)
    
    # Add recommendations to results
    pii_results["recommendations"] = recommendations
    
    # Store PII flags in dataset
    dataset.pii_flags = pii_results
    db.commit()
    db.refresh(dataset)
    
    return pii_results

