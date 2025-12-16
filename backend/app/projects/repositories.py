"""Repositories for projects module (data access layer)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import List, Optional
import uuid
import datetime

# Third-party
from sqlmodel import Session

# Local - Module
from .models import Project

# ============================================================================
# REPOSITORIES
# ============================================================================

def get_projects(
    db: Session,
    owner_id: Optional[uuid.UUID] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Project]:
    """
    Get projects with optional filtering and pagination.
    
    Args:
        db: Database session
        owner_id: Filter by owner (recommended for security)
        skip: Number of records to skip
        limit: Maximum records to return
        
    Returns:
        List of projects (excludes soft-deleted)
    """
    query = db.query(Project).filter(Project.deleted_at == None)  # Exclude soft-deleted
    
    if owner_id:
        query = query.filter(Project.owner_id == owner_id)
    
    return query.offset(skip).limit(limit).all()


def get_project_by_id(db: Session, project_id: uuid.UUID) -> Optional[Project]:
    """Get a project by ID (excludes soft-deleted)."""
    return db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at == None
    ).first()


def create_project(db: Session, project: Project, user_id: uuid.UUID = None) -> Project:
    """Create a new project with audit trail."""
    if user_id:
        project.created_by = user_id
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project: Project) -> Project:
    """Update an existing project with timestamp."""
    project.updated_at = datetime.datetime.utcnow()
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project, deleted_by: uuid.UUID = None) -> None:
    """Soft-delete a project for audit trail."""
    project.deleted_at = datetime.datetime.utcnow()
    if deleted_by:
        project.deleted_by = deleted_by
    db.add(project)
    db.commit()

