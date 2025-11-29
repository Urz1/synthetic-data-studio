"""Database diagnostic script.

This will check:
1. What DATABASE_URL is being used
2. If connection works
3. What tables exist
4. What schema they're in
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.config import settings
from sqlalchemy import create_engine, text, inspect

def diagnose_database():
    """Check database state."""
    print("=" * 60)
    print("DATABASE DIAGNOSTIC")
    print("=" * 60)
    
    # 1. Show DATABASE_URL
    db_url = settings.database_url
    # Hide password for security
    if '@' in db_url:
        parts = db_url.split('@')
        user_part = parts[0].split('://')[-1].split(':')[0]
        safe_url = f"{db_url.split('://')[0]}://{user_part}:***@{parts[1]}"
    else:
        safe_url = db_url
    
    print(f"\n1. DATABASE_URL from config:")
    print(f"   {safe_url}")
    
    # 2. Test connection
    print(f"\n2. Testing connection...")
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("   ✅ Connection successful!")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return 1
    
    # 3. List all tables
    print(f"\n3. Tables in database:")
    try:
        inspector = inspect(engine)
        
        # Get all schemas
        schemas = inspector.get_schema_names()
        print(f"   Schemas: {schemas}")
        
        # Check each schema
        all_tables = []
        for schema in schemas:
            tables = inspector.get_table_names(schema=schema)
            if tables:
                print(f"\n   Schema '{schema}':")
                for table in tables:
                    print(f"      - {table}")
                    all_tables.append(f"{schema}.{table}")
        
        if not all_tables:
            print("   ⚠️  NO TABLES FOUND!")
            print("\n   This means the tables were never created.")
            print("   Let's create them now...")
            return 2
        
        # 4. Check for required tables
        print(f"\n4. Checking for required tables:")
        required_tables = ['users', 'projects', 'datasets', 'generators', 
                          'evaluations', 'compliance_packs', 'jobs', 'audit_logs']
        
        missing = []
        for table in required_tables:
            # Check in any schema
            found = any(table in t for t in all_tables)
            if found:
                print(f"   ✅ {table}")
            else:
                print(f"   ❌ {table} - MISSING")
                missing.append(table)
        
        if missing:
            print(f"\n   ⚠️  Missing {len(missing)} tables!")
            return 2
        else:
            print(f"\n   ✅ All tables exist!")
            return 0
            
    except Exception as e:
        print(f"   ❌ Error inspecting database: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    result = diagnose_database()
    
    if result == 2:
        print("\n" + "=" * 60)
        print("SOLUTION: Run the table creation script:")
        print("=" * 60)
        print("python force_create_tables.py")
        print()
    elif result == 0:
        print("\n" + "=" * 60)
        print("✅ DATABASE IS HEALTHY!")
        print("=" * 60)
        print("If you're still getting errors, try:")
        print("1. Restart your FastAPI server")
        print("2. Clear any connection pools")
        print()
