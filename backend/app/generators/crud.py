import datetime
import uuid
from typing import Optional
from sqlmodel import Session, select
from .models import Generator


def get_generators(db: Session, skip: int = 0, limit: int = 100):
    return db.exec(select(Generator).offset(skip).limit(limit)).all()


def get_generator_by_id(db: Session, generator_id: str):
    return db.get(Generator, uuid.UUID(generator_id))


def create_generator(db: Session, generator: Generator):
    db.add(generator)
    db.commit()
    db.refresh(generator)
    return generator


def update_generator_status(db: Session, generator_id: str, status: str, output_dataset_id: Optional[str] = None):
    generator = db.get(Generator, uuid.UUID(generator_id))
    if generator:
        generator.status = status
        if output_dataset_id:
            generator.output_dataset_id = uuid.UUID(output_dataset_id)
        generator.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(generator)
    return generator
