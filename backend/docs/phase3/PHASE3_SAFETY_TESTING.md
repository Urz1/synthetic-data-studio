# Phase 3: DP Safety Features Testing Guide

## Overview
This guide covers testing the new 3-layer privacy protection system added to prevent catastrophic privacy failures.

## What Was Added

### 1. Configuration Validator (`dp_config_validator.py`)
- Pre-training validation of DP parameters
- Mathematical feasibility checks
- Recommended configuration generation
- Privacy-utility trade-off guidance

### 2. Enhanced DP Services
- **Pre-training validation**: Checks configuration before expensive training
- **Improved noise calculation**: Proper RDP formula instead of heuristic
- **Post-training validation**: Catches catastrophic failures
- **Actionable error messages**: Specific parameter suggestions

### 3. New API Endpoints
- `POST /generators/dp/validate-config`: Validate before training
- `GET /generators/dp/recommended-config`: Get safe parameters

## Protection Layers

### Layer 1: Pre-Training Warnings
Alerts for risky but potentially valid configurations:
- ⚠️ High sampling rate (>10% of dataset)
- ⚠️ Many training steps (>1000)
- ⚠️ Very strict/lenient epsilon values

### Layer 2: Pre-Training Errors
Blocks mathematically impossible configurations:
- ❌ Computed noise multiplier <0.5
- ❌ Cannot achieve target epsilon with current settings
- ❌ Provides specific fixes (reduce epochs to X, batch_size to Y)

### Layer 3: Post-Training Validation
Catches failures after training completes:
- 🔴 CRITICAL: epsilon >10x over budget
- ⚠️ WARNING: epsilon 2-10x over budget
- ✅ SUCCESS: Within budget

## Test Scenarios

### Test 1: Original Failing Configuration
**Purpose**: Verify the bug that was discovered is now caught

```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 50,
    "batch_size": 500,
    "target_epsilon": 10.0
}
```

**Expected Result**: 
- ❌ Raises ValueError BEFORE training starts
- Error message: "Configuration validation failed"
- Lists specific errors:
  - "Batch size (500) is too large (>50% of dataset)"
  - "Too many training steps (100)"
- Suggests: "Reduce epochs to 10 or increase batch_size to 100"

**Actual Behavior in Bug**: 
- ✅ Training completed
- ε = 3180.64 (31806% over budget!)
- No protection

---

### Test 2: Validate Configuration (New Endpoint)
**Purpose**: Check configuration without training

```http
POST http://localhost:8000/generators/dp/validate-config
{
    "dataset_id": "{your_dataset_id}",
    "generator_type": "dp-ctgan",
    "epochs": 50,
    "batch_size": 500,
    "target_epsilon": 10.0
}
```

**Expected Response**:
```json
{
    "is_valid": false,
    "errors": [
        "Batch size (500) is too large (>50% of dataset)",
        "Too many training steps (100)"
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
        "rationale": {...}
    }
}
```

---

### Test 3: Get Recommended Configuration
**Purpose**: Get safe parameters for your dataset

```http
GET http://localhost:8000/generators/dp/recommended-config?dataset_id={id}&target_epsilon=10.0&desired_quality=balanced
```

**Expected Response**:
```json
{
    "dataset_id": "...",
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
            "expected_privacy_level": "Moderate",
            "estimated_training_time": "40s (approximate)"
        }
    }
}
```

---

### Test 4: Safe Configuration (Recommended)
**Purpose**: Verify safe configuration works correctly

```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
}
```

**Expected Result**:
- ✅ Configuration validates successfully
- ✅ Training completes without errors
- ✅ Epsilon ≈ 10-15 (within 2x of target)
- ✅ Privacy level: "Moderate" or "Good"

---

### Test 5: High Privacy Configuration
**Purpose**: Test very strict privacy (ε < 5)

```http
GET http://localhost:8000/generators/dp/recommended-config?dataset_id={id}&target_epsilon=5.0&desired_quality=high_privacy
```

Then use recommended config to train:
```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
{
    "generator_type": "dp-ctgan",
    "num_rows": 200,
    "epochs": 10,
    "batch_size": 50,
    "target_epsilon": 5.0
}
```

**Expected Result**:
- ✅ Epsilon ≈ 3-7
- ✅ Privacy level: "Strong" or "Very Strong"
- ⚠️ Data quality may be lower (expected trade-off)

---

### Test 6: Edge Case - Small Dataset
**Purpose**: Test warnings for small datasets

```http
POST http://localhost:8000/generators/dp/validate-config
{
    "dataset_id": "{small_dataset_id}",  // <100 rows
    "generator_type": "dp-ctgan",
    "epochs": 30,
    "batch_size": 32,
    "target_epsilon": 10.0
}
```

**Expected Response**:
- ⚠️ Warning: "Dataset is very small (50 rows). DP-SGD works best with datasets > 1000 rows."
- May still be valid depending on other parameters

---

### Test 7: DP-TVAE (Alternative Model)
**Purpose**: Verify validation works for TVAE too

```http
POST http://localhost:8000/generators/dataset/{dataset_id}/generate
{
    "generator_type": "dp-tvae",
    "num_rows": 200,
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
}
```

**Expected Result**:
- Same validation logic as DP-CTGAN
- Training 2-3x faster
- Similar privacy guarantees

---

### Test 8: Privacy Report (After Training)
**Purpose**: Verify post-training report includes validation

```http
GET http://localhost:8000/generators/{generator_id}/privacy-report
```

**Expected Response**:
```json
{
    "generator_id": "...",
    "model_type": "dp-ctgan",
    "privacy_spent": {
        "epsilon": 11.5,
        "delta": 0.001,
        "noise_multiplier": 2.71
    },
    "privacy_level": "Moderate",
    "compliance": {
        "hipaa": {
            "compliant": true,
            "notes": "Privacy guarantees meet HIPAA requirements..."
        },
        "gdpr": {...}
    },
    "validation": {
        "epsilon_ratio": 1.15,
        "status": "acceptable",
        "message": "Privacy budget slightly exceeded (15% over) but within acceptable range."
    }
}
```

---

## Validation Rules Summary

### Sampling Rate
- **Error** if >50% of dataset
- **Warning** if >20% of dataset
- **Optimal**: 5-10%

### Training Steps
- **Error** if >2000 steps
- **Warning** if >1000 steps
- **Optimal**: 100-500 steps

### Noise Multiplier
- **Error** if <0.3 (mathematically infeasible)
- **Warning** if <0.5 (risky)
- **Optimal**: 0.5-5.0

### Epsilon Ratio (Post-Training)
- **Critical** if >10x target (catastrophic failure)
- **Warning** if >2x target (significant overspend)
- **Success** if ≤2x target (acceptable)

## Recommended Configurations by Dataset Size

| Dataset Size | Epochs | Batch Size | Target ε | Expected Result |
|--------------|--------|------------|----------|-----------------|
| 100-500      | 10-20  | 32-50      | 10-20    | Moderate privacy |
| 500-1000     | 20-30  | 50-100     | 5-10     | Good privacy |
| 1000-5000    | 30-50  | 100-200    | 3-8      | Strong privacy |
| 5000-10000   | 50-100 | 200-500    | 1-5      | Very strong privacy |
| >10000       | 100+   | 500-1000   | 0.5-3    | Exceptional privacy |

## Quality Trade-offs

### High Privacy (ε < 5)
- ✅ Strong privacy guarantees
- ✅ HIPAA/GDPR compliant
- ⚠️ Lower data quality
- ⚠️ May lose rare patterns

### Balanced (ε ≈ 10)
- ✅ Good privacy protection
- ✅ Reasonable data quality
- ✅ Most use cases
- ⚠️ Some utility loss

### High Quality (ε ≈ 15)
- ✅ High data quality
- ✅ Preserves patterns well
- ⚠️ Weaker privacy
- ⚠️ May not meet strict compliance

## Troubleshooting

### Error: "Batch size too large"
**Solution**: Reduce batch_size to <10% of dataset
```json
{
    "batch_size": 100  // Instead of 500 for 1000-row dataset
}
```

### Error: "Too many training steps"
**Solution**: Reduce epochs or increase batch_size
```json
{
    "epochs": 20,      // Instead of 50
    "batch_size": 100  // Instead of 50
}
```

### Error: "Configuration is mathematically infeasible"
**Solution**: Either:
1. Reduce epochs significantly
2. Increase batch_size
3. Increase target_epsilon (accept weaker privacy)

### Warning: "Privacy budget exceeded"
**Cause**: Configuration was risky but not blocked
**Solution**: Use recommended config endpoint for safer parameters

## API Testing Workflow

1. **Get recommendations first**:
   ```http
   GET /generators/dp/recommended-config?dataset_id={id}
   ```

2. **Validate your desired config**:
   ```http
   POST /generators/dp/validate-config
   {
       "dataset_id": "{id}",
       "epochs": 20,
       "batch_size": 100,
       "target_epsilon": 10.0
   }
   ```

3. **Train if valid**:
   ```http
   POST /generators/dataset/{id}/generate
   {
       "generator_type": "dp-ctgan",
       "epochs": 20,
       "batch_size": 100,
       "target_epsilon": 10.0
   }
   ```

4. **Check privacy report**:
   ```http
   GET /generators/{generator_id}/privacy-report
   ```

## Success Criteria

✅ **Test 1 (Original Bug)**: Should now FAIL with clear error message
✅ **Test 4 (Recommended)**: Should succeed with ε ≈ 10-15
✅ **Validation endpoint**: Returns accurate warnings/errors
✅ **Recommendation endpoint**: Provides safe configurations
✅ **Privacy report**: Shows epsilon_ratio and validation status

## Notes

- The system now blocks catastrophic failures BEFORE training
- Error messages provide specific, actionable guidance
- Recommendations adapt to dataset size and desired quality
- Post-training validation catches edge cases
- All validation is consistent between DP-CTGAN and DP-TVAE

## Next Steps After Testing

1. Test with your actual datasets (different sizes)
2. Experiment with different `desired_quality` settings
3. Document any edge cases you discover
4. Consider adding strict_mode for production (raise error instead of warning)
5. Implement usage tracking for privacy budget across multiple generations
