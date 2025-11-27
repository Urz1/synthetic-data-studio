"""
Core validation utilities used across all modules.

Centralizes common validation logic to ensure consistency and DRY principles.
"""

import re
import uuid
from pathlib import Path
from typing import Optional
from fastapi import HTTPException


def validate_uuid(uuid_str: str, param_name: str = "id") -> uuid.UUID:
    """
    Validate and convert string to UUID.
    
    Args:
        uuid_str: String representation of UUID
        param_name: Name of the parameter (for error messages)
        
    Returns:
        Validated UUID object
        
    Raises:
        HTTPException: 422 if UUID format is invalid
    """
    try:
        return uuid.UUID(uuid_str)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(
            status_code=422,
            detail=f"Invalid UUID format for {param_name}"
        )


def validate_filename(filename: str, max_length: int = 200) -> str:
    """
    Sanitize filename for safe filesystem use.
    
    Removes path separators, invalid characters, and truncates to safe length.
    Safe for both Windows and Unix filesystems.
    
    Args:
        filename: Original filename
        max_length: Maximum allowed length (default 200 to allow UUID prefix)
        
    Returns:
        Sanitized filename
        
    Example:
        >>> validate_filename("test<script>.csv")
        'test_script_.csv'
    """
    if not filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty")
    
    # Remove path separators and null bytes
    filename = Path(filename).name
    
    # Replace invalid characters (Windows: <>:"/\|?* plus control chars)
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', filename)
    
    # Truncate to safe length, preserving extension
    if len(filename) > max_length:
        name, ext = Path(filename).stem, Path(filename).suffix
        filename = name[:max_length - len(ext)] + ext
    
    return filename


def validate_pagination(
    skip: int = 0,
    limit: int = 100,
    max_limit: int = 1000
) -> tuple[int, int]:
    """
    Validate pagination parameters.
    
    Args:
        skip: Number of records to skip
        limit: Number of records to return
        max_limit: Maximum allowed limit
        
    Returns:
        Validated (skip, limit) tuple
        
    Raises:
        HTTPException: 422 if parameters are invalid
    """
    if skip < 0:
        raise HTTPException(
            status_code=422,
            detail="Skip must be non-negative"
        )
    
    if limit < 1:
        raise HTTPException(
            status_code=422,
            detail="Limit must be at least 1"
        )
    
    if limit > max_limit:
        raise HTTPException(
            status_code=422,
            detail=f"Limit cannot exceed {max_limit}"
        )
    
    return skip, limit


def validate_file_extension(
    filename: str,
    allowed_extensions: set[str]
) -> str:
    """
    Validate file has an allowed extension.
    
    Args:
        filename: Filename to check
        allowed_extensions: Set of allowed extensions (e.g., {".csv", ".json"})
        
    Returns:
        Validated filename
        
    Raises:
        HTTPException: 400 if extension not allowed
    """
    ext = Path(filename).suffix.lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
        )
    
    return filename
