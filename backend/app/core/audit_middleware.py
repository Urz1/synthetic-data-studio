"""
Audit logging middleware for automatic request/response logging.

Captures all API requests and responses for compliance and debugging.
"""

# Standard library
import datetime
import logging
import uuid
from typing import Callable

# Third-party
from fastapi import Request, Response
from sqlmodel import Session
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Internal
from app.audit.enums import AuditAction
from app.audit.models import AuditLog
from app.audit.repositories import create_audit_log
from app.database.database import SessionLocal

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware to automatically log all API requests and responses.
    
    Captures:
    - User information (if authenticated)
    - Request method and path
    - IP address and user agent
    - Response status code
    - Timestamp
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log audit entry."""
        
        # Skip health check and docs endpoints
        if request.url.path in ["/health", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)
        
        # Skip audit logs endpoint to prevent infinite loop
        if request.url.path.startswith("/audit-logs"):
            return await call_next(request)
        
        # Capture request start time
        start_time = datetime.datetime.utcnow()
        
        # Extract request info
        method = request.method
        path = str(request.url.path)
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        #Try to extract user from token (if authenticated)
        user_id = None
        user_email = None
        try:
            if hasattr(request.state, "user"):
                user_id = request.state.user.id
                user_email =request.state.user.email
        except:
            pass  # Not authenticated
        
        # Process request
        response = await call_next(request)
        
        # Log audit entry asynchronously (don't block response)
        try:
            # Determine action from method
            action_map = {
                "GET": AuditAction.READ.value,
                "POST": AuditAction.CREATE.value,
                "PUT": AuditAction.UPDATE.value,
                "PATCH": AuditAction.UPDATE.value,
                "DELETE": AuditAction.DELETE.value
            }
            action = action_map.get(method, "unknown")
            
            # Extract resource type from path (e.g., /datasets/{id} -> dataset)
            path_parts = path.strip("/").split("/")
            resource_type = path_parts[0] if path_parts else None
            
            # Create audit log entry
            audit_log = AuditLog(
                user_id=user_id,
                user_email=user_email,
                action=action,
                resource_type=resource_type,
                request_method=method,
                request_path=path,
                status_code=response.status_code,
                ip_address=ip_address,
                user_agent=user_agent,
                timestamp=start_time
            )
            
            # Save to database (in background to not block response)
            # Note: This is a simplified version. In production with Celery,
            # we'd send this to a task queue
            try:
                db = SessionLocal()
                try:
                    create_audit_log(db, audit_log)
                    db.commit()
                finally:
                    db.close()
            except Exception as db_error:
                # Log error but don't fail request
                logger.error(f"Failed to create audit log: {db_error}")
        
        except Exception as e:
            # Never fail request due to audit logging
            logger.error(f"Audit middleware error: {e}")
        
        return response


def create_manual_audit_log(
    db: Session,
    user_id: uuid.UUID,
    action: str,
    resource_type: str,
    resource_id: uuid.UUID = None,
    resource_name: str = None,
    metadata: dict = None
):
    """
    Manual audit log creation for business logic events.

    
    Use this for important business events that aren't captured by HTTP:
    - Data generation completed
    - Model training finished
    - Evaluation run completed
    - Compliance report generated
    
    Args:
        db: Database session
        user_id: User who performed action
        action: Action type (from AuditAction enum)
        resource_type: Resource type (from ResourceType enum)
        resource_id: ID of affected resource
        resource_name: Human-readable resource name
        metadata: Additional context
    """
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        resource_name=resource_name,
        metadata=metadata
    )
    
    create_audit_log(db, audit_log)
    logger.info(f"Audit log created: {user_id} {action} {resource_type} {resource_id}")
