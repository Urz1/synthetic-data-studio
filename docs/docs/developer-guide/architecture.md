---
id: developer-guide-architecture
title: "System Architecture"
sidebar_label: "Architecture"
sidebar_position: 1
slug: /developer-guide/architecture
tags: [developer, architecture]
---

# System Architecture

This document provides a comprehensive overview of Synthetic Data Studio's system architecture, design principles, and technical implementation.

## ? High-Level Architecture

### System Overview

Synthetic Data Studio is built as a modern, scalable web application using FastAPI and follows a modular, service-oriented architecture.

```
+-------------------------------------------------------------+
¦                    SYNTHETIC DATA STUDIO                    ¦
+-------------------------------------------------------------¦
¦  +-------------+ +-------------+ +-------------+ +---------+ ¦
¦  ¦   Web API   ¦ ¦ Background  ¦ ¦   AI/LLM   ¦ ¦ Storage ¦ ¦
¦  ¦  (FastAPI)  ¦ ¦  Workers    ¦ ¦  Services  ¦ ¦ Service ¦ ¦
¦  ¦             ¦ ¦ (Celery)    ¦ ¦ (Gemini)   ¦ ¦ (S3)    ¦ ¦
¦  +-------------+ +-------------+ +-------------+ +---------+ ¦
+-------------------------------------------------------------¦
¦  +-------------+ +-------------+ +-------------+ +---------+ ¦
¦  ¦  Business   ¦ ¦   Data      ¦ ¦ Repository ¦ ¦  Core   ¦ ¦
¦  ¦  Services   ¦ ¦   Models    ¦ ¦   Layer    ¦ ¦ Services¦ ¦
¦  ¦             ¦ ¦ (SQLModel)  ¦ ¦ (CRUD)     ¦ ¦         ¦ ¦
¦  +-------------+ +-------------+ +-------------+ +---------+ ¦
+-------------------------------------------------------------¦
¦  +---------------------------------------------------------+ ¦
¦  ¦                 DATABASE LAYER                          ¦ ¦
¦  ¦  +-------------+ +-------------+ +-------------+        ¦ ¦
¦  ¦  ¦ PostgreSQL  ¦ ¦  SQLite    ¦ ¦   Redis     ¦        ¦ ¦
¦  ¦  ¦ (Primary)   ¦ ¦ (Dev/Test) ¦ ¦ (Caching)   ¦        ¦ ¦
¦  ¦  +-------------+ +-------------+ +-------------+        ¦ ¦
¦  +---------------------------------------------------------+ ¦
+-------------------------------------------------------------+
```

## Architectural Principles

### 1. Modular Design

- **Separation of Concerns**: Each module has a single responsibility
- **Dependency Injection**: Clean interfaces between components
- **Plugin Architecture**: Extensible service implementations

### 2. API-First Design

- **RESTful APIs**: Consistent, versioned endpoints
- **OpenAPI Specification**: Auto-generated API documentation
- **Type Safety**: Pydantic models for request/response validation

### 3. Privacy by Design

- **Differential Privacy**: Mathematical privacy guarantees built-in
- **Safety Validation**: Multi-layer privacy checks
- **Audit Trail**: Comprehensive logging for compliance

### 4. Scalability & Performance

- **Asynchronous Processing**: Background jobs for long-running tasks
- **Caching Strategy**: Redis for session and result caching
- **Resource Optimization**: GPU support for ML workloads

## Directory Structure

### Root Level

```
backend/
+-- app/                    # Main application code
+-- docs/                   # Documentation
+-- tests/                  # Test suites
+-- scripts/                # Utility scripts
+-- requirements*.txt       # Python dependencies
+-- pytest.ini             # Test configuration
+-- Dockerfile             # Container definition
+-- docker-compose.yml     # Local development stack
```

### Application Structure (`app/`)

```
app/
+-- main.py                # FastAPI application entry point
+-- api.py                 # API router aggregation
+-- core/                  # Core functionality
¦   +-- config.py          # Configuration management
¦   +-- dependencies.py    # Dependency injection
¦   +-- exceptions.py      # Custom exceptions
¦   +-- security.py        # Authentication & authorization
¦   +-- utils.py           # Utility functions
¦   +-- validators.py      # Input validation
+-- auth/                  # Authentication module
¦   +-- models.py          # User models
¦   +-- repositories.py    # User data access
¦   +-- routes.py          # Auth endpoints
¦   +-- schemas.py         # Auth request/response models
¦   +-- services.py        # Auth business logic
+-- datasets/              # Dataset management
+-- generators/            # Synthesis orchestration
+-- evaluations/           # Quality assessment
+-- llm/                   # AI features
+-- models/                # ML model management
+-- compliance/            # Compliance endpoints
+-- jobs/                  # Background job processing
+-- projects/              # Project management
+-- services/              # Business logic services
¦   +-- synthesis/         # ML synthesis implementations
¦   +-- privacy/           # Privacy validation & reporting
¦   +-- llm/               # AI service integrations
+-- database/              # Database layer
¦   +-- database.py        # Connection management
¦   +-- models/            # Base models
¦   +-- migrations/        # Schema migrations
+-- storage/               # File storage abstraction
```

