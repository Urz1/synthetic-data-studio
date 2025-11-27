# API Integration Guide

Complete guide for integrating third-party applications with Synthetic Data Studio's REST API, including authentication, error handling, and best practices.

## 🔐 Authentication

### JWT Token Authentication

All API requests require authentication using JWT tokens.

#### Obtaining Access Tokens

```bash
# Register a new user
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-user@example.com",
    "password": "secure-password"
  }'

# Login to get tokens
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-user@example.com",
    "password": "secure-password"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### Using Tokens in Requests

```bash
# Include token in Authorization header
curl -X GET "http://localhost:8000/datasets/" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Management

#### Token Expiration
- Access tokens expire in 30 minutes by default
- Implement automatic token refresh for long-running integrations

#### Refresh Tokens (Optional)
```bash
# Use refresh token to get new access token
curl -X POST "http://localhost:8000/auth/refresh" \
  -H "Authorization: Bearer refresh_token_here"
```

### Authentication Errors

```json
{
  "detail": "Not authenticated",
  "type": "authentication_error",
  "status_code": 401
}
```

```json
{
  "detail": "Token has expired",
  "type": "token_expired",
  "status_code": 401
}
```

## 📡 Client Libraries

### Python Client

#### Installation
```bash
pip install requests pydantic
```

#### Basic Usage
```python
import requests
from typing import Optional, Dict, Any

class SynthStudioClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token: Optional[str] = None

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate and store access token."""
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        return data

    def _headers(self) -> Dict[str, str]:
        """Get headers with authentication."""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def upload_dataset(self, file_path: str) -> Dict[str, Any]:
        """Upload a dataset file."""
        with open(file_path, "rb") as f:
            response = requests.post(
                f"{self.base_url}/datasets/upload",
                files={"file": f},
                headers={"Authorization": f"Bearer {self.token}"}
            )
        response.raise_for_status()
        return response.json()

    def generate_synthetic_data(
        self,
        dataset_id: str,
        generator_type: str = "ctgan",
        num_rows: int = 1000
    ) -> Dict[str, Any]:
        """Generate synthetic data."""
        response = requests.post(
            f"{self.base_url}/generators/dataset/{dataset_id}/generate",
            json={
                "generator_type": generator_type,
                "num_rows": num_rows
            },
            headers=self._headers()
        )
        response.raise_for_status()
        return response.json()

# Usage example
client = SynthStudioClient()
client.login("user@example.com", "password")

# Upload dataset
dataset = client.upload_dataset("data.csv")
dataset_id = dataset["id"]

# Generate synthetic data
result = client.generate_synthetic_data(dataset_id, "dp-ctgan", 500)
print(f"Generation started: {result}")
```

### JavaScript/Node.js Client

#### Installation
```bash
npm install axios
```

#### Basic Usage
```javascript
const axios = require('axios');

class SynthStudioClient {
    constructor(baseURL = 'http://localhost:8000') {
        this.client = axios.create({ baseURL });
        this.token = null;
    }

    async login(email, password) {
        const response = await this.client.post('/auth/login', {
            email,
            password
        });
        this.token = response.data.access_token;
        this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        return response.data;
    }

    async uploadDataset(filePath) {
        const FormData = require('form-data');
        const fs = require('fs');

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const response = await this.client.post('/datasets/upload', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${this.token}`
            }
        });
        return response.data;
    }

    async generateSyntheticData(datasetId, options = {}) {
        const defaultOptions = {
            generator_type: 'ctgan',
            num_rows: 1000,
            ...options
        };

        const response = await this.client.post(
            `/generators/dataset/${datasetId}/generate`,
            defaultOptions
        );
        return response.data;
    }

    async getEvaluation(evaluationId) {
        const response = await this.client.get(`/evaluations/${evaluationId}`);
        return response.data;
    }
}

// Usage
const client = new SynthStudioClient();
await client.login('user@example.com', 'password');

const dataset = await client.uploadDataset('data.csv');
const result = await client.generateSyntheticData(dataset.id, {
    generator_type: 'dp-ctgan',
    num_rows: 500
});
```

## 🔄 Asynchronous Operations

### Background Job Handling

Many operations (data generation, evaluation) run asynchronously.

#### Polling for Completion
```python
import time

def wait_for_completion(client, generator_id, timeout=300):
    """Wait for generation to complete."""
    start_time = time.time()

    while time.time() - start_time < timeout:
        response = client.get(f"/generators/{generator_id}")
        status = response.json()["status"]

        if status == "completed":
            return response.json()
        elif status == "failed":
            raise Exception("Generation failed")

        time.sleep(5)  # Wait 5 seconds

    raise TimeoutError("Operation timed out")

# Usage
result = wait_for_completion(client, generator_id)
```

#### Webhook Notifications (Future Feature)
```python
# Configure webhook endpoint
webhook_config = {
    "url": "https://your-app.com/webhooks/synth-studio",
    "events": ["generation.completed", "evaluation.completed"],
    "secret": "your-webhook-secret"
}

