# Phase 3: Differential Privacy - Testing Guide

**Last Updated**: November 20, 2025

---

## 🧪 Postman Test Cases for Phase 3

### Prerequisites
1. Server running: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
2. User registered and logged in (get JWT token)
3. Dataset uploaded (use dataset_id from Phase 2 tests)

---

## Test 1: DP-CTGAN Generation with Strong Privacy (ε=5.0)

**Purpose**: Generate synthetic data with strong privacy guarantees suitable for PHI

### Request
```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
Authorization: Bearer {your_jwt_token}
Content-Type: application/json

{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 30,
    "batch_size": 100,
    "target_epsilon": 5.0,
    "max_grad_norm": 1.0
}
```

### Expected Response
```json
{
    "message": "Generation completed",
    "generator_id": "uuid-here",
    "output_dataset_id": "uuid-here"
}
```

### Validation
- ✅ Status 200 OK
- ✅ Training completes in ~2-4 minutes
- ✅ Privacy budget epsilon ≈ 5.0 (±1.0)
- ✅ Synthetic CSV file created in uploads/
- ✅ Generator record has privacy_config and privacy_spent fields

**Notes**: 
- Strong privacy (ε=5.0) may reduce synthetic data quality slightly
- Suitable for HIPAA-compliant PHI generation

---

## Test 2: DP-TVAE Generation with Moderate Privacy (ε=10.0)

**Purpose**: Faster training with moderate privacy protection

### Request
```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
Authorization: Bearer {your_jwt_token}
Content-Type: application/json

{
    "generator_type": "dp-tvae",
    "num_rows": 200,
    "epochs": 30,
    "batch_size": 100,
    "target_epsilon": 10.0
}
```

### Expected Response
```json
{
    "message": "Generation completed",
    "generator_id": "uuid-here",
    "output_dataset_id": "uuid-here"
}
```

### Validation
- ✅ Status 200 OK
- ✅ Training ~2x faster than DP-CTGAN (~1-2 minutes)
- ✅ Privacy budget epsilon ≈ 10.0
- ✅ Better data quality than ε=5.0

**Notes**:
- TVAE is faster but may be slightly less accurate for complex data
- ε=10.0 is reasonable for most business use cases

---

## Test 3: Get Privacy Report for DP-CTGAN

**Purpose**: Retrieve comprehensive privacy analysis

### Request
```http
GET http://localhost:8000/generators/{generator_id_from_test_1}/privacy-report
Authorization: Bearer {your_jwt_token}
```

### Expected Response
```json
{
    "report_id": "uuid",
    "generator_id": "uuid",
    "model_type": "dp-ctgan",
    "generated_at": "2025-11-20T...",
    "privacy_budget": {
        "epsilon": 4.82,
        "delta": 0.001,
        "target_epsilon": 5.0,
        "target_delta": 0.001,
        "budget_utilization": 96.4
    },
    "privacy_assessment": {
        "level": "Strong",
        "color": "green",
        "score": 8,
        "interpretation": "Strong privacy protection suitable for highly sensitive data (PHI, PII).",
        "epsilon_value": 4.82
    },
    "compliance": {
        "HIPAA": {
            "status": "Compliant",
            "notes": [
                "Differential Privacy with ε=4.82 provides mathematical privacy guarantees",
                "Suitable for Protected Health Information (PHI)",
                "De-identification standard met through algorithmic privacy"
            ],
            "recommendation": "Approved for PHI use"
        },
        "GDPR": {
            "status": "Compliant",
            "notes": [
                "Provides quantifiable privacy protection (ε=4.82, δ=1.00e-03)",
                "Meets GDPR Article 32 security requirements",
                "Supports right to be forgotten through synthetic data",
                "Privacy-by-design principle satisfied"
            ],
            "recommendation": "Approved for EU data"
        },
        "CCPA": {
            "status": "Compliant",
            "recommendation": "Approved for California consumer data"
        },
        "SOC2": {
            "status": "Compliant",
            "recommendation": "Suitable for SOC 2 Type II compliance"
        }
    },
    "tradeoff_analysis": {
        "privacy_vs_utility": {
            "privacy_strength": "Strong",
            "utility_impact": "Moderate",
            "description": "Good balance between privacy and utility for most use cases."
        },
        "budget_status": {
            "target_epsilon": 5.0,
            "actual_epsilon": 4.82,
            "exceeded": false,
            "overspend_percentage": 0,
            "status": "Within Budget"
        },
        "tuning_suggestions": [
            "Good privacy-utility balance achieved",
            "Settings are appropriate for sensitive data"
        ]
    },
    "parameters": {
        "max_grad_norm": 1.0,
        "noise_multiplier": 1.234,
        "epochs": 30,
        "batch_size": 100,
        "training_rows": 1000
    },
    "recommendations": [
        "✓ Good privacy-utility balance for most use cases",
        "Privacy Level: Strong",
        "Document this privacy report for compliance audits"
    ]
}
```

