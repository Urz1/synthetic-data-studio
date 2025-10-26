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
import app.auth.models  # noqa: F401
import app.projects.models  # noqa: F401
import app.datasets.models  # noqa: F401
import app.generators.models  # noqa: F401
import app.jobs.models  # noqa: F401
import app.synthetic_datasets.models  # noqa: F401
import app.models.models  # noqa: F401
import app.artifacts.models  # noqa: F401
import app.evaluations.models  # noqa: F401
import app.compliance.models  # noqa: F401
import app.billing.models  # noqa: F401
import app.audit.models  # noqa: F401


def create_all():
    SQLModel.metadata.create_all(engine)


if __name__ == "__main__":
    create_all()
    print("SQLModel metadata.create_all() completed")
