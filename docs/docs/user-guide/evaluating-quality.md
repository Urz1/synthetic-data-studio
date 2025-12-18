---
id: user-guide-evaluating-quality
title: "Evaluating Synthetic Data Quality"
sidebar_label: "Evaluating Quality"
sidebar_position: 4
slug: /user-guide/evaluating-quality
tags: [user-guide, evaluation]
---
# Evaluating Synthetic Data Quality

Learn how to assess the quality of your synthetic datasets using comprehensive evaluation metrics and statistical tests.

##  Quality Assessment Overview

Synthetic Data Studio provides multi-dimensional quality evaluation across three critical areas:

### 1. Statistical Similarity
**Question**: How well does the synthetic data match the statistical properties of the real data?

### 2. Machine Learning Utility
**Question**: Can you train effective ML models using the synthetic data?

### 3. Privacy Preservation
**Question**: Are there unacceptable privacy leakage risks?

##  Quick Quality Check

### Statistical Evaluation (Fast)

Get immediate feedback with statistical tests:

```bash
curl -X POST "http://localhost:8000/evaluations/quick/{generator_id}" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "generator_id": "gen-123",
  "quality_level": "Good",
  "overall_score": 0.85,
  "statistical_similarity": {
    "ks_test": 0.92,
    "chi_square": 0.88,
    "wasserstein_distance": 0.15
  },
  "recommendations": [
    "Data quality looks good for most use cases",
    "Consider increasing training epochs for better similarity"
  ]
}
```

### Comprehensive Evaluation

Run full evaluation suite:

```bash
curl -X POST "http://localhost:8000/evaluations/run" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_id": "gen-123",
    "dataset_id": "original-dataset-id",
    "include_statistical": true,
    "include_ml_utility": true,
    "include_privacy": true
  }'
```

##  Statistical Similarity Tests

### Kolmogorov-Smirnov Test

**Purpose**: Tests if two continuous distributions are identical

**How it works**:
- Compares empirical distribution functions
- Measures maximum difference between distributions
- Returns p-value indicating statistical significance

```json
{
  "column": "age",
  "ks_test": {
    "statistic": 0.087,
    "p_value": 0.23,
    "passed": true,
    "interpretation": "Distributions are statistically similar (p > 0.05)"
  }
}
```

**Interpretation**:
-  **p > 0.05**: Distributions are similar (good)
-  **p = 0.01-0.05**: Marginally different
- ❌ **p < 0.01**: Distributions are different (needs improvement)

### Chi-Square Test

**Purpose**: Tests independence for categorical/binned data

**How it works**:
- Compares observed vs expected frequencies
- Works on categorical data or binned continuous data
- Sensitive to sample size differences

```json
{
  "column": "category",
  "chi_square_test": {
    "statistic": 12.3,
    "p_value": 0.14,
    "degrees_of_freedom": 4,
    "passed": true,
    "interpretation": "Category distributions match (p > 0.05)"
  }
}
```

### Wasserstein Distance

