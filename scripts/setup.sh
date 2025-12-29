#!/bin/bash
# Synth Studio - One-liner Development Setup
# Usage: ./scripts/setup.sh

set -e

echo "================================================"
echo "  Synth Studio - Development Environment Setup  "
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

# Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Python: $PYTHON_VERSION"
else
    echo -e "${RED}✗${NC} Python 3.9+ is required"
    exit 1
fi

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js 18+ is required"
    exit 1
fi

# pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}✓${NC} pnpm: $PNPM_VERSION"
else
    echo -e "${YELLOW}!${NC} pnpm not found, installing..."
    npm install -g pnpm
fi

echo ""
echo "Setting up Backend..."
echo "--------------------"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet

# Copy env file if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env from example..."
    cp .env.example .env
    echo -e "${YELLOW}!${NC} Please edit backend/.env with your settings"
fi

echo -e "${GREEN}✓${NC} Backend setup complete"

cd ..

echo ""
echo "Setting up Frontend..."
echo "---------------------"

cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
pnpm install --silent

# Copy env file if not exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local from example..."
    cp .env.local.example .env.local
    echo -e "${YELLOW}!${NC} Please edit frontend/.env.local with your settings"
fi

echo -e "${GREEN}✓${NC} Frontend setup complete"

cd ..

echo ""
echo "================================================"
echo -e "${GREEN}  Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env with your database credentials"
echo "  2. Edit frontend/.env.local with your API URL"
echo "  3. Run: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  4. Run: cd frontend && pnpm dev"
echo ""
echo "Access:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo ""
