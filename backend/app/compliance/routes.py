from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.core.dependencies import get_db, get_current_user
from .models import ComplianceReport
from .crud import list_reports, create_report

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/", response_model=list[ComplianceReport])
def get_reports(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return list_reports(db)


@router.post("/", response_model=ComplianceReport)
def post_report(report: ComplianceReport, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_report(db, report)
