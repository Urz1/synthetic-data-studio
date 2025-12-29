---
id: developer-guide-development-setup
title: "Development Setup"
sidebar_label: "Development Setup"
sidebar_position: 3
slug: /developer-guide/development-setup
tags: [developer, setup]
---

# Development Setup

This guide covers setting up a local development environment for Synthetic Data Studio, including prerequisites, installation, and development workflows.

## Prerequisites

### Required Software

#### Python Environment

- **Python 3.9+**: Download from [python.org](https://python.org)
- **pip**: Python package installer (included with Python)
- **venv**: Virtual environment module (included with Python)

#### Version Control

- **Git**: Download from [git-scm.com](https://git-scm.com)

#### Database (Choose One)

- **SQLite**: Included with Python (recommended for development)
- **PostgreSQL**: Download from [postgresql.org](https://postgresql.org)
- **MySQL/MariaDB**: Download from [mariadb.org](https://mariadb.org)

#### Optional Tools

- **Docker**: For containerized development
- **Redis**: For background job queuing
- **VS Code**: Recommended IDE with Python extensions

### System Requirements

#### Minimum

- **RAM**: 4GB
- **Disk Space**: 2GB free
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

#### Recommended

- **RAM**: 8GB+
- **Disk Space**: 5GB free
- **GPU**: NVIDIA GPU with CUDA support (optional, for ML acceleration)

## Quick Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/Urz1/synthetic-data-studio.git
cd synthetic-data-studio/backend

# Verify Python version
python --version  # Should be 3.9 or higher
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/macOS
python -m venv .venv
source .venv/bin/activate

# Verify activation
which python  # Should point to .venv/bin/python
```

### 3. Install Dependencies

```bash
# Install core dependencies
pip install -r requirements.txt

# Install development dependencies (optional)
pip install -r requirements-dev.txt

# Verify installation
python -c "import fastapi, uvicorn, sqlmodel; print(' Dependencies installed')"
```

### 4. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file (see Configuration section below)
# For quick start, you can use the defaults
```

### 5. Initialize Database

```bash
# Create database tables
python -m app.database.create_tables

# Verify database setup
python -c "from app.database.database import engine; print(' Database ready')"
```

### 6. Start Development Server

```bash
# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Verify server is running
curl http://localhost:8000/health
# Should return: {"status": "healthy", "service": "synthetic-data-studio-backend"}
```

### 7. Access API Documentation

Open your browser to: http://localhost:8000/docs

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# ===========================================
# SYNTHETIC DATA STUDIO DEVELOPMENT CONFIG
# ===========================================

# Database Configuration
DATABASE_URL=sqlite:///./dev.db

# Security Settings
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Server Settings
HOST=0.0.0.0
PORT=8000
DEBUG=true
RELOAD=true

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100MB

# Development Features
ENABLE_SWAGGER=true
ENABLE_REDOC=true
LOG_LEVEL=DEBUG

# Optional: External Services (for advanced development)
# REDIS_URL=redis://localhost:6379/0
# USE_GEMINI=true
# GEMINI_API_KEY=your-key-here
```

### Database Options

#### SQLite (Simplest)

```env
DATABASE_URL=sqlite:///./dev.db
```

- No additional setup required
- File-based database
- Perfect for development
- ? Not suitable for production

#### PostgreSQL (Production-like)

```env
DATABASE_URL=postgresql://username:password@localhost:5432/synth_dev
```

Setup:

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql

# Create database
createdb synth_dev

# Create user (optional)
createuser synth_user
psql -c "ALTER USER synth_user PASSWORD 'your-password';"
```

#### MySQL/MariaDB

```env
DATABASE_URL=mysql://username:password@localhost:3306/synth_dev
```

### AI/LLM Setup (Optional)

For AI features development:

```env
# Google Gemini (Free tier available)
USE_GEMINI=true
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Groq (Fast, free tier)
USE_GROQ=true
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-70b-versatile

# OpenAI (Paid)
USE_OPENAI=true
OPENAI_API_KEY=your-openai-api-key
```

## Testing Setup

### Install Test Dependencies

```bash
pip install -r requirements-dev.txt
```

### Run Tests

```bash
# Run all tests
pytest

# Run specific test categories
pytest tests/unit/
pytest tests/integration/
pytest tests/e2e/

# Run with coverage
pytest --cov=app --cov-report=html

# Run tests in watch mode (requires pytest-watch)
pytest-watch -- -v
```

### Test Configuration

Create `tests/.env.test` for test-specific settings:

```env
DATABASE_URL=sqlite:///./test.db
TESTING=true
SECRET_KEY=test-secret-key
```

## Docker Development (Alternative)

### Using Docker Compose

```yaml
# docker-compose.dev.yml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app
      - ./uploads:/app/uploads
    environment:
      - DATABASE_URL=sqlite:///./dev.db
      - DEBUG=true
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: synth_dev
      POSTGRES_USER: synth_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

### Running with Docker

```bash
# Start development stack
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Run tests in container
docker-compose -f docker-compose.dev.yml exec app pytest
```

## Development Tools

### Code Quality

#### Linting

```bash
# Install linting tools
pip install flake8 black isort mypy

# Run linting
flake8 app/ tests/

# Auto-format code
black app/ tests/
isort app/ tests/

# Type checking
mypy app/
```

#### Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run on all files
pre-commit run --all-files
```

### IDE Setup

#### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "./.venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "python.sortImports.args": ["--profile", "black"],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

#### VS Code Extensions

- Python
- Pylance
- Python Docstring Generator
- autoDocstring
- Better Comments

### Debugging

#### Local Debugging

```python
# Add to your code for debugging
import pdb; pdb.set_trace()

# Or use breakpoint() in Python 3.7+
breakpoint()
```

#### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "app.main:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8000"
      ],
      "cwd": "${workspaceFolder}/backend",
      "python": "${workspaceFolder}/backend/.venv/bin/python"
    }
  ]
}
```

## Monitoring Development

### Application Logs

```bash
# View application logs
tail -f logs/app.log

