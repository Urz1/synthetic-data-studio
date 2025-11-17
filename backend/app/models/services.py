"""Services for ML model management - training, storage, and inference."""

import os
import torch
import uuid
from pathlib import Path
from typing import Optional, Dict, Any
from sqlmodel import Session
from .models import Model, ModelVersion
from .crud import create_model, create_model_version, get_model_versions


# Directory for storing trained models
MODEL_STORAGE_DIR = Path("app/models/storage")
MODEL_STORAGE_DIR.mkdir(exist_ok=True)


def save_pytorch_model(model: torch.nn.Module, model_id: str, version_id: str) -> str:
    """Save a PyTorch model to disk and return the file path."""
    model_path = MODEL_STORAGE_DIR / f"{model_id}_{version_id}.pt"
    torch.save(model.state_dict(), model_path)
    return str(model_path)


def load_pytorch_model(model_class: torch.nn.Module, model_id: str, version_id: str) -> torch.nn.Module:
    """Load a PyTorch model from disk."""
    model_path = MODEL_STORAGE_DIR / f"{model_id}_{version_id}.pt"
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    model = model_class
    model.load_state_dict(torch.load(model_path))
    model.eval()  # Set to evaluation mode
    return model


def create_trained_model(
    db: Session,
    model_type: str,
    trained_model: torch.nn.Module,
    metadata: Dict[str, Any],
    created_by: str
) -> ModelVersion:
    """Create a new model and version record for a trained model."""
    # Create the base model
    base_model = Model()
    db_model = create_model(db, base_model)

    # Get the latest version number
    existing_versions = get_model_versions(db, str(db_model.id))
    version_number = len(existing_versions) + 1

    # Create model version
    model_version = ModelVersion(
        model_id=db_model.id,
        version_number=version_number,
        created_by=uuid.UUID(created_by) if isinstance(created_by, str) else created_by,
        meta={
            "model_type": model_type,
            "storage_path": None,  # Will be set after saving
            **metadata
        }
    )

    # Save the model to disk
    model_path = save_pytorch_model(trained_model, str(db_model.id), str(model_version.id))
    model_version.meta["storage_path"] = model_path

    # Save the version record
    db_version = create_model_version(db, model_version)

    return db_version


def get_trained_model(
    db: Session,
    model_id: str,
    version_id: str,
    model_class: torch.nn.Module
) -> torch.nn.Module:
    """Load a trained model from storage."""
    # Get version metadata
    versions = get_model_versions(db, model_id)
    version = next((v for v in versions if str(v.id) == version_id), None)
    if not version:
        raise ValueError(f"Model version {version_id} not found for model {model_id}")

    # Load the model
    return load_pytorch_model(model_class, model_id, version_id)