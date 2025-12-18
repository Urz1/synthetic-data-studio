---
id: reference-configuration-options
title: "Configuration Options Reference"
sidebar_label: "Configuration Options"
sidebar_position: 1
slug: /reference/configuration-options
tags: [reference, configuration]
---
# Configuration Options Reference

Complete reference of all configuration options available in Synthetic Data Studio.

## Environment Variables

### Core Application Settings

#### `SECRET_KEY`
- **Type**: `string`
- **Required**: Yes
- **Description**: Secret key for JWT token signing
- **Default**: None
- **Example**: `your-256-bit-secret-key-here`
- **Security**: Must be kept secret and randomly generated

#### `ALGORITHM`
- **Type**: `string`
- **Required**: No
- **Description**: JWT algorithm for token signing
- **Default**: `HS256`
- **Allowed Values**: `HS256`, `HS384`, `HS512`
- **Example**: `HS256`

#### `ACCESS_TOKEN_EXPIRE_MINUTES`
- **Type**: `integer`
- **Required**: No
- **Description**: JWT access token expiration time
- **Default**: `30`
- **Range**: `5` - `1440` (24 hours)
- **Example**: `60`

#### `REFRESH_TOKEN_EXPIRE_DAYS`
- **Type**: `integer`
- **Required**: No
- **Description**: Refresh token expiration time
- **Default**: `7`
- **Range**: `1` - `365`
- **Example**: `30`

### Database Configuration

#### `DATABASE_URL`
- **Type**: `string`
- **Required**: Yes
- **Description**: Database connection URL
- **Default**: `sqlite:///./synth_studio.db`
- **Supported**: SQLite, PostgreSQL, MySQL
- **Examples**:
  - SQLite: `sqlite:///./synth_studio.db`
  - PostgreSQL: `postgresql://user:pass@localhost:5432/db`
  - MySQL: `mysql://user:pass@localhost:3306/db`

### Server Configuration

#### `HOST`
- **Type**: `string`
- **Required**: No
- **Description**: Server bind address
- **Default**: `0.0.0.0`
- **Example**: `127.0.0.1`

#### `PORT`
- **Type**: `integer`
- **Required**: No
- **Description**: Server port
- **Default**: `8000`
- **Range**: `1024` - `65535`
- **Example**: `8080`

#### `DEBUG`
- **Type**: `boolean`
- **Required**: No
- **Description**: Enable debug mode
- **Default**: `false`
- **Note**: Disable in production

#### `RELOAD`
- **Type**: `boolean`
- **Required**: No
- **Description**: Enable auto-reload on code changes
- **Default**: `false`
- **Note**: Disable in production

### File Storage

#### `UPLOAD_DIR`
- **Type**: `string`
- **Required**: No
- **Description**: Directory for uploaded files
- **Default**: `./uploads`
- **Example**: `/app/uploads`

#### `MAX_FILE_SIZE`
- **Type**: `string`
- **Required**: No
- **Description**: Maximum file size for uploads
- **Default**: `100MB`
- **Format**: Size with unit (MB, GB)
- **Example**: `500MB`

#### `ALLOWED_EXTENSIONS`
- **Type**: `string`
- **Required**: No
- **Description**: Comma-separated list of allowed file extensions
- **Default**: `csv,json,xlsx,parquet`
- **Example**: `csv,json,xlsx`

### External Services

#### AWS S3 Configuration

##### `USE_S3`
- **Type**: `boolean`
- **Required**: No
- **Description**: Enable AWS S3 storage
- **Default**: `false`

##### `AWS_ACCESS_KEY_ID`
- **Type**: `string`
- **Required**: Conditional (if USE_S3=true)
- **Description**: AWS access key ID
- **Example**: `AKIAEXAMPLEKEY`

##### `AWS_SECRET_ACCESS_KEY`
- **Type**: `string`
- **Required**: Conditional (if USE_S3=true)
- **Description**: AWS secret access key
- **Security**: Must be kept secret

##### `AWS_DEFAULT_REGION`
- **Type**: `string`
- **Required**: Conditional (if USE_S3=true)
- **Description**: AWS region
- **Default**: `us-east-1`
- **Example**: `eu-west-1`

##### `S3_BUCKET`
- **Type**: `string`
- **Required**: Conditional (if USE_S3=true)
- **Description**: S3 bucket name
- **Example**: `my-synth-studio-bucket`

#### Google Cloud Storage

##### `USE_GCS`
- **Type**: `boolean`
- **Required**: No
- **Description**: Enable Google Cloud Storage
- **Default**: `false`

