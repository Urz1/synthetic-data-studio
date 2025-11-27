"""Repositories for projects module (data access layer)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import List

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


def create_project(db: Session, project: Project) -> Project:
    """Create a new project."""
    db.add(project)
    db.commit()
    db.refresh(project)
    return project
