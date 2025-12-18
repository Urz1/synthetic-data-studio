---
id: user-guide-ai-features
title: "AI-Powered Features"
sidebar_label: "AI Features"
sidebar_position: 5
slug: /user-guide/ai-features
tags: [user-guide, ai]
---
# AI-Powered Features

Discover how Synthetic Data Studio leverages AI to enhance your synthetic data workflow with intelligent chat, automated insights, and smart recommendations.

##  AI Feature Overview

Synthetic Data Studio integrates multiple AI capabilities to make synthetic data generation more intelligent and user-friendly:

### Core AI Capabilities

- ** Interactive Chat**: Natural language conversations about your data quality
- ** Smart Suggestions**: AI-powered recommendations for improvement
- ** Metric Explanations**: Plain English interpretations of technical metrics
- ** Auto-Documentation**: Automated generation of compliance documents
- ** Enhanced Detection**: Context-aware PII identification
- ** Guided Workflows**: Step-by-step AI assistance

##  Interactive Chat

### Chat Interface

Engage in natural conversations about your synthetic data:

```bash
curl -X POST "http://localhost:8000/llm/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How good is my synthetic data quality?",
    "evaluation_id": "eval-123",
    "history": []
  }'
```

**Sample Conversation:**
```bash
You: How good is my synthetic data quality?

AI: Based on your evaluation results, your synthetic data shows good overall quality with an 85% similarity score. The statistical tests passed for 8 out of 10 columns, with particularly strong performance in continuous variables. However, there's room for improvement in categorical data representation.

You: What can I do to improve the categorical columns?

AI: To improve categorical data quality, consider:
1. Increasing training epochs from 50 to 100
2. Using CTGAN instead of TVAE for better mode capture
3. Adding more categorical-specific preprocessing
4. Fine-tuning the embedding dimensions
```

### Context-Aware Responses

The chat system understands your specific context:

- **Evaluation Results**: References your quality metrics
- **Generator Configuration**: Knows your synthesis parameters
- **Data Characteristics**: Understands your dataset structure
- **Historical Context**: Remembers previous conversations

### Advanced Chat Features

#### Multi-turn Conversations

```json
{
  "message": "What about privacy?",
  "evaluation_id": "eval-123",
  "history": [
    {
      "role": "user",
      "content": "How good is my synthetic data quality?"
    },
    {
      "role": "assistant",
      "content": "Your data shows 85% similarity..."
    }
  ]
}
```

#### Generator-Specific Chat

```json
{
  "message": "Why is training taking so long?",
  "generator_id": "gen-123",
  "context": {
    "current_status": "running",
    "progress": 75
  }
}
```

##  Smart Suggestions

### Improvement Recommendations

Get AI-powered suggestions for enhancing your synthetic data:

```bash
curl -X POST "http://localhost:8000/llm/suggest-improvements/eval-123" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "evaluation_id": "eval-123",
  "suggestions": [
    {
      "category": "quality_improvement",
      "priority": "high",
      "title": "Increase Training Epochs",
      "description": "Your current 50 epochs may be insufficient for optimal quality",
      "recommended_action": "Increase to 100-150 epochs",
      "expected_impact": "15-20% improvement in statistical similarity",
      "implementation_effort": "low"
    },
    {
      "category": "method_optimization",
      "priority": "medium",
      "title": "Switch to CTGAN",
      "description": "TVAE shows weaker performance on mixed data types",
      "recommended_action": "Use CTGAN for better categorical handling",
      "expected_impact": "10-15% improvement in ML utility",
      "implementation_effort": "medium"
    }
  ],
  "implementation_plan": {
    "immediate_actions": ["Increase epochs to 100"],
    "short_term": ["Switch to CTGAN", "Fine-tune batch size"],
    "long_term": ["Implement hyperparameter optimization"]
  }
}
```

### Suggestion Categories

- **Quality Improvement**: Statistical similarity enhancements
- **Performance Optimization**: Speed and resource improvements
- **Privacy Enhancement**: Better privacy-utility balance
- **Method Selection**: Algorithm recommendations
- **Parameter Tuning**: Hyperparameter optimization

##  Metric Explanations

### Understanding Technical Metrics

Get plain English explanations of complex metrics:

```bash
curl "http://localhost:8000/llm/explain-metric?metric_name=wasserstein_distance&metric_value=0.15"
```

**Response:**
```json
{
  "metric_name": "wasserstein_distance",
  "metric_value": 0.15,
  "explanation": {
    "simple_description": "This measures how different two distributions are, like how much 'work' it would take to transform one pile of dirt into another.",
    "interpretation": "A value of 0.15 means the distributions are fairly similar - about 15% different from perfect match.",
    "quality_assessment": "This is a good result. Values under 0.20 are generally acceptable for most applications.",
    "business_impact": "Your synthetic data captures the essential patterns of the real data well enough for most analytical purposes."
  },
  "analogies": [
    "Like two bell curves that overlap 85% - they're not identical but very similar",
    "Similar to getting 85% on a test - you understand the material well"
  ],
  "next_steps": [
    "This metric is good enough for most use cases",
    "If you need higher precision, consider increasing training epochs",
    "For critical applications, aim for values under 0.10"
  ]
}
```

