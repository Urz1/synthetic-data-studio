"""Repositories for compliance module (data access layer)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import uuid
from typing import List, Optional

# Third-party
from sqlmodel import Session, select

# Local - Module
from .models import ComplianceReport

# ============================================================================
# REPOSITORIES
# ============================================================================

def list_reports(db: Session) -> List[ComplianceReport]:
    """List all compliance reports."""
    return db.exec(select(ComplianceReport)).all()


def create_report(db: Session, report: ComplianceReport) -> ComplianceReport:
    """Create a new compliance report."""
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_report(db: Session, report_id: uuid.UUID) -> Optional[ComplianceReport]:
    """Get compliance report by ID."""
    return db.get(ComplianceReport, report_id)
