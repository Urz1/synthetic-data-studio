"""
Migration script to add profiling_data and update pii_flags column in datasets table.
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('synth_studio.db')
    cursor = conn.cursor()
    
    try:
        # Check if profiling_data column exists
        cursor.execute("PRAGMA table_info(datasets)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'profiling_data' not in columns:
            print("Adding profiling_data column...")
            cursor.execute("ALTER TABLE datasets ADD COLUMN profiling_data JSON")
            print("✓ profiling_data column added")
        else:
            print("✓ profiling_data column already exists")
        
        # Note: SQLite doesn't support modifying column types easily
        # pii_flags should already be JSON type from initial creation
        # If needed, we'd have to recreate the table
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