### Validation
- ✅ Status 200 OK
- ✅ Privacy level is "Strong" or "Good" for ε < 10
- ✅ HIPAA status is "Compliant" for ε < 10
- ✅ GDPR status is "Compliant"
- ✅ Recommendations are actionable

---

## Test 4: Very Strong Privacy (ε=1.0)

**Purpose**: Maximum privacy protection for extremely sensitive data

### Request
```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
Authorization: Bearer {your_jwt_token}
Content-Type: application/json

{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 30,
    "batch_size": 100,
    "target_epsilon": 1.0
}
```

### Expected Response
```json
{
    "message": "Generation completed",
    "generator_id": "uuid-here",
    "output_dataset_id": "uuid-here"
}
```

### Validation
- ✅ Status 200 OK
- ✅ Privacy level: "Very Strong"
- ✅ May have higher utility impact (quality reduction)
- ✅ Best for maximum privacy requirements

**Privacy Report Check:**
```http
GET http://localhost:8000/generators/{generator_id}/privacy-report
```
- Expect privacy_level: "Very Strong" or "Exceptional"
- Expect interpretation: "Excellent privacy protection"
- Expect utility_impact: "High" or "Moderate"

---

## Test 5: Privacy Budget Exceeded Warning

**Purpose**: Test system warns when privacy budget is exceeded

### Request
```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
Authorization: Bearer {your_jwt_token}
Content-Type: application/json

{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 100,
    "batch_size": 50,
    "target_epsilon": 3.0
}
```

### Expected Behavior
- Training completes but logs warning
- Actual epsilon may exceed 3.0 due to many epochs
- Privacy report shows budget_exceeded: true

### Privacy Report Validation
```http
GET http://localhost:8000/generators/{generator_id}/privacy-report
```

Expected in response:
```json
{
    "tradeoff_analysis": {
        "budget_status": {
            "exceeded": true,
            "overspend_percentage": 25.3,
            "status": "Budget Exceeded"
        }
    },
    "recommendations": [
        "⚠️ Privacy budget exceeded target by 25.3%",
        "Consider increasing noise_multiplier or reducing epochs in next training"
    ]
}
```

---

## Test 6: Compare Regular vs DP Models

**Purpose**: Compare data quality and privacy between regular CTGAN and DP-CTGAN

### Step 1: Generate with Regular CTGAN
```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
Body: {
    "generator_type": "ctgan",
    "num_rows": 200,
    "epochs": 30
}
```

### Step 2: Generate with DP-CTGAN
```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
Body: {
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 30,
    "target_epsilon": 5.0
}
```

### Step 3: Download Both Datasets
```http
GET http://localhost:8000/datasets/{regular_dataset_id}/download
GET http://localhost:8000/datasets/{dp_dataset_id}/download
```

### Manual Comparison
- Open both CSV files
- Compare distributions visually
- DP version should be similar but with slight noise
- DP version provides mathematical privacy guarantee

---

## Test 7: Privacy Report for Non-DP Model (Error Case)

**Purpose**: Verify error handling for non-DP generators

### Request
```http
GET http://localhost:8000/generators/{regular_ctgan_generator_id}/privacy-report
Authorization: Bearer {your_jwt_token}
```

### Expected Response
```json
{
    "detail": "Privacy reports are only available for DP-enabled generators (dp-ctgan, dp-tvae)"
}
```

### Validation
- ✅ Status 400 Bad Request
- ✅ Clear error message

---

## Test 8: Privacy Report Before Training (Edge Case)

**Purpose**: Test privacy report when generator hasn't been trained yet

### Setup
Create generator without training:
```http
POST http://localhost:8000/generators/
Body: {
    "dataset_id": "{dataset_id}",
    "type": "dp-ctgan",
    "name": "test_untrained",
    "parameters_json": {}
}
```

