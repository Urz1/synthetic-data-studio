"""Projects API Routes."""

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
from .schemas import ProjectCreate, ProjectResponse
from .repositories import get_projects, create_project
from .models import Project

# ============================================================================
# SETUP
# ============================================================================

router = APIRouter(prefix="/projects", tags=["projects"])

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all projects."""
    return get_projects(db)


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_new_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new project."""
    # Convert schema to model
    # Note: We use **project.dict() because from_orm fails when required fields (owner_id) are missing in the source
    db_project = Project(**project.dict())
    db_project.owner_id = current_user.id
    
    return create_project(db, db_project)

