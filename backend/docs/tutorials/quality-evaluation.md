# Quality Evaluation Tutorial

Master the art of evaluating synthetic data quality using comprehensive statistical tests, ML utility assessments, and privacy leakage detection.

## 🎯 Tutorial Goals

By the end of this tutorial, you will:
- Understand all quality evaluation metrics
- Run comprehensive quality assessments
- Interpret evaluation results correctly
- Identify and fix quality issues
- Compare different synthesis methods
- Generate professional quality reports

**Time Required**: 30-40 minutes
**Difficulty**: Advanced
**Prerequisites**: Basic and privacy synthesis tutorials completed

## 📊 Quality Evaluation Framework

### Three Dimensions of Quality

Synthetic Data Studio evaluates quality across three critical dimensions:

#### 1. Statistical Similarity
**Question**: How well does the synthetic data match real data distributions?

#### 2. Machine Learning Utility
**Question**: Can you train effective ML models on synthetic data?

#### 3. Privacy Preservation
**Question**: Are there unacceptable privacy leakage risks?

### Quality Score Interpretation

| Score Range | Quality Level | Description | Action Required |
|-------------|---------------|-------------|-----------------|
| 0.9-1.0 | Excellent | Exceptional quality | Production ready |
| 0.8-0.9 | Good | High quality | Most applications |
| 0.7-0.8 | Acceptable | Reasonable quality | Development/testing |
| 0.6-0.7 | Marginal | Limited quality | Needs improvement |
| < 0.6 | Poor | Significant issues | Not recommended |

## 🧪 Running Comprehensive Evaluations

### Step 1: Prepare Your Data

First, ensure you have both original and synthetic datasets:

```bash
# Upload original dataset
curl -X POST "http://localhost:8000/datasets/upload" \
  -F "file=@original_data.csv"

# Generate synthetic data (from previous tutorials)
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "ctgan",
    "num_rows": 1000,
    "epochs": 50
  }'
```

### Step 2: Run Full Evaluation Suite

Execute comprehensive quality assessment:

```bash
curl -X POST "http://localhost:8000/evaluations/run" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_id": "your-generator-id",
    "dataset_id": "original-dataset-id",
    "include_statistical": true,
    "include_ml_utility": true,
    "include_privacy": true
  }'
```

**Expected Response:**
```json
{
  "evaluation_id": "eval-comprehensive-123",
  "status": "running",
  "estimated_duration": "5-10 minutes",
  "tests_included": [
    "statistical_similarity",
    "ml_utility",
    "privacy_preservation"
  ]
}
```

### Step 3: Monitor Evaluation Progress

```bash
# Check evaluation status
curl http://localhost:8000/evaluations/eval-comprehensive-123
```

### Step 4: Review Complete Results

```bash
# Get full evaluation report
curl http://localhost:8000/evaluations/eval-comprehensive-123
```

## 📈 Understanding Statistical Similarity

### Kolmogorov-Smirnov Test

**Purpose**: Tests if two continuous distributions are identical

**How it works**:
- Compares empirical distribution functions
- Measures maximum difference between distributions
- Returns p-value for statistical significance

```json
{
  "statistical_similarity": {
    "kolmogorov_smirnov": {
      "age": {
        "statistic": 0.087,
        "p_value": 0.23,
        "passed": true,
        "interpretation": "Distributions are statistically similar (p > 0.05)"
      },
      "income": {
        "statistic": 0.045,
        "p_value": 0.67,
        "passed": true,
        "interpretation": "Excellent distribution match"
      }
    }
  }
}
```

**Interpretation Guide**:
- ✅ **p > 0.05**: Distributions are similar (good)
- ⚠️ **p = 0.01-0.05**: Marginally different
- ❌ **p < 0.01**: Distributions are different (needs improvement)

### Chi-Square Test for Categorical Data

**Purpose**: Tests independence for categorical/binned data

```json
{
  "statistical_similarity": {
    "chi_square": {
      "category": {
        "statistic": 12.3,
        "p_value": 0.14,
        "degrees_of_freedom": 4,
        "passed": true,
        "interpretation": "Category distributions match well"
      }
    }
  }
}
```

### Wasserstein Distance