## ? Core Components

### FastAPI Application Layer

#### Main Application (`main.py`)

```python
# Application initialization
app = FastAPI(
    title="Synthetic Data Studio API",
    description="Backend API for Synthetic Data Studio",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Middleware stack
app.add_middleware(CORSMiddleware, ...)
app.add_middleware(AuthenticationMiddleware, ...)

# Router inclusion
app.include_router(api.router)

# Lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database, cache, etc.
    yield
    # Shutdown: Cleanup resources
```

#### API Router Aggregation (`api.py`)

```python
# Centralized router loading
modules_to_load = [
    "app.auth.routes",
    "app.datasets.routes",
    "app.generators.routes",
    # ... other modules
]

for module in modules_to_load:
    try:
        m = __import__(module, fromlist=["router"])
        if hasattr(m, "router"):
            router.include_router(m.router)
    except Exception as e:
        logger.error(f"Failed to load {module}: {e}")
```

### Data Models & Persistence

#### SQLModel Integration

```python
# Base model with common fields
class BaseModel(SQLModel):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

# Example domain model
class Generator(BaseModel, table=True):
    name: str
    type: str = Field(index=True)
    status: str = Field(default="pending")
    parameters_json: Optional[str] = Field(default=None)
    privacy_config: Optional[Dict] = Field(default=None, sa_column=Column(JSON))
    # ... other fields
```

#### Repository Pattern

```python
class GeneratorRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, generator: Generator) -> Generator:
        self.session.add(generator)
        self.session.commit()
        self.session.refresh(generator)
        return generator

    def get_by_id(self, generator_id: UUID) -> Optional[Generator]:
        return self.session.get(Generator, generator_id)

    def update_status(self, generator_id: UUID, status: str) -> bool:
        # Update logic
        pass
```

### Service Layer Architecture

#### Business Logic Services

```python
class GeneratorService:
    def __init__(self, repository: GeneratorRepository):
        self.repository = repository

    async def create_generator(self, request: GeneratorCreateRequest) -> Generator:
        # Validation
        # Business logic
        # Persistence
        pass

    async def start_generation(self, generator_id: UUID) -> GenerationResponse:
        # Orchestration logic
        # Background job scheduling
        pass
```

#### Synthesis Services

```python
class CTGANService:
    def __init__(self, config: DPConfig):
        self.config = config
        self.model = None

    def train(self, data: pd.DataFrame) -> TrainingResult:
        # Model training logic
        # Privacy accounting
        # Progress tracking
        pass

    def generate(self, num_samples: int) -> pd.DataFrame:
        # Sample generation
        # Post-processing
        pass
```

### Background Processing

#### Celery Integration

```python
# Task definition
@celery_app.task(bind=True)
def generate_synthetic_data(self, generator_id: str):
    """Background task for data generation."""
    try:
        # Progress updates
        self.update_state(state='PROGRESS', meta={'progress': 25})

        # Generation logic
        result = perform_generation(generator_id)

        # Completion
        self.update_state(state='SUCCESS', meta={'result': result})
        return result

    except Exception as e:
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise
```

#### Job Management

```python
class JobManager:
    def __init__(self, celery_app):
        self.celery = celery_app

    def submit_generation_job(self, generator_id: UUID) -> str:
        """Submit generation job to queue."""
        task = generate_synthetic_data.delay(str(generator_id))
        return task.id

    def get_job_status(self, job_id: str) -> JobStatus:
        """Get job execution status."""
        task = self.celery.AsyncResult(job_id)
        return JobStatus(
            id=job_id,
            status=task.status,
            progress=task.info.get('progress', 0) if task.info else 0
        )
```

## Security Architecture

### Authentication & Authorization

#### JWT-Based Auth

```python
class AuthService:
    def __init__(self, secret_key: str, algorithm: str):
        self.secret_key = secret_key
        self.algorithm = algorithm

    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=30)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
```

#### Role-Based Access Control

```python
class PermissionChecker:
    def __init__(self, user: User):
        self.user = user

    def can_access_dataset(self, dataset: Dataset) -> bool:
        """Check if user can access dataset."""
        if self.user.role == "admin":
            return True
        return dataset.created_by == self.user.id

    def can_modify_generator(self, generator: Generator) -> bool:
        """Check if user can modify generator."""
        return generator.created_by == self.user.id or self.user.role == "admin"
```

### Privacy & Compliance

#### Differential Privacy Framework

```python
class DPFramework:
    def __init__(self, accountant: PrivacyAccountant):
        self.accountant = accountant

    def validate_config(self, config: DPConfig) -> ValidationResult:
        """Validate DP configuration for safety."""
        # Check sampling rate
        # Validate noise multiplier
        # Verify privacy budget
        pass

    def apply_noise(self, tensor: torch.Tensor, noise_multiplier: float) -> torch.Tensor:
        """Apply calibrated noise for DP."""
        noise = torch.normal(0, noise_multiplier, tensor.shape)
        return tensor + noise
```

