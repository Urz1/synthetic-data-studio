# Privacy Synthesis Tutorial

Learn how to generate synthetic data with differential privacy guarantees. This tutorial covers HIPAA, GDPR, and CCPA compliance requirements.

## 🎯 Tutorial Goals

By the end of this tutorial, you will:
- Understand differential privacy concepts
- Generate data with mathematical privacy guarantees
- Validate privacy configurations before training
- Review privacy reports and compliance documentation
- Choose appropriate privacy parameters for your use case

**Time Required**: 25-35 minutes
**Difficulty**: Intermediate
**Prerequisites**: Basic synthesis tutorial completed

## 🔒 Differential Privacy Fundamentals

### What is Differential Privacy?

Differential Privacy (DP) provides **mathematical guarantees** that individual records cannot be distinguished in analysis results. It adds carefully calibrated noise to ensure privacy while preserving statistical utility.

**Key Concept**: A DP algorithm guarantees that whether or not any individual's data is included, the output distribution remains statistically indistinguishable.

### Privacy Parameters

#### Epsilon (ε) - Privacy Budget
- **Lower values** = Stronger privacy (more noise)
- **Higher values** = Weaker privacy (less noise, better utility)
- **Typical range**: 0.1 to 20.0

#### Delta (δ) - Failure Probability
- **Probability that privacy guarantee fails**
- **Typically**: 1/dataset_size or 1e-5 for large datasets
- **Auto-calculated** in Synthetic Data Studio

### Privacy Levels by Use Case

| Use Case | Epsilon Range | Privacy Level | Compliance |
|----------|---------------|---------------|------------|
| Clinical trials | 0.1 - 1.0 | Very Strong | HIPAA PHI |
| Healthcare data | 1.0 - 5.0 | Strong | GDPR Article 9 |
| Customer data | 5.0 - 10.0 | Moderate | CCPA |
| Analytics | 10.0 - 20.0 | Weak | SOC-2 |

## 🛡️ Safety-First Workflow

### Step 1: Validate Configuration (Always First!)

**Never start DP training without validation!**

```bash
curl -X POST "http://localhost:8000/generators/dp/validate-config" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "your-dataset-id",
    "generator_type": "dp-ctgan",
    "epochs": 50,
    "batch_size": 200,
    "target_epsilon": 10.0
  }'
```

**Successful Validation:**
```json
{
  "is_valid": true,
  "errors": [],
  "warnings": ["Batch size is 10% of dataset - good for privacy"],
  "recommended_config": {
    "epochs": 50,
    "batch_size": 200,
    "target_epsilon": 10.0,
    "expected_privacy_level": "Moderate"
  }
}
```

**Common Validation Errors:**
```json
{
  "is_valid": false,
  "errors": ["Batch size (500) too large for dataset (1000 rows)"],
  "warnings": [],
  "recommended_config": {
    "batch_size": 100,
    "epochs": 25
  }
}
```

### Step 2: Understand the Warnings

**Batch Size Warnings:**
- ✅ "Batch size is 10% of dataset" = Good for privacy
- ⚠️ "Batch size is 20% of dataset" = Moderate risk
- ❌ "Batch size too large" = High privacy risk

**Training Step Warnings:**
- ✅ "< 500 steps" = Good for privacy
- ⚠️ "500-1000 steps" = Moderate consumption
- ❌ "> 1000 steps" = High privacy budget usage

## 🚀 Generate Privacy-Preserving Data

### Healthcare Data Example (HIPAA Compliance)

#### Scenario
- **Dataset**: 10,000 patient records with PHI
- **Requirements**: HIPAA compliance, strong privacy
- **Use Case**: ML model training for disease prediction

#### Step 1: Upload and Profile

```bash
# Upload healthcare dataset
curl -X POST "http://localhost:8000/datasets/upload" \
  -F "file=@healthcare_data.csv"

# Profile the data
curl -X POST "http://localhost:8000/datasets/{dataset_id}/profile"

# Check for PII
curl -X POST "http://localhost:8000/datasets/{dataset_id}/pii-detection"
```

#### Step 2: Validate DP Configuration

```bash
curl -X POST "http://localhost:8000/generators/dp/validate-config" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "health-dataset-id",
    "generator_type": "dp-ctgan",
    "epochs": 100,
    "batch_size": 100,
    "target_epsilon": 1.0
  }'
```

**Why these parameters?**
- `epsilon: 1.0` = Strong HIPAA-compliant privacy
- `batch_size: 100` = 1% of 10k dataset (excellent for privacy)
- `epochs: 100` = Sufficient training for quality

#### Step 3: Generate with Privacy

```bash
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-ctgan",
    "num_rows": 10000,
    "target_epsilon": 1.0,
    "epochs": 100,
    "batch_size": 100
  }'
```

**Monitor Progress:**
```bash
# Check status
curl http://localhost:8000/generators/{generator_id}
```

#### Step 4: Review Privacy Report

```bash
curl http://localhost:8000/generators/{generator_id}/privacy-report
```

