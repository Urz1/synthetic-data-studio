try:
    from fastapi import APIRouter, Depends
    from sqlmodel import Session
    from app.core.dependencies import get_db, get_current_user
    from .models import Project
    from .crud import get_projects, create_project

    router = APIRouter(prefix="/projects", tags=["projects"])


    @router.get("/", response_model=list[Project])
    def list_projects(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
        return get_projects(db)


    @router.post("/", response_model=Project)
    def create_new_project(project: Project, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
        # Set owner_id to current user
        project.owner_id = current_user.id
        return create_project(db, project)
except Exception:
    router = None
