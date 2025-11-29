"""Quick script to reset the database schema."""

import os
from pathlib import Path
from app.database.database import engine
from sqlmodel import SQLModel

# Import all models to ensure tables are created
from app.auth.models import User
from app.datasets.models import Dataset, DatasetFile
from app.projects.models import Project
from app.generators.models import Generator
from app.synthetic_datasets.models import SyntheticDataset
from app.evaluations.models import Evaluation
from app.compliance.models import ComplianceReport
from app.jobs.models import Job

def reset_database():
    """Drop all tables and recreate them."""
    db_path = Path("synth_studio.db")  # Match DATABASE_URL from config.py
    
    # Delete existing database file
    if db_path.exists():
        print(f"Deleting existing database: {db_path}")
        db_path.unlink()
        print("✓ Database deleted")
    
    # Create all tables
    print("Creating fresh database with all tables...")
    SQLModel.metadata.create_all(engine)
    print("✓ Database created successfully!")
    print("\nAll tables created with latest schema.")
    print("You can now start the server and test uploads.")

if __name__ == "__main__":
    reset_database()