**Purpose**: Measures distribution difference (Earth Mover's Distance)

**Best for**: Overall distribution similarity assessment

```json
{
  "statistical_similarity": {
    "wasserstein_distance": {
      "income": {
        "distance": 0.045,
        "normalized_distance": 0.045,
        "passed": true,
        "interpretation": "Excellent distribution match (< 5% difference)"
      },
      "age": {
        "distance": 0.123,
        "normalized_distance": 0.123,
        "passed": false,
        "interpretation": "Distribution difference detected (> 10%)"
      }
    }
  }
}
```

**Distance Scale**:
- ✅ **< 0.05**: Excellent match
- ✅ **0.05-0.10**: Good match
- ⚠️ **0.10-0.20**: Acceptable
- ❌ **> 0.20**: Poor match

## 🤖 Machine Learning Utility Assessment

### Classification Performance

**Purpose**: Tests if synthetic data can train good classifiers

**Methodology**:
1. Train classifier on synthetic data
2. Test on real data holdout set
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

**Purpose**: Tests predictive relationships preservation

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

### Cross-Validation Stability

**Purpose**: Ensures robust performance across different data splits

```json
{
  "ml_utility": {
    "cross_validation": {
      "folds": 5,
      "mean_accuracy": 0.86,
      "std_accuracy": 0.02,
      "confidence_interval": [0.84, 0.88],
      "stable_performance": true,
      "interpretation": "Stable performance across data splits"
    }
  }
}
```

## 🔒 Privacy Leakage Detection

### Membership Inference Attack

**Purpose**: Tests if synthetic data reveals whether records were used in training

```json
{
  "privacy_preservation": {
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

**Risk Assessment**:
- ✅ **< 0.55**: Low risk (good privacy)
- ⚠️ **0.55-0.60**: Moderate risk
- ❌ **> 0.60**: High risk (privacy concerns)

### Attribute Inference Attack

**Purpose**: Tests if sensitive attributes can be inferred from synthetic data

```json
{
  "privacy_preservation": {
    "attribute_inference": {
      "target_attribute": "salary",
      "attack_accuracy": 0.15,
      "baseline_accuracy": 0.10,
      "privacy_score": 0.67,
      "risk_level": "moderate",
      "recommendations": [
        "Consider using differential privacy for this attribute",
        "Reduce salary correlation with other features"
      ]
    }
  }
}
```

## 📋 Complete Evaluation Report

### Overall Assessment Structure

```json
{
  "evaluation_id": "eval-comprehensive-123",
  "generator_id": "gen-ctgan-456",
  "dataset_id": "data-original-789",
  "overall_quality_score": 0.83,
  "quality_level": "Good",
  "execution_time": "8.5 minutes",
  "recommendations": [
    "Overall quality is good for most applications",
    "Consider privacy-preserving methods for sensitive attributes",
    "Statistical similarity could be improved with more training"
  ]
}
```

### Detailed Component Breakdown

```json
{
  "statistical_similarity": {
    "overall_score": 0.88,
    "passed_tests": 8,
    "total_tests": 10,
    "failed_columns": ["age"],
    "recommendations": [
      "Review age distribution - KS test failed",
      "Consider increasing training epochs for better fit"
    ]
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
    "recommendations": [
      "Use DP methods for high-risk attributes",
      "Consider ε=5.0 for better privacy-utility balance"
    ]
  }
}
```

## 🔍 Comparative Analysis

### Compare Multiple Generators

Evaluate different synthesis methods side-by-side:

```bash
# Generate with different methods
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{"generator_type": "ctgan", "num_rows": 1000}'

curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{"generator_type": "tvae", "num_rows": 1000}'

curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{"generator_type": "dp-ctgan", "num_rows": 1000, "target_epsilon": 10.0}'
```

### Run Comparative Evaluation

```bash
curl -X POST "http://localhost:8000/evaluations/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "evaluation_ids": ["eval-ctgan", "eval-tvae", "eval-dp-ctgan"],
    "comparison_metrics": ["overall_score", "statistical_similarity", "ml_utility"]
  }'