##### `GOOGLE_APPLICATION_CREDENTIALS`
- **Type**: `string`
- **Required**: Conditional (if USE_GCS=true)
- **Description**: Path to GCS service account JSON file
- **Example**: `./service-account.json`

##### `GCS_BUCKET`
- **Type**: `string`
- **Required**: Conditional (if USE_GCS=true)
- **Description**: GCS bucket name
- **Example**: `my-synth-studio-bucket`

### AI/LLM Services

#### Google Gemini

##### `USE_GEMINI`
- **Type**: `boolean`
- **Required**: No
- **Description**: Enable Google Gemini AI
- **Default**: `false`

##### `GEMINI_API_KEY`
- **Type**: `string`
- **Required**: Conditional (if USE_GEMINI=true)
- **Description**: Google Gemini API key
- **Security**: Must be kept secret

##### `GEMINI_MODEL`
- **Type**: `string`
- **Required**: No
- **Description**: Gemini model to use
- **Default**: `gemini-1.5-flash`
- **Options**: `gemini-1.5-flash`, `gemini-1.5-pro`

##### `GEMINI_MAX_TOKENS`
- **Type**: `integer`
- **Required**: No
- **Description**: Maximum tokens for Gemini responses
- **Default**: `2048`
- **Range**: `1` - `8192`

##### `GEMINI_TEMPERATURE`
- **Type**: `float`
- **Required**: No
- **Description**: Response creativity (0.0 = deterministic, 1.0 = creative)
- **Default**: `0.7`
- **Range**: `0.0` - `2.0`

#### Groq

##### `USE_GROQ`
- **Type**: `boolean`
- **Required**: No
- **Description**: Enable Groq AI
- **Default**: `false`

##### `GROQ_API_KEY`
- **Type**: `string`
- **Required**: Conditional (if USE_GROQ=true)
- **Description**: Groq API key
- **Security**: Must be kept secret

##### `GROQ_MODEL`
- **Type**: `string`
- **Required**: No
- **Description**: Groq model to use
- **Default**: `llama-3.1-70b-versatile`
- **Options**: `llama-3.1-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`

##### `GROQ_MAX_TOKENS`
- **Type**: `integer`
- **Required**: No
- **Description**: Maximum tokens for Groq responses
- **Default**: `4096`
- **Range**: `1` - `8192`

##### `GROQ_TEMPERATURE`
- **Type**: `float`
- **Required**: No
- **Description**: Response creativity
- **Default**: `0.1`
- **Range**: `0.0` - `2.0`

#### OpenAI

##### `USE_OPENAI`
- **Type**: `boolean`
- **Required**: No
- **Description**: Enable OpenAI
- **Default**: `false`

##### `OPENAI_API_KEY`
- **Type**: `string`
- **Required**: Conditional (if USE_OPENAI=true)
- **Description**: OpenAI API key
- **Security**: Must be kept secret

##### `OPENAI_MODEL`
- **Type**: `string`
- **Required**: No
- **Description**: OpenAI model to use
- **Default**: `gpt-4`
- **Options**: `gpt-4`, `gpt-3.5-turbo`

##### `OPENAI_MAX_TOKENS`
- **Type**: `integer`
- **Required**: No
- **Description**: Maximum tokens for OpenAI responses
- **Default**: `2048`

##### `OPENAI_TEMPERATURE`
- **Type**: `float`
- **Required**: No
- **Description**: Response creativity
- **Default**: `0.3`

### Synthesis Configuration

#### Default Parameters

##### `DEFAULT_GENERATOR_TYPE`
- **Type**: `string`
- **Required**: No
- **Description**: Default synthesis method
- **Default**: `ctgan`
- **Options**: `ctgan`, `tvae`, `gaussian_copula`

##### `DEFAULT_EPOCHS`
- **Type**: `integer`
- **Required**: No
- **Description**: Default training epochs
- **Default**: `50`
- **Range**: `1` - `1000`

##### `DEFAULT_BATCH_SIZE`
- **Type**: `integer`
- **Required**: No
- **Description**: Default batch size
- **Default**: `500`
- **Range**: `10` - `10000`

##### `DEFAULT_NUM_ROWS`
- **Type**: `integer`
- **Required**: No
- **Description**: Default number of synthetic rows
- **Default**: `1000`
- **Range**: `100` - `1000000`

#### GPU Configuration

##### `USE_GPU`
- **Type**: `boolean`
- **Required**: No
- **Description**: Enable GPU acceleration
- **Default**: `true`

