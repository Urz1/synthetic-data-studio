"""Repositories for synthetic datasets module (data access layer)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import List
import uuid
import datetime

# Local - Module
from .models import SyntheticDataset

# ============================================================================
# MOCK STORAGE
# ============================================================================

_SYN = []

# ============================================================================
# REPOSITORIES
# ============================================================================

def list_synthetic() -> List[SyntheticDataset]:
    """List all synthetic datasets."""
    return _SYN


def create_synthetic(s: SyntheticDataset) -> SyntheticDataset:
    """Create a new synthetic dataset."""
    # Mock ID generation
    s.id = uuid.uuid4()
    if not s.uploaded_at:
        s.uploaded_at = datetime.datetime.utcnow()
    _SYN.append(s)
    return s
