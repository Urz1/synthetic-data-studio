# Privacy Features & Differential Privacy

Learn how to use Synthetic Data Studio's differential privacy features to generate mathematically private synthetic data with regulatory compliance.

## 🔒 Differential Privacy Fundamentals

### What is Differential Privacy?

Differential Privacy (DP) is a mathematical framework that provides **strong privacy guarantees** for data analysis. It ensures that the output of any analysis is statistically indistinguishable whether or not any individual's data is included.

**Key Concept**: A DP algorithm adds carefully calibrated noise to ensure that individual records cannot be distinguished in the output.

### Privacy Parameters

#### Epsilon (ε) - Privacy Budget
- **Definition**: Maximum privacy loss per individual
- **Range**: 0.1 (very private) to 100+ (less private)
- **Interpretation**: Lower ε = stronger privacy guarantees
- **Typical Values**: 0.1-10.0 for production use

#### Delta (δ) - Failure Probability
- **Definition**: Probability that privacy guarantee fails
- **Typical Value**: 1/n (where n = dataset size)
- **Auto-calculated** in Synthetic Data Studio

### Privacy Levels

| Epsilon (ε) | Privacy Level | Use Case | Compliance |
|-------------|---------------|----------|------------|
| < 1.0 | Very Strong | Clinical trials, genomic data | HIPAA (PHI) |
| 1-5 | Strong | Healthcare, financial records | GDPR Article 9 |
| 5-10 | Moderate | Customer data, HR records | CCPA |
| 10-20 | Weak | Aggregated analytics | SOC-2 |
| > 20 | Minimal | Non-sensitive data | None required |

## 🛡️ Safety System

### 3-Layer Privacy Protection

Synthetic Data Studio implements a comprehensive safety system:

#### 1. Pre-Training Validation
**Purpose**: Prevent catastrophic privacy failures before training starts

```bash
# Validate DP configuration
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

**Validation Checks:**
- ✅ Sampling rate validation (< 10% recommended)
- ✅ Training steps calculation
- ✅ Noise multiplier computation
- ✅ Privacy budget verification

#### 2. Runtime Privacy Accounting
**Purpose**: Track actual privacy expenditure during training

- **Rényi Differential Privacy (RDP)** accounting
- **Composition theorems** for multiple training steps
- **Real-time budget tracking**
- **Automatic noise calibration**

#### 3. Post-Training Verification
**Purpose**: Confirm final privacy guarantees

```bash
# Get privacy report
curl http://localhost:8000/generators/{generator_id}/privacy-report
```

**Verification Includes:**
- 🔍 Actual epsilon achieved
- 📊 Privacy budget utilization
- ⚠️ Safety warnings and recommendations
- 📋 Compliance framework mapping

## 🚀 Using Differential Privacy

### Step 1: Validate Configuration

Always validate before training:

```bash
curl -X POST "http://localhost:8000/generators/dp/validate-config" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "550e8400-e29b-41d4-a716-446655440000",
    "generator_type": "dp-ctgan",
    "epochs": 50,
    "batch_size": 200,
    "target_epsilon": 10.0
  }'
```

**Successful Response:**
```json
{
  "is_valid": true,
  "errors": [],
  "warnings": [
    "Batch size (200) is 10% of dataset size - good for privacy"
  ],
  "requested_config": {
    "epochs": 50,
    "batch_size": 200,
    "target_epsilon": 10.0,
    "sampling_rate": "10.00%"
  },
  "recommended_config": {
    "epochs": 50,
    "batch_size": 200,
    "target_epsilon": 10.0,
    "expected_privacy_level": "Moderate"
  }
}
```

### Step 2: Get Recommendations

Let the system suggest optimal parameters:

```bash
curl "http://localhost:8000/generators/dp/recommended-config?dataset_id=550e8400-e29b-41d4-a716-446655440000&desired_quality=balanced"
```

**Quality Options:**
- `high_privacy`: ε < 5, prioritizes privacy over quality
- `balanced`: ε ≈ 10, good balance of privacy and utility
- `high_quality`: ε ≈ 15, prioritizes quality over privacy

### Step 3: Generate with Privacy

```bash
curl -X POST "http://localhost:8000/generators/dataset/550e8400-e29b-41d4-a716-446655440000/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-ctgan",
    "num_rows": 1000,
    "target_epsilon": 10.0,
    "epochs": 50,
    "batch_size": 200
  }'
