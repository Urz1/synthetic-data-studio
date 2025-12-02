"""Repositories for projects module (data access layer)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import List, Optional
import uuid

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
        List of projects
    """
    query = db.query(Project)
    
    if owner_id:
        query = query.filter(Project.owner_id == owner_id)
    
    return query.offset(skip).limit(limit).all()


def get_project_by_id(db: Session, project_id: uuid.UUID) -> Optional[Project]:
    """Get a project by ID."""
    return db.query(Project).filter(Project.id == project_id).first()


def create_project(db: Session, project: Project) -> Project:
    """Create a new project."""
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project: Project) -> Project:
    """Update an existing project."""
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    """Delete a project."""
    db.delete(project)
    db.commit()