# Register webhook (when implemented)
client.post("/webhooks/register", json=webhook_config)
```

## 📊 Data Synchronization

### Batch Operations

#### Bulk Dataset Upload
```python
def upload_multiple_datasets(client, file_paths):
    """Upload multiple datasets."""
    results = []
    for file_path in file_paths:
        try:
            result = client.upload_dataset(file_path)
            results.append({"file": file_path, "success": True, "data": result})
        except Exception as e:
            results.append({"file": file_path, "success": False, "error": str(e)})
    return results

# Usage
files = ["dataset1.csv", "dataset2.csv", "dataset3.csv"]
results = upload_multiple_datasets(client, files)
```

#### Batch Evaluation
```python
def evaluate_multiple_generators(client, generator_ids):
    """Run evaluations for multiple generators."""
    evaluations = []
    for gen_id in generator_ids:
        try:
            # Start evaluation
            eval_result = client.post("/evaluations/run", json={
                "generator_id": gen_id,
                "dataset_id": "original-dataset-id"
            })

            evaluations.append({
                "generator_id": gen_id,
                "evaluation_id": eval_result["evaluation_id"],
                "status": "started"
            })
        except Exception as e:
            evaluations.append({
                "generator_id": gen_id,
                "error": str(e)
            })
    return evaluations
```

### Incremental Sync

#### Change Detection
```python
def get_dataset_changes(client, last_sync_timestamp):
    """Get datasets modified since last sync."""
    response = client.get("/datasets/", params={
        "modified_after": last_sync_timestamp.isoformat(),
        "limit": 100
    })
    return response.json()

def sync_datasets(client, last_sync):
    """Synchronize datasets with local system."""
    changes = get_dataset_changes(client, last_sync)

    for dataset in changes:
        # Process each changed dataset
        local_copy = download_dataset(client, dataset["id"])
        update_local_record(dataset)

    return len(changes)
```

## 🛡️ Error Handling

### HTTP Status Codes

| Status Code | Meaning | Action |
|-------------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Refresh token or re-authenticate |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify resource exists |
| 422 | Validation Error | Check data format |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Server Error | Retry with exponential backoff |

### Error Response Format

```json
{
  "detail": "Dataset not found",
  "type": "resource_not_found",
  "status_code": 404,
  "timestamp": "2025-11-27T10:30:00Z"
}
```

```json
{
  "detail": "Validation failed",
  "type": "validation_error",
  "status_code": 422,
  "errors": [
    {
      "field": "num_rows",
      "message": "Must be between 100 and 100000",
      "code": "range_error"
    }
  ]
}
```

### Retry Logic

```python
import time
import random