### Supported Metrics

- **wasserstein_distance**: Distribution similarity
- **ks_test**: Statistical significance testing
- **chi_square**: Categorical data comparison
- **js_divergence**: Information theory similarity
- **epsilon**: Privacy budget
- **delta**: Failure probability

##  Auto-Documentation

### Model Cards

Generate comprehensive model documentation:

```bash
curl -X POST "http://localhost:8000/generators/gen-123/model-card" \
  -H "Content-Type: application/json" \
  -d '{"include_privacy": true}'
```

**Generated Model Card:**
```json
{
  "model_card": {
    "model_details": {
      "name": "Customer Data Generator",
      "type": "DP-CTGAN",
      "version": "1.0",
      "creation_date": "2025-11-27",
      "framework": "Synthetic Data Studio"
    },
    "intended_use": {
      "primary_uses": ["Development testing", "Analytics training"],
      "out_of_scope": ["Production deployment without validation"]
    },
    "data_profile": {
      "training_data_size": 10000,
      "features": ["age", "income", "category", "location"],
      "data_characteristics": "Mixed numerical and categorical"
    },
    "privacy_considerations": {
      "differential_privacy": true,
      "epsilon": 10.0,
      "privacy_guarantees": "ε=10.0, δ=1e-5",
      "compliance_frameworks": ["GDPR", "CCPA"]
    },
    "performance_metrics": {
      "statistical_similarity": 0.87,
      "ml_utility": 0.92,
      "privacy_score": 0.89
    }
  },
  "format": "json",
  "disclaimer": "AI-generated content. Requires review before distribution."
}
```

### Audit Narratives

Create human-readable audit trails:

```bash
curl http://localhost:8000/generators/gen-123/audit-narrative
```

**Generated Narrative:**
```json
{
  "generator_id": "gen-123",
  "narrative": {
    "executive_summary": "This synthetic data generator was created on November 27, 2025, using differential privacy techniques to ensure regulatory compliance.",
    "technical_details": {
      "method": "DP-CTGAN with RDP accounting",
      "privacy_parameters": "ε=10.0, δ=1e-5",
      "training_duration": "45 minutes",
      "quality_metrics": "87% statistical similarity"
    },
    "compliance_statement": "The generator implements mathematical privacy guarantees suitable for HIPAA, GDPR, and CCPA compliance.",
    "recommendations": [
      "Validate output quality before production use",
      "Document privacy parameters in compliance records",
      "Regularly review and update privacy budgets"
    ]
  }
}
```

### Compliance Reports

Generate framework-specific compliance documentation:

```bash
curl -X POST "http://localhost:8000/generators/gen-123/compliance-report" \
  -H "Content-Type: application/json" \
  -d '{"framework": "GDPR"}'
```

##  Enhanced PII Detection

### AI-Powered Detection

Use advanced AI for better sensitive data identification:

```bash
curl -X POST "http://localhost:8000/datasets/dataset-123/pii-detection-enhanced" \
  -H "Content-Type: application/json"
```

**Enhanced Detection Features:**
- **Context Analysis**: Understands data relationships
- **Pattern Recognition**: Identifies complex PII patterns
- **Risk Assessment**: Provides confidence scores and risk levels
- **Recommendations**: Suggests handling strategies

### Detection Comparison

| Feature | Standard Detection | AI-Enhanced Detection |
|---------|-------------------|----------------------|
| **Accuracy** | 85% | 95% |
| **Context Awareness** | Limited | Advanced |
| **False Positives** | Higher | Lower |
| **Complex Patterns** | Basic | Advanced |
| **Recommendations** | Generic | Specific |

##  Guided Workflows

### Step-by-Step Assistance

Get AI-guided help through complex workflows:

#### Privacy Implementation Guide

```bash
curl -X POST "http://localhost:8000/llm/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me implement differential privacy for my healthcare data",
    "context": {
      "data_type": "healthcare",
      "compliance_needs": ["HIPAA"],
      "current_method": "CTGAN"
    }
  }'
```

**AI Response:**
```json
{
  "response": "I'll guide you through implementing HIPAA-compliant differential privacy for healthcare data. Here's your step-by-step plan:",
  "workflow_steps": [
    {
      "step": 1,
      "title": "Validate Current Setup",
      "action": "Run /generators/dp/validate-config with ε=1.0",
      "description": "Ensure your configuration meets HIPAA requirements"
    },
    {
      "step": 2,
      "title": "Choose Appropriate Method",
      "recommendation": "DP-CTGAN for complex healthcare correlations",
      "rationale": "Better at preserving medical data relationships"
    },
    {
      "step": 3,
      "title": "Set Privacy Parameters",
      "parameters": {
        "epsilon": 1.0,
        "delta": "auto",
        "max_grad_norm": 1.0
      },
      "explanation": "ε=1.0 provides strong HIPAA-compliant privacy"
    }
  ],
  "estimated_time": "2-3 hours",
  "success_criteria": [
    "Privacy report shows ε ≤ 1.0",
    "HIPAA compliance check passes",
    "Data utility remains > 80%"
  ]
}
```