```

### Step 4: Review Privacy Report

After generation, check the privacy report:

```bash
curl http://localhost:8000/generators/{generator_id}/privacy-report
```

**Sample Report:**
```json
{
  "generator_id": "gen-123",
  "privacy_level": "Moderate",
  "epsilon_achieved": 9.8,
  "epsilon_target": 10.0,
  "budget_utilization": "98%",
  "compliance_frameworks": {
    "HIPAA": {
      "compliant": true,
      "requirements_met": ["De-identification", "Privacy Rule"],
      "recommendations": ["Document privacy parameters in BAA"]
    },
    "GDPR": {
      "compliant": true,
      "requirements_met": ["Article 5", "Article 25"],
      "recommendations": ["Include in DPIA documentation"]
    }
  },
  "safety_assessment": {
    "risk_level": "low",
    "warnings": [],
    "recommendations": [
      "Privacy parameters are well-calibrated",
      "Consider ε=5.0 for higher privacy if needed"
    ]
  }
}
```

## 📊 DP Method Comparison

### DP-CTGAN vs DP-TVAE

| Feature | DP-CTGAN | DP-TVAE |
|---------|----------|---------|
| **Quality** | Excellent | Good |
| **Speed** | Slower | 2-3x faster |
| **Memory** | Higher | Lower |
| **Best For** | Complex data | Mixed types |
| **Training Time** | 10-30 min | 5-15 min |

### When to Use Each Method

**Choose DP-CTGAN when:**
- Maximum data quality is required
- Complex correlations need preservation
- Training time is not a constraint
- Dataset has intricate patterns

**Choose DP-TVAE when:**
- Faster generation is needed
- Dataset has mixed data types
- Memory constraints exist
- Prototyping or iteration speed matters

## ⚙️ Advanced Configuration

### Fine-Tuning Privacy Parameters

```json
{
  "target_epsilon": 5.0,
  "target_delta": 0.0001,
  "max_grad_norm": 1.0,
  "noise_multiplier": "auto",
  "epochs": 100,
  "batch_size": 100
}
```

### Understanding Noise Multiplier

The noise multiplier controls privacy-utility trade-off:

- **Lower values** (< 0.5): Less noise, better utility, weaker privacy
- **Medium values** (0.5-2.0): Balanced noise, good privacy-utility trade-off
- **Higher values** (> 2.0): More noise, stronger privacy, reduced utility

### Custom Delta Values

```json
{
  "target_delta": 1e-5,  // Instead of auto-calculated 1/n
  "target_epsilon": 1.0
}
```

**Note**: Lower delta values require more noise, reducing data quality.

## 🛡️ Compliance Frameworks

### HIPAA Compliance

**Requirements Met:**
- ✅ De-identification of Protected Health Information (PHI)
- ✅ Safe Harbor method compliance
- ✅ Expert determination documentation
- ✅ Privacy Rule compliance

**Implementation:**
```json
{
  "target_epsilon": 1.0,
  "generator_type": "dp-ctgan",
  "compliance_framework": "HIPAA"
}
```

### GDPR Compliance

**Requirements Met:**
- ✅ Data minimization (Article 5)
- ✅ Privacy by design (Article 25)
- ✅ Lawful processing (Article 6)
- ✅ Data protection impact assessment (Article 35)

**Implementation:**
```json
{
  "target_epsilon": 5.0,
  "generator_type": "dp-tvae",
  "compliance_framework": "GDPR"
}
```

### CCPA Compliance

**Requirements Met:**
- ✅ Right to know about data collection
- ✅ Right to delete personal information
- ✅ Right to opt-out of data sales
- ✅ Data minimization requirements

### SOC-2 Compliance

**Requirements Met:**
- ✅ Security principle
- ✅ Availability principle
- ✅ Processing integrity
- ✅ Confidentiality principle

## 🔍 Privacy Evaluation

### Membership Inference Testing

Check if synthetic data could reveal original records:

```bash
curl -X POST "http://localhost:8000/evaluations/run" \
  -H "Content-Type: application/json" \
  -d '{
    "generator_id": "gen-123",
    "dataset_id": "original-dataset-id",
    "include_privacy": true
  }'
