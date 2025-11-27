# Privacy Levels Reference

Comprehensive guide to understanding and selecting appropriate privacy levels (epsilon values) for different use cases and regulatory requirements.

## Understanding Epsilon (ε)

### What is Epsilon?

Epsilon (ε) is the **privacy budget** in differential privacy. It represents the maximum amount of privacy loss an individual can experience from a single query or analysis.

- **Lower ε** = Stronger privacy protection, more noise added
- **Higher ε** = Weaker privacy protection, less noise, better utility
- **ε = 0** = Perfect privacy (impossible in practice)
- **ε → ∞** = No privacy protection

### Privacy Loss Interpretation

| Epsilon (ε) | Privacy Loss | Interpretation |
|-------------|--------------|----------------|
| < 0.1 | Negligible | Extremely strong privacy |
| 0.1 - 1.0 | Very Low | Excellent privacy protection |
| 1.0 - 5.0 | Low | Strong privacy protection |
| 5.0 - 10.0 | Moderate | Reasonable privacy protection |
| 10.0 - 20.0 | High | Weak privacy protection |
| > 20.0 | Very High | Minimal privacy protection |

## Privacy Level Guidelines

### Clinical & Healthcare Data

#### HIPAA Compliance Requirements
- **Required ε**: ≤ 1.0 for PHI (Protected Health Information)
- **Recommended ε**: 0.5 - 1.0 for clinical trials
- **Acceptable ε**: Up to 2.0 for anonymized research data

**Use Cases:**
- Electronic Health Records (EHR)
- Clinical trial data
- Genomic research data
- Medical imaging metadata

**Rationale:**
HIPAA requires de-identification of PHI. DP with ε ≤ 1.0 provides mathematical guarantees suitable for Safe Harbor compliance.

#### Example Configuration
```json
{
  "generator_type": "dp-ctgan",
  "target_epsilon": 1.0,
  "epochs": 100,
  "batch_size": 50,
  "compliance_framework": "HIPAA"
}
```

### Financial Services Data

#### Regulatory Requirements
- **Required ε**: 1.0 - 5.0 depending on data sensitivity
- **Recommended ε**: 2.0 - 5.0 for transaction data
- **Acceptable ε**: Up to 10.0 for aggregated analytics

**Use Cases:**
- Customer transaction histories
- Credit scoring data
- Fraud detection datasets
- Investment portfolio data

**Rationale:**
Financial data requires balancing privacy with analytical utility. ε = 5.0 typically provides good privacy-utility trade-offs.

#### Example Configuration
```json
{
  "generator_type": "dp-tvae",
  "target_epsilon": 5.0,
  "epochs": 75,
  "batch_size": 100,
  "compliance_framework": "GDPR"
}
```

### Customer & Marketing Data

#### Privacy Requirements
- **Required ε**: 5.0 - 10.0 for general customer data
- **Recommended ε**: 8.0 - 10.0 for marketing analytics
- **Acceptable ε**: Up to 15.0 for non-sensitive data

**Use Cases:**
- Customer profiles
- Purchase behavior data
- Marketing campaign data
- User interaction logs

**Rationale:**
Customer data often requires less stringent privacy than healthcare data, allowing for higher utility.

#### Example Configuration
```json
{
  "generator_type": "dp-ctgan",
  "target_epsilon": 10.0,
  "epochs": 50,
  "batch_size": 200,
  "compliance_framework": "CCPA"
}
```

### Research & Academic Data

#### Privacy Requirements
- **Required ε**: 0.1 - 2.0 for sensitive research
- **Recommended ε**: 0.5 - 1.0 for academic studies
- **Acceptable ε**: Up to 5.0 for public research data

**Use Cases:**
- Social science surveys
- Educational research data
- Public policy studies
- Academic collaborations

**Rationale:**
Research data often requires strong privacy protection while maintaining analytical validity for publication.

#### Example Configuration
```json
{
  "generator_type": "dp-ctgan",
  "target_epsilon": 0.5,
  "epochs": 150,
  "batch_size": 25,
  "compliance_framework": "research"
}
```

### Public & Aggregated Data

#### Privacy Requirements
- **Required ε**: 10.0+ for public data
- **Recommended ε**: 15.0 - 20.0 for aggregated statistics
- **Acceptable ε**: Any value for truly public data