**Expected Report:**
```json
{
  "generator_id": "gen-health-123",
  "privacy_level": "Strong",
  "epsilon_achieved": 0.95,
  "epsilon_target": 1.0,
  "budget_utilization": "95%",
  "compliance_frameworks": {
    "HIPAA": {
      "compliant": true,
      "requirements_met": [
        "De-identification of PHI",
        "Privacy Rule compliance",
        "Minimum necessary standard"
      ],
      "recommendations": [
        "Document epsilon value in BAA",
        "Include in HIPAA risk assessment"
      ]
    }
  },
  "safety_assessment": {
    "risk_level": "low",
    "warnings": [],
    "recommendations": [
      "Privacy parameters are well-calibrated for healthcare use"
    ]
  }
}
```

### Financial Data Example (GDPR Compliance)

#### Scenario
- **Dataset**: 50,000 customer transaction records
- **Requirements**: GDPR Article 35 (DPIA), data minimization
- **Use Case**: Fraud detection model training

#### Configuration for GDPR

```bash
curl -X POST "http://localhost:8000/generators/dp/validate-config" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "finance-dataset-id",
    "generator_type": "dp-tvae",
    "epochs": 50,
    "batch_size": 250,
    "target_epsilon": 5.0
  }'
```

**Why DP-TVAE?**
- Faster than DP-CTGAN for large datasets
- Good for mixed numerical/categorical data
- Suitable for transaction data

#### Generate Financial Data

```bash
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-tvae",
    "num_rows": 50000,
    "target_epsilon": 5.0,
    "epochs": 50,
    "batch_size": 250
  }'
```

### Customer Data Example (CCPA Compliance)

#### Scenario
- **Dataset**: 25,000 customer profiles
- **Requirements**: CCPA right to deletion, data minimization
- **Use Case**: Customer analytics and personalization

#### CCPA-Compliant Configuration

```bash
curl -X POST "http://localhost:8000/generators/dp/validate-config" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "customer-dataset-id",
    "generator_type": "dp-ctgan",
    "epochs": 75,
    "batch_size": 125,
    "target_epsilon": 10.0
  }'
```

## 📊 Compare Privacy vs Quality Trade-offs

### Generate Multiple Versions

Let's create three versions with different privacy levels:

#### Version 1: High Privacy (ε = 1.0)
```json
{
  "generator_type": "dp-ctgan",
  "num_rows": 1000,
  "target_epsilon": 1.0,
  "epochs": 100,
  "batch_size": 50
}
```

#### Version 2: Balanced (ε = 5.0)
```json
{
  "generator_type": "dp-ctgan",
  "num_rows": 1000,
  "target_epsilon": 5.0,
  "epochs": 75,
  "batch_size": 100
}
```

#### Version 3: High Utility (ε = 10.0)
```json
{
  "generator_type": "ctgan",
  "num_rows": 1000,
  "epochs": 50,
  "batch_size": 200
}
```

### Evaluate All Versions

```bash
# Evaluate each generator
for gen_id in "gen-v1" "gen-v2" "gen-v3"; do
  curl -X POST "http://localhost:8000/evaluations/quick/${gen_id}"
done
```

### Compare Results

| Version | Epsilon | Quality Score | Privacy Level | Use Case |
|---------|---------|----------------|----------------|----------|
| V1 | 1.0 | 0.78 | Very Strong | Clinical research |
| V2 | 5.0 | 0.85 | Strong | Healthcare analytics |
| V3 | 10.0 | 0.92 | Moderate | Customer insights |

**Key Insights:**
- **Privacy comes at a cost**: Lower ε reduces utility
- **Choose based on requirements**: Clinical trials need ε < 1.0
- **Balance is possible**: ε = 5.0 often provides good trade-off

## 🛡️ Compliance Documentation

### Generate Compliance Reports

```bash
# HIPAA compliance report
curl -X POST "http://localhost:8000/generators/{generator_id}/compliance-report" \
  -H "Content-Type: application/json" \
  -d '{"framework": "HIPAA"}'

# GDPR compliance report
curl -X POST "http://localhost:8000/generators/{generator_id}/compliance-report" \
  -H "Content-Type: application/json" \
  -d '{"framework": "GDPR"}'
```

### Model Cards

Create comprehensive documentation:

```bash
curl -X POST "http://localhost:8000/generators/{generator_id}/model-card" \
  -H "Content-Type: application/json" \
  -d '{"include_privacy": true}'
```

### Audit Narratives

Generate human-readable audit trails:

```bash
curl http://localhost:8000/generators/{generator_id}/audit-narrative
```

## 🔍 Advanced Privacy Analysis

### Membership Inference Testing

Check if synthetic data reveals original records:

```bash
curl -X POST "http://localhost:8000/evaluations/run" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_id": "gen-123",
    "dataset_id": "original-dataset-id",
    "include_privacy": true
  }'
```

**Good Privacy Result:**
```json
{
  "privacy_tests": {
    "membership_inference": {
      "attack_success_rate": 0.51,
      "baseline_accuracy": 0.50,
      "privacy_score": 0.98,
      "risk_level": "low",
      "interpretation": "No significant membership inference risk"
    }
  }
}
```

