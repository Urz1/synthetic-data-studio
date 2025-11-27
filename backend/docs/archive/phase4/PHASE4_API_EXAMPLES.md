# Phase 4: Evaluation API Examples

Quick reference for using the Phase 4 Evaluation Suite API endpoints.

## Prerequisites

```bash
# Start server
cd backend
python -m uvicorn app.main:app --reload

# Server running at: http://localhost:8000
```

## ⚠️ IMPORTANT: Complete Workflow First!

Before using evaluation endpoints, you need **TWO IDs**:

1. **`dataset_id`** - From uploading your dataset
2. **`generator_id`** - From training a generator (must be completed)

**See [WORKFLOW_GUIDE.md](../WORKFLOW_GUIDE.md) for step-by-step instructions!**

---

## Quick Start: Get Your IDs

### 1. Upload Dataset → Get `dataset_id`

```bash
# Simple upload (no project_id needed!)
curl -X POST "http://localhost:8000/datasets/upload" \
  -F "file=@mydata.csv"

# Response:
# {
#   "id": "ds_abc123",  ← This is your dataset_id
#   "name": "mydata.csv"
# }
```

### 2. Generate Synthetic Data → Get `generator_id`

```bash
# Flexible num_rows! (or omit to match original size)
curl -X POST "http://localhost:8000/datasets/ds_abc123/generate?generator_type=dp-ctgan&num_rows=5000&epochs=100"

# Response:
# {
#   "generator_id": "gen_xyz789",  ← This is your generator_id
#   "status": "training"
# }
```

### 3. Wait for Training

```bash
# Check status
curl "http://localhost:8000/generators/gen_xyz789"

# Wait until: "status": "completed"
```

### 4. Now You Can Evaluate!

```bash
curl -X POST "http://localhost:8000/evaluations/run" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_id": "gen_xyz789",
    "dataset_id": "ds_abc123",
    "target_column": "income",
    "include_statistical": true,
    "include_ml_utility": true,
    "include_privacy": true
  }'
```

## API Endpoints

### 1. Run Comprehensive Evaluation

Evaluate synthetic data across all three dimensions (statistical, ML utility, privacy).

**Endpoint**: `POST /evaluations/run`

**Example**:
```bash
curl -X POST "http://localhost:8000/evaluations/run" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_id": "gen_abc123",
    "dataset_id": "ds_xyz789",
    "target_column": "income",
    "sensitive_columns": ["ssn", "medical_record_id"],
    "include_statistical": true,
    "include_ml_utility": true,
    "include_privacy": true
  }'
```

**Response** (201 Created):
```json
{
  "evaluation_id": "eval_def456",
  "generator_id": "gen_abc123",
  "dataset_id": "ds_xyz789",
  "status": "completed",
  "report": {
    "report_id": "gen_abc123_quality_report",
    "generated_at": "2024-01-15T10:30:00Z",
    "dataset_info": {
      "real_rows": 10000,
      "synthetic_rows": 10000,
      "num_columns": 15
    },
    "evaluations": {
      "statistical_similarity": {
        "summary": {
          "total_tests": 15,
          "passed_tests": 14,
          "pass_rate": 93.3,
          "overall_quality": "Excellent"
        }
      },
      "ml_utility": {
        "summary": {
          "utility_ratio": 0.967,
          "quality_level": "Excellent"
        }
      },
      "privacy": {
        "summary": {
          "overall_privacy_level": "Good"
        }
      }
    },
    "overall_assessment": {
      "overall_score": 0.91,
      "overall_quality": "Excellent",
      "recommendations": [
        "Quality is satisfactory. No immediate improvements needed."
      ]
    }
  }
}
```

---

### 2. Quick Statistical Evaluation

Fast evaluation using only statistical tests (no ML or privacy tests).

**Endpoint**: `POST /evaluations/quick/{generator_id}`

**Example**:
```bash
curl -X POST "http://localhost:8000/evaluations/quick/gen_abc123"
```

