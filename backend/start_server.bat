@echo off
echo Starting Synthetic Data Studio Backend...
echo.
echo Make sure you have:
echo 1. Created a .env file with DATABASE_URL
echo 2. Run: python -m app.database.create_tables
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