### Attribute Inference Testing

Test for sensitive attribute disclosure:

```json
{
  "privacy_tests": {
    "attribute_inference": {
      "target_attribute": "salary",
      "attack_accuracy": 0.12,
      "baseline_accuracy": 0.10,
      "privacy_score": 0.80,
      "risk_level": "low"
    }
  }
}
```

## 🎯 Parameter Optimization

### Systematic Parameter Search

#### Start Conservative
```json
{
  "target_epsilon": 1.0,
  "epochs": 50,
  "batch_size": 100
}
```

#### Test Quality Impact
- Run evaluation after each change
- Monitor statistical similarity scores
- Check ML utility metrics

#### Adjust Based on Results
```json
// If quality too low, increase epsilon
{
  "target_epsilon": 2.0,
  "epochs": 75,
  "batch_size": 100
}

// If privacy too weak, decrease epsilon
{
  "target_epsilon": 0.5,
  "epochs": 100,
  "batch_size": 50
}
```

### Automated Recommendations

Use the API to get parameter suggestions:

```bash
curl "http://localhost:8000/generators/dp/recommended-config?dataset_id={id}&desired_quality=balanced"
```

## 🚨 Common Privacy Issues

### "Epsilon Too Low" Error

**Problem**: Target epsilon cannot be achieved with current parameters

**Solutions**:
1. Increase batch size
2. Reduce epochs
3. Use DP-TVAE instead of DP-CTGAN
4. Accept higher epsilon value

### Poor Quality with Strong Privacy

**Problem**: ε = 0.1 produces unusable synthetic data

**Solutions**:
1. Assess if ε = 0.1 is truly required
2. Consider ε = 1.0 for better utility
3. Use domain-specific privacy approaches
4. Implement hybrid approaches (DP + other techniques)

### Membership Inference Failures

**Problem**: Privacy attacks succeed too often

**Solutions**:
1. Reduce epsilon further
2. Increase noise multiplier
3. Use different DP algorithm
4. Implement additional privacy techniques

## 📋 Compliance Checklist

### HIPAA Compliance
- [ ] ε ≤ 1.0 for PHI data
- [ ] Document privacy parameters in BAA
- [ ] Include in HIPAA risk assessment
- [ ] Regular privacy audits
- [ ] Staff training on DP concepts

### GDPR Compliance
- [ ] Data Protection Impact Assessment (DPIA)
- [ ] Privacy by design documentation
- [ ] Lawful processing justification
- [ ] Data minimization evidence
- [ ] Individual rights implementation

### CCPA Compliance
- [ ] Privacy notice updates
- [ ] Data usage documentation
- [ ] Individual rights responses
- [ ] Service provider agreements
- [ ] Security assessments

## 🏆 Tutorial Complete!

### What You Accomplished

✅ **Understood differential privacy concepts**
✅ **Validated DP configurations safely**
✅ **Generated privacy-preserving synthetic data**
✅ **Reviewed compliance documentation**
✅ **Compared privacy-utility trade-offs**
✅ **Created audit-ready reports**

### Your Privacy-Compliant Dataset

You now have:
- **Mathematically private synthetic data**
- **Compliance documentation** for HIPAA/GDPR/CCPA
- **Privacy guarantees** with known epsilon bounds
- **Audit trails** for regulatory reviews

## 🚀 Advanced Topics

### Next Steps

1. **[Quality Evaluation Tutorial](quality-evaluation.md)**: Deep dive into evaluation metrics
2. **[Compliance Reporting Tutorial](compliance-reporting.md)**: Generate audit documentation
3. **[API Integration Guide](../developer-guide/api-integration.md)**: Build custom integrations

### Advanced Privacy Techniques

- **Hybrid Approaches**: Combine DP with other privacy methods
- **Local Differential Privacy**: Client-side privacy
- **Federated Learning**: Privacy-preserving distributed training
- **Homomorphic Encryption**: Compute on encrypted data

### Research Directions

- **Dynamic Epsilon**: Adjust privacy based on data sensitivity
- **Attribute-Specific Privacy**: Different epsilon for different columns
- **Temporal Privacy**: Privacy over time series data
- **Composition Attacks**: Advanced privacy threat models

## 📚 Resources

### Documentation
- **[Privacy Features Guide](../user-guide/privacy-features.md)**: Complete DP reference
- **[API Examples](../examples/)**: Code examples and API usage
- **[Compliance Guide](../user-guide/privacy-features.md#compliance-frameworks)**: Regulatory requirements

### Research Papers
- **"Deep Learning with Differential Privacy"** (Abadi et al.)
- **"Differential Privacy: A Survey"** (Dwork & Roth)
- **"Privacy-Preserving Synthetic Data"** (Bowen & Liu)

### Tools & Libraries
- **Opacus**: PyTorch differential privacy library
- **TensorFlow Privacy**: TF differential privacy
- **PySyft**: Privacy-preserving machine learning

---

**Congratulations!** 🔒 You now know how to generate mathematically private synthetic data. Your datasets are ready for HIPAA, GDPR, and CCPA compliance!