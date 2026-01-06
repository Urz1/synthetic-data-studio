"""
CRUD operations for evaluations.
"""

# Standard library
import logging
import uuid
from datetime import datetime
from typing import List, Optional

# Third-party
from sqlalchemy.orm import Session

# Internal
from .models import Evaluation

logger = logging.getLogger(__name__)


def create_evaluation(
    db: Session,
    generator_id: str,
    dataset_id: str,
    report: dict,
    created_by: str = None  # ADDED: User ID for audit trail
) -> Evaluation:
    """
    Create new evaluation record.
    
    Args:
        db: Database session
        generator_id: Generator ID
        dataset_id: Dataset ID
        report: Quality report dictionary
        created_by: User ID who ran the evaluation
    
    Returns:
        Created evaluation record
    """
    # Convert string IDs to UUID objects
    gen_uuid = uuid.UUID(generator_id) if isinstance(generator_id, str) else generator_id
    ds_uuid = uuid.UUID(dataset_id) if isinstance(dataset_id, str) else dataset_id
    user_uuid = uuid.UUID(created_by) if created_by and isinstance(created_by, str) else created_by
    
    # Compute artifact hash for integrity verification
    artifact_hash = Evaluation.compute_report_hash(report)
    
    evaluation = Evaluation(
        generator_id=gen_uuid,
        dataset_id=ds_uuid,
        report=report,
        created_by=user_uuid,
        artifact_hash=artifact_hash
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    logger.info(f"Created evaluation {evaluation.id} by user {created_by} (hash: {artifact_hash[:12]}...)")
    
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


def delete_evaluation(db: Session, evaluation_id: str, deleted_by: str = None) -> bool:
    """
    Soft-delete evaluation (for audit trail immutability).
    
    Args:
        db: Database session
        evaluation_id: Evaluation ID
        deleted_by: User ID who is deleting
    
    Returns:
        True if soft-deleted, False if not found
    """
    from datetime import datetime
    
    eval_uuid = uuid.UUID(evaluation_id) if isinstance(evaluation_id, str) else evaluation_id
    evaluation = get_evaluation(db, str(eval_uuid))
    if not evaluation:
        return False
    
    # SOFT DELETE: Set deleted_at timestamp instead of removing record
    evaluation.deleted_at = datetime.utcnow()
    if deleted_by:
        evaluation.deleted_by = uuid.UUID(deleted_by) if isinstance(deleted_by, str) else deleted_by
    
    db.add(evaluation)
    db.commit()
    
    logger.info(f"Soft-deleted evaluation {evaluation_id} by user {deleted_by}")
    
    return True
