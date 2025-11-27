# Complete Workflow Guide: Upload → Generate → Evaluate

## Problem Summary

You identified 3 key issues:
1. **Confusion about evaluation IDs** - Where do generator_id and dataset_id come from?
2. **Dataset upload requires project_id** - Seems unnecessary
3. **Fixed num_rows=1000** - Too restrictive, should be flexible

---

## Issue 1: Complete Workflow with ID Tracking

### Step-by-Step Workflow

#### Step 1: Upload Dataset (Get `dataset_id`)

**Current Issue**: Requires `project_id` which is confusing

**Endpoint**: `POST /datasets/upload`

**Request**:
```bash
curl -X POST "http://localhost:8000/datasets/upload?project_id=default-project" \
  -F "file=@patient_data.csv"
```

**Response**:
```json
{
  "id": "ds_abc123",  ← Save this dataset_id!
  "name": "patient_data.csv",
  "file_path": "uploads/patient_data.csv",
  "status": "uploaded"
}
```

**💡 Save the `id` field - this is your `dataset_id`**

---

#### Step 2: Generate Synthetic Data (Get `generator_id`)

**Current Issue**: num_rows hardcoded to 1000

**Endpoint**: `POST /datasets/{dataset_id}/generate`

**Request**:
```bash
curl -X POST "http://localhost:8000/datasets/ds_abc123/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-ctgan",
    "num_rows": 5000,  ← Now flexible!
    "epochs": 100,
    "batch_size": 500,
    "parameters": {
      "epsilon": 10.0,
      "delta": 1e-5
    }
  }'
```

**Response**:
```json
{
  "generator_id": "gen_xyz789",  ← Save this generator_id!
  "status": "training",
  "message": "Training started"
}
```

**💡 Save the `generator_id` - you'll need it for evaluation**

---

#### Step 3: Wait for Training to Complete

**Endpoint**: `GET /generators/{generator_id}`

**Request**:
```bash
curl "http://localhost:8000/generators/gen_xyz789"
```

**Response** (while training):
```json
{
  "id": "gen_xyz789",
  "status": "training",  ← Wait until "completed"
  "progress": 45
}
```

**Response** (when done):
```json
{
  "id": "gen_xyz789",
  "status": "completed",  ← Ready for evaluation!
  "output_path": "uploads/synthetic_gen_xyz789.csv",
  "dataset_id": "ds_abc123"
}
```

---

#### Step 4: Run Evaluation (Now you have both IDs!)

**Endpoint**: `POST /evaluations/run`

**Request**:
```json
{
  "generator_id": "gen_xyz789",  ← From Step 2
  "dataset_id": "ds_abc123",     ← From Step 1
  "target_column": "diagnosis",
  "sensitive_columns": ["patient_id", "ssn"],
  "include_statistical": true,
  "include_ml_utility": true,
  "include_privacy": true
}
```

**Response**:
```json
{
  "evaluation_id": "eval_def456",
  "status": "completed",
  "report": {
    "overall_assessment": {
      "overall_score": 0.91,
      "overall_quality": "Excellent"
    }
  }
}
```

---

## Issue 2: Simplified Dataset Upload (No project_id Required)

### Current Problem
```bash
# ❌ Confusing - Why do I need project_id?
POST /datasets/upload?project_id=some-uuid
```

### Proposed Fix
```bash
# ✅ Simple - Just upload the file!
POST /datasets/upload
```

I'll create a simplified upload endpoint.

---

## Issue 3: Flexible num_rows for Synthetic Generation

### Current Problems

1. **Hardcoded 1000 rows** in generation
2. **No option to generate more/less**
3. **Can't match original dataset size**

### Proposed Fixes

1. **Make num_rows configurable** (already exists but not documented well)
2. **Add "same_as_original" option** to match input size
3. **Add validation** to prevent unreasonable sizes

---

## Complete End-to-End Example (Python)