```

### Attribute Inference Testing

Test for potential attribute disclosure:

```json
{
  "privacy_tests": {
    "membership_inference": true,
    "attribute_inference": true,
    "target_attributes": ["income", "age", "location"]
  }
}
```

## 📋 Best Practices

### Privacy-First Development

1. **Always Validate First**: Use `/dp/validate-config` before training
2. **Start Conservative**: Begin with lower epsilon values
3. **Monitor Budget**: Track privacy expenditure throughout training
4. **Document Decisions**: Record privacy parameters for compliance

### Parameter Selection Guidelines

#### For Healthcare Data (HIPAA)
```json
{
  "target_epsilon": 1.0,
  "generator_type": "dp-ctgan",
  "epochs": 100,
  "batch_size": 50
}
```

#### For Financial Data (GDPR)
```json
{
  "target_epsilon": 5.0,
  "generator_type": "dp-tvae",
  "epochs": 50,
  "batch_size": 100
}
```

#### For General Business Data
```json
{
  "target_epsilon": 10.0,
  "generator_type": "dp-ctgan",
  "epochs": 50,
  "batch_size": 200
}
```

### Quality vs Privacy Trade-offs

**High Privacy (ε < 5):**
- ✅ Strong privacy guarantees
- ⚠️ Reduced data quality
- ⚠️ More noise in results
- ✅ Regulatory compliance

**Balanced Approach (ε = 5-10):**
- ✅ Good privacy protection
- ✅ Reasonable data quality
- ✅ Practical for most use cases
- ✅ Compliance-friendly

**High Quality (ε > 10):**
- ⚠️ Weaker privacy guarantees
- ✅ Better data utility
- ✅ Less noise in results
- ⚠️ May not meet strict compliance

## 🚨 Common Issues & Solutions

### "Sampling Rate Too High"

**Error:** `Batch size too large (>20% of dataset)`

**Solution:**
```json
{
  "batch_size": 100,  // Reduce from 500
  "epochs": 25        // May need to increase epochs
}
```

### "Privacy Budget Exceeded"

**Error:** `Target epsilon too low for training parameters`

**Solutions:**
1. Increase target epsilon
2. Reduce epochs
3. Increase batch size
4. Use DP-TVAE instead of DP-CTGAN

### "Training Unstable"

**Error:** `Privacy accounting failed - training unstable`

**Solutions:**
1. Reduce learning rate
2. Increase max_grad_norm
3. Use smaller batch sizes
4. Validate configuration first

### "Poor Quality Results"

**Issue:** Synthetic data quality is low despite DP guarantees

**Solutions:**
1. Increase epochs gradually
2. Use DP-CTGAN over DP-TVAE
3. Adjust noise multiplier
4. Consider non-DP methods if privacy requirements allow

## 📊 Monitoring & Auditing

### Privacy Budget Tracking

Monitor privacy expenditure:

```bash
# Check generator status during training
curl http://localhost:8000/generators/{generator_id}

# Review final privacy report
curl http://localhost:8000/generators/{generator_id}/privacy-report
```

### Audit Trail

Maintain records for compliance:

- Configuration parameters used
- Validation results
- Privacy reports generated
- Quality evaluation results
- Compliance framework mappings

### Performance Monitoring

Track DP training metrics:

- Training time vs privacy parameters
- Memory usage patterns
- Convergence behavior
- Quality metrics over time

## 🔗 Integration with Compliance

### Automated Compliance Reporting

Generate compliance documentation:

```bash
curl -X POST "http://localhost:8000/generators/{generator_id}/compliance-report" \
  -H "Content-Type: application/json" \
  -d '{"framework": "HIPAA"}'
```

### Model Cards

Create comprehensive model documentation:

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

## 📚 Next Steps

After implementing privacy features:

1. **[Evaluate Quality](evaluating-quality.md)** - Assess privacy-utility trade-offs
2. **[Generate Compliance Reports](evaluating-quality.md#compliance-reporting)** - Create audit documentation
3. **[Use AI Features](ai-features.md)** - Get AI-powered privacy insights

---

**Need help with privacy parameters?** Use the `/dp/recommended-config` endpoint or check our [Troubleshooting Guide](../reference/troubleshooting.md).