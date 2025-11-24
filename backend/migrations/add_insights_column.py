"""Add insights column to evaluations table

Run this to add the insights column for LLM-generated insights.
"""

import sqlite3
import os
from pathlib import Path

def run_migration():
    """Add insights column to evaluations table"""
    
    # Find the database file
    db_path = Path("synth_studio.db")
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        print("Please run this script from the backend directory")
        return
    
    print(f"Found database: {db_path}")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(evaluations)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'insights' in columns:
            print("✓ insights column already exists")
            return
        
        # Add the column
        print("Adding insights column...")
        cursor.execute("""
            ALTER TABLE evaluations 
            ADD COLUMN insights TEXT
        """)
        
        conn.commit()
        print("✓ Successfully added insights column to evaluations table")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == "__main__":
    print("="*60)
    print("Database Migration: Add insights column")
    print("="*60)
    run_migration()
    print("="*60)
