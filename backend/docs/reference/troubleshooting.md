# Troubleshooting Guide

Comprehensive guide to diagnosing and resolving common issues with Synthetic Data Studio.

## 🔍 Quick Diagnosis

### Health Check

Start with a basic health check:

```bash
# Check if server is running
curl http://localhost:8000/health

# Expected response
{
  "status": "healthy",
  "service": "synthetic-data-studio-backend",
  "timestamp": "2025-11-27T10:30:00Z"
}
```

### System Information

Gather diagnostic information:

```bash
# Python version and environment
python --version
which python
pip list | grep -E "(fastapi|uvicorn|sqlmodel)"

# System resources
df -h  # Disk space
free -h  # Memory
nproc  # CPU cores

# Running processes
ps aux | grep -E "(uvicorn|python)" | grep -v grep
```

## 🚨 Critical Issues

### Server Won't Start

#### Symptoms
- Uvicorn fails to start
- Port 8000 already in use
- Import errors on startup

#### Diagnosis
```bash
# Check for port conflicts
netstat -tulpn | grep :8000

# Test imports
python -c "import fastapi, uvicorn, sqlmodel; print('Imports OK')"

# Check configuration
python -c "from app.core.config import settings; print('Config OK')"
```

#### Solutions

**Port Conflict:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**Import Errors:**
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check Python path
python -c "import sys; print(sys.path)"
```

**Configuration Issues:**
```bash
# Validate .env file
cat .env

# Test database connection
python -c "from app.database.database import engine; print('DB OK')"
```

### Database Connection Failed

#### Symptoms
- "Could not connect to database" errors
- Application starts but API calls fail
- Migration errors

#### Diagnosis
```bash
# Test database connection
python -c "
from app.database.database import engine
try:
    with engine.connect() as conn:
        result = conn.execute('SELECT 1')
        print('Database connection: OK')
except Exception as e:
    print(f'Database connection: FAILED - {e}')
"

# Check database service
# For PostgreSQL
sudo systemctl status postgresql

# For SQLite
ls -la *.db
```

#### Solutions

**SQLite Issues:**
```bash
# Remove corrupted database
rm synth_studio.db

# Recreate tables
python -m app.database.create_tables
```

**PostgreSQL Issues:**
```bash
# Check connection string
echo $DATABASE_URL

# Test with psql
psql $DATABASE_URL -c "SELECT version();"

# Reset database
dropdb synth_studio
createdb synth_studio
python -m app.database.create_tables
```

**Permission Issues:**
```bash
# Check file permissions
ls -la uploads/
chmod 755 uploads/

# Database file permissions
chmod 644 *.db
```

## 📤 Data Upload Issues

### File Upload Fails

#### Symptoms
- "File too large" errors
- "Invalid file format" messages
- Upload appears to succeed but no data

#### Diagnosis
```bash
# Check file size
ls -lh your-file.csv

# Validate CSV structure
head -5 your-file.csv
wc -l your-file.csv

# Check server logs
tail -f logs/app.log
```

#### Solutions

**File Size Issues:**
```bash
# Check configured limits
grep MAX_FILE_SIZE .env

# Split large files
split -l 100000 large-file.csv chunk_

# Upload chunks separately
for chunk in chunk_*; do
    curl -X POST "http://localhost:8000/datasets/upload" -F "file=@$chunk"
done
```

**Format Issues:**
```bash
# Validate CSV
python -c "
import pandas as pd
df = pd.read_csv('your-file.csv', nrows=5)
print('Columns:', list(df.columns))
print('Shape:', df.shape)
print('Dtypes:', df.dtypes)
"
```

**Encoding Issues:**
```bash
# Check file encoding
file your-file.csv

# Convert to UTF-8
iconv -f latin1 -t utf8 your-file.csv > your-file-utf8.csv
```

### Data Processing Errors

#### Symptoms
- Profiling fails
- Type inference errors
- Memory errors during processing

#### Diagnosis
```bash
# Check data quality
python -c "
import pandas as pd
df = pd.read_csv('your-file.csv')
print('Missing values:')
print(df.isnull().sum())
print('Data types:')
print(df.dtypes)
print('Memory usage:')
print(df.memory_usage(deep=True).sum() / 1024 / 1024, 'MB')
"
```

#### Solutions

**Memory Issues:**
```bash
# Process in chunks
python -c "
import pandas as pd
chunk_size = 10000
for chunk in pd.read_csv('large-file.csv', chunksize=chunk_size):
    # Process chunk
    print(f'Processed {len(chunk)} rows')
"
```

**Type Inference Problems:**
```bash
# Explicit type conversion
python -c "
import pandas as pd
df = pd.read_csv('file.csv', dtype={
    'customer_id': str,
    'age': 'Int64',
    'income': float
})
print(df.dtypes)
"
```

## 🤖 Synthesis Issues

### Generation Fails

#### Symptoms
- "Training failed" errors
- Out of memory during generation
- Poor quality results

#### Diagnosis
```bash
# Check system resources
free -h
nvidia-smi  # If using GPU

