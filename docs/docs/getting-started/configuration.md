---
id: getting-started-configuration
title: "Configuration Guide"
sidebar_label: "Configuration"
sidebar_position: 3
slug: /getting-started/configuration
tags: [getting-started, configuration]
---
# Configuration Guide

Learn how to configure Synthetic Data Studio for different environments and use cases.

##  Configuration Overview

Synthetic Data Studio uses environment variables for configuration. The main configuration file is `.env` in the backend directory.

##  Basic Configuration

### Creating the Environment File

```bash
# Copy the example file
cp .env.example .env
```

### Essential Settings

```env
# ===========================================
# SYNTHETIC DATA STUDIO CONFIGURATION
# ===========================================

# Database Configuration
DATABASE_URL=sqlite:///./synth_studio.db

# Security Settings
SECRET_KEY=your-super-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100MB
ALLOWED_EXTENSIONS=csv,json,xlsx

# Server Settings
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

##  Database Configuration

### SQLite (Development/Default)

```env
DATABASE_URL=sqlite:///./synth_studio.db
```

**Pros**: Simple, no additional setup, file-based
**Cons**: Not suitable for production, limited concurrency

### PostgreSQL (Production)

```env
DATABASE_URL=postgresql://username:password@localhost:5432/synth_studio
```

**Setup**:

```bash
# Install PostgreSQL driver
pip install psycopg2-binary

# Create database
createdb synth_studio

# Or via psql
psql -c "CREATE DATABASE synth_studio;"
```

### MySQL/MariaDB

```env
DATABASE_URL=mysql://username:password@localhost:3306/synth_studio
```

**Setup**:

```bash
# Install MySQL driver
pip install pymysql

# Create database
mysql -u root -p -e "CREATE DATABASE synth_studio;"
```

## � Security Configuration

### JWT Authentication

```env
# JWT Secret Key (REQUIRED - Generate a strong random key)
SECRET_KEY=your-256-bit-secret-key-here

# Token Expiration
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

> [!NOTE]
> Algorithm is currently fixed to HS256.

**Generating a secure secret key**:

```python
import secrets
print(secrets.token_hex(32))  # 256-bit key
```

### CORS Settings

```env
# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# CORS Credentials
ALLOW_CREDENTIALS=true

# CORS Methods
ALLOW_METHODS=GET,POST,PUT,DELETE,OPTIONS

# CORS Headers
ALLOW_HEADERS=*
```

##  File Storage Configuration

### Local Storage (Default)

```env
# Upload Directory
UPLOAD_DIR=./uploads
```

> [!NOTE]
> File size limit (100MB) and allowed extensions (CSV, JSON) are currently enforced by the application and are not configurable via environment variables.

### AWS S3 Storage

```env
# Enable S3 Storage
USE_S3=true

# AWS Credentials
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1

# S3 Bucket
S3_BUCKET=your-synth-studio-bucket

# Optional: Custom S3 Endpoint (for MinIO, etc.)
S3_ENDPOINT_URL=https://minio.example.com
```

### Google Cloud Storage

```env
# Enable GCS
USE_GCS=true

# GCS Credentials (JSON key file path)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# GCS Bucket
GCS_BUCKET=your-synth-studio-bucket
```

##  AI/LLM Configuration

### Google Gemini (Free Tier)

```env
# Enable Gemini
USE_GEMINI=true

# API Key
GEMINI_API_KEY=your-gemini-api-key

# Model Settings
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=2048
GEMINI_TEMPERATURE=0.7
```

### Groq (Free Tier)

```env
# Enable Groq
USE_GROQ=true

# API Key
GROQ_API_KEY=your-groq-api-key

# Model Settings
GROQ_MODEL=llama-3.1-70b-versatile
GROQ_MAX_TOKENS=4096
GROQ_TEMPERATURE=0.1
```

### OpenAI (Optional)

```env
# Enable OpenAI
USE_OPENAI=true

# API Key
OPENAI_API_KEY=your-openai-api-key

# Model Settings
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2048
OPENAI_TEMPERATURE=0.3
```

##  Synthesis Configuration

> [!NOTE]
> Synthesis parameters (epochs, batch size, privacy budget) are configured per-job via the API. The defaults mentioned below are application-level defaults.

### GPU Settings

```env
# GPU Settings
USE_GPU=true
CUDA_VISIBLE_DEVICES=0
```

##  Evaluation Configuration

### Statistical Tests

