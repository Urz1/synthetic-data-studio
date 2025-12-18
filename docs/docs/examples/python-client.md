---
id: examples-python-client-examples
title: "Python API Client Examples"
sidebar_label: "Python API Client Examples"
sidebar_position: 3
slug: /examples/python-client-examples
tags: [examples, python]
---
# Python API Client Examples

This guide provides Python code examples for interacting with the Synthetic Data Studio API programmatically.

## Setup

First, install the required dependencies:

```bash
pip install requests pandas
```

## Authentication

```python
import requests

BASE_URL = "http://localhost:8000"

def login(username: str, password: str) -> str:
    """Authenticate and get access token."""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"username": username, "password": password}
    )
    response.raise_for_status()
    return response.json()["access_token"]

# Get access token
access_token = login("admin", "password")
headers = {"Authorization": f"Bearer {access_token}"}
```

## Dataset Management

### Upload a Dataset

```python
import pandas as pd
from io import StringIO

def upload_dataset(file_path: str, project_id: str = None) -> dict:
    """Upload a CSV or JSON file as a dataset."""
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'project_id': project_id} if project_id else {}

        response = requests.post(
            f"{BASE_URL}/datasets/upload",
            files=files,
            data=data,
            headers=headers
        )
        response.raise_for_status()
        return response.json()

# Upload a CSV file
dataset = upload_dataset("customer_data.csv")
dataset_id = dataset["id"]
print(f"Uploaded dataset: {dataset_id}")
```

### List Datasets

```python
def list_datasets() -> list:
    """Get all datasets for the current user."""
    response = requests.get(f"{BASE_URL}/datasets/", headers=headers)
    response.raise_for_status()
    return response.json()

datasets = list_datasets()
for dataset in datasets:
    print(f"Dataset: {dataset['name']} (ID: {dataset['id']})")
```

### Profile Dataset

```python
def profile_dataset(dataset_id: str) -> dict:
    """Generate statistical profile for a dataset."""
    response = requests.post(
        f"{BASE_URL}/datasets/{dataset_id}/profile",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

profile = profile_dataset(dataset_id)
print("Dataset Profile:")
print(f"- Rows: {profile['row_count']}")
print(f"- Columns: {profile['column_count']}")
print(f"- Columns: {list(profile['columns'].keys())}")
```

### Detect PII

```python
def detect_pii(dataset_id: str) -> dict:
    """Detect personally identifiable information."""
    response = requests.post(
        f"{BASE_URL}/datasets/{dataset_id}/pii-detection",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

pii_results = detect_pii(dataset_id)
print("PII Detection Results:")
for column, result in pii_results["columns"].items():
    if result["pii_detected"]:
        print(f"- {column}: {result['pii_types']} (confidence: {result['confidence']:.2f})")
```

## Synthetic Data Generation

### Create a Generator

```python
def create_generator(dataset_id: str, name: str, method: str = "CTGAN",
                    epsilon: float = 1.0) -> dict:
    """Create a synthetic data generator."""
    generator_config = {
        "name": name,
        "description": f"Generator for dataset {dataset_id}",
        "dataset_id": dataset_id,
        "method": method,
        "privacy_level": {
            "epsilon": epsilon,
            "delta": 1e-5
        },
        "configuration": {
            "epochs": 100,
            "batch_size": 500
        }
    }

    response = requests.post(
        f"{BASE_URL}/generators/",
        json=generator_config,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

generator = create_generator(dataset_id, "My Generator", "CTGAN", 0.5)
generator_id = generator["id"]
print(f"Created generator: {generator_id}")
```

### Generate Synthetic Data

```python
def generate_synthetic_data(generator_id: str) -> dict:
    """Start synthetic data generation job."""
    response = requests.post(
        f"{BASE_URL}/generators/{generator_id}/generate",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

job = generate_synthetic_data(generator_id)
job_id = job["job_id"]
print(f"Started generation job: {job_id}")
```

### Check Generation Status

```python
def get_generator_status(generator_id: str) -> dict:
    """Get generator status and results."""
    response = requests.get(
        f"{BASE_URL}/generators/{generator_id}",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

import time

while True:
    status = get_generator_status(generator_id)
    print(f"Status: {status['status']}")

    if status["status"] == "completed":
        synthetic_dataset_id = status["synthetic_dataset_id"]
        print(f"Synthetic data ready: {synthetic_dataset_id}")
        break
    elif status["status"] == "failed":
        print(f"Generation failed: {status.get('error', 'Unknown error')}")
        break

    time.sleep(5)  # Wait 5 seconds before checking again
```

## Quality Evaluation

### Run Evaluation

```python
def run_evaluation(original_dataset_id: str, synthetic_dataset_id: str) -> dict:
    """Run comprehensive quality evaluation."""
    evaluation_config = {
        "original_dataset_id": original_dataset_id,
        "synthetic_dataset_id": synthetic_dataset_id,
        "evaluation_types": ["statistical", "privacy", "utility"],
        "configuration": {
            "privacy_tests": {
                "membership_inference": True,
                "attribute_inference": True
            }
        }
    }

    response = requests.post(
        f"{BASE_URL}/evaluations/",
        json=evaluation_config,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

evaluation = run_evaluation(dataset_id, synthetic_dataset_id)
evaluation_id = evaluation["id"]
print(f"Started evaluation: {evaluation_id}")
```

### Get Evaluation Results

