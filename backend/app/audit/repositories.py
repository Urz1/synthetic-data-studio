"""Audit log repositories (data access layer)."""

# Standard library
import datetime
import uuid
from typing import List, Optional

# Third-party
from sqlmodel import Session, and_, select

# Internal
from .models import AuditLog


def create_audit_log(db: Session, audit_log: AuditLog) -> AuditLog:
    """Create a new audit log entry."""
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_audit_logs(
    db: Session,
    user_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[uuid.UUID] = None,
    start_date: Optional[datetime.datetime] = None,
    end_date: Optional[datetime.datetime] = None,
    limit: int = 100,
    offset: int = 0
) -> List[AuditLog]:
    """
    Get audit logs with optional filters.
    
    Args:
        db: Database session
        user_id: Filter by user
        action: Filter by action type
        resource_type: Filter by resource type
        resource_id: Filter by specific resource
        start_date: Filter by start date
        end_date: Filter by end date
        limit: Maximum number of results
        offset: Offset for pagination
        
    Returns:
        List of audit log entries
    """
    query = select(AuditLog)
    
    # Build filters
    filters = []
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if action:
        filters.append(AuditLog.action == action)
    if resource_type:
        filters.append(AuditLog.resource_type == resource_type)
    if resource_id:
        filters.append(AuditLog.resource_id == resource_id)
    if start_date:
        filters.append(AuditLog.timestamp >= start_date)
    if end_date:
        filters.append(AuditLog.timestamp <= end_date)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Order by timestamp descending (most recent first)
    query = query.order_by(AuditLog.timestamp.desc())
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    return db.exec(query).all()


def get_audit_log_by_id(db: Session, audit_log_id: uuid.UUID) -> Optional[AuditLog]:
    """Get a specific audit log by ID."""
    return db.get(AuditLog, audit_log_id)


def get_user_audit_logs(
    db: Session,
    user_id: uuid.UUID,
    limit: int = 100,
    offset: int = 0
) -> List[AuditLog]:
    """Get all audit logs for a specific user."""
    return get_audit_logs(db, user_id=user_id, limit=limit, offset=offset)


def get_resource_audit_logs(
    db: Session,
    resource_type: str,
    resource_id: uuid.UUID,
    limit: int = 100,
    offset: int = 0
) -> List[AuditLog]:
    """Get all audit logs for a specific resource."""
    return get_audit_logs(
        db,
        resource_type=resource_type,
        resource_id=resource_id,
        limit=limit,
        offset=offset
    )


def count_audit_logs(
    db: Session,
    user_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    start_date: Optional[datetime.datetime] = None,
    end_date: Optional[datetime.datetime] = None
) -> int:
    """Count audit logs matching filters (for pagination)."""
    query = select(AuditLog)
    
    filters = []
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if action:
        filters.append(AuditLog.action == action)
    if resource_type:
        filters.append(AuditLog.resource_type == resource_type)
    if start_date:
        filters.append(AuditLog.timestamp >= start_date)
    if end_date:
        filters.append(AuditLog.timestamp <= end_date)
    
    if filters:
        query = query.where(and_(*filters))
    
    return len(db.exec(query).all())
