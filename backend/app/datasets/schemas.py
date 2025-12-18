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
    column_count: Optional[int] = None  # Computed from schema_data
    schema_data: Dict[str, Any] = Field(default_factory=dict)
    status: str = "uploaded"
    checksum: str
    pii_flags: Optional[Dict[str, Any]] = None
    profiling_data: Optional[Dict[str, Any]] = None
    version: int = 1
    uploader_id: uuid.UUID
    uploaded_at: datetime
    deleted_at: Optional[datetime] = None
    
    @classmethod
    def from_dataset(cls, dataset) -> "DatasetResponse":
        """Create response from Dataset model with column_count from DB."""
        schema_data = dataset.schema_data or {}
        
        # Use stored column_count, fallback to schema_data keys count for existing data
        column_count = dataset.column_count
        if column_count is None:
            if "columns" in schema_data and isinstance(schema_data["columns"], list):
                column_count = len(schema_data["columns"])
            elif schema_data and isinstance(schema_data, dict):
                column_count = len(schema_data)
            else:
                column_count = 0
        
        return cls(
            id=dataset.id,
            project_id=dataset.project_id,
            name=dataset.name,
            original_filename=dataset.original_filename,
            file_path=dataset.file_path,
            size_bytes=dataset.size_bytes,
            row_count=dataset.row_count,
            column_count=column_count,
            schema_data=schema_data,
            status=dataset.status,
            checksum=dataset.checksum,
            pii_flags=dataset.pii_flags,
            profiling_data=dataset.profiling_data,
            version=dataset.version,
            uploader_id=dataset.uploader_id,
            uploaded_at=dataset.uploaded_at,
            deleted_at=dataset.deleted_at,
        )


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
