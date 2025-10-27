from sqlmodel import Session
from .models import Project


def get_projects(db: Session):
    return db.query(Project).all()


def create_project(db: Session, project: Project):
    db.add(project)
    db.commit()
    db.refresh(project)
    return project
