"""Alembic migration environment configuration.

Keep this file safe to import in CI/local environments:
- Do not import application runtime settings that may call sys.exit.
- Prefer DATABASE_URL when present; otherwise fall back to alembic.ini.
"""

from logging.config import fileConfig
import os
import sys
from pathlib import Path

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Signal to app modules (config/database) that we're running migrations.
os.environ.setdefault("ALEMBIC_RUNNING", "1")

# Add backend/ to sys.path so we can import `app.*`
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlmodel import SQLModel

# Import model modules so SQLModel.metadata is populated.
# (We intentionally import the modules, not symbols, to avoid unused imports.)
# Wrap in try-except to handle cases where linter runs without ALEMBIC_RUNNING set.
try:
    import app.auth.models  # noqa: F401
    import app.projects.models  # noqa: F401
    import app.datasets.models  # noqa: F401
    import app.generators.models  # noqa: F401
    import app.evaluations.models  # noqa: F401
    import app.compliance.models  # noqa: F401
    import app.jobs.models  # noqa: F401
    import app.audit.models  # noqa: F401
    import app.exports.models  # noqa: F401
except ImportError:
    # If imports fail (e.g., during linting), skip them.
    # SQLModel.metadata will be empty, but that's ok for some operations.
    pass

# this is the Alembic Config object
config = context.config

# Prefer DATABASE_URL (set by deploy/CI). Fall back to alembic.ini placeholder.
db_url = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")

# If alembic.ini still has the template placeholder, use a safe local default
# so `alembic revision --autogenerate` works out of the box.
if not db_url or db_url.startswith("driver://"):
    db_url = "sqlite:///./test.db"

config.set_main_option("sqlalchemy.url", db_url)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata from SQLModel (which includes all SQLModel tables)
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  # Detect column type changes
        compare_server_default=True,  # Detect default value changes
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # Detect column type changes
            compare_server_default=True,  # Detect default value changes
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