# Test with small dataset
python -c "
import pandas as pd
from app.services.synthesis.ctgan_service import CTGANService

# Test with small sample
df = pd.DataFrame({
    'col1': [1, 2, 3, 4, 5],
    'col2': ['a', 'b', 'c', 'd', 'e']
})

service = CTGANService()
try:
    result = service.train(df)
    print('Training: OK')
except Exception as e:
    print(f'Training: FAILED - {e}')
"
```

#### Solutions

**Memory Issues:**
```bash
# Reduce batch size
curl -X POST "http://localhost:8000/generators/dataset/{id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "ctgan",
    "num_rows": 1000,
    "batch_size": 100
  }'
```

**GPU Issues:**
```bash
# Check GPU availability
python -c "import torch; print(torch.cuda.is_available())"

# Force CPU usage
export CUDA_VISIBLE_DEVICES=""

# Check GPU memory
nvidia-smi
```

**Quality Issues:**
```bash
# Increase training epochs
curl -X POST "http://localhost:8000/generators/dataset/{id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "ctgan",
    "num_rows": 1000,
    "epochs": 100,
    "batch_size": 200
  }'
```

### Differential Privacy Issues

#### Symptoms
- "Privacy budget exceeded" errors
- "Invalid epsilon" messages
- Poor utility with strong privacy

#### Diagnosis
```bash
# Validate DP configuration
curl -X POST "http://localhost:8000/generators/dp/validate-config" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "your-dataset",
    "target_epsilon": 5.0,
    "epochs": 50,
    "batch_size": 200
  }'
```

#### Solutions

**Configuration Issues:**
```json
{
  "solution": "Reduce epochs or increase batch size",
  "recommended_config": {
    "epochs": 25,
    "batch_size": 400,
    "target_epsilon": 5.0
  }
}
```

**Utility-Privacy Trade-off:**
```json
{
  "solution": "Balance privacy and utility",
  "options": [
    {
      "name": "High Privacy",
      "epsilon": 1.0,
      "utility": "70-80%",
      "use_case": "PHI, clinical data"
    },
    {
      "name": "Balanced",
      "epsilon": 5.0,
      "utility": "85-90%",
      "use_case": "General privacy needs"
    },
    {
      "name": "High Utility",
      "epsilon": 10.0,
      "utility": "90-95%",
      "use_case": "Non-sensitive data"
    }
  ]
}
```

## 📊 Evaluation Issues

### Statistical Tests Fail

#### Symptoms
- "Test failed" errors
- Unexpected statistical results
- Inconsistent metrics

#### Diagnosis
```bash
# Check evaluation data
curl http://localhost:8000/evaluations/{evaluation_id}

# Validate input data
python -c "
import pandas as pd
real = pd.read_csv('real-data.csv')
synth = pd.read_csv('synthetic-data.csv')
print('Real data shape:', real.shape)
print('Synthetic data shape:', synth.shape)
print('Column match:', list(real.columns) == list(synth.columns))
"
```

#### Solutions

**Data Mismatch:**
```bash
# Ensure datasets have same columns
python -c "
import pandas as pd
real = pd.read_csv('real.csv')
synth = pd.read_csv('synthetic.csv')

# Align columns
common_cols = set(real.columns) & set(synth.columns)
real_aligned = real[common_cols]
synth_aligned = synth[common_cols]

print('Aligned columns:', len(common_cols))
"
```

**Sample Size Issues:**
```bash
# Use appropriate sample sizes
curl -X POST "http://localhost:8000/evaluations/run" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_id": "gen-123",
    "dataset_id": "data-123",
    "evaluation_sample_size": 1000
  }'
```

### ML Utility Problems

#### Symptoms
- Low classification/regression scores
- Inconsistent results across runs

#### Diagnosis
```bash
# Check ML evaluation configuration
curl http://localhost:8000/evaluations/{evaluation_id}

# Test with simple model
python -c "
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pandas as pd

# Load data
df = pd.read_csv('data.csv')
X = df.drop('target', axis=1)
y = df['target']

# Simple test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = RandomForestClassifier(n_estimators=10)
model.fit(X_train, y_train)
pred = model.predict(X_test)
print('Accuracy:', accuracy_score(y_test, pred))
"
```

#### Solutions

**Model Configuration:**
```json
{
  "ml_utility_config": {
    "algorithms": ["random_forest", "xgboost"],
    "test_size": 0.2,
    "cross_validation_folds": 3,
    "random_state": 42
  }
}
```

**Data Quality Issues:**
```json
{
  "solutions": [
    "Check for data leakage between train/test sets",
    "Ensure sufficient sample size for reliable evaluation",
    "Validate that synthetic data preserves important patterns",
    "Consider domain-specific evaluation metrics"
  ]
}
```

## 🔐 Security Issues

### Authentication Problems

#### Symptoms
- "Invalid token" errors
- Login fails
- API access denied

#### Diagnosis
```bash
# Check token format
echo "your-jwt-token" | jq -R 'split(".") | .[0],.[1] | @base64d | fromjson'

