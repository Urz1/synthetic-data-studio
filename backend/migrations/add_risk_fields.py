"""
Database migration script to add risk assessment fields to evaluations table.

Run this script to add risk_score, risk_level, and risk_details columns.
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    """Add risk assessment columns to evaluations table."""
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        try:
            # Add risk_score column (FLOAT)
            conn.execute(text("""
                ALTER TABLE evaluations 
                ADD COLUMN IF NOT EXISTS risk_score FLOAT
            """))
            print("✓ Added risk_score column")
            
            # Add risk_level column (VARCHAR)
            conn.execute(text("""
                ALTER TABLE evaluations 
                ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20)
            """))
            print("✓ Added risk_level column")
            
            # Add risk_details column (JSONB for PostgreSQL, JSON for others)
            try:
                # Try JSONB first (PostgreSQL)
                conn.execute(text("""
                    ALTER TABLE evaluations 
                    ADD COLUMN IF NOT EXISTS risk_details JSONB
                """))
                print("✓ Added risk_details column (JSONB)")
            except Exception:
                # Fallback to JSON (SQLite/other databases)
                conn.execute(text("""
                    ALTER TABLE evaluations 
                    ADD COLUMN IF NOT EXISTS risk_details JSON
                """))
                print("✓ Added risk_details column (JSON)")
            
            conn.commit()
            print("\n✅ Migration completed successfully!")
            print("Risk assessment fields added to evaluations table")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("=" * 60)
    print("Adding Risk Assessment Fields to Evaluations Table")
    print("=" * 60)
    migrate()
