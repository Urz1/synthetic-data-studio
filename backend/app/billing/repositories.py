"""Billing & usage repository functions."""

from typing import List, Optional
from datetime import datetime
import uuid

from sqlmodel import Session, select, func

from .models import UsageRecord, Quota


# ============================================================================
# USAGE RECORD OPERATIONS
# ============================================================================

def create_usage_record(
    db: Session,
    project_id: uuid.UUID,
    user_id: Optional[uuid.UUID],
    usage_type: str,
    quantity: int
) -> UsageRecord:
    """Create a new usage record."""
    record = UsageRecord(
        project_id=project_id,
        user_id=user_id,
        type=usage_type,
        quantity=quantity
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_usage_records(
    db: Session,
    project_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
    usage_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0
) -> List[UsageRecord]:
    """Get usage records with optional filters."""
    query = select(UsageRecord)
    
    if project_id:
        query = query.where(UsageRecord.project_id == project_id)
    if user_id:
        query = query.where(UsageRecord.user_id == user_id)
    if usage_type:
        query = query.where(UsageRecord.type == usage_type)
    if start_date:
        query = query.where(UsageRecord.created_at >= start_date)
    if end_date:
        query = query.where(UsageRecord.created_at <= end_date)
    
    query = query.order_by(UsageRecord.created_at.desc()).offset(offset).limit(limit)
    
    return list(db.exec(query).all())


def get_usage_summary(
    db: Session,
    project_id: uuid.UUID,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> dict:
    """Get aggregated usage summary for a project."""
    query = select(
        UsageRecord.type,
        func.sum(UsageRecord.quantity).label("total")
    ).where(UsageRecord.project_id == project_id)
    
    if start_date:
        query = query.where(UsageRecord.created_at >= start_date)
    if end_date:
        query = query.where(UsageRecord.created_at <= end_date)
    
    query = query.group_by(UsageRecord.type)
    
    results = db.exec(query).all()
    
    summary = {
        "total_generations": 0,
        "total_evaluations": 0,
        "total_api_calls": 0,
        "storage_used_mb": 0.0,
    }
    
    for row in results:
        usage_type, total = row
        if usage_type == "generation":
            summary["total_generations"] = total or 0
        elif usage_type == "evaluation":
            summary["total_evaluations"] = total or 0
        elif usage_type == "api_call":
            summary["total_api_calls"] = total or 0
        elif usage_type == "storage":
            summary["storage_used_mb"] = float(total or 0)
    
    summary["period_start"] = start_date
    summary["period_end"] = end_date
    
    return summary


# ============================================================================
# QUOTA OPERATIONS
# ============================================================================

def create_quota(
    db: Session,
    project_id: uuid.UUID,
    quota_type: str,
    limit_val: int,
    reset_at: datetime
) -> Quota:
    """Create a new quota."""
    quota = Quota(
        project_id=project_id,
        quota_type=quota_type,
        limit_val=limit_val,
        used=0,
        reset_at=reset_at
    )
    db.add(quota)
    db.commit()
    db.refresh(quota)
    return quota


def get_quota(
    db: Session,
    quota_id: uuid.UUID
) -> Optional[Quota]:
    """Get a quota by ID."""
    return db.get(Quota, quota_id)


def get_project_quotas(
    db: Session,
    project_id: uuid.UUID
) -> List[Quota]:
    """Get all quotas for a project."""
    query = select(Quota).where(Quota.project_id == project_id)
    return list(db.exec(query).all())


def get_quota_by_type(
    db: Session,
    project_id: uuid.UUID,
    quota_type: str
) -> Optional[Quota]:
    """Get a specific quota type for a project."""
    query = select(Quota).where(
        Quota.project_id == project_id,
        Quota.quota_type == quota_type
    )
    return db.exec(query).first()


def update_quota(
    db: Session,
    quota_id: uuid.UUID,
    limit_val: Optional[int] = None,
    used: Optional[int] = None,
    reset_at: Optional[datetime] = None
) -> Optional[Quota]:
    """Update a quota."""
    quota = db.get(Quota, quota_id)
    if not quota:
        return None
    
    if limit_val is not None:
        quota.limit_val = limit_val
    if used is not None:
        quota.used = used
    if reset_at is not None:
        quota.reset_at = reset_at
    
    db.add(quota)
    db.commit()
    db.refresh(quota)
    return quota


def increment_quota_usage(
    db: Session,
    project_id: uuid.UUID,
    quota_type: str,
    amount: int = 1
) -> Optional[Quota]:
    """Increment usage for a quota."""
    quota = get_quota_by_type(db, project_id, quota_type)
    if quota:
        quota.used += amount
        db.add(quota)
        db.commit()
        db.refresh(quota)
    return quota


def check_quota_available(
    db: Session,
    project_id: uuid.UUID,
    quota_type: str,
    required: int = 1
) -> tuple[bool, Optional[str]]:
    """Check if quota is available. Returns (is_available, error_message)."""
    quota = get_quota_by_type(db, project_id, quota_type)
    
    if not quota:
        # No quota set = unlimited
        return True, None
    
    # Check if quota needs reset
    if datetime.utcnow() >= quota.reset_at:
        quota.used = 0
        db.add(quota)
        db.commit()
    
    remaining = quota.limit_val - quota.used
    
    if remaining < required:
        return False, f"Quota exceeded for {quota_type}. Used: {quota.used}/{quota.limit_val}"
    
    return True, None


def reset_quota(
    db: Session,
    quota_id: uuid.UUID,
    new_reset_at: datetime
) -> Optional[Quota]:
    """Reset a quota's usage counter."""
    quota = db.get(Quota, quota_id)
    if quota:
        quota.used = 0
        quota.reset_at = new_reset_at
        db.add(quota)
        db.commit()
        db.refresh(quota)
    return quota
