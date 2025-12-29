"""Fix column_count for all existing datasets.

This script recalculates column_count from schema_data for all datasets
where column_count is NULL or 0.

Run this script once to fix existing data:
    cd backend
    python -m scripts.fix_column_count
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text
import json


def fix_column_counts():
    """Update column_count for all datasets based on schema_data."""
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not set. Please check your .env file.")
        return
    
    print(f"Connecting to database...")
    engine = create_engine(database_url)
    
    with engine.connect() as connection:
        # Get all datasets
        result = connection.execute(text(
            "SELECT id, name, schema_data, column_count FROM datasets"
        ))
        
        datasets = result.fetchall()
        print(f"Found {len(datasets)} datasets to check")
        
        fixed_count = 0
        
        for row in datasets:
            dataset_id = row[0]
            name = row[1]
            schema_data = row[2]
            current_count = row[3]
            
            # Parse schema_data if it's a string
            if isinstance(schema_data, str):
                try:
                    schema_data = json.loads(schema_data)
                except:
                    schema_data = {}
            
            # Calculate correct column count from schema_data
            if schema_data:
                if isinstance(schema_data, dict):
                    # Schema data is flat: {"col1": "type1", "col2": "type2", ...}
                    correct_count = len(schema_data)
                else:
                    correct_count = 0
            else:
                correct_count = 0
            
            # Update if different from current or current is None/0
            if (current_count is None or current_count == 0) and correct_count > 0:
                connection.execute(
                    text("UPDATE datasets SET column_count = :count WHERE id = :id"),
                    {"count": correct_count, "id": dataset_id}
                )
                print(f"  Fixed '{name}': {current_count} -> {correct_count} columns")
                fixed_count += 1
            elif correct_count == 0:
                print(f"  WARNING: '{name}' has empty schema_data, cannot determine column count")
        
        connection.commit()
        print(f"\nFixed {fixed_count} datasets")
        print("Done! Refresh your datasets page to see the correct column counts.")


if __name__ == "__main__":
    fix_column_counts()
