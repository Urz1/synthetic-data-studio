# DP Safety Features - API Test Examples

## 🚀 Ready-to-Run API Tests

Copy and paste these examples into your API client (Postman, Thunder Client, curl, etc.)

**Base URL**: `http://localhost:8000`

---

## 1️⃣ Get Recommended Configuration

### Request
```http
GET /generators/dp/recommended-config?dataset_id=YOUR_DATASET_ID&target_epsilon=10.0&desired_quality=balanced
```

### cURL
```bash
curl "http://localhost:8000/generators/dp/recommended-config?dataset_id=YOUR_DATASET_ID&target_epsilon=10.0&desired_quality=balanced"
```

### Expected Response (200 OK)
```json
{
    "dataset_id": "YOUR_DATASET_ID",
    "dataset_name": "demo_dataset",
    "dataset_size": 1000,
    "desired_quality": "balanced",
    "recommended_config": {
        "epochs": 20,
        "batch_size": 100,
        "target_epsilon": 10.0,
        "target_delta": 0.001,
        "max_grad_norm": 1.0,
        "rationale": {
            "dataset_size": 1000,
            "desired_quality": "balanced",
            "expected_privacy_level": "Moderate",
            "estimated_training_time": "40s (approximate)"
        }
    }
}
```

---

## 2️⃣ Validate the Original Failing Configuration

**Purpose**: Verify the bug is now caught

### Request
```http
POST /generators/dp/validate-config
Content-Type: application/json

{
    "dataset_id": "YOUR_DATASET_ID",
    "generator_type": "dp-ctgan",
    "epochs": 50,
    "batch_size": 500,
    "target_epsilon": 10.0
}
```

### cURL
```bash
curl -X POST http://localhost:8000/generators/dp/validate-config \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "YOUR_DATASET_ID",
    "generator_type": "dp-ctgan",
    "epochs": 50,
    "batch_size": 500,
    "target_epsilon": 10.0
  }'
```

### Expected Response (200 OK)
```json
{
    "is_valid": false,
    "errors": [
        "Batch size (500) is too large (>50% of dataset). Maximum recommended: 500. Large batches make privacy guarantees very difficult.",
        "Too many training steps (100). With 50 epochs and batch_size 500, privacy budget will be exhausted. Reduce epochs to 12 or increase batch_size to 1000."
    ],
    "warnings": [],
    "requested_config": {
        "dataset_size": 1000,
        "epochs": 50,
        "batch_size": 500,
        "target_epsilon": 10.0,
        "sampling_rate": "50.0%"
    },
    "recommended_config": {
        "epochs": 20,
        "batch_size": 100,
        "target_epsilon": 10.0,
        "target_delta": 0.001,
        "max_grad_norm": 1.0,
        "rationale": {
            "dataset_size": 1000,
            "desired_quality": "balanced",
            "expected_privacy_level": "Moderate",
            "estimated_training_time": "40s (approximate)"
        }
    }
}
```

✅ **Success!** The configuration is now correctly identified as invalid.

---

## 3️⃣ Validate a Safe Configuration

**Purpose**: Verify safe configs pass validation

### Request
```http
POST /generators/dp/validate-config
Content-Type: application/json

{
    "dataset_id": "YOUR_DATASET_ID",
    "generator_type": "dp-ctgan",
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
}
```

### cURL
```bash
curl -X POST http://localhost:8000/generators/dp/validate-config \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "YOUR_DATASET_ID",
    "generator_type": "dp-ctgan",
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
  }'
```

### Expected Response (200 OK)
```json
{
    "is_valid": true,
    "errors": [],
    "warnings": [
        "Batch size (100) is 10% of dataset. Consider reducing to 66 for better privacy."
    ],
    "requested_config": {
        "dataset_size": 1000,
        "epochs": 20,
        "batch_size": 100,
        "target_epsilon": 10.0,
        "sampling_rate": "10.0%"
    },
    "recommended_config": {
        "epochs": 20,
        "batch_size": 100,
        "target_epsilon": 10.0,
        "target_delta": 0.001,
        "max_grad_norm": 1.0,
        "rationale": {
            "dataset_size": 1000,
            "desired_quality": "balanced",
            "expected_privacy_level": "Moderate",
            "estimated_training_time": "40s (approximate)"
        }
    }
}
```

✅ **Success!** Configuration is valid with minor warnings.

