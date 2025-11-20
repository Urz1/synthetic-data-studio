"""
Migration: Add file_path column to datasets table

This adds the file_path column to store the full path to dataset files.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path("synth_studio.db")

def migrate():
    """Add file_path column to datasets table."""
    
    if not DB_PATH.exists():
        print(f"Error: Database not found at {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("PRAGMA table_info(datasets)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'file_path' in columns:
        print("✓ Column 'file_path' already exists")
    else:
        print("Adding 'file_path' column to datasets table...")
        cursor.execute("ALTER TABLE datasets ADD COLUMN file_path TEXT")
        conn.commit()
        print("✓ Column added successfully")
    
    # Update existing records
    print("\nUpdating existing datasets...")
    cursor.execute("SELECT id, original_filename FROM datasets WHERE file_path IS NULL")
    datasets = cursor.fetchall()
    
    updated = 0
    for dataset_id, original_filename in datasets:
        if original_filename:
            file_path = f"uploads/{original_filename}"
            cursor.execute(
                "UPDATE datasets SET file_path = ? WHERE id = ?",
                (file_path, dataset_id)
            )
            updated += 1
    
    conn.commit()
    print(f"✓ Updated {updated} dataset(s)")
    
    conn.close()
    print("\nMigration complete!")

if __name__ == "__main__":
    migrate()
