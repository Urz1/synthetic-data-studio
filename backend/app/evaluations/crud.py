"""
CRUD operations for evaluations.
"""

import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from .models import Evaluation

logger = logging.getLogger(__name__)


def create_evaluation(
    db: Session,
    generator_id: str,
    dataset_id: str,
    report: dict
) -> Evaluation:
    """
    Create new evaluation record.
    
    Args:
        db: Database session
        generator_id: Generator ID
        dataset_id: Dataset ID
        report: Quality report dictionary
    
    Returns:
        Created evaluation record
    """
    # Convert string IDs to UUID objects
    gen_uuid = uuid.UUID(generator_id) if isinstance(generator_id, str) else generator_id
    ds_uuid = uuid.UUID(dataset_id) if isinstance(dataset_id, str) else dataset_id
    
    evaluation = Evaluation(
        generator_id=gen_uuid,
        dataset_id=ds_uuid,
        report=report
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    logger.info(f"Created evaluation {evaluation.id}")
    
    return evaluation


def get_evaluation(db: Session, evaluation_id: str) -> Optional[Evaluation]:
    """
    Get evaluation by ID.
    
    Args:
        db: Database session
        evaluation_id: Evaluation ID
    
    Returns:
        Evaluation record or None
    """
    eval_uuid = uuid.UUID(evaluation_id) if isinstance(evaluation_id, str) else evaluation_id
    return db.query(Evaluation).filter(Evaluation.id == eval_uuid).first()


def list_evaluations_by_generator(db: Session, generator_id: str) -> List[Evaluation]:
    """
    List all evaluations for a generator.
    
    Args:
        db: Database session
        generator_id: Generator ID
    
    Returns:
        List of evaluations
    """
    gen_uuid = uuid.UUID(generator_id) if isinstance(generator_id, str) else generator_id
    return db.query(Evaluation).filter(
        Evaluation.generator_id == gen_uuid
    ).order_by(Evaluation.created_at.desc()).all()


def list_evaluations_by_dataset(db: Session, dataset_id: str) -> List[Evaluation]:
    """
    List all evaluations for a dataset.
    
    Args:
        db: Database session
        dataset_id: Dataset ID
    
    Returns:
        List of evaluations
    """
    ds_uuid = uuid.UUID(dataset_id) if isinstance(dataset_id, str) else dataset_id
    return db.query(Evaluation).filter(
        Evaluation.dataset_id == ds_uuid
    ).order_by(Evaluation.created_at.desc()).all()


def delete_evaluation(db: Session, evaluation_id: str) -> bool:
    """
    Delete evaluation.
    
    Args:
        db: Database session
        evaluation_id: Evaluation ID
    
    Returns:
        True if deleted, False if not found
    """
    eval_uuid = uuid.UUID(evaluation_id) if isinstance(evaluation_id, str) else evaluation_id
    evaluation = get_evaluation(db, str(eval_uuid))
    if not evaluation:
        return False
    
    db.delete(evaluation)
    db.commit()
    
    logger.info(f"Deleted evaluation {evaluation_id}")
    
    return True
