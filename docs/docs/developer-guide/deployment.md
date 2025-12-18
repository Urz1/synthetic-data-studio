---
id: developer-guide-deployment
title: "Deployment Guide"
sidebar_label: "Deployment"
sidebar_position: 5
slug: /developer-guide/deployment
tags: [developer, deployment]
---

# Deployment Guide

Complete guide for deploying Synthetic Data Studio to production environments, including Docker, cloud platforms, and scaling considerations.

## Quick Deployment Options

### Option 1: Docker (Recommended)

```bash
# Build and run with Docker
docker build -t synth-studio .
docker run -p 8000:8000 -e SECRET_KEY=your-secret-key synth-studio

# Or use Docker Compose
docker-compose up -d
```

### Option 2: Cloud Platforms

#### Heroku

```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set DATABASE_URL=your-database-url

# Deploy
git push heroku main
```

#### Railway

```bash
# Connect GitHub repo to Railway
# Set environment variables in dashboard
# Deploy automatically
```

#### Render

```bash
# Connect GitHub repo
# Set build command: pip install -r requirements.txt
# Set start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Docker Deployment

### Production Dockerfile

```dockerfile
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd --create-home --shell /bin/bash app

# Set work directory
WORKDIR /home/app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Change ownership
RUN chown -R app:app .

# Switch to app user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Expose port
EXPOSE 8000

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Docker Compose for Production

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    volumes:
      - uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=synth_studio
      - POSTGRES_USER=synth_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  uploads:
```

### Multi-Stage Docker Build

```dockerfile
# Build stage
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

WORKDIR /app
COPY . .

USER nobody
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## ? Cloud Platform Deployments

### AWS Deployment

#### ECS Fargate

```yaml
# task-definition.json
{
  "family": "synth-studio",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions":
    [
      {
        "name": "app",
        "image": "your-registry/synth-studio:latest",
        "essential": true,
        "portMappings": [{ "containerPort": 8000, "hostPort": 8000 }],
        "environment":
          [
            { "name": "SECRET_KEY", "value": "your-secret" },
            { "name": "DATABASE_URL", "value": "postgresql://..." },
            { "name": "REDIS_URL", "value": "redis://..." },
          ],
        "logConfiguration":
          {
            "logDriver": "awslogs",
            "options":
              {
                "awslogs-group": "/ecs/synth-studio",
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "ecs",
              },
          },
      },
    ],
}
```

#### Elastic Beanstalk

```yaml
# .ebextensions/environment.config
option_settings:
  aws:elasticbeanstalk:application:environment:
    SECRET_KEY: your-secret-key
    DATABASE_URL: your-database-url
    REDIS_URL: your-redis-url
  aws:autoscaling:launchconfiguration:
    InstanceType: t3.medium
    IamInstanceProfile: aws-elasticbeanstalk-ec2-role
```

### Google Cloud Platform

#### Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/project-id/synth-studio
gcloud run deploy synth-studio \
  --image gcr.io/project-id/synth-studio \
  --platform managed \
  --port 8000 \
  --set-env-vars SECRET_KEY=your-secret,DATABASE_URL=your-db \
  --allow-unauthenticated
```

#### App Engine

```yaml
# app.yaml
runtime: python311
instance_class: F4

env_variables:
  SECRET_KEY: your-secret-key
  DATABASE_URL: your-database-url

handlers:
  - url: /.*
    script: auto
```

### Azure Deployment

#### Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name synth-studio \
  --image your-registry/synth-studio:latest \
  --cpu 1 \
  --memory 2 \
  --registry-login-server your-registry.azurecr.io \
  --registry-username your-registry \
  --registry-password your-password \
  --environment-variables SECRET_KEY=your-secret DATABASE_URL=your-db \
  --ports 8000 \
  --dns-name-label synth-studio
```

## ? Production Configuration

### Environment Variables

```bash
# Security
SECRET_KEY=your-256-bit-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis (for caching and background jobs)
REDIS_URL=redis://host:6379/0

# File Storage
USE_S3=true
AWS_ACCESS_KEY_ID=key
AWS_SECRET_ACCESS_KEY=secret
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET=your-bucket

# External Services
USE_GEMINI=true
GEMINI_API_KEY=key
USE_GROQ=true
GROQ_API_KEY=key

# Application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=4
```

### Database Setup

#### PostgreSQL Production Setup

```sql
-- Create database
CREATE DATABASE synth_studio;

-- Create user
CREATE USER synth_user WITH PASSWORD 'secure-password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE synth_studio TO synth_user;

-- Create extensions
\c synth_studio
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### Connection Pooling

```python
# app/core/config.py
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    settings.database_url,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=3600
)
```

### Background Jobs

#### Celery Configuration

```python
# app/core/celery_app.py
from celery import Celery

