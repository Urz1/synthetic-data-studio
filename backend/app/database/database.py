import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB

load_dotenv()

db_url = os.getenv("DATABASE_URL")
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Session = SessionLocal
Base = declarative_base()

# Use JSON for SQLite, JSONB for PostgreSQL
JSONType = JSON if db_url.startswith("sqlite") else JSONB