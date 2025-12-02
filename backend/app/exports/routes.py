"""Exports API routes for listing and re-downloading saved exports."""

import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.dependencies import get_db, get_current_user
from app.core.validators import validate_uuid
from app.storage.s3 import get_storage_service, S3StorageError, S3ConfigurationError

from .models import (
    Export,
    ExportType,
    ExportFormat,
    ExportResponse,
    ExportListResponse
)
from . import repositories as exports_repo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/exports", tags=["exports"])


# ============================================================================
# Helper Functions
# ============================================================================

def _is_s3_available() -> bool:
    """Check if S3 is configured."""
    try:
        get_storage_service()
        return True
    except S3ConfigurationError:
        return False


def _export_to_response(export: Export, include_url: bool = False) -> ExportResponse:
    """Convert Export model to response schema."""
    response = ExportResponse(
        id=export.id,
        export_type=export.export_type,
        format=export.format,
        title=export.title,
        generator_id=export.generator_id,
        dataset_id=export.dataset_id,
        project_id=export.project_id,
        file_size_bytes=export.file_size_bytes,
        metadata_json=export.metadata_json,
        created_at=export.created_at,
        expires_at=export.expires_at
    )
    
    if include_url and export.s3_key:
        try:
            storage = get_storage_service()
            # Determine filename from title and format
            safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in export.title[:50])
            filename = f"{safe_title}.{export.format}"
            
            response.download_url = storage.generate_download_url(
                key=export.s3_key,
                filename=filename,
                expires_in=3600
            )
        except Exception as e:
            logger.warning(f"Could not generate download URL for export {export.id}: {e}")
    
    return response


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/", response_model=ExportListResponse)
def list_exports(
    export_type: Optional[str] = Query(None, description="Filter by export type"),
    format: Optional[str] = Query(None, description="Filter by format (pdf, docx)"),
    generator_id: Optional[str] = Query(None, description="Filter by generator ID"),
    dataset_id: Optional[str] = Query(None, description="Filter by dataset ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> ExportListResponse:
    """
    List all exports for the current user.
    
    Supports filtering by export_type, format, generator_id, or dataset_id.
    """
    # Convert string filters to enums if provided
    type_filter = None
    if export_type:
        try:
            type_filter = ExportType(export_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid export_type: {export_type}")
    
    format_filter = None
    if format:
        try:
            format_filter = ExportFormat(format)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid format: {format}")
    
    gen_id = None
    if generator_id:
        validate_uuid(generator_id, "generator_id")
        gen_id = uuid.UUID(generator_id)
    
    ds_id = None
    if dataset_id:
        validate_uuid(dataset_id, "dataset_id")
        ds_id = uuid.UUID(dataset_id)
    
    exports, total = exports_repo.list_exports_by_user(
        db=db,
        user_id=current_user.id,
        export_type=type_filter,
        format=format_filter,
        generator_id=gen_id,
        dataset_id=ds_id,
        limit=limit,
        offset=offset
    )
    
    return ExportListResponse(
        exports=[_export_to_response(e) for e in exports],
        total=total
    )


@router.get("/{export_id}", response_model=ExportResponse)
def get_export(
    export_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> ExportResponse:
    """Get a specific export by ID with download URL."""
    validate_uuid(export_id, "export_id")
    
    export = exports_repo.get_export_by_id(db, uuid.UUID(export_id))
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")
    
    # Check ownership
    if export.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this export")
    
    return _export_to_response(export, include_url=True)


@router.get("/{export_id}/download")
def get_export_download_url(
    export_id: str,
    expires_in: int = Query(3600, ge=60, le=86400, description="URL expiration in seconds"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get a fresh download URL for an export.
    
    Args:
        export_id: Export ID
        expires_in: URL expiration time (60 seconds to 24 hours)
    """
    validate_uuid(export_id, "export_id")
    
    export = exports_repo.get_export_by_id(db, uuid.UUID(export_id))
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")
    
    # Check ownership
    if export.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this export")
    
    if not export.s3_key:
        raise HTTPException(status_code=404, detail="Export file not found in storage")
    
    try:
        storage = get_storage_service()
        safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in export.title[:50])
        filename = f"{safe_title}.{export.format}"
        
        download_url = storage.generate_download_url(
            key=export.s3_key,
            filename=filename,
            expires_in=expires_in
        )
        
        return {
            "export_id": str(export.id),
            "download_url": download_url,
            "filename": filename,
            "expires_in": expires_in,
            "file_size_bytes": export.file_size_bytes
        }
    except S3StorageError as e:
        logger.error(f"Failed to generate download URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate download URL")


@router.delete("/{export_id}")
def delete_export(
    export_id: str,
    delete_from_s3: bool = Query(True, description="Also delete from S3 storage"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete an export record.
    
    Args:
        export_id: Export ID
        delete_from_s3: If True, also delete the file from S3
    """
    validate_uuid(export_id, "export_id")
    
    export = exports_repo.get_export_by_id(db, uuid.UUID(export_id))
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")
    
    # Check ownership
    if export.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this export")
    
    # Delete from S3 if requested
    s3_deleted = False
    if delete_from_s3 and export.s3_key:
        try:
            storage = get_storage_service()
            storage.delete_file(export.s3_key)
            s3_deleted = True
            logger.info(f"Deleted export from S3: {export.s3_key}")
        except Exception as e:
            logger.warning(f"Failed to delete from S3: {e}")
    
    # Delete record
    exports_repo.delete_export(db, uuid.UUID(export_id))
    
    return {
        "message": "Export deleted successfully",
        "export_id": export_id,
        "s3_deleted": s3_deleted
    }


@router.get("/generator/{generator_id}", response_model=ExportListResponse)
def list_exports_by_generator(
    generator_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> ExportListResponse:
    """List all exports for a specific generator."""
    validate_uuid(generator_id, "generator_id")
    
    exports = exports_repo.list_exports_by_generator(
        db=db,
        generator_id=uuid.UUID(generator_id),
        limit=limit
    )
    
    # Filter to only user's exports
    user_exports = [e for e in exports if e.created_by == current_user.id]
    
    return ExportListResponse(
        exports=[_export_to_response(e) for e in user_exports],
        total=len(user_exports)
    )


@router.get("/dataset/{dataset_id}", response_model=ExportListResponse)
def list_exports_by_dataset(
    dataset_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> ExportListResponse:
    """List all exports for a specific dataset."""
    validate_uuid(dataset_id, "dataset_id")
    
    exports = exports_repo.list_exports_by_dataset(
        db=db,
        dataset_id=uuid.UUID(dataset_id),
        limit=limit
    )
    
    # Filter to only user's exports
    user_exports = [e for e in exports if e.created_by == current_user.id]
    
    return ExportListResponse(
        exports=[_export_to_response(e) for e in user_exports],
        total=len(user_exports)
    )
