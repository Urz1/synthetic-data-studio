"""
General utility functions used across the application.

Provides common helpers for file operations, formatting, and other
cross-cutting concerns.
"""

import hashlib
from datetime import datetime
from pathlib import Path
from typing import Union


def now_iso() -> str:
    """
    Get current UTC time in ISO 8601 format.
    
    Returns:
        ISO formatted timestamp string with 'Z' suffix
    """
    return datetime.utcnow().isoformat() + "Z"


def calculate_checksum(file_path: Union[str, Path]) -> str:
    """
    Calculate SHA-256 checksum of a file.
    
    Args:
        file_path: Path to file
        
    Returns:
        Hex digest of SHA-256 hash
    """
    file_path = Path(file_path)
    return hashlib.sha256(file_path.read_bytes()).hexdigest()


def format_bytes(size_bytes: int) -> str:
    """
    Convert bytes to human-readable format.
    
    Args:
        size_bytes: Size in bytes
        
    Returns:
        Human-readable string (e.g., "1.5 MB")
        
    Example:
        >>> format_bytes(1536)
        '1.5 KB'
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} PB"
