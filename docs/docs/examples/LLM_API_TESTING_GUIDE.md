---
id: examples-llm-api-testing-guide
title: "LLM API Testing Guide"
sidebar_label: "LLM API Testing Guide"
sidebar_position: 1
slug: /examples/llm-api-testing-guide
tags: [examples, llm]
---
# LLM API Testing Guide

## Quick Start

### Option 1: Postman

1. Import `LLM_API_Tests.postman_collection.json` into Postman
2. Replace placeholder IDs with your actual IDs:
   - `YOUR_EVALUATION_ID_HERE`
   - `YOUR_GENERATOR_ID_HERE`
   - `YOUR_DATASET_ID_HERE`
3. Run requests!

### Option 2: Swagger UI (Recommended for Quick Testing)

1. Open http://localhost:8000/docs
2. Find the endpoint you want to test
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"

---

## All 11 LLM Endpoints

### 1. Interactive Chat

**Endpoint:** `POST /llm/chat`

**Example Request:**

```json
{
  "message": "What's the overall quality of this synthetic data?",
  "evaluation_id": "abc-123",
  "history": []
}
```

**Use Cases:**

- Ask questions about evaluation results
- Get recommendations
- Understand quality metrics
- Explore trade-offs

---

### 2. Improvement Suggestions

**Endpoint:** `POST /llm/suggest-improvements/{evaluation_id}`

**Example:**

```
POST /llm/suggest-improvements/abc-123
```

**Returns:**

```json
{
  "suggestions": [
    "Increase training epochs from 50 to 100 for better convergence",
    "Reduce batch size to 250 to improve gradient stability",
    "Consider using DP-CTGAN with epsilon=8 for stronger privacy"
  ]
}
```

---

### 3. Metric Explanations

**Endpoint:** `GET /llm/explain-metric`

**Example:**

```
GET /llm/explain-metric?metric_name=ks_statistic&metric_value=0.087
```

**Common Metrics to Explain:**

- `ks_statistic` - Kolmogorov-Smirnov test
- `utility_ratio` - ML utility score
- `epsilon` - Privacy budget
- `wasserstein_distance` - Distribution distance
- `dcr_score` - Distance to closest record

---

### 4. Natural Language Insights

**Endpoint:** `POST /evaluations/{evaluation_id}/explain`

**Example:**

```
POST /evaluations/abc-123/explain
```

**Returns:**

```json
{
  "executive_summary": "The synthetic data shows excellent quality...",
  "key_findings": [
    " Statistical similarity: 93% of tests passed",
    " ML utility: Models trained on synthetic data achieve 89% of original performance"
  ],
  "recommendations": [
    "Safe for production use",
    "Consider differential privacy for additional protection"
  ],
  "business_impact": "High-quality synthetic data ready for analytics and ML training"
}
```

---

### 5. Compare Evaluations

**Endpoint:** `POST /evaluations/compare`

**Example Request:**

```json
["eval-1", "eval-2", "eval-3"]
```

**Returns:**

```json
{
  "summary": "Evaluation 1 (CTGAN) offers best quality, Evaluation 2 (DP-CTGAN) offers best privacy",
  "winner": 1,
  "trade_offs": [
    "CTGAN: Higher quality (0.93) but no formal privacy",
    "DP-CTGAN: Strong privacy (ε=10) with slight quality trade-off (0.89)"
  ],
  "recommendation": "Use DP-CTGAN for production, CTGAN for development/testing"
}
```

---

### 6. Model Card Generation

**Endpoint:** `POST /generators/{generator_id}/model-card`

**Example:**

```
POST /generators/gen-456/model-card
```

**Returns:** Markdown-formatted model card with:

- Model details and purpose
- Intended use cases
- Performance metrics
- Privacy considerations
- Compliance mappings
- Usage guidelines

**Use Cases:**

- Documentation for stakeholders
- Compliance audits
- Model registry
- Team onboarding

---

### 7. Audit Narratives

**Endpoint:** `GET /generators/{generator_id}/audit-narrative`

**Example:**

```
GET /generators/gen-456/audit-narrative
```

**Returns:**

```markdown
# Audit Trail: Healthcare Data Generator

**10:00 AM** - Generator Created
A DP-CTGAN generator was initialized for healthcare data synthesis...

**10:15 AM** - Training Started
Model training began with 300 epochs and batch size 500...

**11:30 AM** - Training Completed
Training completed successfully. Privacy budget spent: ε=9.8...
```

---

### 8. GDPR Compliance Report

**Endpoint:** `POST /generators/{generator_id}/compliance-report?framework=GDPR`

**Example:**

```
POST /generators/gen-456/compliance-report?framework=GDPR
```

**Returns:**