##### `CUDA_VISIBLE_DEVICES`
- **Type**: `string`
- **Required**: No
- **Description**: GPU device IDs to use
- **Default**: `0`
- **Example**: `0,1` (use GPUs 0 and 1)

### Differential Privacy Defaults

#### `DEFAULT_EPSILON`
- **Type**: `float`
- **Required**: No
- **Description**: Default privacy budget
- **Default**: `10.0`
- **Range**: `0.1` - `100.0`

#### `DEFAULT_DELTA`
- **Type**: `string`
- **Required**: No
- **Description**: Default failure probability
- **Default**: `auto`
- **Options**: `auto` or numeric value (e.g., `1e-5`)

#### `DEFAULT_MAX_GRAD_NORM`
- **Type**: `float`
- **Required**: No
- **Description**: Gradient clipping threshold
- **Default**: `1.0`
- **Range**: `0.1` - `10.0`

### Evaluation Configuration

#### Statistical Tests

##### `KS_TEST_SIGNIFICANCE`
- **Type**: `float`
- **Required**: No
- **Description**: Significance level for KS test
- **Default**: `0.05`
- **Range**: `0.001` - `0.1`

##### `CHI_SQUARE_SIGNIFICANCE`
- **Type**: `float`
- **Required**: No
- **Description**: Significance level for Chi-square test
- **Default**: `0.05`
- **Range**: `0.001` - `0.1`

##### `WASSERSTEIN_THRESHOLD`
- **Type**: `float`
- **Required**: No
- **Description**: Acceptable Wasserstein distance
- **Default**: `0.1`
- **Range**: `0.01` - `1.0`

#### ML Utility

##### `ML_UTILITY_TEST_SIZE`
- **Type**: `float`
- **Required**: No
- **Description**: Test set proportion for ML evaluation
- **Default**: `0.2`
- **Range**: `0.1` - `0.5`

##### `ML_UTILITY_RANDOM_STATE`
- **Type**: `integer`
- **Required**: No
- **Description**: Random seed for reproducible results
- **Default**: `42`

### Background Processing

#### Redis Configuration

##### `REDIS_URL`
- **Type**: `string`
- **Required**: No
- **Description**: Redis connection URL
- **Default**: `redis://localhost:6379/0`
- **Example**: `redis://username:password@host:port/db`

#### Celery Configuration

##### `CELERY_BROKER_URL`
- **Type**: `string`
- **Required**: No
- **Description**: Celery message broker URL
- **Default**: `redis://localhost:6379/0`

##### `CELERY_RESULT_BACKEND`
- **Type**: `string`
- **Required**: No
- **Description**: Celery result backend URL
- **Default**: `redis://localhost:6379/0`

##### `CELERY_TASK_SERIALIZER`
- **Type**: `string`
- **Required**: No
- **Description**: Task serialization format
- **Default**: `json`
- **Options**: `json`, `pickle`, `yaml`

### Logging Configuration

#### `LOG_LEVEL`
- **Type**: `string`
- **Required**: No
- **Description**: Logging level
- **Default**: `INFO`
- **Options**: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`

#### `LOG_FORMAT`
- **Type**: `string`
- **Required**: No
- **Description**: Log message format
- **Default**: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- **Example**: `[%(levelname)s] %(message)s`

#### `LOG_FILE`
- **Type**: `string`
- **Required**: No
- **Description**: Log file path (optional)
- **Default**: None
- **Example**: `./logs/app.log`

### Security Configuration

#### CORS Settings

##### `ALLOWED_ORIGINS`
- **Type**: `string`
- **Required**: No
- **Description**: Comma-separated allowed origins
- **Default**: `*` (allow all in development)
- **Example**: `http://localhost:3000,https://myapp.com`

##### `ALLOW_CREDENTIALS`
- **Type**: `boolean`
- **Required**: No
- **Description**: Allow credentials in CORS
- **Default**: `true`

##### `ALLOW_METHODS`
- **Type**: `string`
- **Required**: No
- **Description**: Comma-separated allowed HTTP methods
- **Default**: `GET,POST,PUT,DELETE,OPTIONS`

##### `ALLOW_HEADERS`
- **Type**: `string`
- **Required**: No
- **Description**: Comma-separated allowed headers
- **Default**: `*`

### Monitoring & Metrics

#### `ENABLE_METRICS`
- **Type**: `boolean`
- **Required**: No
- **Description**: Enable Prometheus metrics
- **Default**: `false`

#### `METRICS_PORT`
- **Type**: `integer`
- **Required**: No
- **Description**: Metrics server port
- **Default**: `9090`

#### `HEALTH_CHECK_INTERVAL`
- **Type**: `integer`
- **Required**: No
- **Description**: Health check interval (seconds)
- **Default**: `30`

