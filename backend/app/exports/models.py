"""Export models for tracking saved reports in S3."""

# Standard library
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

# Third-party
from sqlmodel import Column, Field, JSON, SQLModel


class ExportFormat(str, Enum):
    """Supported export formats."""
    PDF = "pdf"
    DOCX = "docx"
    MARKDOWN = "markdown"


class ExportType(str, Enum):
    """Types of exports."""
    MODEL_CARD = "model_card"
    PRIVACY_REPORT = "privacy_report"
    COMPLIANCE_REPORT = "compliance_report"
    AUDIT_NARRATIVE = "audit_narrative"
    EVALUATION_REPORT = "evaluation_report"
    BILLING_REPORT = "billing_report"


class Export(SQLModel, table=True):
    """
    Tracks exported reports saved to S3.
    
    Stores metadata about generated reports for audit trail and re-download.
    """
    __tablename__ = "exports"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # What was exported
    export_type: str = Field(..., description="Type of export (model_card, privacy_report, etc.)")
    format: str = Field(..., description="File format (pdf, docx, markdown)")
    title: str = Field(..., max_length=500, description="Report title")
    
    # Related entities (optional - depends on export type)
    generator_id: Optional[uuid.UUID] = Field(default=None, foreign_key="generators.id", index=True)
    dataset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="datasets.id", index=True)
    project_id: Optional[uuid.UUID] = Field(default=None, foreign_key="projects.id", index=True)
    
    # S3 storage info
    s3_key: str = Field(..., max_length=1000, description="S3 object key")
    s3_bucket: str = Field(..., max_length=255, description="S3 bucket name")
    file_size_bytes: int = Field(default=0, description="File size in bytes")
    
    # Metadata
    metadata_json: Optional[Dict[str, Any]] = Field(
        default=None, 
        sa_column=Column(JSON),
        description="Additional metadata (framework, generator_type, etc.)"
    )
    
    # Ownership
    created_by: uuid.UUID = Field(..., foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Optional expiry for temporary exports
    expires_at: Optional[datetime] = Field(default=None, description="Optional expiry time")
    
    # Soft delete
    deleted_at: Optional[datetime] = Field(default=None)


class ExportCreate(SQLModel):
    """Schema for creating a new export record."""
    export_type: ExportType
    format: ExportFormat
    title: str
    generator_id: Optional[uuid.UUID] = None
    dataset_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    s3_key: str
    s3_bucket: str
    file_size_bytes: int = 0
    metadata_json: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None


class ExportResponse(SQLModel):
    """Schema for export API responses."""
    id: uuid.UUID
    export_type: str
    format: str
    title: str
    generator_id: Optional[uuid.UUID] = None
    dataset_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    file_size_bytes: int
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    download_url: Optional[str] = None  # Presigned URL when requested


class ExportListResponse(SQLModel):
    """Schema for listing exports."""
    exports: list[ExportResponse]
    total: int