```python
import requests
import time

BASE_URL = "http://localhost:8000"

# ============================================
# STEP 1: Upload Dataset
# ============================================
print("Step 1: Uploading dataset...")

with open('patient_data.csv', 'rb') as f:
    response = requests.post(
        f"{BASE_URL}/datasets/upload",
        files={"file": ("patient_data.csv", f, "text/csv")}
    )

dataset = response.json()
dataset_id = dataset['id']
print(f"✓ Dataset uploaded: {dataset_id}")
print(f"  Rows: {dataset.get('num_rows', 'unknown')}")
print(f"  Columns: {dataset.get('num_columns', 'unknown')}")

# ============================================
# STEP 2: Generate Synthetic Data
# ============================================
print("\nStep 2: Starting synthetic data generation...")

response = requests.post(
    f"{BASE_URL}/datasets/{dataset_id}/generate",
    json={
        "generator_type": "dp-ctgan",
        "num_rows": 5000,  # Flexible! Can be any reasonable number
        "epochs": 100,
        "batch_size": 500,
        "parameters": {
            "epsilon": 10.0,
            "delta": 1e-5
        }
    }
)

generator = response.json()
generator_id = generator['generator_id']
print(f"✓ Training started: {generator_id}")

# ============================================
# STEP 3: Wait for Training to Complete
# ============================================
print("\nStep 3: Waiting for training to complete...")

while True:
    response = requests.get(f"{BASE_URL}/generators/{generator_id}")
    status_data = response.json()
    status = status_data['status']
    
    if status == 'completed':
        print(f"✓ Training completed!")
        print(f"  Output: {status_data.get('output_path')}")
        break
    elif status == 'failed':
        print(f"✗ Training failed: {status_data.get('error')}")
        exit(1)
    else:
        progress = status_data.get('progress', 0)
        print(f"  Status: {status} ({progress}%)")
        time.sleep(10)  # Wait 10 seconds

# ============================================
# STEP 4: Run Evaluation
# ============================================
print("\nStep 4: Running comprehensive evaluation...")

response = requests.post(
    f"{BASE_URL}/evaluations/run",
    json={
        "generator_id": generator_id,  # From Step 2
        "dataset_id": dataset_id,      # From Step 1
        "target_column": "diagnosis",
        "sensitive_columns": ["patient_id", "ssn"],
        "include_statistical": True,
        "include_ml_utility": True,
        "include_privacy": True
    }
)

evaluation = response.json()
report = evaluation['report']

print(f"✓ Evaluation completed!")
print(f"\n=== Results ===")
print(f"Overall Score: {report['overall_assessment']['overall_score']:.2%}")
print(f"Overall Quality: {report['overall_assessment']['overall_quality']}")
print(f"\nStatistical: {report['evaluations']['statistical_similarity']['summary']['pass_rate']:.1f}%")
print(f"ML Utility: {report['evaluations']['ml_utility']['summary']['utility_ratio']:.1%}")
print(f"Privacy: {report['evaluations']['privacy']['summary']['overall_privacy_level']}")
print(f"\nRecommendations:")
for rec in report['overall_assessment']['recommendations']:
    print(f"  - {rec}")
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│ WORKFLOW QUICK REFERENCE                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. POST /datasets/upload                                 │
│    Input:  CSV file                                      │
│    Output: dataset_id  ← SAVE THIS                      │
│                                                          │
│ 2. POST /datasets/{dataset_id}/generate                  │
│    Input:  generator_type, num_rows, epochs, params     │
│    Output: generator_id  ← SAVE THIS                    │
│                                                          │
│ 3. GET /generators/{generator_id}                        │
│    Check:  status == "completed"                         │
│    Wait:   Until training finishes                       │
│                                                          │
│ 4. POST /evaluations/run                                 │
│    Input:  generator_id (from step 2)                    │
│            dataset_id (from step 1)                      │
│            target_column, sensitive_columns              │
│    Output: Comprehensive quality report                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Fixes Needed

I'll implement these fixes:

1. ✅ **Simplified dataset upload** - Remove project_id requirement
2. ✅ **Flexible num_rows** - Add configurable generation size
3. ✅ **Better documentation** - Clear ID tracking guide
4. ✅ **Validation** - Prevent unreasonable num_rows values

---

**Next**: I'll implement these fixes in the code.
