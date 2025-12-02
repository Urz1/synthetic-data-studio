"""Business logic for datasets."""

import json
import logging
import uuid
from pathlib import Path
from typing import Dict, Any, List

import pandas as pd
from sqlmodel import Session

from app.core.utils import calculate_checksum
from app.services.profiling import profile_dataset
from .models import Dataset, DatasetFile
from .repositories import get_datasets, create_dataset, get_dataset_by_id

logger = logging.getLogger(__name__)


async def process_uploaded_file(
    file_path: Path,
    filename: str,
    unique_filename: str,
    project_id: uuid.UUID,
    uploader_id: uuid.UUID,
    db: Session,
    s3_key: str = None,
):
    """Process uploaded file, detect schema, and create dataset record.
    
    Args:
        file_path: Full path to uploaded file
        filename: Original filename from user
        unique_filename: Unique filename with UUID prefix (what's actually on disk)
        project_id: Project ID
        uploader_id: User ID who uploaded
        db: Database session
        s3_key: S3 object key if uploaded to S3
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
    checksum = calculate_checksum(file_path)

    # Basic schema detection
    schema = {}
    for col in df.columns:
        dtype = str(df[col].dtype)
        if dtype == 'object':
            # Check if looks like date by sampling values
            sample = df[col].dropna().head(5)
            if len(sample) > 0:
                try:
                    # Try parsing with infer_datetime_format disabled to avoid warnings
                    parsed = pd.to_datetime(sample, errors='coerce', format='mixed')
                    # If most values parsed successfully, it's likely a date
                    if parsed.notna().sum() >= len(sample) * 0.8:
                        schema[col] = 'datetime'
                    else:
                        schema[col] = 'string'
                except Exception:
                    schema[col] = 'string'
            else:
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
        s3_key=s3_key,  # Store S3 key if uploaded to S3
        size_bytes=file_path.stat().st_size,
        row_count=len(df),
        schema_data=schema,
        checksum=checksum,
        uploader_id=uploader_id  # Set owner
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


# Compatibility functions for old PII detector API
def detect_pii(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compatibility wrapper for old PII detection API.
    Now uses basic pattern matching since enhanced detector requires async context.
    """
    import re
    from typing import Dict, List, Any

    results = {
        "columns": {},
        "summary": {
            "total_columns": len(df.columns),
            "pii_columns": 0,
            "high_risk_columns": 0
        }
    }

    # Basic patterns for common PII
    patterns = {
        "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "phone": r'\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
        "ssn": r'\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b',
        "credit_card": r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
    }

    for col in df.columns:
        col_results = {
            "pii_detected": False,
            "pii_types": [],
            "confidence": 0.0,
            "sample_matches": []
        }

        col_str = df[col].astype(str)

        for pii_type, pattern in patterns.items():
            matches = col_str.str.contains(pattern, regex=True, na=False)
            if matches.any():
                col_results["pii_detected"] = True
                col_results["pii_types"].append(pii_type)
                col_results["confidence"] = min(1.0, col_results["confidence"] + 0.8)
                # Get sample matches (up to 3)
                sample_matches = col_str[matches].head(3).tolist()
                col_results["sample_matches"].extend(sample_matches)

        # Check column name for sensitive keywords
        col_lower = col.lower()
        sensitive_keywords = ["email", "phone", "ssn", "name", "address", "social"]
        if any(keyword in col_lower for keyword in sensitive_keywords):
            if not col_results["pii_detected"]:
                col_results["pii_detected"] = True
                col_results["pii_types"].append("potential_pii")
                col_results["confidence"] = 0.6

        results["columns"][col] = col_results
        if col_results["pii_detected"]:
            results["summary"]["pii_columns"] += 1
            if col_results["confidence"] > 0.8:
                results["summary"]["high_risk_columns"] += 1

    return results


def get_pii_recommendations(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Compatibility wrapper for PII redaction recommendations.
    """
    recommendations = []
    pii_results = detect_pii(df)

    for col, result in pii_results["columns"].items():
        if result["pii_detected"]:
            rec = {
                "column": col,
                "action": "mask" if result["confidence"] > 0.8 else "review",
                "pii_types": result["pii_types"],
                "confidence": result["confidence"],
                "rationale": f"Detected {', '.join(result['pii_types'])} patterns"
            }
            recommendations.append(rec)

    return recommendations

