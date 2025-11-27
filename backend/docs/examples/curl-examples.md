# cURL API Examples

This guide provides cURL command examples for interacting with the Synthetic Data Studio API from the command line.

## Authentication

### Login and Get Access Token

```bash
# Login to get access token
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

Store the access token for subsequent requests:

```bash
# Set access token as environment variable
export ACCESS_TOKEN="your_access_token_here"
```

## Dataset Management

### List All Datasets

```bash
curl -X GET "http://localhost:8000/datasets/" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Upload a Dataset

```bash
# Upload CSV file
curl -X POST "http://localhost:8000/datasets/upload" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@customer_data.csv" \
  -F "project_id=00000000-0000-0000-0000-000000000001"
```

```bash
# Upload JSON file
curl -X POST "http://localhost:8000/datasets/upload" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@transaction_data.json"
```

### Get Dataset Details

```bash
curl -X GET "http://localhost:8000/datasets/{dataset_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Replace `{dataset_id}` with the actual dataset ID.

### Download Dataset

```bash
curl -X GET "http://localhost:8000/datasets/{dataset_id}/download" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o downloaded_dataset.csv
```

### Profile Dataset

```bash
# Generate statistical profile
curl -X POST "http://localhost:8000/datasets/{dataset_id}/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

```bash
# Get existing profile
curl -X GET "http://localhost:8000/datasets/{dataset_id}/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Detect PII

```bash
# Basic PII detection
curl -X POST "http://localhost:8000/datasets/{dataset_id}/pii-detection" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

```bash
# Enhanced AI-powered PII detection
curl -X POST "http://localhost:8000/datasets/{dataset_id}/pii-detection-enhanced" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Delete Dataset

```bash
curl -X DELETE "http://localhost:8000/datasets/{dataset_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Synthetic Data Generation

### List Generators

```bash
curl -X GET "http://localhost:8000/generators/" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Create Generator

```bash
curl -X POST "http://localhost:8000/generators/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Data Generator",
    "description": "DP-CTGAN generator for customer data",
    "dataset_id": "your-dataset-id",
    "method": "CTGAN",
    "privacy_level": {
      "epsilon": 1.0,
      "delta": 0.00001
    },
    "configuration": {
      "epochs": 100,
      "batch_size": 500,
      "embedding_dim": 128
    }
  }'
```

### Get Generator Details

```bash
curl -X GET "http://localhost:8000/generators/{generator_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Generate Synthetic Data

```bash
curl -X POST "http://localhost:8000/generators/{generator_id}/generate" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Generate Model Card

```bash
curl -X POST "http://localhost:8000/generators/{generator_id}/model-card" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Generate Compliance Report

```bash
# GDPR Compliance Report
curl -X POST "http://localhost:8000/generators/{generator_id}/compliance-report?framework=GDPR" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# HIPAA Compliance Report
curl -X POST "http://localhost:8000/generators/{generator_id}/compliance-report?framework=HIPAA" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# CCPA Compliance Report
curl -X POST "http://localhost:8000/generators/{generator_id}/compliance-report?framework=CCPA" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Quality Evaluation

### Run Evaluation

```bash
curl -X POST "http://localhost:8000/evaluations/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "original_dataset_id": "original-dataset-id",
    "synthetic_dataset_id": "synthetic-dataset-id",
    "evaluation_types": ["statistical", "privacy", "utility"],
    "configuration": {
      "statistical_tests": {
        "ks_test": true,
        "chi_square": true,
        "wasserstein": true
      },
      "privacy_tests": {
        "membership_inference": true,
        "attribute_inference": true
      },
      "utility_tests": {
        "classification_utility": true,
        "regression_utility": true
      }
    }
  }'
```

### Get Evaluation Results

```bash
curl -X GET "http://localhost:8000/evaluations/{evaluation_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Explain Evaluation (AI)

```bash
curl -X POST "http://localhost:8000/evaluations/{evaluation_id}/explain" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Compare Evaluations

```bash
curl -X POST "http://localhost:8000/evaluations/compare" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    "evaluation-id-1",
    "evaluation-id-2",
    "evaluation-id-3"
  ]'
```

## AI-Powered Features

### Chat About Evaluation

```bash
curl -X POST "http://localhost:8000/llm/chat" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the overall quality of this synthetic data?",
    "evaluation_id": "your-evaluation-id",
    "history": []
  }'
```

### Get Improvement Suggestions

```bash
curl -X POST "http://localhost:8000/llm/suggest-improvements/{evaluation_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Explain Metric

