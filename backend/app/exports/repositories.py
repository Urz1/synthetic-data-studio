"""CRUD operations for exports."""

import uuid
import logging
from datetime import datetime
from typing import Optional, List
from sqlmodel import Session, select

from .models import Export, ExportCreate, ExportType, ExportFormat

logger = logging.getLogger(__name__)


def create_export(db: Session, export_data: ExportCreate, user_id: uuid.UUID) -> Export:
    """Create a new export record."""
    export = Export(
        export_type=export_data.export_type.value,
        format=export_data.format.value,
        title=export_data.title,
        generator_id=export_data.generator_id,
        dataset_id=export_data.dataset_id,
        project_id=export_data.project_id,
        s3_key=export_data.s3_key,
        s3_bucket=export_data.s3_bucket,
        file_size_bytes=export_data.file_size_bytes,
        metadata_json=export_data.metadata_json,
        expires_at=export_data.expires_at,
        created_by=user_id
    )
    
    db.add(export)
    db.commit()
    db.refresh(export)
    
    logger.info(f"Created export record: {export.id} ({export.export_type}/{export.format})")
    return export


def get_export_by_id(db: Session, export_id: uuid.UUID) -> Optional[Export]:
    """Get an export by ID."""
    statement = select(Export).where(
        Export.id == export_id,
        Export.deleted_at.is_(None)
    )
    return db.exec(statement).first()


def list_exports_by_user(
    db: Session, 
    user_id: uuid.UUID,
    export_type: Optional[ExportType] = None,
    format: Optional[ExportFormat] = None,
    generator_id: Optional[uuid.UUID] = None,
    dataset_id: Optional[uuid.UUID] = None,
    project_id: Optional[uuid.UUID] = None,
    limit: int = 50,
    offset: int = 0
) -> tuple[List[Export], int]:
    """List exports for a user with optional filters."""
    statement = select(Export).where(
        Export.created_by == user_id,
        Export.deleted_at.is_(None)
    )
    
    # Apply filters
    if export_type:
        statement = statement.where(Export.export_type == export_type.value)
    if format:
        statement = statement.where(Export.format == format.value)
    if generator_id:
        statement = statement.where(Export.generator_id == generator_id)
    if dataset_id:
        statement = statement.where(Export.dataset_id == dataset_id)
    if project_id:
        statement = statement.where(Export.project_id == project_id)
    
    # Get total count
    count_statement = statement
    total = len(db.exec(count_statement).all())
    
    # Apply pagination and ordering
    statement = statement.order_by(Export.created_at.desc()).offset(offset).limit(limit)
    
    exports = db.exec(statement).all()
    return list(exports), total


def list_exports_by_generator(
    db: Session,
    generator_id: uuid.UUID,
    limit: int = 20
) -> List[Export]:
    """List all exports for a specific generator."""
    statement = select(Export).where(
        Export.generator_id == generator_id,
        Export.deleted_at.is_(None)
    ).order_by(Export.created_at.desc()).limit(limit)
    
    return list(db.exec(statement).all())


def list_exports_by_dataset(
    db: Session,
    dataset_id: uuid.UUID,
    limit: int = 20
) -> List[Export]:
    """List all exports for a specific dataset."""
    statement = select(Export).where(
        Export.dataset_id == dataset_id,
        Export.deleted_at.is_(None)
    ).order_by(Export.created_at.desc()).limit(limit)
    
    return list(db.exec(statement).all())


def delete_export(db: Session, export_id: uuid.UUID) -> bool:
    """Soft delete an export record."""
    export = get_export_by_id(db, export_id)
    if not export:
        return False
    
    export.deleted_at = datetime.utcnow()
    db.add(export)
    db.commit()
    
    logger.info(f"Soft deleted export: {export_id}")
    return True


def hard_delete_export(db: Session, export_id: uuid.UUID) -> bool:
    """Permanently delete an export record (use with caution)."""
    export = db.get(Export, export_id)
    if not export:
        return False
    
    db.delete(export)
    db.commit()
    
    logger.info(f"Hard deleted export: {export_id}")
    return True


def cleanup_expired_exports(db: Session) -> int:
    """Delete exports that have passed their expiry time. Returns count deleted."""
    now = datetime.utcnow()
    statement = select(Export).where(
        Export.expires_at.isnot(None),
        Export.expires_at < now,
        Export.deleted_at.is_(None)
    )
    
    expired = db.exec(statement).all()
    count = 0
    
    for export in expired:
        export.deleted_at = now
        db.add(export)
        count += 1
    
    if count > 0:
        db.commit()
        logger.info(f"Cleaned up {count} expired exports")
    
    return count