---

## 4️⃣ Train with Original Failing Config

**Purpose**: Verify training is now blocked

### Request
```http
POST /generators/dataset/YOUR_DATASET_ID/generate
Content-Type: application/json

{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 50,
    "batch_size": 500,
    "target_epsilon": 10.0
}
```

### cURL
```bash
curl -X POST http://localhost:8000/generators/dataset/YOUR_DATASET_ID/generate \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 50,
    "batch_size": 500,
    "target_epsilon": 10.0
  }'
```

### Expected Response (500 Internal Server Error)
```json
{
    "detail": "Generation failed: Configuration validation failed:\n❌ Batch size (500) is too large (>50% of dataset). Maximum recommended: 500. Large batches make privacy guarantees very difficult.\n❌ Too many training steps (100). With 50 epochs and batch_size 500, privacy budget will be exhausted. Reduce epochs to 12 or increase batch_size to 1000."
}
```

✅ **Success!** Training blocked with clear error message.

---

## 5️⃣ Train with Safe Configuration

**Purpose**: Verify safe training works

### Request
```http
POST /generators/dataset/YOUR_DATASET_ID/generate
Content-Type: application/json

{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
}
```

### cURL
```bash
curl -X POST http://localhost:8000/generators/dataset/YOUR_DATASET_ID/generate \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
  }'
```

### Expected Response (200 OK)
```json
{
    "message": "Generation completed",
    "generator_id": "abc-123-def-456",
    "output_dataset_id": "xyz-789-uvw-012"
}
```

✅ **Success!** Training completed successfully.

---

## 6️⃣ Get Privacy Report

**Purpose**: Check actual privacy spent

### Request
```http
GET /generators/abc-123-def-456/privacy-report
```

### cURL
```bash
curl "http://localhost:8000/generators/abc-123-def-456/privacy-report"
```

### Expected Response (200 OK)
```json
{
    "generator_id": "abc-123-def-456",
    "model_type": "dp-ctgan",
    "timestamp": "2024-01-15T10:30:00Z",
    "privacy_spent": {
        "epsilon": 11.5,
        "delta": 0.001,
        "noise_multiplier": 2.71,
        "max_grad_norm": 1.0
    },
    "privacy_level": "Moderate",
    "privacy_score": 6,
    "assessment": {
        "epsilon_ratio": 1.15,
        "status": "acceptable",
        "message": "Privacy budget slightly exceeded (15% over) but within acceptable range."
    },
    "compliance": {
        "hipaa": {
            "compliant": true,
            "notes": "Privacy guarantees meet HIPAA requirements for de-identification. ε=11.5 provides moderate privacy protection."
        },
        "gdpr": {
            "compliant": true,
            "notes": "Differential privacy satisfies GDPR anonymization requirements."
        }
    },
    "recommendations": [
        "To strengthen privacy, reduce epochs to 15",
        "Consider target_epsilon=5.0 for stronger guarantees"
    ]
}
```

✅ **Success!** Epsilon ≈11.5 (within 2x of target 10.0).

---

## 7️⃣ Test Different Quality Levels

### High Privacy (ε < 5)
```bash
curl "http://localhost:8000/generators/dp/recommended-config?dataset_id=YOUR_DATASET_ID&target_epsilon=5.0&desired_quality=high_privacy"
```

**Expected**: Lower epochs, smaller batch size

### Balanced (ε ≈ 10)
```bash
curl "http://localhost:8000/generators/dp/recommended-config?dataset_id=YOUR_DATASET_ID&target_epsilon=10.0&desired_quality=balanced"
```

**Expected**: Moderate epochs, moderate batch size

### High Quality (ε ≈ 15)
```bash
curl "http://localhost:8000/generators/dp/recommended-config?dataset_id=YOUR_DATASET_ID&target_epsilon=15.0&desired_quality=high_quality"
```

**Expected**: Higher epochs, larger batch size

---

## 8️⃣ Test DP-TVAE (Faster Alternative)

### Request
```http
POST /generators/dataset/YOUR_DATASET_ID/generate
Content-Type: application/json

{
    "generator_type": "dp-tvae",
    "num_rows": 200,
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
}
```

### cURL
```bash
curl -X POST http://localhost:8000/generators/dataset/YOUR_DATASET_ID/generate \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-tvae",
    "num_rows": 200,
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
  }'
```

