"""Billing & usage API routes."""

from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.dependencies import get_db, get_current_user

from .schemas import (
    UsageRecordCreate,
    UsageRecordResponse,
    UsageSummary,
    QuotaCreate,
    QuotaUpdate,
    QuotaResponse,
    QuotaStatus,
    BillingReport
)
from .repositories import (
    create_usage_record,
    get_usage_records,
    get_usage_summary,
    create_quota,
    get_quota,
    get_project_quotas,
    update_quota,
    check_quota_available,
    reset_quota
)


router = APIRouter(prefix="/billing", tags=["billing"])


# ============================================================================
# USAGE ENDPOINTS
# ============================================================================

@router.get("/usage", response_model=List[UsageRecordResponse])
def list_usage_records(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    usage_type: Optional[str] = Query(None, description="Filter by type"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    List usage records with optional filters.
    
    Tracks all billable operations: generations, evaluations, storage, API calls.
    """
    project_uuid = uuid.UUID(project_id) if project_id else None
    
    records = get_usage_records(
        db=db,
        project_id=project_uuid,
        user_id=current_user.id,
        usage_type=usage_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    
    return records


@router.post("/usage", response_model=UsageRecordResponse, status_code=201)
def record_usage(
    usage: UsageRecordCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Record a usage event.
    
    Typically called internally by other services, but exposed for manual tracking.
    """
    record = create_usage_record(
        db=db,
        project_id=usage.project_id,
        user_id=current_user.id,
        usage_type=usage.type,
        quantity=usage.quantity
    )
    
    return record


@router.get("/usage/summary", response_model=UsageSummary)
def get_usage_stats(
    project_id: str = Query(..., description="Project ID"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get aggregated usage summary for a project.
    
    Returns totals for generations, evaluations, storage, and API calls.
    """
    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    # Default to current month if no dates provided
    if not start_date:
        now = datetime.utcnow()
        start_date = datetime(now.year, now.month, 1)
    if not end_date:
        end_date = datetime.utcnow()
    
    summary = get_usage_summary(
        db=db,
        project_id=project_uuid,
        start_date=start_date,
        end_date=end_date
    )
    
    return UsageSummary(**summary)


# ============================================================================
# QUOTA ENDPOINTS
# ============================================================================

@router.get("/quotas", response_model=List[QuotaResponse])
def list_quotas(
    project_id: str = Query(..., description="Project ID"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    List all quotas for a project.
    
    Returns current limits and usage for each quota type.
    """
    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    quotas = get_project_quotas(db, project_uuid)
    
    # Add computed 'remaining' field
    result = []
    for q in quotas:
        quota_dict = {
            "id": q.id,
            "project_id": q.project_id,
            "quota_type": q.quota_type,
            "limit_val": q.limit_val,
            "used": q.used,
            "reset_at": q.reset_at,
            "remaining": max(0, q.limit_val - q.used)
        }
        result.append(QuotaResponse(**quota_dict))
    
    return result


@router.post("/quotas", response_model=QuotaResponse, status_code=201)
def create_project_quota(
    quota: QuotaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new quota for a project.
    
    Quota types: 'generations', 'evaluations', 'storage_mb', 'api_calls'
    """
    new_quota = create_quota(
        db=db,
        project_id=quota.project_id,
        quota_type=quota.quota_type,
        limit_val=quota.limit_val,
        reset_at=quota.reset_at
    )
    
    return QuotaResponse(
        id=new_quota.id,
        project_id=new_quota.project_id,
        quota_type=new_quota.quota_type,
        limit_val=new_quota.limit_val,
        used=new_quota.used,
        reset_at=new_quota.reset_at,
        remaining=new_quota.limit_val - new_quota.used
    )


@router.put("/quotas/{quota_id}", response_model=QuotaResponse)
def update_project_quota(
    quota_id: str,
    quota_update: QuotaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing quota."""
    try:
        quota_uuid = uuid.UUID(quota_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quota ID format")
    
    updated = update_quota(
        db=db,
        quota_id=quota_uuid,
        limit_val=quota_update.limit_val,
        used=quota_update.used,
        reset_at=quota_update.reset_at
    )
    
    if not updated:
        raise HTTPException(status_code=404, detail="Quota not found")
    
    return QuotaResponse(
        id=updated.id,
        project_id=updated.project_id,
        quota_type=updated.quota_type,
        limit_val=updated.limit_val,
        used=updated.used,
        reset_at=updated.reset_at,
        remaining=max(0, updated.limit_val - updated.used)
    )


@router.post("/quotas/{quota_id}/reset", response_model=QuotaResponse)
def reset_project_quota(
    quota_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Reset a quota's usage counter."""
    try:
        quota_uuid = uuid.UUID(quota_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quota ID format")
    
    # Reset to next month
    now = datetime.utcnow()
    next_month = datetime(now.year, now.month, 1) + timedelta(days=32)
    next_reset = datetime(next_month.year, next_month.month, 1)
    
    reset = reset_quota(db, quota_uuid, next_reset)
    
    if not reset:
        raise HTTPException(status_code=404, detail="Quota not found")
    
    return QuotaResponse(
        id=reset.id,
        project_id=reset.project_id,
        quota_type=reset.quota_type,
        limit_val=reset.limit_val,
        used=reset.used,
        reset_at=reset.reset_at,
        remaining=reset.limit_val
    )


@router.get("/quotas/status", response_model=QuotaStatus)
def get_quota_status(
    project_id: str = Query(..., description="Project ID"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get current quota status for a project.
    
    Includes warnings for quotas approaching limits.
    """
    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    quotas = get_project_quotas(db, project_uuid)
    
    warnings = []
    is_over_limit = False
    
    quota_responses = []
    for q in quotas:
        remaining = max(0, q.limit_val - q.used)
        usage_pct = (q.used / q.limit_val * 100) if q.limit_val > 0 else 0
        
        if q.used >= q.limit_val:
            is_over_limit = True
            warnings.append(f"EXCEEDED: {q.quota_type} quota ({q.used}/{q.limit_val})")
        elif usage_pct >= 90:
            warnings.append(f"WARNING: {q.quota_type} at {usage_pct:.0f}% ({q.used}/{q.limit_val})")
        elif usage_pct >= 75:
            warnings.append(f"NOTICE: {q.quota_type} at {usage_pct:.0f}% ({q.used}/{q.limit_val})")
        
        quota_responses.append(QuotaResponse(
            id=q.id,
            project_id=q.project_id,
            quota_type=q.quota_type,
            limit_val=q.limit_val,
            used=q.used,
            reset_at=q.reset_at,
            remaining=remaining
        ))
    
    return QuotaStatus(
        project_id=project_uuid,
        quotas=quota_responses,
        is_over_limit=is_over_limit,
        warnings=warnings
    )


# ============================================================================
# BILLING REPORT ENDPOINT
# ============================================================================

@router.get("/report", response_model=BillingReport)
def get_billing_report(
    project_id: str = Query(..., description="Project ID"),
    start_date: Optional[datetime] = Query(None, description="Report start date"),
    end_date: Optional[datetime] = Query(None, description="Report end date"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate a billing report for a project.
    
    Includes usage summary and quota status for the specified period.
    """
    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    # Default to current month
    now = datetime.utcnow()
    if not start_date:
        start_date = datetime(now.year, now.month, 1)
    if not end_date:
        end_date = now
    
    # Get usage summary
    summary_data = get_usage_summary(db, project_uuid, start_date, end_date)
    usage_summary = UsageSummary(**summary_data)
    
    # Get quota status
    quotas = get_project_quotas(db, project_uuid)
    quota_responses = [
        QuotaResponse(
            id=q.id,
            project_id=q.project_id,
            quota_type=q.quota_type,
            limit_val=q.limit_val,
            used=q.used,
            reset_at=q.reset_at,
            remaining=max(0, q.limit_val - q.used)
        )
        for q in quotas
    ]
    
    # Future: Calculate actual cost based on pricing
    total_cost = 0.0
    
    return BillingReport(
        project_id=project_uuid,
        period_start=start_date,
        period_end=end_date,
        usage_summary=usage_summary,
        quota_status=quota_responses,
        total_cost_estimate=total_cost
    )
