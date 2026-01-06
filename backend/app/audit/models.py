"""Audit log database model."""

# Standard library
import datetime
import uuid
from typing import Optional

# Third-party
from sqlmodel import Column, Field, SQLModel

# Internal
from app.database.database import JSONType


class AuditLog(SQLModel, table=True):
    """
    Comprehensive audit log for all system actions.
    
    Required for SOC 2, ISO 27001, HIPAA compliance.
    Tracks who did what, when, and from where.
    """
    __tablename__ = "audit_logs"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Who
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    user_email: Optional[str] = None  # Denormalized for reporting
    
    # What
    action: str = Field(index=True)  # AuditAction enum value
    resource_type: Optional[str] = Field(default=None, index=True)  # ResourceType enum value
    resource_id: Optional[uuid.UUID] = Field(default=None, index=True)
    resource_name: Optional[str] = None  # Human-readable name
    
    # When
    timestamp: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        index=True
    )
    
    # Where (network info)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # HTTP request details
    request_method: Optional[str] = None  # GET, POST, PUT, DELETE
    request_path: Optional[str] = None
    status_code: Optional[int] = None
    
    # Additional context
    audit_metadata: Optional[dict] = Field(default=None, sa_column=Column(JSONType), alias="metadata")
    
    # Session tracking
    session_id: Optional[uuid.UUID] = None
    
    # For failure tracking
    error_message: Optional[str] = None
    
    class Config:
        """SQLModel configuration."""
        from_attributes = True