```json
{
  "framework": "GDPR",
  "compliance_level": "Partial",
  "controls_addressed": [
    {
      "control_id": "Article 25",
      "control_name": "Data Protection by Design",
      "how_addressed": "DP-CTGAN implements differential privacy",
      "evidence": "epsilon=10.0, delta=1e-5"
    }
  ],
  "gaps": ["Explicit consent mechanism not implemented"],
  "recommendations": [
    "Add data retention policies",
    "Implement right to erasure"
  ]
}
```

**Supported Frameworks:**

- GDPR
- HIPAA
- CCPA
- SOC2

---

### 9. Enhanced PII Detection

**Endpoint:** `POST /datasets/{dataset_id}/pii-detection-enhanced`

**Example:**

```
POST /datasets/data-789/pii-detection-enhanced
```

**Returns:**

```json
{
  "analysis": {
    "total_columns": 10,
    "columns_with_pii": 3,
    "overall_risk_level": "Medium",
    "high_risk_columns": ["user_id"],
    "medium_risk_columns": ["customer_code", "account_number"],
    "column_analyses": {
      "user_id": {
        "contains_pii": true,
        "pii_type": "indirect_identifier",
        "confidence": 0.95,
        "risk_level": "High",
        "explanation": "Unique identifier that could enable re-identification",
        "recommendations": ["Remove before synthesis", "Use DP with ε≤8"]
      }
    },
    "recommendations": [
      "High-risk PII detected in 1 column: user_id. Consider removing.",
      "Use DP-CTGAN with epsilon ≤ 10 for privacy protection."
    ]
  }
}
```

**Detects:**

- Direct identifiers (names, emails, SSNs)
- Indirect identifiers (user codes, IDs)
- Quasi-identifiers (combinations)
- Encoded/obfuscated PII

---

## Testing Workflow

### Step 1: Get Your IDs

First, get actual IDs from your system:

```bash
# Get datasets
GET /datasets/

# Get generators
GET /generators/

# Get evaluations
GET /evaluations/generator/{generator_id}
```

### Step 2: Test in Order

1. **Start with Enhanced PII Detection**

   ```
   POST /datasets/{id}/pii-detection-enhanced
   ```

   → Understand your data privacy risks

2. **Generate Synthetic Data**

   ```
   POST /generators/dataset/{id}/generate
   ```

   → Create synthetic data

3. **Run Evaluation**

   ```
   POST /evaluations/run
   ```

   → Assess quality

4. **Get Natural Language Insights**

   ```
   POST /evaluations/{id}/explain
   ```

   → Understand results

5. **Ask Questions via Chat**

   ```
   POST /llm/chat
   ```

   → Interactive exploration

6. **Generate Documentation**
   ```
   POST /generators/{id}/model-card
   POST /generators/{id}/compliance-report?framework=GDPR
   ```
   → Compliance docs

---

## Tips for Testing

### 1. Use Real Data

- Test with actual evaluation results for best insights
- LLM responses are context-aware

### 2. Try Different Questions

Chat examples:

- "Is this data safe for production?"
- "How does the privacy level compare to industry standards?"
- "What's the trade-off between quality and privacy?"
- "Should I use CTGAN or DP-CTGAN?"

### 3. Test Fallbacks

- Disconnect internet to test fallback mechanisms
- All endpoints have rule-based fallbacks

### 4. Check Response Times

- Groq is ultra-fast (usually less than 1 second)
- Chat: ~500ms
- Model cards: ~2-3 seconds
- Compliance reports: ~1-2 seconds

---

## Common Issues

### Issue: "Evaluation not found"

**Solution:** Use actual evaluation ID from your database

### Issue: "No LLM providers available"

**Solution:** Check that GROQ_API key is set in `.env`

### Issue: "Endpoints not showing in /docs"

**Solution:** Restart the server:

```bash
python -m uvicorn app.main:app --reload
```

### Issue: "Rate limit exceeded"

**Solution:** Groq free tier: 30 req/min. Wait or upgrade.

---

## Quick Test Script

```bash
# 1. Get a dataset ID
curl http://localhost:8000/datasets/ | jq '.[0].id'

# 2. Run enhanced PII detection
curl -X POST http://localhost:8000/datasets/YOUR_ID/pii-detection-enhanced

# 3. Get a generator ID
curl http://localhost:8000/generators/ | jq '.[0].id'

# 4. Generate model card
curl -X POST http://localhost:8000/generators/YOUR_ID/model-card

# 5. Get an evaluation ID
curl http://localhost:8000/evaluations/generator/YOUR_GEN_ID | jq '.[0].id'

# 6. Get natural language insights
curl -X POST http://localhost:8000/evaluations/YOUR_EVAL_ID/explain

# 7. Chat about the evaluation
curl -X POST http://localhost:8000/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the overall quality?", "evaluation_id": "YOUR_EVAL_ID"}'
```

---

## Next Steps

1.  Import Postman collection
2.  Replace placeholder IDs
3.  Test each endpoint
4.  Try different questions in chat
5.  Generate compliance docs
6.  Integrate into your workflow

**Happy Testing!** 


