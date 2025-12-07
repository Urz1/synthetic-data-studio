"""Compliance API Routes."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import List

# Third-party
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

# Local - Core
from app.core.dependencies import get_db, get_current_user, get_admin_user

# Local - Module
from .schemas import ComplianceReportCreate, ComplianceReportResponse
from .repositories import list_reports, create_report
from .models import ComplianceReport

# ============================================================================
# SETUP
# ============================================================================

router = APIRouter(prefix="/compliance", tags=["compliance"])

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/", response_model=List[ComplianceReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """List all compliance reports. Admin only."""
    return list_reports(db)


@router.post("/", response_model=ComplianceReportResponse, status_code=status.HTTP_201_CREATED)
def post_report(
    report: ComplianceReportCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Create a new compliance report. Admin only."""
    # Convert schema to model
    # Convert schema to model
    # Note: We use **report.dict() for consistency and to avoid potential from_orm issues
    db_report = ComplianceReport(**report.dict())
    return create_report(db, db_report)


@router.get("/summary")
def get_compliance_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """
    Get compliance summary stats and recent reports (limit 5).
    Returns:
      - total_reports
      - counts by status
      - counts by framework
      - recent_reports (limit 5)
    """
    from sqlmodel import select, func
    # Get all reports
    reports = db.exec(select(ComplianceReport)).all()
    total_reports = len(reports)
    status_counts = {
        "compliant": 0,
        "warning": 0,
        "non_compliant": 0,
    }
    framework_counts = {}
    for r in reports:
        status_counts[r.status] = status_counts.get(r.status, 0) + 1
        framework_counts[r.framework] = framework_counts.get(r.framework, 0) + 1
    recent_reports = sorted(reports, key=lambda r: r.generated_at, reverse=True)[:5]
    return {
        "total_reports": total_reports,
        "status_counts": status_counts,
        "framework_counts": framework_counts,
        "recent_reports": [
            {
                "id": str(r.id),
                "generator_id": r.generator_id,
                "framework": r.framework,
                "status": r.status,
                "report_data": r.report_data,
                "generated_at": r.generated_at.isoformat() if r.generated_at else None,
            }
            for r in recent_reports
        ],
    }

