"""
API request/response schemas for datasets.

These Pydantic models define the API contract and are separate from
database models (models.py) following clean architecture principles.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
import uuid


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class DatasetUploadRequest(BaseModel):
    """Request body for dataset upload (multipart form data)."""
    project_id: Optional[str] = Field(
        None,
        description="Project ID to associate dataset with"
    )


class DatasetProfileRequest(BaseModel):
    """Request to profile a dataset."""
    dataset_id: str = Field(..., description="UUID of dataset to profile")


class PIIDetectionRequest(BaseModel):
    """Request for PII detection on a dataset."""
    dataset_id: str = Field(..., description="UUID of dataset to analyze")


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class DatasetResponse(BaseModel):
    """Response model for dataset information."""
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    original_filename: Optional[str] = None
    file_path: Optional[str] = None
    size_bytes: Optional[int] = None
    row_count: Optional[int] = None
    schema_data: Dict[str, Any] = Field(default_factory=dict)
    status: str = "uploaded"
    checksum: str
    pii_flags: Optional[Dict[str, Any]] = None
    profiling_data: Optional[Dict[str, Any]] = None
    version: int = 1
    uploader_id: uuid.UUID
    uploaded_at: datetime
    deleted_at: Optional[datetime] = None


class DatasetListResponse(BaseModel):
    """Response for list of datasets."""
    datasets: list[DatasetResponse]
    total: int
    skip: int
    limit: int


class DatasetDeleteResponse(BaseModel):
    """Response after deleting a dataset."""
    message: str
    dataset_id: str
    deleted_at: datetime


class ProfileResponse(BaseModel):
    """Response containing dataset profiling results."""
    dataset_id: str
    profile: Dict[str, Any]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class PIIDetectionResponse(BaseModel):
    """Response containing PII detection results."""
    dataset_id: str
    pii_results: Dict[str, Any]
    flagged_columns: list[str]
    recommendations: Dict[str, Any]
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
