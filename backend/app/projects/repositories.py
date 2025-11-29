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

def get_projects(db: Session) -> List[Project]:
    """Get all projects."""
    return db.query(Project).all()


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