# Validate token expiration
python -c "
import jwt
token = 'your-jwt-token'
try:
    payload = jwt.decode(token, options={'verify_signature': False})
    print('Token payload:', payload)
except Exception as e:
    print('Token error:', e)
"
```

#### Solutions

**Token Issues:**
```bash
# Refresh token
curl -X POST "http://localhost:8000/auth/refresh" \
  -H "Authorization: Bearer your-refresh-token"

# Re-login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

**Permission Issues:**
```bash
# Check user permissions
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer your-token"
```

### API Security Issues

#### Symptoms
- CORS errors
- Rate limiting
- Suspicious activity blocks

#### Diagnosis
```bash
# Check CORS configuration
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:8000/datasets/upload

# Check rate limits
curl -H "X-Forwarded-For: 1.2.3.4" \
     http://localhost:8000/datasets/ -v
```

#### Solutions

**CORS Issues:**
```bash
# Update ALLOWED_ORIGINS in .env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

**Rate Limiting:**
```bash
# Check rate limit headers
curl http://localhost:8000/datasets/ -I

# Wait for reset
sleep 60
```

## 🚀 Performance Issues

### Slow Response Times

#### Symptoms
- API calls take >5 seconds
- Generation takes >30 minutes
- UI becomes unresponsive

#### Diagnosis
```bash
# Profile API response time
curl -w "@curl-format.txt" -o /dev/null -s \
     "http://localhost:8000/datasets/"

# Check system load
uptime
top -b -n1 | head -20

# Database performance
python -c "
from app.database.database import engine
import time

start = time.time()
with engine.connect() as conn:
    result = conn.execute('SELECT COUNT(*) FROM generators')
    count = result.scalar()
end = time.time()

print(f'Query took {end-start:.3f}s, returned {count} rows')
"
```

#### Solutions

**Database Optimization:**
```sql
-- Add indexes
CREATE INDEX idx_generators_status ON generators(status);
CREATE INDEX idx_datasets_created_at ON datasets(created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM generators WHERE status = 'completed';
```

**API Optimization:**
```python
# Add caching
from functools import lru_cache

@lru_cache(maxsize=100)
def get_dataset_profile(dataset_id: str):
    # Cached function
    pass
```

**Background Job Tuning:**
```bash
# Monitor Celery
celery -A app.core.celery_app inspect active
celery -A app.core.celery_app inspect stats

# Scale workers
celery -A app.core.celery_app worker --concurrency=4 --pool=prefork
```

## 📋 Logging and Monitoring

### Enable Debug Logging

```bash
# Update environment
export LOG_LEVEL=DEBUG

# Restart server
uvicorn app.main:app --reload --log-level debug
```

### Log Analysis

```bash
# Search for errors
grep "ERROR" logs/app.log | tail -10

# Check for specific issues
grep "timeout" logs/app.log
grep "memory" logs/app.log

# Monitor API usage
grep "POST /datasets" logs/app.log | wc -l
```

### Performance Monitoring

```bash
# API response times
grep "completed in" logs/app.log | tail -20

# Database query times
grep "SELECT" logs/app.log | grep -E "[0-9]+\.[0-9]+s" | tail -10

# Memory usage
python -c "
import psutil
print(f'CPU: {psutil.cpu_percent()}%')
print(f'Memory: {psutil.virtual_memory().percent}%')
"
```

## 🆘 Getting Help

### Diagnostic Information

When reporting issues, include:

```bash
# System information
uname -a
python --version
pip list | grep -E "(fastapi|uvicorn|sqlmodel|pytorch)"

# Application logs
tail -50 logs/app.log

# Configuration (redact secrets)
grep -v "SECRET\|PASSWORD\|KEY" .env

# Database status
python -c "from app.database.database import engine; print('DB OK' if engine else 'DB FAIL')"
```

### Support Channels

1. **Documentation**: Check this troubleshooting guide
2. **GitHub Issues**: Search existing issues or create new ones
3. **Community**: Join discussions for peer support
4. **Professional Support**: Contact enterprise support for critical issues

### Issue Report Template

```
## Issue Summary
Brief description of the problem

## Environment
- OS: [e.g., Ubuntu 20.04]
- Python: [e.g., 3.9.7]
- Synthetic Data Studio: [e.g., v1.0.0]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Logs
```
2025-11-27 10:30:00,123 - ERROR - Detailed error message
```

## Additional Context
Any other relevant information
```

---

**Still having issues?** Check our [GitHub Issues](https://github.com/Urz1/synthetic-data-studio/issues) or create a new issue with the diagnostic information above.