**Response** (200 OK):
```json
{
  "report_id": "gen_abc123_summary",
  "generator_id": "gen_abc123",
  "generator_type": "dp-ctgan",
  "generated_at": "2024-01-15T10:30:00Z",
  "pass_rate": 93.3,
  "quality_level": "Excellent"
}
```

---

### 3. Get Evaluation Results

Retrieve a previously run evaluation.

**Endpoint**: `GET /evaluations/{evaluation_id}`

**Example**:
```bash
curl "http://localhost:8000/evaluations/eval_def456"
```

**Response** (200 OK):
```json
{
  "evaluation_id": "eval_def456",
  "generator_id": "gen_abc123",
  "dataset_id": "ds_xyz789",
  "status": "completed",
  "report": { ... }
}
```

---

### 4. List Generator Evaluations

Get all evaluations for a specific generator.

**Endpoint**: `GET /evaluations/generator/{generator_id}`

**Example**:
```bash
curl "http://localhost:8000/evaluations/generator/gen_abc123"
```

**Response** (200 OK):
```json
[
  {
    "evaluation_id": "eval_001",
    "generator_id": "gen_abc123",
    "dataset_id": "ds_xyz789",
    "status": "completed",
    "report": { ... }
  },
  {
    "evaluation_id": "eval_002",
    "generator_id": "gen_abc123",
    "dataset_id": "ds_xyz789",
    "status": "completed",
    "report": { ... }
  }
]
```

---

## Python Examples

### Example 1: Full Evaluation Workflow

```python
import requests

BASE_URL = "http://localhost:8000"

# Step 1: Upload dataset
with open('patient_data.csv', 'rb') as f:
    response = requests.post(
        f"{BASE_URL}/datasets/upload",
        files={"file": f}
    )
dataset_id = response.json()['id']
print(f"Dataset uploaded: {dataset_id}")

# Step 2: Train DP-CTGAN
response = requests.post(
    f"{BASE_URL}/generators/train",
    json={
        "dataset_id": dataset_id,
        "generator_type": "dp-ctgan",
        "parameters": {
            "epsilon": 10.0,
            "epochs": 100,
            "batch_size": 500
        }
    }
)
generator_id = response.json()['id']
print(f"Training started: {generator_id}")

# Wait for training to complete...
import time
while True:
    response = requests.get(f"{BASE_URL}/generators/{generator_id}")
    status = response.json()['status']
    if status == 'completed':
        break
    print(f"Status: {status}")
    time.sleep(10)

# Step 3: Run comprehensive evaluation
response = requests.post(
    f"{BASE_URL}/evaluations/run",
    json={
        "generator_id": generator_id,
        "dataset_id": dataset_id,
        "target_column": "diagnosis",
        "sensitive_columns": ["patient_id", "ssn"],
        "include_statistical": True,
        "include_ml_utility": True,
        "include_privacy": True
    }
)

evaluation = response.json()
print("\n=== Evaluation Results ===")
print(f"Overall Quality: {evaluation['report']['overall_assessment']['overall_quality']}")
print(f"Overall Score: {evaluation['report']['overall_assessment']['overall_score']:.2%}")

# Statistical similarity
stat = evaluation['report']['evaluations']['statistical_similarity']['summary']
print(f"\nStatistical Tests:")
print(f"  Pass Rate: {stat['pass_rate']:.1f}%")
print(f"  Quality: {stat['overall_quality']}")

# ML utility
ml = evaluation['report']['evaluations']['ml_utility']['summary']
print(f"\nML Utility:")
print(f"  Utility Ratio: {ml['utility_ratio']:.1%}")
print(f"  Quality: {ml['quality_level']}")

# Privacy
privacy = evaluation['report']['evaluations']['privacy']['summary']
print(f"\nPrivacy:")
print(f"  Privacy Level: {privacy['overall_privacy_level']}")

# Recommendations
print(f"\n=== Recommendations ===")
for rec in evaluation['report']['overall_assessment']['recommendations']:
    print(f"  - {rec}")
```

---

### Example 2: Quick Check After Training

