"""Synthetic Datasets API Routes."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import List

# Third-party
from fastapi import APIRouter, Depends, HTTPException, status

# Local - Module
from .schemas import SyntheticDatasetCreate, SyntheticDatasetResponse
from .repositories import list_synthetic, create_synthetic
from .models import SyntheticDataset

# ============================================================================
# SETUP
# ============================================================================

router = APIRouter(prefix="/synthetic-datasets", tags=["synthetic-datasets"])

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/", response_model=List[SyntheticDatasetResponse])
def get_synthetic():
    """List all synthetic datasets."""
    return list_synthetic()


@router.post("/", response_model=SyntheticDatasetResponse, status_code=status.HTTP_201_CREATED)
def post_synthetic(dataset: SyntheticDatasetCreate):
    """Create a new synthetic dataset."""
    # Convert schema to model
    # Note: This is a mock implementation as per original code
    db_dataset = SyntheticDataset(
        **dataset.dict(),
        id=None, # Will be set by repository
        uploaded_at=None # Will be set by default factory
    )
    return create_synthetic(db_dataset)

