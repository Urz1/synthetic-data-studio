"""
Security utilities and authorization helpers.

Provides reusable security functions for resource ownership verification
and access control across all modules.
"""

import uuid
from typing import Any, Optional
from fastapi import HTTPException


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