```bash
curl -X GET "http://localhost:8000/llm/explain-metric?metric_name=ks_statistic&metric_value=0.087" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Complete Workflow Example

Here's a complete workflow using cURL commands:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:8000"
USERNAME="admin"
PASSWORD="password"

# 1. Login and get token
echo "Logging in..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
echo "Got access token: ${ACCESS_TOKEN:0:20}..."

# 2. Upload dataset
echo "Uploading dataset..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/datasets/upload" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@sample_data.csv")

DATASET_ID=$(echo $UPLOAD_RESPONSE | jq -r '.id')
echo "Uploaded dataset: $DATASET_ID"

# 3. Profile dataset
echo "Profiling dataset..."
curl -X POST "$BASE_URL/datasets/$DATASET_ID/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Create generator
echo "Creating generator..."
GENERATOR_RESPONSE=$(curl -s -X POST "$BASE_URL/generators/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Sample Generator\",
    \"description\": \"Generated via cURL\",
    \"dataset_id\": \"$DATASET_ID\",
    \"method\": \"CTGAN\",
    \"privacy_level\": {\"epsilon\": 1.0, \"delta\": 0.00001},
    \"configuration\": {\"epochs\": 50, \"batch_size\": 200}
  }")

GENERATOR_ID=$(echo $GENERATOR_RESPONSE | jq -r '.id')
echo "Created generator: $GENERATOR_ID"

# 5. Generate synthetic data
echo "Starting synthetic data generation..."
curl -X POST "$BASE_URL/generators/$GENERATOR_ID/generate" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 6. Wait for completion (simplified)
echo "Waiting for generation to complete..."
sleep 30

# 7. Check generator status
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/generators/$GENERATOR_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
SYNTHETIC_ID=$(echo $STATUS_RESPONSE | jq -r '.synthetic_dataset_id')

if [ "$STATUS" = "completed" ] && [ "$SYNTHETIC_ID" != "null" ]; then
  echo "Generation completed! Synthetic dataset: $SYNTHETIC_ID"

  # 8. Run evaluation
  echo "Running evaluation..."
  EVAL_RESPONSE=$(curl -s -X POST "$BASE_URL/evaluations/" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"original_dataset_id\": \"$DATASET_ID\",
      \"synthetic_dataset_id\": \"$SYNTHETIC_ID\",
      \"evaluation_types\": [\"statistical\", \"privacy\"]
    }")

  EVALUATION_ID=$(echo $EVAL_RESPONSE | jq -r '.id')
  echo "Started evaluation: $EVALUATION_ID"

  # 9. Get AI insights
  echo "Getting AI insights..."
  curl -X POST "$BASE_URL/evaluations/$EVALUATION_ID/explain" \
    -H "Authorization: Bearer $ACCESS_TOKEN"

else
  echo "Generation failed or still in progress. Status: $STATUS"
fi

echo "Workflow complete!"
```

## Error Handling

### Check Response Status

```bash
# Capture response and check status
RESPONSE=$(curl -s -w "%{http_code}" -X GET "http://localhost:8000/datasets/" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=${RESPONSE: -3}
BODY=${RESPONSE%???}

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "Success: $BODY"
else
  echo "Error $HTTP_CODE: $BODY"
fi
```

### Handle Authentication Errors

```bash
# Retry with token refresh
if [ "$HTTP_CODE" -eq 401 ]; then
  echo "Token expired, refreshing..."
  # Re-login logic here
fi
```

## Advanced Usage

### Batch Operations

```bash
# Process multiple datasets
for file in data/*.csv; do
  echo "Processing $file..."
  curl -X POST "http://localhost:8000/datasets/upload" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -F "file=@$file"
done
```

### Custom Headers and Timeouts

```bash
# With custom timeout and verbose output
curl -v --max-time 300 -X POST "http://localhost:8000/generators/{generator_id}/generate" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Custom-Header: value"
```

### Save Responses to Files

```bash
# Save evaluation results to JSON file
curl -X GET "http://localhost:8000/evaluations/{evaluation_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o evaluation_results.json

# Pretty print JSON
cat evaluation_results.json | jq '.'
```

### Monitor Job Progress

```bash
# Poll job status
while true; do
  STATUS=$(curl -s -X GET "http://localhost:8000/generators/{generator_id}" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.status')

  echo "Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    echo "Job completed!"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Job failed!"
    break
  fi

  sleep 10
done
```

## Environment Variables

Create a `.env` file for easy configuration:

```bash
# .env file
BASE_URL=http://localhost:8000
USERNAME=admin
PASSWORD=password
```

Then source it in your scripts:

```bash
source .env
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}"
```