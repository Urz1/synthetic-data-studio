"""Synthetic datasets package."""

from . import repositories, schemas, routes

__all__ = ["repositories", "schemas", "routes", "router"]

# Export router directly for convenience
from .routes import router

# Note: We use app.datasets.models.Dataset for the database model
# since synthetic datasets are stored in the same table as regular datasets
