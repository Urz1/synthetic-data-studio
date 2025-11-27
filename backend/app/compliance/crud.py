from sqlmodel import Session, select
from .models import ComplianceReport
import uuid

def list_reports(db: Session):
    return db.exec(select(ComplianceReport)).all()


def create_report(db: Session, report: ComplianceReport):
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

def get_report(db: Session, report_id: uuid.UUID):
    return db.get(ComplianceReport, report_id)