**Use Cases:**
- Public census data
- Aggregated statistics
- Benchmark datasets
- Open government data

**Rationale:**
Public data requires minimal privacy protection, allowing maximum utility.

#### Example Configuration
```json
{
  "generator_type": "ctgan",
  "epochs": 50,
  "batch_size": 500,
  "note": "No DP required for public data"
}
```

## Advanced Privacy Considerations

### Composition and Sequential Queries

#### Privacy Budget Depletion
Each DP operation consumes privacy budget. Multiple analyses require careful budget management:

```python
# Example: Multiple analyses on same dataset
total_epsilon = epsilon1 + epsilon2 + epsilon3  # Simple composition
# Actual: More complex due to advanced composition theorems
```

#### Recommended Approach
```json
{
  "strategy": "allocate_budget",
  "total_budget": 5.0,
  "allocations": {
    "initial_analysis": 2.0,
    "follow_up_study": 2.0,
    "validation_check": 1.0
  }
}
```

### Data Sensitivity Levels

#### High Sensitivity
- **Examples**: Medical diagnoses, financial transactions, personal identifiers
- **Required ε**: ≤ 2.0
- **Additional Measures**: Data minimization, purpose limitation

#### Medium Sensitivity
- **Examples**: Demographic data, behavioral patterns, aggregated metrics
- **Required ε**: 2.0 - 8.0
- **Additional Measures**: Pseudonymization, access controls

#### Low Sensitivity
- **Examples**: Public statistics, anonymized aggregates, synthetic data
- **Required ε**: 8.0+
- **Additional Measures**: Standard data protection practices

### Contextual Privacy

#### Same Data, Different Contexts
```json
{
  "healthcare_context": {
    "epsilon": 1.0,
    "justification": "PHI protection required"
  },
  "research_context": {
    "epsilon": 5.0,
    "justification": "De-identified research data"
  },
  "public_context": {
    "epsilon": null,
    "justification": "No DP required for public data"
  }
}
```

## Regulatory Framework Mapping

### HIPAA Privacy Rule

#### Safe Harbor Method
- **DP Equivalent**: ε ≤ 1.0 provides comparable protection
- **Expert Determination**: DP offers mathematical guarantees
- **Documentation**: Required for BAA (Business Associate Agreement)

#### Implementation Guidance
```json
{
  "hipaa_compliance": {
    "method": "Safe Harbor + Expert Determination",
    "dp_parameters": {
      "epsilon": 1.0,
      "mechanism": "DP-CTGAN",
      "validation": "Third-party audit recommended"
    },
    "documentation": {
      "privacy_assessment": "Required",
      "baa_amendment": "Recommended",
      "audit_trail": "Mandatory"
    }
  }
}
```

### GDPR Article 25/35

#### Data Protection by Design/Default
- **DP Implementation**: Privacy built into data processing
- **DPIA Requirement**: Triggered for high-risk processing
- **Documentation**: Required for Article 30 records

#### Implementation Guidance
```json
{
  "gdpr_compliance": {
    "article_25": {
      "privacy_by_design": "DP implementation",
      "privacy_by_default": "Strong default privacy settings"
    },
    "article_35": {
      "dpia_required": true,
      "dpia_simplified": "DP reduces risk assessment complexity",
      "mitigation_measures": "Mathematical privacy guarantees"
    },
    "data_minimization": {
      "synthetic_data": "Reduces data volume requirements",
      "purpose_limitation": "Research and analytics use specified"
    }
  }
}
```

### CCPA Data Minimization

#### Privacy Rights Implementation
- **Right to Know**: Data usage transparency
- **Right to Delete**: Complete data removal capability
- **Data Minimization**: Synthetic data reduces collection needs

#### Implementation Guidance
```json
{
  "ccpa_compliance": {
    "data_minimization": {
      "synthetic_approach": "Reduces personal data collection",
      "retention_limits": "Configurable data lifecycle",
      "purpose_specification": "Research and analytics defined"
    },
    "privacy_rights": {
      "right_to_know": "Data usage transparency provided",
      "right_to_delete": "Complete data removal supported",
      "right_to_opt_out": "Data sale opt-out implemented"
    }
  }
}
```