```python
import requests

BASE_URL = "http://localhost:8000"
generator_id = "gen_abc123"

# Quick statistical check
response = requests.post(f"{BASE_URL}/evaluations/quick/{generator_id}")
result = response.json()

print(f"Pass Rate: {result['pass_rate']:.1f}%")
print(f"Quality: {result['quality_level']}")

if result['quality_level'] in ['Excellent', 'Good']:
    print("✓ Quality is satisfactory. Proceed with full evaluation.")
else:
    print("⚠ Quality issues detected. Consider retraining.")
```

---

### Example 3: Compare Multiple Generators

```python
import requests
import pandas as pd

BASE_URL = "http://localhost:8000"

generators = {
    "CTGAN": "gen_ctgan_001",
    "DP-CTGAN (ε=10)": "gen_dp_ctgan_10",
    "DP-CTGAN (ε=5)": "gen_dp_ctgan_5",
    "TVAE": "gen_tvae_001"
}

dataset_id = "ds_test_123"

results = []

for name, gen_id in generators.items():
    print(f"Evaluating {name}...")
    
    response = requests.post(
        f"{BASE_URL}/evaluations/run",
        json={
            "generator_id": gen_id,
            "dataset_id": dataset_id,
            "target_column": "target",
            "include_statistical": True,
            "include_ml_utility": True,
            "include_privacy": True
        }
    )
    
    report = response.json()['report']
    
    results.append({
        "Generator": name,
        "Overall Score": report['overall_assessment']['overall_score'],
        "Overall Quality": report['overall_assessment']['overall_quality'],
        "Statistical (%)": report['evaluations']['statistical_similarity']['summary']['pass_rate'],
        "ML Utility (%)": report['evaluations']['ml_utility']['summary']['utility_ratio'] * 100,
        "Privacy": report['evaluations']['privacy']['summary']['overall_privacy_level']
    })

# Display comparison table
df = pd.DataFrame(results)
print("\n=== Generator Comparison ===")
print(df.to_string(index=False))

# Find best generator
best = df.loc[df['Overall Score'].idxmax()]
print(f"\n✓ Best generator: {best['Generator']}")
print(f"  Score: {best['Overall Score']:.3f}")
print(f"  Quality: {best['Overall Quality']}")
```

**Example Output**:
```
=== Generator Comparison ===
          Generator  Overall Score Overall Quality  Statistical (%)  ML Utility (%)  Privacy
             CTGAN          0.889            Good             93.3            96.7     Fair
 DP-CTGAN (ε=10)          0.912       Excellent             93.3            95.2     Good
  DP-CTGAN (ε=5)          0.875            Good             86.7            91.8     Good
              TVAE          0.856            Good             86.7            93.4     Fair

✓ Best generator: DP-CTGAN (ε=10)
  Score: 0.912
  Quality: Excellent
```

---

## Error Handling

### Common Errors

**404 Not Found**:
```json
{
  "detail": "Generator gen_abc123 not found"
}
```
**Solution**: Verify generator ID exists.

---

**400 Bad Request**:
```json
{
  "detail": "Generator status is training. Must be 'completed' to evaluate."
}
```
**Solution**: Wait for training to complete before evaluating.

---

**400 Bad Request**:
```json
{
  "detail": "Generator has no synthetic data output"
}
```
**Solution**: Ensure generator has successfully generated synthetic data.

---

**500 Internal Server Error**:
```json
{
  "detail": "Evaluation failed: Target column 'income' not found"
}
```
**Solution**: Check that target_column exists in dataset.

---

## Best Practices

1. **Always run quick evaluation first** for fast feedback
2. **Run full evaluation** before deploying to production
3. **Compare multiple generators** to find best configuration
4. **Check privacy level** for sensitive data use cases
5. **Review recommendations** in overall_assessment

---

## Next Steps

- **Phase 5**: Compliance system (model cards, audit logs)
- **Phase 6**: Production deployment (Celery workers, PostgreSQL)

---

**Documentation**: See [PHASE4_SUMMARY.md](PHASE4_SUMMARY.md) for detailed technical documentation.