```

### Comparative Results

```json
{
  "comparison": {
    "generators": [
      {
        "generator_id": "gen-ctgan",
        "method": "CTGAN",
        "overall_score": 0.89,
        "statistical_similarity": 0.92,
        "ml_utility": 0.94,
        "privacy_score": 0.0
      },
      {
        "generator_id": "gen-tvae",
        "method": "TVAE",
        "overall_score": 0.82,
        "statistical_similarity": 0.85,
        "ml_utility": 0.87,
        "privacy_score": 0.0
      },
      {
        "generator_id": "gen-dp-ctgan",
        "method": "DP-CTGAN",
        "overall_score": 0.76,
        "statistical_similarity": 0.78,
        "ml_utility": 0.82,
        "privacy_score": 0.95
      }
    ],
    "insights": {
      "best_overall": "CTGAN",
      "best_privacy": "DP-CTGAN",
      "trade_off_analysis": "DP-CTGAN provides strong privacy but at 15% quality cost",
      "recommendations": [
        "Use CTGAN for development and testing",
        "Use DP-CTGAN for production with sensitive data",
        "TVAE offers good middle-ground option"
      ]
    }
  }
}
```

## 🔧 Improving Quality Scores

### Statistical Similarity Issues

**Problem**: Poor distribution matching (KS test failures)

**Solutions**:
```json
{
  "increase_epochs": true,
  "recommended_epochs": 150,
  "use_ctgan_instead": true,
  "add_data_augmentation": true,
  "estimated_improvement": "20-30% better similarity"
}
```

**Problem**: Categorical data imbalance

**Solutions**:
```json
{
  "use_mode_specific_loss": true,
  "increase_embedding_dim": true,
  "recommended_embedding_dim": 256,
  "balance_training_data": true
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
  "recommended_batch_size": 256,
  "add_feature_engineering": true
}
```

### Privacy Issues

**Problem**: Membership inference vulnerability

**Solutions**:
```json
{
  "use_differential_privacy": true,
  "recommended_epsilon": 5.0,
  "add_output_perturbation": true,
  "implement_privacy_accounting": true
}
```

## 🎯 Custom Evaluation Configuration

### Selective Testing

Run only specific tests for faster iteration:

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

Customize machine learning evaluation parameters:

```json
{
  "ml_utility_config": {
    "test_size": 0.3,
    "random_state": 42,
    "cross_validation_folds": 5,
    "algorithms": ["random_forest", "xgboost", "logistic_regression"],
    "metrics": ["accuracy", "precision", "recall", "f1", "auc", "r_squared"],
    "hyperparameters": {
      "random_forest": {"n_estimators": 100, "max_depth": 10},
      "xgboost": {"n_estimators": 100, "learning_rate": 0.1}
    }
  }
}
```

### Privacy Test Customization

Configure privacy evaluation parameters:

```json
{
  "privacy_config": {
    "membership_inference": {
      "attack_model": "neural_network",
      "shadow_models": 5,
      "test_ratio": 0.3,
      "confidence_threshold": 0.8
    },
    "attribute_inference": {
      "target_attributes": ["salary", "medical_history"],
      "auxiliary_columns": ["age", "gender", "location"],
      "attack_epsilon": 0.1,
      "sensitivity_analysis": true
    }
  }
}
```

## 🤖 AI-Powered Insights

### Natural Language Explanations

Get AI-powered analysis of your evaluation results:

```bash
curl -X POST "http://localhost:8000/evaluations/{evaluation_id}/explain" \
  -H "Content-Type: application/json"
```

**AI Analysis Example**:
```json
{
  "evaluation_id": "eval-123",
  "ai_insights": {
    "executive_summary": "Your synthetic data shows strong statistical similarity but moderate ML utility. The privacy assessment indicates low risk of membership inference.",
    "key_findings": [
      "Kolmogorov-Smirnov tests passed for 8/10 columns with excellent p-values",
      "ML classification accuracy is 87% of baseline performance",
      "Membership inference attack success rate is only 52% (near random)"
    ],
    "strengths": [
      "Excellent distribution preservation for continuous variables",
      "Strong privacy protection against membership attacks",
      "Good cross-validation stability"
    ],
    "areas_for_improvement": [
      "ML utility could be improved with more training data",
      "Consider differential privacy for enhanced privacy guarantees",
      "Some categorical variables show slight distribution drift"
    ],
    "recommendations": [
      "Increase training dataset size by 2-3x for better ML performance",
      "Use CTGAN with 100+ epochs for improved statistical fidelity",
      "Implement DP-CTGAN with ε=10.0 for production deployment"
    ],
    "business_impact": "Suitable for development and testing environments. With recommended improvements, this synthetic data will be production-ready for most analytical applications."
  }
}
```

### Smart Suggestions

Get AI recommendations for quality improvement:

```bash
curl -X POST "http://localhost:8000/llm/suggest-improvements/{evaluation_id}" \
  -H "Content-Type: application/json"
```

## 📊 Quality Monitoring Dashboard

### Track Quality Over Time

Monitor quality trends across multiple evaluations:

```bash
# Get evaluation history for a generator
curl http://localhost:8000/evaluations/generator/{generator_id}

# Compare quality across versions
curl -X POST "http://localhost:8000/evaluations/compare" \
  -H "Content-Type: application/json" \
  -d '{"evaluation_ids": ["eval-v1", "eval-v2", "eval-v3"]}'
```

### Quality Metrics Dashboard

```json
{
  "quality_dashboard": {
    "current_quality": {
      "overall_score": 0.85,
      "quality_level": "Good",
      "trend": "improving"
    },
    "historical_performance": {
      "last_30_days": {
        "average_score": 0.82,
        "best_score": 0.89,
        "worst_score": 0.75
      },
      "improvement_rate": "+5% over last month"
    },
    "quality_distribution": {
      "excellent": 15,
      "good": 45,
      "acceptable": 30,
      "marginal": 8,
      "poor": 2
    }
  }
}
```

## 📋 Quality Certification

### Generate Quality Reports

Create professional quality certification documents:

```bash
curl -X POST "http://localhost:8000/generators/{generator_id}/model-card" \
  -H "Content-Type: application/json" \
  -d '{"include_quality_metrics": true}'