## Practical Selection Guide

### Decision Tree for Epsilon Selection

```
Start: Data Classification
├── High Risk (PHI, Financial, Personal)
│   ├── Regulatory Requirement?
│   │   ├── HIPAA → ε ≤ 1.0
│   │   ├── GDPR → ε = 1.0-5.0
│   │   └── CCPA → ε = 5.0-10.0
│   └── No Regulation → ε = 2.0-5.0
├── Medium Risk (Demographic, Behavioral)
│   ├── Research Use → ε = 5.0-8.0
│   ├── Commercial Use → ε = 8.0-12.0
│   └── Public Use → ε = 10.0-15.0
└── Low Risk (Aggregated, Public)
    ├── Any Use → ε = 15.0+ or No DP
    └── Consider: Utility vs Privacy Trade-off
```

### Quick Reference Table

| Data Type | Typical ε | Use Case | Compliance |
|-----------|-----------|----------|------------|
| **PHI/Medical** | 0.5-1.0 | Clinical research | HIPAA |
| **Financial** | 2.0-5.0 | Fraud detection | GDPR |
| **Customer** | 5.0-10.0 | Marketing analytics | CCPA |
| **Research** | 1.0-5.0 | Academic studies | IRB/IEC |
| **Public** | 10.0+ | Open data | None |

## Implementation Examples

### Healthcare Data Pipeline

```python
# HIPAA-compliant healthcare data generation
config = {
    "dataset_id": "healthcare-dataset",
    "generator_type": "dp-ctgan",
    "target_epsilon": 1.0,  # HIPAA compliant
    "epochs": 100,
    "batch_size": 50,
    "compliance_framework": "HIPAA",
    "validation_required": True
}

# Generate with privacy guarantees
result = generate_synthetic_data(config)
```

### Financial Data Processing

```python
# GDPR-compliant financial data
config = {
    "dataset_id": "financial-dataset",
    "generator_type": "dp-tvae",
    "target_epsilon": 5.0,  # GDPR Article 35 compliant
    "epochs": 75,
    "batch_size": 100,
    "compliance_framework": "GDPR",
    "purpose": "Fraud detection research"
}
```

### Customer Analytics

```python
# CCPA-compliant customer data
config = {
    "dataset_id": "customer-dataset",
    "generator_type": "dp-ctgan",
    "target_epsilon": 10.0,  # CCPA data minimization
    "epochs": 50,
    "batch_size": 200,
    "compliance_framework": "CCPA",
    "retention_days": 2555  # 7 years max
}
```

## Validation and Auditing

### Privacy Parameter Validation

```bash
# Validate DP configuration before use
curl -X POST "http://localhost:8000/generators/dp/validate-config" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "your-dataset",
    "target_epsilon": 5.0,
    "epochs": 75,
    "batch_size": 100
  }'
```

### Post-Generation Audit

```bash
# Review privacy report
curl http://localhost:8000/generators/{generator_id}/privacy-report
```

### Compliance Documentation

```bash
# Generate compliance report
curl -X POST "http://localhost:8000/generators/{generator_id}/compliance-report" \
  -H "Content-Type: application/json" \
  -d '{"framework": "HIPAA"}'
```

## Common Questions

### "What's the best epsilon for my use case?"

**Answer**: It depends on your regulatory requirements and utility needs:
- **HIPAA/PHI**: ε ≤ 1.0
- **GDPR High Risk**: ε = 1.0-5.0
- **General Privacy**: ε = 5.0-10.0
- **Maximum Utility**: ε = 10.0-20.0

### "How do I balance privacy and utility?"

**Answer**: Start with regulatory minimums and increase epsilon until you achieve acceptable utility. Use the validation endpoint to test different configurations.

### "Can I change epsilon after generation?"

**Answer**: No, epsilon is set during training. You must regenerate data with different privacy parameters.

### "What if my required epsilon is too low?"

**Answer**: Consider:
1. Reducing dataset size
2. Using simpler models (TVAE vs CTGAN)
3. Implementing hybrid approaches
4. Reviewing if the requirement is truly necessary

---

**Need help selecting privacy levels?** Use the `/generators/dp/recommended-config` endpoint or consult with your privacy officer.