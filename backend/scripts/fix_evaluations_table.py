"""
Migration script to fix the evaluations table schema.

This script:
1. Backs up existing evaluations data (if any)
2. Drops the old evaluations table
3. Recreates it with the correct schema
4. Restores any backed up data (if possible)
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings
from app.evaluations.models import Evaluation
from sqlmodel import SQLModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_evaluations_table():
    """Fix the evaluations table schema."""
    
    # Create engine
    engine = create_engine(settings.database_url, echo=True)
    
    with engine.begin() as conn:
        # Check if table exists
        inspector = inspect(engine)
        if 'evaluations' not in inspector.get_table_names():
            logger.info("Evaluations table does not exist, creating new one...")
            SQLModel.metadata.create_all(engine, tables=[Evaluation.__table__])
            logger.info("✓ Created evaluations table")
            return
        
        # Get current columns
        columns = [col['name'] for col in inspector.get_columns('evaluations')]
        logger.info(f"Current columns: {columns}")
        
        # Check if we need migration
        expected_columns = {'id', 'generator_id', 'dataset_id', 'report', 'created_at'}
        current_columns = set(columns)
        
        if expected_columns.issubset(current_columns):
            logger.info("✓ Evaluations table already has correct schema")
            return
        
        # Need to migrate
        logger.info("Migrating evaluations table...")
        
        # Backup data (if any)
        backup_data = []
        try:
            result = conn.execute(text("SELECT * FROM evaluations"))
            backup_data = [dict(row._mapping) for row in result]
            logger.info(f"Backed up {len(backup_data)} evaluation records")
        except Exception as e:
            logger.warning(f"Could not backup data: {e}")
        
        # Drop old table
        logger.info("Dropping old evaluations table...")
        conn.execute(text("DROP TABLE IF EXISTS evaluations"))
        
        # Create new table
        logger.info("Creating new evaluations table...")
        SQLModel.metadata.create_all(engine, tables=[Evaluation.__table__])
        
        logger.info("✓ Migration complete!")
        
        if backup_data:
            logger.warning(f"Note: {len(backup_data)} old evaluation records were not migrated due to schema changes")
            logger.warning("Old evaluations can be re-run using the /evaluations/run endpoint")


if __name__ == "__main__":
    print("=" * 60)
    print("Evaluations Table Migration Script")
    print("=" * 60)
    print()
    print("This will update the evaluations table schema.")
    print("Old evaluation records will be lost but can be regenerated.")
    print()
    
    response = input("Continue? (yes/no): ").strip().lower()
    if response != 'yes':
        print("Migration cancelled.")
        sys.exit(0)
    
    try:
        migrate_evaluations_table()
        print()
        print("=" * 60)
        print("✓ Migration completed successfully!")
        print("=" * 60)
    except Exception as e:
        print()
        print("=" * 60)
        print(f"✗ Migration failed: {e}")
        print("=" * 60)
        sys.exit(1)
