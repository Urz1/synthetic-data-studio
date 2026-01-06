"""Database configuration and connection setup."""

# Standard library
import os
import sys
from pathlib import Path

# Third-party
from dotenv import load_dotenv
from sqlalchemy import JSON, create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker

# Ensure we load the backend-local .env regardless of CWD.
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(dotenv_path=_BACKEND_ROOT / ".env")

db_url = os.getenv("DATABASE_URL")

allow_unsafe = os.getenv("TESTING") == "1" or os.getenv("ALEMBIC_RUNNING") == "1"

# Validate DATABASE_URL is set
if not db_url:
    if allow_unsafe:
        # Keep imports working for migrations/tests.
        db_url = "sqlite:///./test.db"
    else:
        print("\n" + "=" * 60)
        print("❌ CRITICAL ERROR: DATABASE_URL not set")
        print("=" * 60)
        print("Please set DATABASE_URL in your .env file.")
        print("Examples:")
        print("  SQLite: DATABASE_URL=sqlite:///./synth_studio.db")
        print("  PostgreSQL: DATABASE_URL=postgresql://user:pass@localhost:5432/dbname")
        print("=" * 60 + "\n")
        sys.exit(1)

# Production-ready connection pooling settings
if "postgresql" in db_url:
    # PostgreSQL with connection pooling and keepalive
    connect_args = {
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_size=10,  # Number of connections to maintain
        max_overflow=20,  # Additional connections when pool is full
        pool_timeout=30,  # Seconds to wait for connection
        pool_recycle=3600,  # Recycle connections after 1 hour (prevents SSL timeouts)
        pool_pre_ping=True,  # Test connection before using (auto-reconnect if dead)
    )
else:
    # SQLite
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Session = SessionLocal
Base = declarative_base()

# Use JSON for SQLite, JSONB for PostgreSQL
JSONType = JSON if db_url.startswith("sqlite") else JSONB