```

### Quality Standards Compliance

```json
{
  "quality_certification": {
    "standard": "Enterprise Grade",
    "version": "1.0",
    "certification_date": "2025-11-27",
    "valid_until": "2026-11-27",
    "quality_requirements": {
      "statistical_similarity": ">= 0.85",
      "ml_utility": ">= 0.90",
      "privacy_score": ">= 0.80"
    },
    "actual_metrics": {
      "statistical_similarity": 0.87,
      "ml_utility": 0.92,
      "privacy_score": 0.85
    },
    "compliance_status": "PASSED",
    "certified_use_cases": [
      "Development and testing",
      "Model validation",
      "Analytics training",
      "Data sharing (with privacy review)"
    ]
  }
}
```

## 🚨 Troubleshooting Quality Issues

### Common Quality Problems

**Inconsistent Statistical Tests**
```
Cause: Small sample sizes, outliers, non-normal distributions
Solution: Increase evaluation sample size, handle outliers, use appropriate tests
```

**Poor ML Utility**
```
Cause: Insufficient training data, wrong algorithm, feature loss
Solution: Increase synthetic dataset size, choose better algorithm, preserve correlations
```

**Privacy Test Failures**
```
Cause: Weak privacy parameters, membership inference risks
Solution: Use DP methods, adjust epsilon, implement better privacy techniques
```

**Slow Evaluations**
```
Cause: Large datasets, complex ML models, full privacy tests
Solution: Use quick evaluations for iteration, sample data for testing, selective test runs
```

### Performance Optimization

**Speed Up Evaluations**:
- Use quick statistical evaluation for iteration
- Sample smaller datasets for testing
- Run selective tests (statistical only)
- Cache evaluation results

**Improve Accuracy**:
- Use larger evaluation datasets
- Run multiple cross-validation folds
- Include diverse test scenarios
- Validate against domain expertise

## 🏆 Tutorial Complete!

### What You Mastered

✅ **Comprehensive quality evaluation** across all dimensions
✅ **Statistical similarity assessment** with multiple test methods
✅ **Machine learning utility testing** with cross-validation
✅ **Privacy leakage detection** and risk assessment
✅ **Comparative analysis** of different synthesis methods
✅ **Quality improvement strategies** and parameter optimization
✅ **Professional reporting** and certification generation

### Your Quality Assessment Toolkit

You now have the expertise to:
- **Evaluate any synthetic dataset** comprehensively
- **Identify quality issues** and their root causes
- **Optimize synthesis parameters** for better results
- **Compare synthesis methods** objectively
- **Generate professional reports** for stakeholders
- **Make data-driven decisions** about synthetic data usage

## 🚀 Advanced Applications

### Quality Assurance Pipelines

Implement automated quality checks in CI/CD:

```yaml
# .github/workflows/quality-check.yml
name: Quality Assurance

on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Generate test data
        run: python scripts/generate_test_data.py

      - name: Run quality evaluation
        run: python scripts/quality_evaluation.py

      - name: Check quality thresholds
        run: |
          if [ "$(cat quality_score.txt)" -lt "80" ]; then
            echo "Quality score below threshold"
            exit 1
          fi
```

### Multi-Stage Quality Gates

Implement quality gates for different environments:

```json
{
  "quality_gates": {
    "development": {
      "statistical_similarity": ">= 0.70",
      "ml_utility": ">= 0.75",
      "privacy_score": ">= 0.60"
    },
    "staging": {
      "statistical_similarity": ">= 0.80",
      "ml_utility": ">= 0.85",
      "privacy_score": ">= 0.75"
    },
    "production": {
      "statistical_similarity": ">= 0.85",
      "ml_utility": ">= 0.90",
      "privacy_score": ">= 0.80"
    }
  }
}
```

## 📚 Next Steps

After mastering quality evaluation:

1. **[Compliance Reporting Tutorial](compliance-reporting.md)**: Generate audit documentation
2. **[API Integration Guide](../developer-guide/api-integration.md)**: Build custom applications
3. **[Deployment Guide](../developer-guide/deployment.md)**: Production deployment strategies

### Further Learning

- **Research Papers**: Latest advances in synthetic data quality assessment
- **Industry Benchmarks**: Compare against published quality standards
- **Advanced Techniques**: Novel evaluation methods and metrics
- **Domain-Specific**: Healthcare, finance, and industry-specific quality requirements

---

**Congratulations!** 📊 You are now a synthetic data quality evaluation expert. Your datasets are ready for rigorous quality assurance and production deployment!