## Configuration File Examples

### Development Configuration

```env
# Development Environment
DEBUG=true
RELOAD=true
LOG_LEVEL=DEBUG
DATABASE_URL=sqlite:///./dev.db

# AI Services (optional)
USE_GEMINI=true
GEMINI_API_KEY=your-dev-key

# File limits
MAX_FILE_SIZE=50MB
```

### Production Configuration

```env
# Production Environment
DEBUG=false
RELOAD=false
LOG_LEVEL=WARNING
DATABASE_URL=postgresql://user:pass@db-host:5432/synth_studio

# Security
SECRET_KEY=your-production-secret-key
ALLOWED_ORIGINS=https://your-app.com,https://admin.your-app.com

# External Services
USE_S3=true
AWS_ACCESS_KEY_ID=production-key
AWS_SECRET_ACCESS_KEY=production-secret
S3_BUCKET=prod-synth-studio

# AI Services
USE_GEMINI=true
GEMINI_API_KEY=production-gemini-key

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# Background Jobs
REDIS_URL=redis://prod-redis:6379/0
CELERY_BROKER_URL=redis://prod-redis:6379/0
```

### Testing Configuration

```env
# Testing Environment
DEBUG=false
TESTING=true
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=test-secret-key

# Disable external services in tests
USE_S3=false
USE_GEMINI=false
USE_GROQ=false

# Fast test execution
DEFAULT_EPOCHS=5
DEFAULT_BATCH_SIZE=100
```

## Configuration Validation

The application validates configuration on startup. Invalid configurations will prevent startup with clear error messages.

### Common Validation Errors

- **Missing SECRET_KEY**: Required for JWT token signing
- **Invalid DATABASE_URL**: Must be properly formatted connection string
- **Invalid file paths**: UPLOAD_DIR must exist and be writable
- **Conflicting settings**: Cannot enable multiple AI providers with same model

### Configuration Testing

```bash
# Test configuration loading
python -c "from app.core.config import settings; print(' Config loaded successfully')"

# Validate database connection
python -c "from app.database.database import engine; print(' Database connected')"

# Test AI service connections (if enabled)
python -c "from app.services.llm.chat_service import ChatService; print(' AI services initialized')"
```

## Environment-Specific Overrides

### Using Multiple .env Files

```bash
# .env.base - Shared configuration
SECRET_KEY=base-secret
DATABASE_URL=sqlite:///./app.db

# .env.development - Development overrides
DEBUG=true
LOG_LEVEL=DEBUG

# .env.production - Production overrides
DEBUG=false
LOG_LEVEL=WARNING
DATABASE_URL=postgresql://...
```

### Loading Environment Files

```python
# In config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Configuration fields...

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
```

## Security Considerations

### Secret Management

- Never commit secrets to version control
- Use environment variables for sensitive data
- Rotate secrets regularly
- Use different secrets for different environments

### File Permissions

- Ensure UPLOAD_DIR is writable by application user
- Restrict access to configuration files
- Use secure file permissions (e.g., 600 for secret files)

### Network Security

- Restrict ALLOWED_ORIGINS in production
- Use HTTPS/TLS encryption
- Implement proper firewall rules
- Regular security updates

## Performance Tuning

### Database Optimization

- Use connection pooling for high traffic
- Enable database query logging in development
- Configure appropriate connection limits

### Memory Management

- Adjust batch sizes based on available RAM
- Monitor memory usage in production
- Configure garbage collection settings

### GPU Optimization

- Set CUDA_VISIBLE_DEVICES for multi-GPU systems
- Monitor GPU memory usage
- Use appropriate batch sizes for GPU memory

## Troubleshooting Configuration

### Debug Configuration Loading

```python
# Enable debug logging
LOG_LEVEL=DEBUG

# Check loaded configuration
python -c "
from app.core.config import settings
import json
print(json.dumps(settings.dict(), indent=2, default=str))
"
```

### Common Issues

**Configuration not loading**: Check .env file exists and is readable
**Database connection failed**: Verify DATABASE_URL format and credentials
**AI services not working**: Check API keys and network connectivity
**File upload issues**: Verify UPLOAD_DIR exists and is writable

### Configuration Reset

```bash
# Reset to defaults
rm .env
cp .env.example .env

# Or manually set minimal config
export SECRET_KEY="temp-key-for-testing"
export DATABASE_URL="sqlite:///./temp.db"
```

---

**Need help with configuration?** Check the [Configuration Guide](../getting-started/configuration.md) or create an issue on GitHub.