**Purpose**: Measures distribution difference (Earth Mover's Distance)

**How it works**:
- Calculates minimum "work" to transform one distribution into another
- Normalized by data range for comparability
- Lower values indicate better similarity

```json
{
  "column": "income",
  "wasserstein_distance": {
    "distance": 0.045,
    "normalized_distance": 0.045,
    "max_possible": 1.0,
    "passed": true,
    "interpretation": "Excellent distribution match (< 5% difference)"
  }
}
```

**Distance Scale**:
-  **< 0.05**: Excellent match
-  **0.05-0.10**: Good match
-  **0.10-0.20**: Acceptable
- ❌ **> 0.20**: Poor match

### Jensen-Shannon Divergence

**Purpose**: Symmetric measure of distribution similarity

**How it works**:
- Based on Kullback-Leibler divergence
- Symmetric (order doesn't matter)
- Bounded between 0 and 1

```json
{
  "column": "score",
  "js_divergence": {
    "divergence": 0.078,
    "normalized_divergence": 0.078,
    "passed": true,
    "interpretation": "Good distribution similarity (< 0.1)"
  }
}
```

##  Machine Learning Utility Tests

### Classification Performance

**Purpose**: Tests if synthetic data can train good classifiers

**How it works**:
1. Train classifier on synthetic data
2. Test on real data (holdout set)
3. Compare to baseline (real data training)

```json
{
  "ml_utility": {
    "classification": {
      "accuracy": 0.87,
      "precision": 0.85,
      "recall": 0.86,
      "f1_score": 0.85,
      "baseline_accuracy": 0.89,
      "utility_score": 0.97,
      "interpretation": "97% of baseline performance maintained"
    }
  }
}
```

### Regression Performance

**Purpose**: Tests if synthetic data preserves predictive relationships

```json
{
  "ml_utility": {
    "regression": {
      "r_squared": 0.82,
      "mean_absolute_error": 1250.50,
      "root_mean_squared_error": 1850.75,
      "baseline_r_squared": 0.85,
      "utility_score": 0.96,
      "interpretation": "96% of baseline predictive power maintained"
    }
  }
}
```

### Cross-Validation Results

**Purpose**: Ensures robust performance across different data splits

```json
{
  "cross_validation": {
    "folds": 5,
    "mean_accuracy": 0.86,
    "std_accuracy": 0.02,
    "confidence_interval": [0.84, 0.88],
    "stable_performance": true
  }
}
```

##  Privacy Leakage Tests

### Membership Inference Attack

**Purpose**: Tests if synthetic data could reveal whether specific records were used in training

**How it works**:
- Trains attack model to distinguish training vs non-training records
- Measures attack success rate
- Lower success rates indicate better privacy

```json
{
  "privacy_tests": {
    "membership_inference": {
      "attack_success_rate": 0.52,
      "baseline_accuracy": 0.50,
      "privacy_score": 0.96,
      "risk_level": "low",
      "interpretation": "No significant membership inference risk detected"
    }
  }
}
```

**Risk Levels**:
-  **< 0.55**: Low risk (good privacy)
-  **0.55-0.60**: Moderate risk
- ❌ **> 0.60**: High risk (privacy concerns)

### Attribute Inference Attack

**Purpose**: Tests if sensitive attributes can be inferred from synthetic data

```json
{
  "privacy_tests": {
    "attribute_inference": {
      "target_attribute": "income",
      "attack_accuracy": 0.15,
      "baseline_accuracy": 0.10,
      "privacy_score": 0.67,
      "risk_level": "moderate",
      "recommendations": [
        "Consider using differential privacy for this attribute",
        "Reduce income correlation with other features"
      ]
    }
  }
}
```

##  Quality Report Structure

### Overall Assessment

```json
{
  "evaluation_id": "eval-123",
  "generator_id": "gen-123",
  "dataset_id": "data-123",
  "overall_quality_score": 0.83,
  "quality_level": "Good",
  "recommendations": [
    "Overall quality is good for most applications",
    "Consider privacy-preserving methods for sensitive attributes",
    "Statistical similarity could be improved with more training"
  ]
}
```

### Detailed Breakdown

```json
{
  "statistical_similarity": {
    "overall_score": 0.88,
    "passed_tests": 8,
    "total_tests": 10,
    "failed_columns": ["outlier_column"],
    "recommendations": ["Review outlier handling for 'outlier_column'"]
  },
  "ml_utility": {
    "overall_score": 0.91,
    "classification_score": 0.89,
    "regression_score": 0.93,
    "stability_score": 0.95
  },
  "privacy_preservation": {
    "overall_score": 0.78,
    "membership_inference_risk": "low",
    "attribute_inference_risks": ["moderate"],
    "recommendations": ["Use DP methods for high-risk attributes"]
  }
}
```

##  Quality Score Interpretation

### Overall Quality Levels

| Score Range | Quality Level | Description | Suitable For |
|-------------|---------------|-------------|--------------|
| 0.9-1.0 | Excellent | Exceptional quality | Production, critical applications |
| 0.8-0.9 | Good | High quality | Most business applications |
| 0.7-0.8 | Acceptable | Reasonable quality | Development, testing |
| 0.6-0.7 | Marginal | Limited quality | Prototyping only |
| < 0.6 | Poor | Significant issues | Not recommended |

### Component Scores

**Statistical Similarity**:
-  **> 0.85**: Excellent distribution matching
-  **0.75-0.85**: Good statistical properties
-  **0.65-0.75**: Acceptable for some use cases
- ❌ **< 0.65**: Poor statistical fidelity

**ML Utility**:
-  **> 0.90**: Near-baseline performance
-  **0.80-0.90**: Good predictive capability
-  **0.70-0.80**: Acceptable for training
- ❌ **< 0.70**: Limited utility

**Privacy Preservation**:
-  **> 0.80**: Strong privacy protection
-  **0.70-0.80**: Good privacy guarantees
-  **0.60-0.70**: Moderate privacy concerns
- ❌ **< 0.60**: Significant privacy risks

##  Improving Quality

### Statistical Similarity Issues

**Problem**: Poor distribution matching
**Solutions**:
```json
{
  "increase_epochs": true,
  "recommended_epochs": 150,
  "use_ctgan": true,
  "add_regularization": true
}
```

**Problem**: Categorical data mismatch
**Solutions**:
```json
{
  "use_mode_specific_loss": true,
  "increase_embedding_dim": true,
  "recommended_embedding_dim": 256
}
```

### ML Utility Issues

**Problem**: Poor predictive performance
**Solutions**:
```json
{
  "increase_training_data": true,
  "use_transfer_learning": true,
  "fine_tune_hyperparameters": true,
  "recommended_batch_size": 256
}
```

### Privacy Issues

**Problem**: Membership inference vulnerability
**Solutions**:
```json
{
  "use_differential_privacy": true,
  "recommended_epsilon": 5.0,
  "add_output_perturbation": true
}
```

##  Custom Evaluation Options

### Selective Testing

Run only specific tests:

```bash
curl -X POST "http://localhost:8000/evaluations/run" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_id": "gen-123",
    "dataset_id": "data-123",
    "include_statistical": true,
    "include_ml_utility": false,
    "include_privacy": false,
    "target_columns": ["age", "income", "category"]
  }'
```

### Advanced ML Configuration

Customize ML evaluation:

```json
{
  "ml_utility_config": {
    "test_size": 0.3,
    "random_state": 42,
    "cross_validation_folds": 5,
    "algorithms": ["random_forest", "xgboost", "logistic_regression"],
    "metrics": ["accuracy", "precision", "recall", "f1", "auc"]
  }
}
```

### Privacy Test Configuration

Configure privacy evaluation:

```json
{
  "privacy_config": {
    "membership_inference": {
      "attack_model": "neural_network",
      "shadow_models": 5,
      "test_ratio": 0.3
    },
    "attribute_inference": {
      "target_attributes": ["salary", "medical_history"],
      "auxiliary_columns": ["age", "gender", "location"],
      "attack_epsilon": 0.1
    }
  }
}
```

##  Tracking Quality Over Time

### Evaluation History

Track quality improvements:

```bash
# List all evaluations for a generator
curl http://localhost:8000/evaluations/generator/{generator_id}
```

### Comparative Analysis

Compare multiple generators:

```bash
curl -X POST "http://localhost:8000/evaluations/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "evaluation_ids": ["eval-1", "eval-2", "eval-3"],
    "comparison_metrics": ["overall_score", "statistical_similarity", "ml_utility"]
  }'
```

##  AI-Powered Insights

### Natural Language Explanations

Get AI-powered analysis of your results:

```bash
curl -X POST "http://localhost:8000/evaluations/{evaluation_id}/explain" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "evaluation_id": "eval-123",
  "insights": {
    "executive_summary": "Your synthetic data shows good overall quality...",
    "key_findings": [
      "Statistical similarity is excellent for most columns",
      "ML utility is slightly below baseline due to privacy constraints"
    ],
    "recommendations": [
      "Consider using DP-CTGAN for better privacy-utility balance",
      "Increase training epochs to improve correlation preservation"
    ],
    "business_impact": "Suitable for development and testing environments..."
  }
}
```

### Smart Suggestions

Get AI recommendations for improvement:

```bash
curl -X POST "http://localhost:8000/llm/suggest-improvements/{evaluation_id}" \
  -H "Content-Type: application/json"
```

##  Best Practices

### Evaluation Workflow

1. **Start with Quick Evaluation**: Get immediate feedback
2. **Run Comprehensive Tests**: Full statistical + ML + privacy assessment
3. **Review AI Insights**: Understand results in business context
4. **Iterate and Improve**: Adjust parameters based on findings
5. **Document Results**: Keep records for compliance

### Quality Thresholds

**Development/Testing**:
- Statistical Similarity: > 0.75
- ML Utility: > 0.80
- Privacy Score: > 0.70

**Production Use**:
- Statistical Similarity: > 0.85
- ML Utility: > 0.90
- Privacy Score: > 0.80

**Critical Applications**:
- Statistical Similarity: > 0.95
- ML Utility: > 0.95
- Privacy Score: > 0.90

### Regular Monitoring

- **Daily**: Quick statistical checks for ongoing generation
- **Weekly**: Full ML utility evaluation
- **Monthly**: Comprehensive privacy assessment
- **Quarterly**: Cross-generator comparison and trend analysis

## � Troubleshooting

### Common Quality Issues

**Poor Statistical Similarity**:
```bash
Causes: Insufficient training, wrong method, data preprocessing issues
Solutions: Increase epochs, use CTGAN, check data quality
```

**Low ML Utility**:
```bash
Causes: Over-privacy, insufficient data, correlation loss
Solutions: Reduce privacy parameters, increase dataset size, use better methods
```

**Privacy Concerns**:
```bash
Causes: Weak privacy parameters, membership inference risks
Solutions: Use DP methods, adjust epsilon, implement output perturbation
```

### Performance Issues

**Slow Evaluation**:
```bash
Causes: Large datasets, complex ML models, full privacy tests
Solutions: Use quick evaluation, sample data, selective testing
```

**Memory Issues**:
```bash
Causes: Large datasets, complex models
Solutions: Reduce batch sizes, use sampling, optimize algorithms
```

##  Integration with Compliance

### Audit Trail Generation

Create compliance documentation:

```bash
# Generate compliance report
curl -X POST "http://localhost:8000/generators/{generator_id}/compliance-report" \
  -H "Content-Type: application/json" \
  -d '{"framework": "GDPR"}'
```

### Quality Certification

Document quality standards met:

```json
{
  "quality_certification": {
    "standard": "Enterprise Grade",
    "statistical_similarity_threshold": 0.85,
    "ml_utility_threshold": 0.90,
    "privacy_threshold": 0.80,
    "certified_date": "2025-11-27",
    "valid_until": "2026-11-27"
  }
}
```

##  Next Steps

After evaluating quality:

1. **[Use Privacy Features](privacy-features.md)** - Implement differential privacy if needed
2. **[Explore AI Features](ai-features.md)** - Get AI-powered insights and automation
3. **[Generate Compliance Reports](privacy-features.md#compliance-frameworks)** - Create audit documentation

---

**Need help interpreting results?** Use the `/llm/explain-metric` endpoint or check our [Reference Guide](../reference/troubleshooting.md).