**Expected**: Same validation, 2-3x faster training

---

## 🧪 Complete Testing Workflow

### Step 1: Get Your Dataset ID
```bash
# List all datasets
curl "http://localhost:8000/datasets/"
```

### Step 2: Get Recommendations
```bash
curl "http://localhost:8000/generators/dp/recommended-config?dataset_id=YOUR_DATASET_ID&target_epsilon=10.0&desired_quality=balanced"
```

### Step 3: Validate Your Config
```bash
curl -X POST http://localhost:8000/generators/dp/validate-config \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "YOUR_DATASET_ID",
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
  }'
```

### Step 4: Train if Valid
```bash
curl -X POST http://localhost:8000/generators/dataset/YOUR_DATASET_ID/generate \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-ctgan",
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
  }'
```

### Step 5: Check Privacy Report
```bash
curl "http://localhost:8000/generators/GENERATOR_ID/privacy-report"
```

---

## ⚡ Quick Tests

### Test 1: Verify Bug is Fixed ❌
```bash
curl -X POST http://localhost:8000/generators/dataset/YOUR_DATASET_ID/generate \
  -H "Content-Type: application/json" \
  -d '{"generator_type":"dp-ctgan","epochs":50,"batch_size":500,"target_epsilon":10.0}'
```
**Expected**: Error raised before training

### Test 2: Safe Config Works ✅
```bash
curl -X POST http://localhost:8000/generators/dataset/YOUR_DATASET_ID/generate \
  -H "Content-Type: application/json" \
  -d '{"generator_type":"dp-ctgan","epochs":20,"batch_size":100,"target_epsilon":10.0}'
```
**Expected**: Training succeeds, ε ≈ 10-15

### Test 3: Validation Endpoint ⚡
```bash
curl -X POST http://localhost:8000/generators/dp/validate-config \
  -H "Content-Type: application/json" \
  -d '{"dataset_id":"YOUR_DATASET_ID","epochs":50,"batch_size":500,"target_epsilon":10.0}'
```
**Expected**: Returns errors without training (<1s)

---

## 📊 Test Results Checklist

After running tests, verify:

- [ ] Original failing config (epochs=50, batch_size=500) is **blocked**
- [ ] Error message includes **specific suggestions** (epochs=X, batch_size=Y)
- [ ] Validation endpoint returns results in **<1 second**
- [ ] Recommended config produces **ε within 2x of target**
- [ ] Privacy report shows **epsilon_ratio and validation status**
- [ ] Both **DP-CTGAN and DP-TVAE** have same protections
- [ ] Different quality levels produce **different configs**
- [ ] Post-training epsilon is **reasonable** (not 3180!)

---

## 🔧 Troubleshooting

### Error: "Dataset not found"
**Fix**: Upload a dataset first or use an existing dataset_id
```bash
curl -X POST http://localhost:8000/datasets/upload -F "file=@yourdata.csv"
```

### Error: "Authorization required"
**Fix**: Add authentication token (if auth enabled)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" ...
```

### Error: "Configuration validation failed"
**Expected**: This means the safety system is working! Use recommended config instead.

### Warning: "Privacy budget slightly exceeded"
**OK**: If ε is within 2x of target (e.g., ε=12 for target=10), this is acceptable.

### Critical: "Privacy budget catastrophically exceeded"
**Problem**: If you see ε >10x target, please report as bug. Should not happen with new system!

---

## 🎯 Success Criteria

✅ All these should be true:
1. Validation endpoint works (<1s response)
2. Original failing config is blocked
3. Recommended configs pass validation
4. Training with safe config succeeds
5. Actual epsilon ≈ target epsilon (within 2x)
6. Privacy reports show validation status
7. Error messages are clear and actionable

---

## 📞 Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify dataset exists and has correct format
3. Try recommended config first before custom settings
4. Review `PHASE3_SAFETY_TESTING.md` for detailed guidance

---

## 🚀 Next Steps

After confirming safety features work:
1. Test with your actual datasets (different sizes)
2. Experiment with quality trade-offs
3. Compare DP-CTGAN vs DP-TVAE performance
4. Document your use cases and findings
5. Consider Phase 4: Evaluation suite

---

**Happy Testing!** 🎉

The system is now protected against catastrophic privacy failures. Your original bug (ε=3180) is impossible with these safeguards.