##  Feature Configuration

### AI Model Selection

Configure which AI models to use:

```env
# Primary AI provider
USE_GEMINI=true
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-1.5-flash

# Fallback provider
USE_GROQ=true
GROQ_API_KEY=your-key
GROQ_MODEL=llama-3.1-70b-versatile

# Response settings
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2048
```

### Feature Toggles

Enable/disable specific AI features:

```env
# Chat features
ENABLE_AI_CHAT=true
ENABLE_CONTEXT_AWARE_RESPONSES=true

# Suggestions
ENABLE_SMART_SUGGESTIONS=true
ENABLE_AUTOMATED_IMPROVEMENTS=true

# Documentation
ENABLE_AUTO_MODEL_CARDS=true
ENABLE_COMPLIANCE_REPORTS=true

# Detection
ENABLE_ENHANCED_PII_DETECTION=true
```

##  Usage Analytics

### AI Feature Usage Tracking

Monitor AI feature adoption and effectiveness:

```bash
# Get AI usage statistics
curl http://localhost:8000/admin/ai-usage-stats
```

**Tracking Metrics:**
- Chat conversation volume and satisfaction
- Suggestion acceptance rates
- Documentation generation frequency
- PII detection accuracy improvements

##  Privacy & Security

### AI Data Handling

- **No Training Data Storage**: AI responses don't retain your data
- **Secure API Communication**: Encrypted connections to AI providers
- **Compliance-Aware**: AI respects privacy constraints
- **Audit Logging**: All AI interactions are logged for compliance

### Data Minimization

- **Context-Only Sharing**: Only necessary metadata sent to AI
- **No Raw Data**: Original datasets never leave your infrastructure
- **Aggregated Insights**: AI works with statistical summaries

## � Troubleshooting

### Common AI Issues

**Slow Responses**
```bash
Cause: High server load or network latency
Solution: Use Groq for faster responses, implement caching
```

**Inaccurate Suggestions**
```bash
Cause: Limited context or outdated training data
Solution: Provide more evaluation details, use latest AI models
```

**API Rate Limits**
```bash
Cause: Exceeded provider limits
Solution: Implement request queuing, use multiple providers
```

**Context Loss**
```bash
Cause: Long conversations exceed token limits
Solution: Start new conversations for different topics
```

### Performance Optimization

**Response Speed**
- Use Groq for faster responses
- Implement response caching
- Optimize context window usage

**Accuracy Improvement**
- Provide detailed evaluation results
- Include relevant metadata
- Use specific, clear questions

**Cost Management**
- Monitor API usage
- Implement response caching
- Use appropriate model sizes

##  Best Practices

### Effective AI Usage

1. **Be Specific**: Ask detailed, specific questions
2. **Provide Context**: Include evaluation IDs and relevant metadata
3. **Iterate**: Use follow-up questions to refine understanding
4. **Validate**: Cross-check AI suggestions with your domain knowledge

### Workflow Integration

1. **Quality Assessment**: Use AI explanations to understand evaluation results
2. **Improvement Planning**: Leverage smart suggestions for optimization
3. **Documentation**: Generate compliance documents automatically
4. **Knowledge Sharing**: Use chat to explain concepts to team members

### Compliance Considerations

1. **Audit Trail**: All AI interactions are logged
2. **Data Handling**: Understand what data is shared with AI providers
3. **Regulatory Approval**: Get approval for AI-assisted workflows
4. **Fallback Procedures**: Have manual processes for critical decisions

##  Integration Examples

### Development Workflow

```python
# Python integration example
import requests

class SynthStudioAI:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url

    def explain_metric(self, metric_name, value):
        response = requests.get(
            f"{self.base_url}/llm/explain-metric",
            params={"metric_name": metric_name, "metric_value": value}
        )
        return response.json()

    def get_suggestions(self, evaluation_id):
        response = requests.post(
            f"{self.base_url}/llm/suggest-improvements/{evaluation_id}"
        )
        return response.json()
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Evaluate Synthetic Data Quality
  run: |
    # Generate evaluation
    EVAL_ID=$(curl -s -X POST $API_URL/evaluations/run \
      -H "Content-Type: application/json" \
      -d '{"generator_id": "$GENERATOR_ID", "dataset_id": "$DATASET_ID"}' | jq -r .evaluation_id)

    # Get AI insights
    curl -X POST $API_URL/llm/suggest-improvements/$EVAL_ID

    # Generate compliance report
    curl -X POST $API_URL/generators/$GENERATOR_ID/compliance-report \
      -H "Content-Type: application/json" \
      -d '{"framework": "GDPR"}'
```

##  Next Steps

After exploring AI features:

1. **[Generate Compliance Reports](privacy-features.md#compliance-frameworks)** - Create audit documentation
2. **[Check Tutorials](../tutorials/)** - Learn advanced workflows
3. **[Review API Examples](../examples/)** - Explore all endpoints

---

**Want to learn more?** Try asking the AI chat: "What are the best practices for synthetic data generation?" or check our [API Examples](../examples/) for AI endpoint usage.


