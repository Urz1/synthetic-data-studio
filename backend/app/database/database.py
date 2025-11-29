import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB

load_dotenv()

db_url = os.getenv("DATABASE_URL")

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