### Request
```http
GET http://localhost:8000/generators/{new_generator_id}/privacy-report
```

### Expected Response
```json
{
    "status": "not_trained",
    "message": "Model not trained yet. No privacy budget spent.",
    "generator_id": "uuid",
    "model_type": "dp-ctgan"
}
```

---

## Test 9: DP-TVAE vs DP-CTGAN Speed Comparison

**Purpose**: Validate that DP-TVAE is faster than DP-CTGAN

### Test Setup
Use same parameters for both:
```json
{
    "num_rows": 200,
    "epochs": 30,
    "batch_size": 100,
    "target_epsilon": 10.0
}
```

### Execution
1. Run DP-CTGAN generation → Record time
2. Run DP-TVAE generation → Record time

### Expected Results
- DP-TVAE should be 2-3x faster
- Example: DP-CTGAN ~3min, DP-TVAE ~1min
- Both should achieve similar epsilon values

---

## Test 10: Custom Privacy Parameters

**Purpose**: Test advanced privacy parameter tuning

### Request
```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
Authorization: Bearer {your_jwt_token}
Content-Type: application/json

{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 30,
    "batch_size": 100,
    "target_epsilon": 8.0,
    "target_delta": 0.0001,
    "max_grad_norm": 0.5,
    "noise_multiplier": 1.5
}
```

### Validation
- ✅ Custom delta is used (0.0001 instead of 1/n)
- ✅ Custom max_grad_norm affects clipping
- ✅ Custom noise_multiplier affects epsilon
- ✅ Privacy report reflects custom parameters

---

## 🎯 Success Criteria Summary

All tests should demonstrate:
- [x] DP-CTGAN generates synthetic data with privacy guarantees
- [x] DP-TVAE works and is faster than DP-CTGAN
- [x] Privacy reports provide comprehensive analysis
- [x] HIPAA/GDPR compliance indicators work correctly
- [x] Privacy budget tracking is accurate
- [x] Warnings appear when budget is exceeded
- [x] Error handling for non-DP models works
- [x] Privacy levels match epsilon ranges
- [x] Model persistence includes privacy metadata
- [x] API responses include privacy information

---

## 📊 Expected Privacy Levels by Epsilon

| Test | Epsilon | Expected Level | HIPAA Status |
|------|---------|----------------|--------------|
| Test 1 | 5.0 | Strong/Good | Compliant ✅ |
| Test 2 | 10.0 | Moderate | Compliant ✅ |
| Test 4 | 1.0 | Very Strong | Compliant ✅ |
| Test 5 | 3.0→4.0 | Good | Compliant ✅ |
| Test 9 | 10.0 | Moderate | Compliant ✅ |
| Test 10 | 8.0 | Moderate | Compliant ✅ |

---

## 🐛 Common Issues & Solutions

### Issue 1: Opacus Not Installed
**Error**: `ModuleNotFoundError: No module named 'opacus'`  
**Solution**: `pip install opacus>=1.4.0`

### Issue 2: Privacy Budget Significantly Exceeded
**Symptom**: Epsilon is 2x target  
**Cause**: Too many epochs or small batch size  
**Solution**: Reduce epochs or increase batch size

### Issue 3: Very Low Data Quality with Strong Privacy
**Symptom**: ε=1.0 produces poor synthetic data  
**Expected**: This is normal - strong privacy trades off utility  
**Solution**: Increase epsilon to 3.0-5.0 or validate that utility is sufficient

### Issue 4: Migration Not Run
**Error**: `Column 'privacy_config' does not exist`  
**Solution**: Run migration: `python app/database/migrations/add_privacy_fields_migration.py`

---

## 📝 Testing Checklist

- [ ] Test 1: DP-CTGAN with ε=5.0 ✅
- [ ] Test 2: DP-TVAE with ε=10.0 ✅
- [ ] Test 3: Privacy report retrieval ✅
- [ ] Test 4: Very strong privacy (ε=1.0) ✅
- [ ] Test 5: Budget exceeded warning ✅
- [ ] Test 6: Compare regular vs DP ✅
- [ ] Test 7: Error for non-DP model ✅
- [ ] Test 8: Untrained model edge case ✅
- [ ] Test 9: Speed comparison ✅
- [ ] Test 10: Custom parameters ✅

---

**Ready to test Phase 3 Differential Privacy features!** 🔒🧪