```env
# Test Settings
KS_TEST_SIGNIFICANCE=0.05
CHI_SQUARE_SIGNIFICANCE=0.05
WASSERSTEIN_THRESHOLD=0.1

# ML Utility
ML_UTILITY_TEST_SIZE=0.2
ML_UTILITY_RANDOM_STATE=42
```

### Privacy Tests

```env
# Membership Inference
MI_ATTACK_TRAIN_SIZE=0.5
MI_ATTACK_TEST_SIZE=0.3

# Attribute Inference
AI_ATTACK_SAMPLE_SIZE=1000
AI_ATTACK_SIGNIFICANCE=0.05
```

##  Server Configuration

### Development

```env
# Debug Mode
DEBUG=true

# Auto Reload
RELOAD=true

# Server Settings
HOST=0.0.0.0
PORT=8000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

### Production

```env
# Production Settings
DEBUG=false
RELOAD=false

# Server
HOST=0.0.0.0
PORT=8000

# Workers (for Gunicorn)
WORKERS=4
WORKER_CLASS=uvicorn.workers.UvicornWorker

# Logging
LOG_LEVEL=WARNING
```

##  Background Jobs

### Celery Configuration

```env
# Redis Broker (for Celery)
REDIS_URL=redis://localhost:6379/0

# Celery Settings
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Task Settings
CELERY_TASK_SERIALIZER=json
CELERY_ACCEPT_CONTENT=['json']
CELERY_RESULT_SERIALIZER=json
CELERY_TIMEZONE=UTC
```

##  Monitoring & Observability

### Logging

```env
# Log Level
LOG_LEVEL=INFO

# Log Format
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# Log File (Optional)
LOG_FILE=./logs/synth_studio.log

# Log Rotation
LOG_MAX_BYTES=10485760  # 10MB
LOG_BACKUP_COUNT=5
```

### Metrics (Optional)

```env
# Prometheus Metrics
ENABLE_METRICS=true
METRICS_PORT=9090

# Health Checks
HEALTH_CHECK_INTERVAL=30
```

## � Environment-Specific Configurations

### Development Environment

```env
# .env.development
DEBUG=true
RELOAD=true
DATABASE_URL=sqlite:///./dev.db
LOG_LEVEL=DEBUG
USE_GPU=false
```

### Testing Environment

```env
# .env.test
DEBUG=false
DATABASE_URL=sqlite:///./test.db
TESTING=true
USE_GPU=false
LOG_LEVEL=WARNING
```

### Production Environment

```env
# .env.production
DEBUG=false
RELOAD=false
DATABASE_URL=postgresql://user:pass@prod-db:5432/synth_studio
USE_S3=true
LOG_LEVEL=WARNING
ENABLE_METRICS=true
```

##  Validation & Troubleshooting

### Configuration Validation

The application validates configuration on startup. Common issues:

**Database Connection**:

```text
ERROR: Database connection failed
SOLUTION: Check DATABASE_URL format and credentials
```

**Missing Secret Key**:

```text
ERROR: SECRET_KEY not set
SOLUTION: Generate a secure random key
```

**Invalid File Paths**:

```text
ERROR: UPLOAD_DIR does not exist
SOLUTION: Create directory or update path
```

### Testing Configuration

```bash
# Test database connection
python -c "from app.database.database import engine; print('DB OK' if engine else 'DB FAIL')"

# Test configuration loading
python -c "from app.core.config import settings; print('Config OK')"

# Test API startup
uvicorn app.main:app --dry-run
```

##  Complete Example Configuration

Here's a complete production-ready configuration:

```env
# ===========================================
# PRODUCTION CONFIGURATION
# ===========================================

# Database
DATABASE_URL=postgresql://synth_user:secure_password@db.example.com:5432/synth_studio

# Security
SECRET_KEY=256-bit-hex-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# File Storage
USE_S3=true
AWS_ACCESS_KEY_ID=AKIAEXAMPLE
AWS_SECRET_ACCESS_KEY=secret-key-here
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET=synth-studio-production

# AI Services
USE_GEMINI=true
GEMINI_API_KEY=gemini-key-here
USE_GROQ=true
GROQ_API_KEY=groq-key-here

# Server
DEBUG=false
HOST=0.0.0.0
PORT=8000
WORKERS=4

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/app.log

# Background Jobs
REDIS_URL=redis://redis.example.com:6379/0
CELERY_BROKER_URL=redis://redis.example.com:6379/0

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

---

**Need help?** Check the [Troubleshooting Guide](../reference/troubleshooting.md) or create an issue on GitHub.