```python
def get_evaluation_results(evaluation_id: str) -> dict:
    """Get detailed evaluation results."""
    response = requests.get(
        f"{BASE_URL}/evaluations/{evaluation_id}",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

results = get_evaluation_results(evaluation_id)
print("Evaluation Results:")
print(f"- Overall Quality: {results['overall_quality']:.2f}")
print(f"- Statistical Similarity: {results['statistical_similarity']:.2f}")
print(f"- Privacy Risk: {results['privacy_risk']:.2f}")
```

## AI-Powered Features

### Chat About Evaluation

```python
def chat_about_evaluation(evaluation_id: str, message: str, history: list = None) -> dict:
    """Interactive chat about evaluation results."""
    if history is None:
        history = []

    chat_request = {
        "message": message,
        "evaluation_id": evaluation_id,
        "history": history
    }

    response = requests.post(
        f"{BASE_URL}/llm/chat",
        json=chat_request,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Ask about evaluation quality
chat_response = chat_about_evaluation(
    evaluation_id,
    "What's the overall quality of this synthetic data?"
)
print(f"AI Response: {chat_response['response']}")
```

### Get Improvement Suggestions

```python
def get_improvement_suggestions(evaluation_id: str) -> dict:
    """Get AI-powered improvement suggestions."""
    response = requests.post(
        f"{BASE_URL}/llm/suggest-improvements/{evaluation_id}",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

suggestions = get_improvement_suggestions(evaluation_id)
print("Improvement Suggestions:")
for i, suggestion in enumerate(suggestions["suggestions"], 1):
    print(f"{i}. {suggestion}")
```

## Complete Workflow Example

```python
import requests
import time

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "admin"
PASSWORD = "password"

def main():
    # Authenticate
    access_token = login(USERNAME, PASSWORD)
    headers = {"Authorization": f"Bearer {access_token}"}

    # Upload original dataset
    print("Uploading dataset...")
    dataset = upload_dataset("original_data.csv")
    dataset_id = dataset["id"]

    # Profile the dataset
    print("Profiling dataset...")
    profile = profile_dataset(dataset_id)

    # Create generator
    print("Creating generator...")
    generator = create_generator(dataset_id, "My Generator", epsilon=0.5)
    generator_id = generator["id"]

    # Generate synthetic data
    print("Generating synthetic data...")
    job = generate_synthetic_data(generator_id)

    # Wait for completion
    while True:
        status = get_generator_status(generator_id)
        print(f"Status: {status['status']}")

        if status["status"] == "completed":
            synthetic_dataset_id = status["synthetic_dataset_id"]
            break
        elif status["status"] == "failed":
            raise Exception(f"Generation failed: {status.get('error')}")

        time.sleep(10)

    # Run evaluation
    print("Running evaluation...")
    evaluation = run_evaluation(dataset_id, synthetic_dataset_id)
    evaluation_id = evaluation["id"]

    # Wait for evaluation to complete
    while True:
        results = get_evaluation_results(evaluation_id)
        if results.get("status") == "completed":
            break
        time.sleep(5)

    # Print results
    print("
Evaluation Results:")
    print(f"Overall Quality: {results['overall_quality']:.2f}")
    print(f"Statistical Similarity: {results['statistical_similarity']:.2f}")

    # Get AI insights
    chat = chat_about_evaluation(evaluation_id, "How can I improve the quality?")
    print(f"\nAI Suggestion: {chat['response']}")

if __name__ == "__main__":
    main()
```

## Error Handling

```python
def handle_api_errors(func):
    """Decorator for consistent error handling."""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error: {e.response.status_code} - {e.response.text}")
            raise
        except requests.exceptions.RequestException as e:
            print(f"Request Error: {e}")
            raise
    return wrapper

@handle_api_errors
def safe_api_call():
    # Your API call here
    pass
```

## Advanced Usage

### Batch Processing

```python
def process_multiple_datasets(file_paths: list) -> list:
    """Process multiple datasets in batch."""
    results = []

    for file_path in file_paths:
        try:
            # Upload
            dataset = upload_dataset(file_path)

            # Profile
            profile_dataset(dataset["id"])

            # Create generator
            generator = create_generator(dataset["id"], f"Generator for {file_path}")

            results.append({
                "file": file_path,
                "dataset_id": dataset["id"],
                "generator_id": generator["id"],
                "status": "ready"
            })

        except Exception as e:
            results.append({
                "file": file_path,
                "error": str(e),
                "status": "failed"
            })

    return results
```

### Custom Evaluation Configuration

```python
def run_custom_evaluation(original_id: str, synthetic_id: str,
                         custom_config: dict) -> dict:
    """Run evaluation with custom configuration."""
    config = {
        "original_dataset_id": original_id,
        "synthetic_dataset_id": synthetic_id,
        "evaluation_types": ["statistical", "privacy", "utility"],
        "configuration": {
            "statistical_tests": {
                "ks_test": True,
                "chi_square": True,
                "wasserstein": True
            },
            "privacy_tests": {
                "membership_inference": True,
                "attribute_inference": True,
                "closest_distance": True
            },
            "utility_tests": {
                "classification_utility": True,
                "regression_utility": True
            },
            **custom_config
        }
    }

    response = requests.post(
        f"{BASE_URL}/evaluations/",
        json=config,
        headers=headers
    )
    response.raise_for_status()
    return response.json()
```

