"""
Security utilities and authorization helpers.

Provides reusable security functions for resource ownership verification,
access control, and security middleware.
"""

# Standard library
import uuid
from typing import Any, Callable, Optional

# Third-party
from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


# ============================================================================
# SECURITY HEADERS MIDDLEWARE
# ============================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all responses.
    
    Headers added:
    - X-Content-Type-Options: Prevents MIME type sniffing
    - X-Frame-Options: Prevents clickjacking
    - X-XSS-Protection: Enables XSS filter in older browsers
    - Strict-Transport-Security: Enforces HTTPS
    - Referrer-Policy: Controls referrer information
    - Permissions-Policy: Controls browser features
    - Content-Security-Policy: Prevents XSS and injection attacks
    """
    
    def __init__(self, app, enable_hsts: bool = True, enable_csp: bool = True):
        """
        Initialize security headers middleware.
        
        Args:
            app: FastAPI application
            enable_hsts: Enable HSTS header (disable for local development)
            enable_csp: Enable CSP header (can be relaxed for development)
        """
        super().__init__(app)
        self.enable_hsts = enable_hsts
        self.enable_csp = enable_csp
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # XSS protection for older browsers
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Disable browser features we don't use
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )
        
        # HSTS - Enforce HTTPS (only in production)
        if self.enable_hsts:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        
        # Content-Security-Policy - XSS protection
        # Note: 'unsafe-inline' and 'unsafe-eval' required for Next.js
        if self.enable_csp:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https: blob:; "
                "connect-src 'self' https://*.upstash.io wss://*.upstash.io; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )
        
        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds a unique request ID to each request.
    
    Useful for:
    - Distributed tracing
    - Log correlation
    - Debugging
    """
    
    HEADER_NAME = "X-Request-ID"
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get existing request ID or generate new one
        request_id = request.headers.get(self.HEADER_NAME) or str(uuid.uuid4())
        
        # Store in request state for access in route handlers
        request.state.request_id = request_id
        
        # Process request
        response = await call_next(request)
        
        # Add request ID to response headers
        response.headers[self.HEADER_NAME] = request_id
        
        return response


def get_request_id(request: Request) -> str:
    """
    Get the request ID from the current request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Request ID string
    """
    return getattr(request.state, "request_id", "unknown")


# ============================================================================
# OWNERSHIP & AUTHORIZATION CHECKS
# ============================================================================


def check_resource_ownership(
    resource: Any,
    user_id: uuid.UUID,
    owner_field: str = "uploader_id"
) -> None:
    """
    Verify that a user owns a resource.
    
    Args:
        resource: The resource object to check
        user_id: The current user's ID
        owner_field: Name of the field containing owner ID (default: "uploader_id")
        
    Raises:
        HTTPException: 403 if user doesn't own the resource
        
    Example:
        >>> check_resource_ownership(dataset, current_user.id)
        # Raises 403 if dataset.uploader_id != current_user.id
    """
    resource_owner = getattr(resource, owner_field, None)
    
    if resource_owner is None:
        raise ValueError(
            f"Resource does not have '{owner_field}' field. "
            f"Cannot verify ownership."
        )
    
    if resource_owner != user_id:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: You don't own this resource"
        )


def require_owner(user_id: uuid.UUID, resource_owner_id: uuid.UUID) -> None:
    """
    Simple ownership check that raises 403 if IDs don't match.
    
    Args:
        user_id: Current user's ID
        resource_owner_id: Resource owner's ID
        
    Raises:
        HTTPException: 403 if IDs don't match
    """
    if user_id != resource_owner_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied: You don't own this resource"
        )


def check_admin_role(user: Any) -> None:
    """
    Verify user has admin privileges.
    
    Args:
        user: User object with role/permissions
        
    Raises:
        HTTPException: 403 if user is not admin
        
    Note:
        Currently not implemented - placeholder for future RBAC
    """
    # TODO: Implement when role-based auth is added
    has_admin = getattr(user, 'is_admin', False) or getattr(user, 'is_superuser', False)
    
    if not has_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )
