# Phase 4: Comprehensive Evaluation Suite

## Overview

Phase 4 implements a comprehensive evaluation framework for synthetic data quality assessment. The system evaluates synthetic data across three critical dimensions:

1. **Statistical Similarity**: How well does synthetic data match real data distributions?
2. **ML Utility**: Can you train good machine learning models on synthetic data?
3. **Privacy Preservation**: Are there privacy leakage risks?

**Status**: ✅ **COMPLETE**

---

## Architecture

### Components

```
app/evaluations/
├── statistical_tests.py    # Statistical similarity evaluator (470 lines)
├── ml_utility.py           # ML utility evaluator (350+ lines)
├── privacy_tests.py        # Privacy leakage evaluator (400+ lines)
├── quality_report.py       # Comprehensive report generator (250+ lines)
├── crud.py                 # Database operations
├── routes.py               # API endpoints
└── models.py               # Evaluation data model
```

### Evaluation Flow

```
1. User requests evaluation via API
   ↓
2. Load real data and synthetic data
   ↓
3. Run evaluations:
   - Statistical similarity tests
   - ML utility tests
   - Privacy leakage tests
   ↓
4. Generate comprehensive report
   ↓
5. Save to database
   ↓
6. Return quality assessment with recommendations
```

---

## Statistical Similarity Evaluator

**File**: `app/evaluations/statistical_tests.py`

### Tests Implemented

#### 1. Kolmogorov-Smirnov Test
- **Purpose**: Tests if two continuous distributions are identical
- **Method**: Two-sample KS test
- **Pass Criteria**: p-value > 0.05 (fail to reject null hypothesis that distributions are same)
- **Use Case**: Continuous numerical features

```python
# Example
evaluator = StatisticalEvaluator(real_data, synthetic_data)
result = evaluator.kolmogorov_smirnov_test('age')
# Returns: {'statistic': 0.087, 'p_value': 0.23, 'passed': True}
```

#### 2. Chi-Square Test
- **Purpose**: Tests independence for categorical/binned data
- **Method**: Chi-square test of independence
- **Pass Criteria**: p-value > 0.05
- **Use Case**: Categorical features or binned continuous features

```python
result = evaluator.chi_square_test('category', bins=10)
# Returns: {'statistic': 12.3, 'p_value': 0.14, 'passed': True}
```

#### 3. Wasserstein Distance
- **Purpose**: Measures distribution difference (Earth Mover's Distance)
- **Method**: 1-Wasserstein distance normalized by data range
- **Pass Criteria**: Distance < 0.1 (10% of data range)
- **Use Case**: Overall distribution similarity

```python
result = evaluator.wasserstein_distance_test('income')
# Returns: {'distance': 0.045, 'normalized': 0.045, 'passed': True}
```

#### 4. Jensen-Shannon Divergence
- **Purpose**: Symmetric measure of distribution similarity
- **Method**: JS divergence on binned distributions [0, 1]
- **Pass Criteria**: Divergence < 0.1
- **Use Case**: Probability distribution comparison

```python
result = evaluator.jensen_shannon_divergence('score', bins=50)
# Returns: {'divergence': 0.078, 'passed': True}
```

#### 5. Correlation Comparison
- **Purpose**: Compares correlation structures
- **Method**: Frobenius norm and MAE of correlation matrix differences
- **Pass Criteria**: Frobenius norm < 0.3, MAE < 0.1
- **Use Case**: Feature relationship preservation

```python
result = evaluator.correlation_comparison()
# Returns: {'frobenius_norm': 0.21, 'mae': 0.067, 'passed': True}
```

### Quality Levels

| Pass Rate | Quality Level |
|-----------|--------------|
| ≥90%      | Excellent    |
| ≥75%      | Good         |
| ≥60%      | Fair         |
| <60%      | Poor         |

---

## ML Utility Evaluator

**File**: `app/evaluations/ml_utility.py`

### Test Scenarios

#### 1. Train on Real, Test on Real (Baseline)
- **Purpose**: Establish baseline model performance
- **Model**: RandomForestClassifier/Regressor (100 estimators)
- **Use Case**: Reference performance for comparison

#### 2. Train on Synthetic, Test on Real (Key Test)
- **Purpose**: Measure if synthetic data can train useful models
- **Metric**: Utility ratio = synthetic_score / baseline_score
- **Pass Criteria**: Utility ratio ≥ 0.85 (85% of baseline)

#### 3. Train on Mixed, Test on Real (Augmentation Test)
- **Purpose**: Test if synthetic data can augment real training data
- **Configuration**: 50% real + 50% synthetic by default
- **Use Case**: Data augmentation scenarios

### Task Detection

```python
# Auto-detects task type
if num_unique_values / len(data) > 0.05:
    task_type = "regression"
else:
    task_type = "classification"
```

### Metrics

**Classification**:
- Accuracy
- Precision
- Recall
- F1 Score

**Regression**:
- R² Score
- Mean Squared Error (MSE)
- Root Mean Squared Error (RMSE)
- Mean Absolute Error (MAE)

### Quality Levels

| Utility Ratio | Quality Level |
|---------------|--------------|
| ≥95%          | Excellent    |
| ≥85%          | Good         |
| ≥70%          | Fair         |
| <70%          | Poor         |

### Example

```python
evaluator = MLUtilityEvaluator(real_data, synthetic_data, target_column='target')
results = evaluator.evaluate_all()

# Results:
# {
#   "baseline": {"accuracy": 0.92, "f1": 0.91},
#   "synthetic": {"accuracy": 0.88, "f1": 0.87},
#   "mixed": {"accuracy": 0.91, "f1": 0.90},
#   "utility_ratio": 0.956,  # 95.6% of baseline
#   "quality": "Excellent"
# }
```

---

## Privacy Leakage Evaluator

**File**: `app/evaluations/privacy_tests.py`

### Tests Implemented

#### 1. Distance to Closest Record (DCR)
- **Purpose**: Detect if synthetic records are too similar to real records
- **Method**: Calculate min Euclidean distance from each synthetic record to all real records
- **Risk Levels**:
  - High: >20% of synthetic records have DCR < 5th percentile of real-real distances
  - Medium: 10-20% in high-risk zone
  - Low: <10% in high-risk zone

```python
evaluator = PrivacyEvaluator(real_data, synthetic_data)
result = evaluator.distance_to_closest_record()

# Returns:
# {
#   "mean_dcr": 0.234,
#   "median_dcr": 0.198,
#   "min_dcr": 0.034,
#   "high_risk_percentage": 8.3,  # 8.3% of records
#   "risk_level": "Low"
# }
```

#### 2. Membership Inference Attack
- **Purpose**: Test if attacker can distinguish real from synthetic data
- **Method**: Train classifier on labeled (real=1, synthetic=0), measure accuracy
- **Vulnerability Levels**:
  - High: Attack advantage > 30%
  - Medium: 15-30%
  - Low: <15%
- **Attack Advantage**: `(accuracy - 0.5) * 2` (normalized to [0, 1])

```python
result = evaluator.membership_inference_attack()

# Returns:
# {
#   "attack_accuracy": 0.57,  # 57% accuracy
#   "attack_advantage": 0.14,  # 14% advantage (above random 50%)
#   "vulnerability": "Low"
# }
```

#### 3. Attribute Inference Attack
- **Purpose**: Test if sensitive attributes can be inferred
- **Method**: Train model to predict sensitive column, measure accuracy
- **Vulnerability Levels**:
  - High: Inference accuracy > 80%
  - Medium: 65-80%
  - Low: <65%

```python
result = evaluator.attribute_inference_attack('sensitive_column')

# Returns:
# {
#   "inference_accuracy": 0.62,
#   "baseline_accuracy": 0.50,  # Random guessing
#   "vulnerability": "Low"
# }
```

### Overall Privacy Assessment

Combines all privacy tests:
- **Good**: All tests pass (low vulnerability)
- **Fair**: Some medium risks detected
- **Poor**: High risks detected in any test

---

## Quality Report Generator

**File**: `app/evaluations/quality_report.py`

### Comprehensive Report Structure

```python
{
  "report_id": "gen_123_quality_report",
  "generator_id": "gen_123",
  "generator_type": "dp-ctgan",
  "generated_at": "2024-01-15T10:30:00Z",
  
  "dataset_info": {
    "real_rows": 10000,
    "synthetic_rows": 10000,
    "num_columns": 15,
    "columns": ["age", "income", ...]
  },
  
  "evaluations": {
    "statistical_similarity": {
      "summary": {
        "total_tests": 15,
        "passed_tests": 14,
        "pass_rate": 93.3,
        "overall_quality": "Excellent"
      },
      "column_results": {...}
    },
    
    "ml_utility": {
      "baseline": {"accuracy": 0.92},
      "synthetic": {"accuracy": 0.89},
      "utility_ratio": 0.967,
      "quality": "Excellent"
    },
    
    "privacy": {
      "dcr": {"risk_level": "Low"},
      "membership_inference": {"vulnerability": "Low"},
      "overall_privacy_level": "Good"
    }
  },
  
  "overall_assessment": {
    "overall_score": 0.91,  # Weighted average
    "overall_quality": "Excellent",
    "dimension_scores": {
      "statistical": 0.933,
      "ml_utility": 0.967,
      "privacy": 1.0
    },
    "recommendations": [
      "Quality is satisfactory. No immediate improvements needed."
    ]
  }
}
```

### Scoring Weights

- **Statistical Similarity**: 40%
- **ML Utility**: 30%
- **Privacy**: 30%

### Quality Levels

| Overall Score | Quality Level |
|--------------|--------------|
| ≥0.90        | Excellent    |
| ≥0.75        | Good         |
| ≥0.60        | Fair         |
| <0.60        | Poor         |

---

## API Endpoints

### 1. Run Full Evaluation

```http
POST /evaluations/run
Content-Type: application/json

{
  "generator_id": "gen_abc123",
  "dataset_id": "ds_xyz789",
  "target_column": "income",
  "sensitive_columns": ["ssn", "medical_record_id"],
  "include_statistical": true,
  "include_ml_utility": true,
  "include_privacy": true
}
```

**Response** (201 Created):
```json
{
  "evaluation_id": "eval_def456",
  "generator_id": "gen_abc123",
  "dataset_id": "ds_xyz789",
  "status": "completed",
  "report": {
    "overall_assessment": {
      "overall_score": 0.91,
      "overall_quality": "Excellent",
      "recommendations": [...]
    },
    ...
  }
}
```

### 2. Get Evaluation Results

```http
GET /evaluations/{evaluation_id}
```

**Response** (200 OK):
```json
{
  "evaluation_id": "eval_def456",
  "generator_id": "gen_abc123",
  "dataset_id": "ds_xyz789",
  "status": "completed",
  "report": {...}
}
```

### 3. List Generator Evaluations

```http
GET /evaluations/generator/{generator_id}
```

**Response** (200 OK):
```json
[
  {
    "evaluation_id": "eval_001",
    "generator_id": "gen_abc123",
    "status": "completed",
    "report": {...}
  },
  ...
]
```

### 4. Quick Evaluation (Statistical Only)

```http
POST /evaluations/quick/{generator_id}
```

**Response** (200 OK):
```json
{
  "report_id": "gen_abc123_summary",
  "generator_id": "gen_abc123",
  "generated_at": "2024-01-15T10:30:00Z",
  "pass_rate": 93.3,
  "quality_level": "Excellent"
}
```

---

## Usage Examples

### Example 1: Evaluate DP-CTGAN

```python
import requests

# Run evaluation
response = requests.post(
    "http://localhost:8000/evaluations/run",
    json={
        "generator_id": "gen_dp_ctgan_001",
        "dataset_id": "ds_medical_records",
        "target_column": "diagnosis",
        "sensitive_columns": ["patient_id", "ssn"],
        "include_statistical": True,
        "include_ml_utility": True,
        "include_privacy": True
    }
)

result = response.json()

# Check quality
print(f"Overall Quality: {result['report']['overall_assessment']['overall_quality']}")
print(f"Overall Score: {result['report']['overall_assessment']['overall_score']:.2%}")

# Statistical similarity
stat_summary = result['report']['evaluations']['statistical_similarity']['summary']
print(f"Statistical Pass Rate: {stat_summary['pass_rate']:.1f}%")

# ML utility
ml_summary = result['report']['evaluations']['ml_utility']['summary']
print(f"Utility Ratio: {ml_summary['utility_ratio']:.1%}")

# Privacy
privacy_summary = result['report']['evaluations']['privacy']['summary']
print(f"Privacy Level: {privacy_summary['overall_privacy_level']}")
```

### Example 2: Quick Check

```python
# Fast statistical check
response = requests.post(
    "http://localhost:8000/evaluations/quick/gen_ctgan_001"
)

result = response.json()
print(f"Pass Rate: {result['pass_rate']:.1f}%")
print(f"Quality: {result['quality_level']}")
```

### Example 3: Compare Generators

```python
# Evaluate multiple generators
generators = ["gen_ctgan_001", "gen_dp_ctgan_001", "gen_tvae_001"]

results = {}
for gen_id in generators:
    response = requests.post(
        "http://localhost:8000/evaluations/run",
        json={
            "generator_id": gen_id,
            "dataset_id": "ds_test",
            "target_column": "target",
            "include_statistical": True,
            "include_ml_utility": True,
            "include_privacy": True
        }
    )
    
    report = response.json()['report']
    results[gen_id] = {
        "quality": report['overall_assessment']['overall_quality'],
        "score": report['overall_assessment']['overall_score'],
        "statistical": report['evaluations']['statistical_similarity']['summary']['pass_rate'],
        "ml_utility": report['evaluations']['ml_utility']['summary']['utility_ratio'],
        "privacy": report['evaluations']['privacy']['summary']['overall_privacy_level']
    }

# Print comparison
import pandas as pd
df = pd.DataFrame(results).T
print(df)
```

---

## Testing

### Unit Tests

**Location**: `app/evaluations/tests/`

```bash
# Run all evaluation tests
pytest app/evaluations/tests/ -v

# Run specific test
pytest app/evaluations/tests/test_statistical.py -v

# Run with coverage
pytest app/evaluations/tests/ --cov=app.evaluations --cov-report=html
```

### Integration Test

```python
# Test end-to-end evaluation
import requests
import pandas as pd
from io import StringIO

# 1. Upload dataset
with open('test_data.csv', 'rb') as f:
    response = requests.post(
        "http://localhost:8000/datasets/upload",
        files={"file": f}
    )
dataset_id = response.json()['id']

# 2. Train generator
response = requests.post(
    "http://localhost:8000/generators/train",
    json={
        "dataset_id": dataset_id,
        "generator_type": "dp-ctgan",
        "parameters": {"epsilon": 10.0, "epochs": 100}
    }
)
generator_id = response.json()['id']

# Wait for training...

# 3. Run evaluation
response = requests.post(
    "http://localhost:8000/evaluations/run",
    json={
        "generator_id": generator_id,
        "dataset_id": dataset_id,
        "include_statistical": True,
        "include_ml_utility": True,
        "include_privacy": True
    }
)

evaluation = response.json()
assert evaluation['status'] == 'completed'
assert 'overall_assessment' in evaluation['report']
print("✅ End-to-end evaluation test passed")
```

---

## Performance Considerations

### Optimization Tips

1. **Statistical Tests**: Fast (1-5 seconds for 10K rows)
2. **ML Utility Tests**: Moderate (10-60 seconds depending on data size)
3. **Privacy Tests**: Slow (30-120 seconds for large datasets)

**Recommendations**:
- Use `/evaluations/quick/{generator_id}` for immediate feedback
- Run full evaluation in background for comprehensive assessment
- Cache evaluation results (already stored in database)
- Consider sampling for very large datasets (>100K rows)

### Scaling

For production:
- Move evaluation to Celery background workers
- Implement evaluation queue
- Add progress tracking
- Enable parallel evaluation for multiple generators

---

## Best Practices

### When to Evaluate

1. **After training**: Always evaluate newly trained generators
2. **Before deployment**: Ensure quality meets requirements
3. **Periodic checks**: Re-evaluate if model or data changes
4. **A/B testing**: Compare different generator configurations

### Interpreting Results

| Scenario | Statistical | ML Utility | Privacy | Action |
|----------|------------|-----------|---------|--------|
| All Excellent | ≥90% | ≥95% | Good | ✅ Deploy |
| Good across board | ≥75% | ≥85% | Good/Fair | ✅ Deploy with monitoring |
| Poor statistical | <60% | Any | Any | ⚠️ Retrain with more epochs |
| Poor ML utility | Any | <70% | Any | ⚠️ Check target column, try different generator |
| Poor privacy | Any | Any | Poor | 🚫 Do NOT deploy, use DP-enabled generator |

### Target column selection

- **Classification**: Select categorical target (diagnosis, category, label)
- **Regression**: Select continuous target (age, income, score)
- **No target**: ML utility tests will be skipped

### Sensitive columns

- Always specify for privacy tests
- Include: SSN, medical IDs, credit cards, biometric data
- Tests measure leakage risk for these specific columns

---

## Troubleshooting

### Common Issues

**Issue**: "Generator has no synthetic data output"
- **Cause**: Generator training failed or incomplete
- **Solution**: Check generator status, retrain if needed

**Issue**: "Target column not found"
- **Cause**: Column name mismatch
- **Solution**: Verify column names with `GET /datasets/{id}/columns`

**Issue**: "ML utility evaluation failed"
- **Cause**: Insufficient data, all-null target, or unsupported data types
- **Solution**: Check data quality, ensure target has valid values

**Issue**: Low statistical similarity
- **Cause**: Insufficient training epochs, poor hyperparameters
- **Solution**: Increase epochs, tune learning rate, try different generator

**Issue**: Low ML utility
- **Cause**: Synthetic data doesn't preserve predictive patterns
- **Solution**: Try CTGAN (better for complex patterns) or increase training time

**Issue**: Poor privacy score
- **Cause**: Overfitting, memorization, no DP
- **Solution**: Use DP-enabled generator (DP-CTGAN, DP-TVAE), reduce epsilon

---

## Next Steps (Phase 5)

Phase 5 will focus on compliance and model cards:

1. **Model Card Generator**: Automated model documentation (JSON + PDF)
2. **Audit Logs**: Immutable audit trail for all operations
3. **Compliance Templates**: HIPAA, GDPR, CCPA documentation
4. **Export Functionality**: Package synthetic data with documentation

---

## References

### Statistical Tests
- Kolmogorov-Smirnov: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html
- Chi-square: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.chisquare.html
- Wasserstein distance: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.wasserstein_distance.html

### Privacy Metrics
- Distance to Closest Record: Stadler et al. "Synthetic Data - Anonymisation Groundhog Day" (2022)
- Membership Inference: Shokri et al. "Membership Inference Attacks Against Machine Learning Models" (2017)

### ML Utility
- Train on Synthetic, Test on Real (TSTR): Standard synthetic data benchmark
- SDMetrics: https://github.com/sdv-dev/SDMetrics

---

**Phase 4 Status**: ✅ COMPLETE

**Files Modified**: 8
- `app/evaluations/statistical_tests.py` (created, 470 lines)
- `app/evaluations/ml_utility.py` (created, 350+ lines)
- `app/evaluations/privacy_tests.py` (created, 400+ lines)
- `app/evaluations/quality_report.py` (created, 250+ lines)
- `app/evaluations/routes.py` (created, 200+ lines)
- `app/evaluations/crud.py` (created, 120 lines)
- `app/evaluations/__init__.py` (updated)
- `app/api.py` (updated)

**Next Phase**: Phase 5 - Compliance & Model Cards
