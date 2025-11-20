"""
Quick fix script to update existing dataset file paths.

Run this once to fix any datasets uploaded before the file path fix.
"""

import sqlite3
from pathlib import Path

# Database path
DB_PATH = "synth_studio.db"
UPLOADS_DIR = Path("uploads")

# Connect to database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get all datasets
cursor.execute("SELECT id, original_filename, file_path FROM datasets")
datasets = cursor.fetchall()

print(f"Found {len(datasets)} datasets")
print()

fixed_count = 0
for dataset_id, original_filename, file_path in datasets:
    if not original_filename:
        continue
    
    # Check if original_filename has UUID prefix
    if original_filename and len(original_filename.split('_')[0]) == 36:
        # Already has UUID prefix - this is good!
        expected_path = UPLOADS_DIR / original_filename
        if expected_path.exists():
            # Update file_path if null
            if not file_path:
                cursor.execute(
                    "UPDATE datasets SET file_path = ? WHERE id = ?",
                    (str(expected_path), dataset_id)
                )
                print(f"✓ Updated file_path for dataset {dataset_id}")
                fixed_count += 1
            else:
                print(f"✓ Dataset {dataset_id} already correct")
        else:
            print(f"⚠ Dataset {dataset_id}: File not found at {expected_path}")
    else:
        # No UUID prefix - need to find the actual file
        # List all files in uploads that end with this filename
        matching_files = list(UPLOADS_DIR.glob(f"*_{original_filename}"))
        
        if len(matching_files) == 1:
            actual_file = matching_files[0]
            cursor.execute(
                "UPDATE datasets SET original_filename = ?, file_path = ? WHERE id = ?",
                (actual_file.name, str(actual_file), dataset_id)
            )
            print(f"✓ Fixed dataset {dataset_id}")
            print(f"  Old: {original_filename}")
            print(f"  New: {actual_file.name}")
            fixed_count += 1
        elif len(matching_files) > 1:
            print(f"⚠ Dataset {dataset_id}: Multiple files match {original_filename}")
            for f in matching_files:
                print(f"  - {f.name}")
        else:
            print(f"✗ Dataset {dataset_id}: No file found matching *_{original_filename}")

# Commit changes
conn.commit()
conn.close()

print()
print(f"Fixed {fixed_count} dataset(s)")
print("Done!")
