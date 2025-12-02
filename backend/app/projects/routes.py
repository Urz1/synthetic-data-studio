"""Projects API Routes."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import List, Optional
import uuid

# Third-party
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

# Local - Core
from app.core.dependencies import get_db, get_current_user

# Local - Module
from .schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from .repositories import (
    get_projects,
    get_project_by_id,
    create_project,
    update_project,
    delete_project
)
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
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Max records to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List projects owned by the current user."""
    # Filter to only return user's own projects
    return get_projects(db, owner_id=current_user.id, skip=skip, limit=limit)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific project by ID."""
    project = get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    return project


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


@router.put("/{project_id}", response_model=ProjectResponse)
def update_existing_project(
    project_id: uuid.UUID,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing project."""
    # Get existing project
    db_project = get_project_by_id(db, project_id)
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Check ownership
    if db_project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project"
        )
    
    # Update fields
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)
    
    return update_project(db, db_project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a project."""
    # Get existing project
    db_project = get_project_by_id(db, project_id)
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Check ownership
    if db_project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project"
        )
    
    delete_project(db, db_project)
    return None
