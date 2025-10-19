try:
    from fastapi import APIRouter
    from .models import ComplianceReport
    from .crud import list_reports, create_report

    router = APIRouter(prefix="/compliance", tags=["compliance"])


    @router.get("/", response_model=list[ComplianceReport])
    def get_reports():
        return list_reports()


    @router.post("/", response_model=ComplianceReport)
    def post_report(r: ComplianceReport):
        return create_report(r)
except Exception:
    router = None
