"""Audit log Pydantic schemas for request/response."""

from typing import Optional, Dict, Any
import uuid
import datetime

from pydantic import BaseModel


class AuditLogCreate(BaseModel):
    """Schema for creating an audit log entry."""
    
    user_id: Optional[uuid.UUID] = None
    user_email: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[uuid.UUID] = None
    resource_name: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_method: Optional[str] = None
    request_path: Optional[str] = None
    status_code: Optional[int] = None
    audit_metadata: Optional[Dict[str, Any]] = None
    session_id: Optional[uuid.UUID] = None
    error_message: Optional[str] = None


class AuditLogResponse(BaseModel):
    """Schema for audit log responses."""
    
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    user_email: Optional[str]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[uuid.UUID]
    resource_name: Optional[str]
    timestamp: datetime.datetime
    ip_address: Optional[str]
    user_agent: Optional[str]
    request_method: Optional[str]
    request_path: Optional[str]
    status_code: Optional[int]
    audit_metadata: Optional[Dict[str, Any]]
    session_id: Optional[uuid.UUID]
    error_message: Optional[str]
    
    class Config:
        from_attributes = True


class AuditLogFilter(BaseModel):
    """Schema for filtering audit logs."""
    
    user_id: Optional[uuid.UUID] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[uuid.UUID] = None
    start_date: Optional[datetime.datetime] = None
    end_date: Optional[datetime.datetime] = None
    limit: int = 100
    offset: int = 0
