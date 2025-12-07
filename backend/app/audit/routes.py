"""Audit logging API routes."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import List, Optional
import uuid
import datetime

# Third-party
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

# Local - Core
from app.core.dependencies import get_db, get_current_user, get_admin_user

# Local - Module
from .schemas import AuditLogResponse, AuditLogFilter
from .repositories import (
    get_audit_logs,
    get_audit_log_by_id,
    get_user_audit_logs,
    get_resource_audit_logs,
    count_audit_logs
)
from .enums import AuditAction, ResourceType

# ============================================================================
# SETUP
# ============================================================================

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("", response_model=List[AuditLogResponse])
@router.get("/", response_model=List[AuditLogResponse])
def list_audit_logs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    start_date: Optional[datetime.datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime.datetime] = Query(None, description="Filter by end date"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """
    List audit logs with optional filters.
    
    Requires admin authentication. Returns audit logs visible to admins only.
    """
    # Convert string UUIDs to UUID objects
    user_uuid = uuid.UUID(user_id) if user_id else None
    resource_uuid = uuid.UUID(resource_id) if resource_id else None
    
    logs = get_audit_logs(
        db=db,
        user_id=user_uuid,
        action=action,
        resource_type=resource_type,
        resource_id=resource_uuid,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    
    return logs


@router.get("/{audit_log_id}", response_model=AuditLogResponse)
def get_audit_log(
    audit_log_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Get a specific audit log by ID. Admin only."""
    try:
        log_uuid = uuid.UUID(audit_log_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    log = get_audit_log_by_id(db, log_uuid)
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    
    return log


@router.get("/user/{user_id}", response_model=List[AuditLogResponse])
def get_user_logs(
    user_id: str,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Get all audit logs for a specific user. Admin only."""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    logs = get_user_audit_logs(db, user_uuid, limit, offset)
    return logs


@router.get("/resource/{resource_type}/{resource_id}", response_model=List[AuditLogResponse])
def get_resource_logs(
    resource_type: str,
    resource_id: str,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Get all audit logs for a specific resource. Admin only."""
    try:
        res_uuid = uuid.UUID(resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    logs = get_resource_audit_logs(db, resource_type, res_uuid, limit, offset)
    return logs


@router.get("/stats/summary")
def get_audit_stats(
    start_date: Optional[datetime.datetime] = Query(None),
    end_date: Optional[datetime.datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """
    Get audit log statistics. Admin only.
    
    Returns summary of actions, top users, top resources, etc.
    """
    # TODO: Implement aggregation queries
    # For now, return basic counts
    total_logs = count_audit_logs(db, start_date=start_date, end_date=end_date)
    
    return {
        "total_logs": total_logs,
        "start_date": start_date,
        "end_date": end_date
    }
