"""CRUD operations for ML models."""

import datetime
import uuid
from sqlmodel import Session, select
from .models import Model, ModelVersion


def get_models(db: Session, skip: int = 0, limit: int = 100):
    return db.exec(select(Model).offset(skip).limit(limit)).all()


def get_model_by_id(db: Session, model_id: str):
    return db.get(Model, model_id)


def create_model(db: Session, model: Model):
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def get_model_versions(db: Session, model_id: str):
    model_uuid = uuid.UUID(model_id) if isinstance(model_id, str) else model_id
    return db.exec(select(ModelVersion).where(ModelVersion.model_id == model_uuid)).all()


def create_model_version(db: Session, version: ModelVersion):
    db.add(version)
    db.commit()
    db.refresh(version)
    return version