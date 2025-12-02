"""Helper: create DB tables from SQLModel models (development only).

Usage (cmd.exe):
    python -m app.database.create_tables

This imports the model modules so SQLModel can register them, then
runs SQLModel.metadata.create_all(engine).
"""

from sqlmodel import SQLModel

# ensure engine is configured
from app.database.database import engine

# import all model modules so classes are registered with SQLModel metadata
# Import directly from .models submodules to avoid circular imports
from app.auth.models import User, APIKey  # noqa: F401
from app.projects.models import Project  # noqa: F401
from app.datasets.models import Dataset, DatasetFile  # noqa: F401
from app.generators.models import Generator  # noqa: F401
from app.jobs.models import Job  # noqa: F401
# Note: synthetic_datasets reuses the datasets table, so we don't import it here
from app.artifacts.models import Artifact  # noqa: F401
from app.evaluations.models import Evaluation  # noqa: F401
from app.compliance.models import ComplianceReport  # noqa: F401
from app.billing.models import UsageRecord, Quota  # noqa: F401
from app.audit.models import AuditLog  # noqa: F401


def create_all():
    SQLModel.metadata.create_all(engine)


if __name__ == "__main__":
    create_all()
    print("SQLModel metadata.create_all() completed")
