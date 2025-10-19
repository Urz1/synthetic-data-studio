try:
    from fastapi import APIRouter
    from .models import Job
    from .crud import list_jobs, create_job

    router = APIRouter(prefix="/jobs", tags=["jobs"])


    @router.get("/", response_model=list[Job])
    def get_jobs():
        return list_jobs()


    @router.post("/", response_model=Job)
    def post_job(j: Job):
        return create_job(j)
except Exception:
    router = None
