"""Dashboard API endpoints for aggregated statistics.

This module provides optimized endpoints that aggregate data from multiple
sources to reduce the number of API calls needed for dashboard views.
"""

# Standard library
import logging
from datetime import datetime, timedelta
from typing import Any

# Third-party
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, and_, func, select

# Internal
from app.audit.models import AuditLog
from app.auth.models import User
from app.core.dependencies import get_current_user, get_db
from app.datasets.models import Dataset
from app.evaluations.models import Evaluation
from app.generators.models import Generator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Get aggregated dashboard statistics and recent items.
    
    This endpoint combines multiple queries into one response to optimize
    dashboard loading performance. Returns:
    - Overall statistics (counts, averages)
    - Recent generators (last 5)
    - Recent activity (last 5 audit logs for admin users)
    
    **Optimization**: Replaces 3-4 separate API calls with a single request.
    """
    try:
        is_admin = current_user.role == "admin"
        
        # Get counts in a single query per table
        dataset_count = db.exec(
            select(func.count(Dataset.id)).where(Dataset.uploader_id == current_user.id)
        ).one()
        
        # Get generator stats
        generator_total = db.exec(
            select(func.count(Generator.id)).where(Generator.created_by == current_user.id)
        ).one()
        
        active_generator_count = db.exec(
            select(func.count(Generator.id)).where(
                and_(
                    Generator.created_by == current_user.id,
                    Generator.status.in_(["training", "pending"])
                )
            )
        ).one()
        
        # Get evaluation stats
        evaluation_total = db.exec(
            select(func.count(Evaluation.id))
            .join(Generator, Evaluation.generator_id == Generator.id)
            .where(Generator.created_by == current_user.id)
        ).one()
        
        # In the current model, existence of an Evaluation record implies it is completed
        completed_evaluation_count = evaluation_total
        
        # Get average risk score (using risk_score as proxy for privacy metric)
        avg_privacy_score = db.exec(
            select(func.avg(Evaluation.risk_score))
            .join(Generator, Evaluation.generator_id == Generator.id)
            .where(
                and_(
                    Generator.created_by == current_user.id,
                    Evaluation.risk_score.isnot(None)
                )
            )
        ).one()
        
        # Get recent generators (last 5, ordered by creation date)
        recent_generators = db.exec(
            select(Generator)
            .where(Generator.created_by == current_user.id)
            .order_by(Generator.created_at.desc())
            .limit(5)
        ).all()
        
        # Get recent activities (audit logs for admin only)
        recent_activities = []
        if is_admin:
            recent_activities = db.exec(
                select(AuditLog)
                .order_by(AuditLog.timestamp.desc())
                .limit(5)
            ).all()
        
        # Build response
        response = {
            "stats": {
                "total_datasets": dataset_count,
                "total_generators": generator_total,
                "active_generators": active_generator_count,
                "total_evaluations": evaluation_total,
                "completed_evaluations": completed_evaluation_count,
                "avg_privacy_score": float(avg_privacy_score) if avg_privacy_score else 0.0,
            },
            "recent_generators": [
                {
                    "id": str(gen.id),
                    "name": gen.name,
                    "type": gen.type,
                    "status": gen.status,
                    "dataset_id": str(gen.dataset_id),
                    "created_at": gen.created_at.isoformat() if gen.created_at else None,
                    "updated_at": gen.updated_at.isoformat() if gen.updated_at else None,
                    "privacy_config": gen.privacy_config,
                    "privacy_spent": gen.privacy_spent,
                }
                for gen in recent_generators
            ],
            "recent_activities": [
                {
                    "id": str(log.id),
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "details": log.details,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                }
                for log in recent_activities
            ] if is_admin else [],
        }
        
        logger.info(
            f"Dashboard summary generated for user {current_user.id}: "
            f"{dataset_count} datasets, {active_generator_count} active generators"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating dashboard summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate dashboard summary"
        )


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Get lightweight dashboard statistics only (no resource lists).
    
    This endpoint provides just the counts and metrics, without fetching
    any actual resource objects. Use this for even faster loading when you
    only need the numbers.
    """
    try:
        # Get counts efficiently
        dataset_count = db.exec(
            select(func.count(Dataset.id)).where(Dataset.uploader_id == current_user.id)
        ).one()
        
        generator_total = db.exec(
            select(func.count(Generator.id)).where(Generator.created_by == current_user.id)
        ).one()
        
        active_generator_count = db.exec(
            select(func.count(Generator.id)).where(
                and_(
                    Generator.created_by == current_user.id,
                    Generator.status.in_(["training", "pending"])
                )
            )
        ).one()
        
        evaluation_total = db.exec(
            select(func.count(Evaluation.id))
            .join(Generator, Evaluation.generator_id == Generator.id)
            .where(Generator.created_by == current_user.id)
        ).one()
        
        # In current model, existance implies completion
        completed_evaluation_count = evaluation_total
        
        avg_privacy_score = db.exec(
            select(func.avg(Evaluation.risk_score))
            .join(Generator, Evaluation.generator_id == Generator.id)
            .where(
                and_(
                    Generator.created_by == current_user.id,
                    Evaluation.risk_score.isnot(None)
                )
            )
        ).one()
        
        return {
            "total_datasets": dataset_count,
            "total_generators": generator_total,
            "active_generators": active_generator_count,
            "total_evaluations": evaluation_total,
            "completed_evaluations": completed_evaluation_count,
            "avg_privacy_score": float(avg_privacy_score) if avg_privacy_score else 0.0,
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to get dashboard statistics"
        )