#### Audit Logging

```python
class AuditLogger:
    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def log_privacy_event(self, event: PrivacyEvent):
        """Log privacy-related events for compliance."""
        self.logger.info(
            "Privacy Event",
            extra={
                "event_type": event.type,
                "user_id": event.user_id,
                "resource_id": event.resource_id,
                "privacy_params": event.privacy_params,
                "timestamp": event.timestamp.isoformat()
            }
        )
```

## Data Flow Architecture

### Synthesis Pipeline

```
Raw Data Input
       ?
Data Validation & Profiling
       ?
Privacy Configuration Validation
       ?
Background Job Submission
       ?
ML Model Training (GPU/CPU)
       ?
Privacy Accounting & Validation
       ?
Synthetic Data Generation
       ?
Quality Evaluation
       ?
Result Storage & Notification
```

### API Request Flow

```
HTTP Request ? Middleware (CORS, Auth) ? Route Handler ? Service Layer ? Repository ? Database
                                                                 ?
Response ? JSON Serialization ? Pydantic Models ? Business Logic ? Data Access
```

### Background Job Flow

```
API Request ? Job Submission ? Queue (Redis) ? Worker (Celery) ? Task Execution ? Result Storage ? Notification
```

## ? Configuration Management

### Environment-Based Config

```python
class Settings(BaseSettings):
    # Database
    database_url: str = Field(..., env="DATABASE_URL")

    # Security
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # External Services
    redis_url: Optional[str] = Field(None, env="REDIS_URL")
    s3_bucket: Optional[str] = Field(None, env="S3_BUCKET")

    # Feature Flags
    enable_dp: bool = True
    enable_llm: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False
```

### Dependency Injection

```python
def get_db() -> Generator[Session, None, None]:
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Current user dependency."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    return user
```

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: No server-side session storage
- **Database Connection Pooling**: Efficient connection management
- **Background Job Distribution**: Multiple worker processes
- **Load Balancing**: API gateway for traffic distribution

### Performance Optimization

- **Async/Await**: Non-blocking I/O operations
- **Caching**: Redis for frequently accessed data
- **Database Indexing**: Optimized queries
- **GPU Support**: CUDA acceleration for ML workloads

### Monitoring & Observability

- **Structured Logging**: JSON-formatted logs
- **Metrics Collection**: Prometheus-compatible metrics
- **Health Checks**: Application and dependency monitoring
- **Distributed Tracing**: Request flow tracking

## Testing Architecture

### Test Pyramid

```
+-------------+  Few (Integration/E2E)
¦   E2E Tests  ¦
+-------------¦
¦Integration  ¦  Some
¦   Tests     ¦
+-------------¦
¦ Unit Tests  ¦  Many
¦             ¦
+-------------+
```

### Test Structure

```
tests/
+-- unit/              # Unit tests
¦   +-- test_services/ # Service layer tests
¦   +-- test_models/   # Model tests
¦   +-- test_utils/    # Utility tests
+-- integration/       # Integration tests
¦   +-- test_api/      # API endpoint tests
¦   +-- test_db/       # Database integration
+-- e2e/               # End-to-end tests
¦   +-- test_workflows/# Complete workflow tests
+-- conftest.py        # Test configuration
```

## Deployment Architecture

### Containerized Deployment

```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Stack

```
+-----------------+    +-----------------+    +-----------------+
¦   Load Balancer ¦    ¦   API Gateway   ¦    ¦   Application   ¦
¦    (Nginx)      ¦----¦   (Kong/Traefik)¦----¦    (FastAPI)    ¦
+-----------------+    +-----------------+    +-----------------+
         ¦                        ¦                        ¦
         ¦                        ¦                        ¦
+-----------------+    +-----------------+    +-----------------+
¦   Redis Cache   ¦    ¦   PostgreSQL    ¦    ¦   Background    ¦
¦                 ¦    ¦   Database      ¦    ¦   Workers       ¦
+-----------------+    +-----------------+    +-----------------+
```

## Integration Points

### External Services

- **AI Providers**: Google Gemini, Groq for LLM features
- **Cloud Storage**: AWS S3, Google Cloud Storage
- **Monitoring**: Prometheus, Grafana for observability
- **Logging**: ELK stack for log aggregation

### API Ecosystem

- **REST API**: Primary interface for web/mobile clients
- **GraphQL**: Optional for complex data requirements
- **Webhooks**: Event-driven integrations
- **Streaming**: Real-time progress updates

## Further Reading

- **[API Examples](../examples/)**: Code examples and API usage
- **[Development Setup](development-setup.md)**: Local development environment
- **[Testing Guide](testing.md)**: Testing strategies and procedures
- **[Deployment Guide](deployment.md)**: Production deployment options

---

**Need help understanding the architecture?** Check our [Development Setup Guide](development-setup.md) to get started with local development.