celery_app = Celery(
    "synth_studio",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
```

#### Task Definition

```python
# app/tasks.py
from app.core.celery_app import celery_app

@celery_app.task(bind=True)
def generate_synthetic_data(self, generator_id: str):
    """Background task for data generation."""
    # Implementation
    pass
```

#### Running Workers

```bash
# Start Celery workers
celery -A app.core.celery_app worker --loglevel=info --concurrency=4

# Start beat scheduler (for periodic tasks)
celery -A app.core.celery_app beat --loglevel=info
```

## Reverse Proxy Setup

### Nginx Configuration

```nginx
# nginx.conf
upstream app {
    server app:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files
    location /static/ {
        alias /app/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### SSL/TLS Setup

```bash
# Generate SSL certificate (Let's Encrypt)
certbot certonly --nginx -d your-domain.com

# Or use self-signed for testing
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

## Monitoring & Observability

### Application Monitoring

#### Prometheus Metrics

```python
# app/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency', ['method', 'endpoint'])

# Business metrics
GENERATION_COUNT = Counter('synthetic_generations_total', 'Total synthetic data generations')
ACTIVE_USERS = Gauge('active_users', 'Number of active users')
```

#### Health Checks

```python
# app/routes/health.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Comprehensive health check."""
    try:
        # Database check
        db.execute("SELECT 1")

        # Redis check (if configured)
        # External service checks

        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
```

### Logging Configuration

```python
# app/core/logging.py
import logging
from pythonjsonlogger import jsonlogger

def setup_logging():
    """Configure structured logging."""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # JSON formatter for production
    formatter = jsonlogger.JsonFormatter(
        "%(asctime)s %(name)s %(levelname)s %(message)s"
    )

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler
    file_handler = logging.FileHandler("logs/app.log")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
```

## Scaling Strategies

### Horizontal Scaling

#### Load Balancing

```nginx
upstream backend {
    least_conn;
    server app1:8000 weight=1;
    server app2:8000 weight=1;
    server app3:8000 weight=1;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

#### Database Scaling

```yaml
# Read-write splitting
services:
  db-master:
    # Write operations

  db-replica-1:
    # Read operations
  db-replica-2:
    # Read operations
```

### Vertical Scaling

#### Resource Allocation

```yaml
# docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 4G
        reservations:
          cpus: "1.0"
          memory: 2G
```

### Auto Scaling

#### Kubernetes HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: synth-studio-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: synth-studio
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Security Hardening

### Production Security Checklist

- [ ] Use strong, randomly generated SECRET_KEY
- [ ] Enable HTTPS/TLS encryption
- [ ] Configure proper CORS settings
- [ ] Set secure session cookies
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Monitor for vulnerabilities
- [ ] Implement proper logging
- [ ] Use secure headers

### Security Headers

```python
# app/middleware/security.py
from fastapi.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response
```

## Backup & Recovery

### Database Backups

```bash
# PostgreSQL backup
pg_dump -U synth_user -h localhost synth_studio > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U synth_user synth_studio > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### File Storage Backups

```bash
# S3 backup
aws s3 sync uploads/ s3://synth-studio-backups/$(date +%Y%m%d)/

# Restore from backup
aws s3 sync s3://synth-studio-backups/latest/ uploads/
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_generators_status ON generators(status);
CREATE INDEX idx_generators_created_by ON generators(created_by);
CREATE INDEX idx_datasets_created_at ON datasets(created_at);

-- Query optimization
EXPLAIN ANALYZE SELECT * FROM generators WHERE status = 'completed';
```

### Caching Strategy

```python
# Redis caching
from redis import Redis
import json

redis_client = Redis.from_url(settings.redis_url)

def cache_generation_result(generator_id: str, result: dict, ttl: int = 3600):
    """Cache generation results."""
    key = f"generation:{generator_id}"
    redis_client.setex(key, ttl, json.dumps(result))

def get_cached_result(generator_id: str) -> dict:
    """Get cached generation result."""
    key = f"generation:{generator_id}"
    cached = redis_client.get(key)
    return json.loads(cached) if cached else None
```

### CDN for Static Assets

```nginx
# Static file serving with CDN
location /static/ {
    proxy_pass https://cdn.your-domain.com;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Maintenance Tasks

### Regular Maintenance

```bash
# Update dependencies
pip install --upgrade -r requirements.txt

# Database maintenance
vacuumdb -U postgres --analyze synth_studio

# Log rotation
logrotate /etc/logrotate.d/synth-studio

# Security updates
apt-get update && apt-get upgrade -y
```

### Monitoring Scripts

```python
# health_check.py
import requests
import time

def check_health():
    """Continuous health monitoring."""
    while True:
        try:
            response = requests.get("http://localhost:8000/health", timeout=5)
            if response.status_code != 200:
                print(f"Health check failed: {response.status_code}")
                # Send alert
        except Exception as e:
            print(f"Health check error: {e}")
            # Send alert

        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    check_health()
```

## Troubleshooting Production Issues

### Common Production Problems

**High Memory Usage**

```
Cause: Large datasets, memory leaks
Solution: Implement streaming, add memory limits, monitor GC
```

**Slow Response Times**

```
Cause: Database queries, external API calls
Solution: Add caching, optimize queries, use async operations
```

**Database Connection Pool Exhausted**

```
Cause: Too many concurrent connections
Solution: Increase pool size, implement connection pooling
```

**Background Jobs Stuck**

```
Cause: Worker crashes, Redis issues
Solution: Monitor Celery, implement retry logic, add dead letter queues
```

---

**Ready to deploy?** Start with our [Installation Guide](../getting-started/installation.md) and scale up to production using the configurations above.
