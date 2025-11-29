"""Force create all tables in the database.

This script bypasses Alembic and uses SQLModel to create tables directly.
Use this when Alembic shows migration applied but tables don't exist.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlmodel import SQLModel
from app.database.database import engine

# Import ALL models so they're registered with SQLModel
from app.auth.models import User
from app.projects.models import Project
from app.datasets.models import Dataset
from app.generators.models import Generator
from app.evaluations.models import Evaluation
from app.compliance.models import ComplianceReport
from app.jobs.models import Job
from app.audit.models import AuditLog

def create_all_tables():
    """Create all database tables."""
    print("🔧 Creating all database tables...")
    print(f"📍 Database: {engine.url}")
    
    try:
        # This will create ALL tables that are defined in SQLModel
        SQLModel.metadata.create_all(engine)
        print("\n✅ SUCCESS! All tables created:")
        print("   - users")
        print("   - projects")
        print("   - datasets")
        print("   - generators")
        print("   - evaluations")
        print("   - compliance_packs")
        print("   - jobs")
        print("   - audit_logs")
        print("\n🎉 Database is ready!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\nTroubleshooting:")
        print("1. Check your DATABASE_URL in .env")
        print("2. Verify the database is accessible")
        print("3. Check database permissions")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(create_all_tables())