# With timestamps and filtering
tail -f logs/app.log | grep -E "(ERROR|WARNING)" --line-buffered
```

### Database Monitoring

```bash
# SQLite
sqlite3 dev.db ".tables"
sqlite3 dev.db "SELECT COUNT(*) FROM generators;"

# PostgreSQL
psql synth_dev -c "\dt"
psql synth_dev -c "SELECT COUNT(*) FROM generators;"
```

### Performance Monitoring

```bash
# Memory usage
python -c "import psutil; print(f'Memory: {psutil.virtual_memory().percent}%')"

# Disk usage
du -sh uploads/
du -sh *.db
```

## Development Workflows

### Feature Development

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Changes**

   ```bash
   # Make your changes
   # Add tests
   # Update documentation
   ```

3. **Run Quality Checks**

   ```bash
   # Lint and format
   pre-commit run --all-files

   # Run tests
   pytest

   # Type check
   mypy app/
   ```

4. **Test Integration**

   ```bash
   # Start server
   uvicorn app.main:app --reload

   # Test API endpoints
   curl http://localhost:8000/health
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

### Database Migrations

When changing database models:

```bash
# Create migration (if using Alembic)
alembic revision --autogenerate -m "add new field"

# Apply migration
alembic upgrade head

# Or manually update tables
python -m app.database.create_tables
```

### API Development

1. **Design API First**

   ```python
   # Define Pydantic models
   class CreateGeneratorRequest(BaseModel):
       name: str
       type: str
       parameters: Dict[str, Any]

   class GeneratorResponse(BaseModel):
       id: UUID
       name: str
       status: str
   ```

2. **Implement Route Handler**

   ```python
   @router.post("/", response_model=GeneratorResponse)
   async def create_generator(
       request: CreateGeneratorRequest,
       db: Session = Depends(get_db),
       current_user: User = Depends(get_current_user)
   ):
       # Implementation
       pass
   ```

3. **Add Tests**
   ```python
   def test_create_generator(client, db_session):
       response = client.post("/generators/", json={
           "name": "Test Generator",
           "type": "ctgan"
       })
       assert response.status_code == 200
   ```

## Troubleshooting

### Common Issues

**Module Import Errors**

```
Error: No module named 'app.core.config'
Solution: Activate virtual environment: source .venv/bin/activate
```

**Database Connection Failed**

```
Error: Could not connect to database
Solution: Check DATABASE_URL in .env, ensure database is running
```

**Port Already in Use**

```
Error: [Errno 48] Address already in use
Solution: Kill process on port: lsof -ti:8000 | xargs kill -9
```

**CUDA/GPU Issues**

```
Error: CUDA out of memory
Solution: Reduce batch_size, use CPU: export CUDA_VISIBLE_DEVICES=""
```

**Permission Errors**

```
Error: Permission denied
Solution: Check file permissions, ensure write access to uploads/
```

### Getting Help

- **API Documentation**: http://localhost:8000/docs
- **Logs**: Check `logs/app.log` for detailed error messages
- **Tests**: Run `pytest -v` for verbose test output
- **GitHub Issues**: Search existing issues or create new ones

## Advanced Setup

### Background Jobs (Redis + Celery)

```bash
# Install Redis
# macOS: brew install redis
# Ubuntu: sudo apt install redis-server

# Start Redis
redis-server

# Update .env
REDIS_URL=redis://localhost:6379/0

# Start Celery worker
celery -A app.core.celery_app worker --loglevel=info
```

### GPU Acceleration

For ML workloads:

```bash
# Install PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Verify GPU availability
python -c "import torch; print(torch.cuda.is_available())"
```

### Remote Development

Using VS Code Remote:

1. Install "Remote SSH" extension
2. Connect to remote server
3. Clone repository on remote
4. Set up environment as usual

## Next Steps

Now that your development environment is set up:

1. **[Explore the API](../examples/)** - Learn about available endpoints
2. **[Run Tests](testing.md)** - Understand the testing framework
3. **[Contribute Code](../../CONTRIBUTING.md)** - Learn about contribution guidelines
4. **[Deploy Application](deployment.md)** - Set up production deployment

---

**Need help?** Check our [Troubleshooting Guide](../reference/troubleshooting.md) or create an issue on GitHub.
