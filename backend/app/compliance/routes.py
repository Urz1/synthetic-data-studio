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
from app.core.dependencies import get_db, get_current_user

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
    current_user = Depends(get_current_user)
):
    """List all compliance reports."""
    return list_reports(db)


@router.post("/", response_model=ComplianceReportResponse, status_code=status.HTTP_201_CREATED)
def post_report(
    report: ComplianceReportCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new compliance report."""
    # Convert schema to model
    # Convert schema to model
    # Note: We use **report.dict() for consistency and to avoid potential from_orm issues
    db_report = ComplianceReport(**report.dict())
    return create_report(db, db_report)

