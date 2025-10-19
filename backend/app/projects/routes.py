try:
    from fastapi import APIRouter
    from .models import Project
    from .crud import list_projects, create_project

    router = APIRouter(prefix="/projects", tags=["projects"])


    @router.get("/", response_model=list[Project])
    def get_projects():
        return list_projects()


    @router.post("/", response_model=Project)
    def post_project(p: Project):
        return create_project(p)
except Exception:
    router = None