def retry_request(func, max_retries=3, backoff_factor=2):
    """Retry API requests with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return func()
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise e

            # Exponential backoff with jitter
            delay = backoff_factor ** attempt + random.uniform(0, 1)
            time.sleep(delay)

# Usage
result = retry_request(lambda: client.get("/datasets/"))
```

## 🔄 Rate Limiting

### Understanding Limits

- **Authenticated requests**: 1000 per minute
- **File uploads**: 10 per minute
- **Data generation**: 5 concurrent jobs
- **API calls**: 5000 per hour

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1638360000
X-RateLimit-Retry-After: 60
```

### Handling Rate Limits

```python
def handle_rate_limit(response):
    """Handle rate limit responses."""
    if response.status_code == 429:
        retry_after = int(response.headers.get("X-RateLimit-Retry-After", 60))
        print(f"Rate limited. Retry after {retry_after} seconds.")
        time.sleep(retry_after)
        return True
    return False

# Usage in client
def make_request_with_retry(self, method, url, **kwargs):
    while True:
        response = requests.request(method, url, **kwargs)
        if not handle_rate_limit(response):
            return response
```

## 📊 Monitoring Integration

### Health Checks

```python
def check_api_health(base_url):
    """Check API availability."""
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        return {
            "available": response.status_code == 200,
            "response_time": response.elapsed.total_seconds(),
            "status": response.json().get("status")
        }
    except Exception as e:
        return {
            "available": False,
            "error": str(e)
        }

# Usage
health = check_api_health("http://localhost:8000")
if not health["available"]:
    print(f"API unavailable: {health['error']}")
```

### Metrics Collection

```python
class APIMetrics:
    def __init__(self):
        self.requests_total = 0
        self.requests_failed = 0
        self.response_times = []

    def record_request(self, response_time, success=True):
        self.requests_total += 1
        if not success:
            self.requests_failed += 1
        self.response_times.append(response_time)

    def get_metrics(self):
        return {
            "total_requests": self.requests_total,
            "success_rate": (self.requests_total - self.requests_failed) / max(self.requests_total, 1),
            "avg_response_time": sum(self.response_times) / max(len(self.response_times), 1),
            "error_rate": self.requests_failed / max(self.requests_total, 1)
        }

# Usage
metrics = APIMetrics()

# In your client methods
start_time = time.time()
response = requests.get(url)
response_time = time.time() - start_time

metrics.record_request(response_time, response.status_code < 400)
```

## 🔧 Advanced Integration Patterns

### Streaming Large Datasets

```python
def download_large_dataset(client, dataset_id, chunk_size=8192):
    """Download large datasets in chunks."""
    response = client.get(f"/datasets/{dataset_id}/download", stream=True)
    response.raise_for_status()

    with open(f"dataset_{dataset_id}.csv", "wb") as f:
        for chunk in response.iter_content(chunk_size=chunk_size):
            if chunk:
                f.write(chunk)

    return f"dataset_{dataset_id}.csv"
```

### Real-time Progress Monitoring

```python
import asyncio
import websockets

async def monitor_generation_progress(generator_id):
    """Monitor generation progress in real-time."""
    uri = "ws://localhost:8000/ws/generation/{generator_id}"

    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            data = json.loads(message)

            print(f"Progress: {data['progress']}% - {data['status']}")

            if data["status"] in ["completed", "failed"]:
                break

# Usage
asyncio.run(monitor_generation_progress("gen-123"))
```

### Service Mesh Integration

#### Istio Integration
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: synth-studio-api
spec:
  http:
  - match:
    - uri:
        prefix: "/api"
    route:
    - destination:
        host: synth-studio
    timeout: 300s  # For long-running generations
    retries:
      attempts: 3
      perTryTimeout: 60s
```

## 🏢 Enterprise Integration

### SSO Integration

#### SAML 2.0 (Future)
```python
# SAML authentication flow
def saml_login(saml_response):
    """Process SAML authentication."""
    # Validate SAML response
    # Extract user information
    # Create/update user account
    # Generate JWT token
    pass
```

#### OAuth 2.0
```python
def oauth_callback(code, state):
    """Handle OAuth callback."""
    # Exchange code for tokens
    # Get user info from provider
    # Create/update user account
    # Generate JWT token
    pass
```

### Audit Logging

```python
def log_api_activity(user_id, action, resource, details):
    """Log API activities for compliance."""
    audit_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "action": action,
        "resource": resource,
        "details": details,
        "ip_address": get_client_ip(),
        "user_agent": get_user_agent()
    }

    # Send to audit system
    send_to_audit_system(audit_entry)

# Usage in API endpoints
@app.middleware("http")
async def audit_middleware(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    log_api_activity(
        user_id=get_current_user_id(request),
        action=f"{request.method} {request.url.path}",
        resource=request.url.path,
        details={
            "status_code": response.status_code,
            "duration": duration,
            "user_agent": request.headers.get("user-agent")
        }
    )

    return response
```

## 📚 SDKs and Libraries

### Official SDKs (Planned)

- **Python SDK**: `pip install synth-studio-sdk`
- **JavaScript SDK**: `npm install synth-studio-sdk`
- **Go SDK**: `go get github.com/synth-studio/sdk-go`

### Community Libraries

- **R Integration**: `install.packages("synthstudio")`
- **Java SDK**: Maven/Gradle dependency
- **.NET SDK**: NuGet package

## 🔍 Troubleshooting Integration Issues

### Common Problems

**Connection Timeouts**
```
Cause: Large datasets, slow networks
Solution: Increase timeout, use streaming, compress data
```

**Authentication Failures**
```
Cause: Expired tokens, clock skew
Solution: Implement token refresh, synchronize clocks
```

**Rate Limit Exceeded**
```
Cause: Too many requests
Solution: Implement queuing, exponential backoff
```

**Data Format Issues**
```
Cause: Incompatible file formats
Solution: Validate formats before upload, use conversion tools
```

### Debug Mode

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Add request/response logging
import httpx
httpx_logger = logging.getLogger("httpx")
httpx_logger.setLevel(logging.DEBUG)
```

### Integration Testing

```python
def test_integration():
    """Test full integration workflow."""
    client = SynthStudioClient()

    # Test authentication
    assert client.login("test@example.com", "password")

    # Test dataset upload
    dataset = client.upload_dataset("test_data.csv")
    assert "id" in dataset

    # Test generation
    result = client.generate_synthetic_data(dataset["id"])
    assert "generator_id" in result

    # Test evaluation
    evaluation = client.evaluate_generator(result["generator_id"])
    assert evaluation["status"] == "completed"

    print("✅ All integration tests passed")

# Run tests
test_integration()
```

## 📞 Support and Resources

### Getting Help

- **API Documentation**: http://localhost:8000/docs
- **Interactive Testing**: http://localhost:8000/docs (Try it out buttons)
- **Postman Collection**: Download from `/docs/postman-collection.json`
- **GitHub Issues**: Report bugs and request features

### Example Applications

- **[Basic Integration](https://github.com/synth-studio/examples/tree/main/basic-integration)**
- **[Enterprise Integration](https://github.com/synth-studio/examples/tree/main/enterprise-integration)**
- **[Real-time Dashboard](https://github.com/synth-studio/examples/tree/main/dashboard-integration)**

### Webinars and Tutorials

- **API Integration Basics**: Step-by-step video tutorial
- **Advanced Patterns**: Webhooks, streaming, batch operations
- **Enterprise Integration**: SSO, audit logging, monitoring

---

**Ready to integrate?** Start with our [Quick Start Tutorial](../getting-started/quick-start.md) and explore the API documentation at http://localhost:8000/docs.