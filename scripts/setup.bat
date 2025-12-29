@echo off
REM Synth Studio - Windows Development Setup
REM Usage: scripts\setup.bat

echo ================================================
echo   Synth Studio - Development Environment Setup
echo ================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [X] Python 3.9+ is required
    exit /b 1
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo [OK] Python: %%i
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js 18+ is required
    exit /b 1
) else (
    for /f %%i in ('node --version') do echo [OK] Node.js: %%i
)

REM Check pnpm
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [!] pnpm not found, installing...
    npm install -g pnpm
)

echo.
echo Setting up Backend...
echo --------------------

cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt -q

REM Copy env file if not exists
if not exist ".env" (
    echo Creating .env from example...
    copy .env.example .env
    echo [!] Please edit backend\.env with your settings
)

echo [OK] Backend setup complete

cd ..

echo.
echo Setting up Frontend...
echo ---------------------

cd frontend

REM Install dependencies
echo Installing Node.js dependencies...
pnpm install --silent

REM Copy env file if not exists
if not exist ".env.local" (
    echo Creating .env.local from example...
    copy .env.local.example .env.local
    echo [!] Please edit frontend\.env.local with your settings
)

echo [OK] Frontend setup complete

cd ..

echo.
echo ================================================
echo   Setup Complete!
echo ================================================
echo.
echo Next steps:
echo   1. Edit backend\.env with your database credentials
echo   2. Edit frontend\.env.local with your API URL
echo   3. Run: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload
echo   4. Run: cd frontend ^&^& pnpm dev
echo.
echo Access:
echo   - Frontend: http://localhost:3000
echo   - Backend API: http://localhost:8000
echo   - API Docs: http://localhost:8000/docs
echo.
