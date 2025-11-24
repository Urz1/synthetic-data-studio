# LLM Integration - Practical Implementation Plan

## Executive Summary

This plan adapts the LLM integration strategy to work with **free APIs** (Google Gemini and Groq) and provides a **step-by-step implementation guide** for your existing FastAPI backend.

**Timeline**: 7 weeks  
**Cost**: $0 (using free tiers)  
**Technology**: Python (FastAPI backend integration)  
**APIs**: Google Gemini (free tier) + Groq (free tier)

---

## Technology Stack Recommendation

### ✅ **RECOMMENDED: Python Integration (FastAPI)**

**Why Python?**

1. **Existing Backend**: Your entire backend is Python/FastAPI
2. **Consistency**: Same language, same codebase, same deployment
3. **Libraries**: Excellent LLM libraries (google-generativeai, groq)
4. **Integration**: Direct access to your database models, services
5. **Maintenance**: One codebase to maintain

**Why NOT TypeScript/AI SDK?**

- ❌ Requires separate Node.js service
- ❌ Adds deployment complexity (2 services instead of 1)
- ❌ Requires API calls between Python backend ↔ Node.js LLM service
- ❌ Duplicates data models and business logic
- ❌ AI SDK is great for frontends, but overkill for backend-to-backend

**Verdict**: **Stick with Python** and integrate LLM services directly into your FastAPI backend.

---

## Free API Analysis

### Google Gemini (Free Tier)

**Model**: `gemini-1.5-flash` (recommended for speed) or `gemini-1.5-pro` (for quality)

**Free Tier Limits:**

- 15 requests per minute (RPM)
- 1 million tokens per minute (TPM)
- 1,500 requests per day (RPD)

**Pricing**: $0 (free tier is generous)

**Best For:**

- Natural language report generation
- Model card creation
- Audit narratives
- General insights

**Python Library**: `google-generativeai`

### Groq (Free Tier)

**Models**:

- `llama-3.1-70b-versatile` (best quality)
- `llama-3.1-8b-instant` (fastest)
- `mixtral-8x7b-32768` (long context)

**Free Tier Limits:**

- 30 requests per minute
- 6,000 tokens per minute
- Generous daily limits

**Pricing**: $0 (free tier)

**Best For:**

- Fast responses (Groq is VERY fast - 500+ tokens/sec)
- Chat interface
- Quick analysis
- PII detection enhancement

**Python Library**: `groq`

### Hybrid Strategy

**Use Gemini for:**

- Complex analysis (evaluation reports, model cards)
- Longer outputs (compliance documentation)
- Creative content

**Use Groq for:**

- Chat interface (ultra-fast responses)
- Quick queries
- Real-time interactions

---

## Architecture

### Service Layer Structure

```
app/services/llm/
├── __init__.py
├── base.py                      # Base LLM service interface
├── providers/
│   ├── __init__.py
│   ├── gemini_provider.py       # Google Gemini integration
│   ├── groq_provider.py         # Groq integration
│   └── router.py                # Route requests to best provider
├── report_translator.py         # Evaluation reports → insights
├── compliance_writer.py         # Model cards, audit logs
├── chat_service.py              # Interactive chat
└── pii_analyzer.py              # Enhanced PII detection
```

### Database Schema

```sql
-- Track LLM interactions
CREATE TABLE llm_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(255),
    provider VARCHAR(50),           -- 'gemini' or 'groq'
    model VARCHAR(100),             -- 'gemini-1.5-flash', 'llama-3.1-70b', etc.
    input_hash VARCHAR(64),         -- For caching
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    prompt_version VARCHAR(20)
);

-- Cache LLM responses
CREATE TABLE llm_cache (
    input_hash VARCHAR(64) PRIMARY KEY,
    output JSONB,
    provider VARCHAR(50),
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    hit_count INTEGER DEFAULT 0
);

-- Add to existing evaluations table
ALTER TABLE evaluations ADD COLUMN insights JSONB;

-- Add to existing generators table
ALTER TABLE generators ADD COLUMN model_card JSONB;
ALTER TABLE generators ADD COLUMN audit_narrative TEXT;
```

---

## Phase 1: Infrastructure Setup (Week 1)

### Step 1.1: Install Dependencies

```bash
# Add to requirements.txt
google-generativeai>=0.3.0    # Gemini API
groq>=0.4.0                   # Groq API
redis>=5.0.0                  # Caching
python-dotenv>=1.0.0          # Environment variables
tiktoken>=0.5.0               # Token counting (optional)
```

```bash
# Install
pip install -r requirements.txt
```

### Step 1.2: Environment Configuration

```bash
# .env additions
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
REDIS_URL=redis://localhost:6379/0
LLM_CACHE_TTL=3600  # 1 hour
```

**Get API Keys:**

- Gemini: https://makersuite.google.com/app/apikey
- Groq: https://console.groq.com/keys

### Step 1.3: Base LLM Service

**File**: `app/services/llm/base.py`

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel

class LLMRequest(BaseModel):
    """Standard LLM request format"""
    system_prompt: str
    user_prompt: str
    temperature: float = 0.0  # Deterministic by default
    max_tokens: Optional[int] = None
    response_format: str = "text"  # or "json"

class LLMResponse(BaseModel):
    """Standard LLM response format"""
    content: str
    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: int

class BaseLLMProvider(ABC):
    """Base class for all LLM providers"""

    @abstractmethod
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate response from LLM"""
        pass

    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        pass
```

### Step 1.4: Gemini Provider

**File**: `app/services/llm/providers/gemini_provider.py`

```python
import os
import time
import google.generativeai as genai
from app.services.llm.base import BaseLLMProvider, LLMRequest, LLMResponse

class GeminiProvider(BaseLLMProvider):
    def __init__(self, model: str = "gemini-1.5-flash"):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel(model)
        self.model_name = model

    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate response using Gemini"""
        start_time = time.time()

        # Combine system and user prompts
        full_prompt = f"{request.system_prompt}\n\n{request.user_prompt}"

        # Configure generation
        generation_config = {
            "temperature": request.temperature,
            "max_output_tokens": request.max_tokens or 2048,
        }

        # Add JSON mode if requested
        if request.response_format == "json":
            generation_config["response_mime_type"] = "application/json"

        # Generate
        response = await self.model.generate_content_async(
            full_prompt,
            generation_config=generation_config
        )

        latency_ms = int((time.time() - start_time) * 1000)

        return LLMResponse(
            content=response.text,
            provider="gemini",
            model=self.model_name,
            input_tokens=self.count_tokens(full_prompt),
            output_tokens=self.count_tokens(response.text),
            latency_ms=latency_ms
        )

    def count_tokens(self, text: str) -> int:
        """Approximate token count (4 chars ≈ 1 token)"""
        return len(text) // 4
```

### Step 1.5: Groq Provider

**File**: `app/services/llm/providers/groq_provider.py`

```python
import os
import time
from groq import AsyncGroq
from app.services.llm.base import BaseLLMProvider, LLMRequest, LLMResponse

class GroqProvider(BaseLLMProvider):
    def __init__(self, model: str = "llama-3.1-70b-versatile"):
        self.client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        self.model_name = model

    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate response using Groq"""
        start_time = time.time()

        messages = [
            {"role": "system", "content": request.system_prompt},
            {"role": "user", "content": request.user_prompt}
        ]

        # Configure generation
        kwargs = {
            "model": self.model_name,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens or 2048,
        }

        # Add JSON mode if requested
        if request.response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}

        # Generate
        response = await self.client.chat.completions.create(**kwargs)

        latency_ms = int((time.time() - start_time) * 1000)

        return LLMResponse(
            content=response.choices[0].message.content,
            provider="groq",
            model=self.model_name,
            input_tokens=response.usage.prompt_tokens,
            output_tokens=response.usage.completion_tokens,
            latency_ms=latency_ms
        )

    def count_tokens(self, text: str) -> int:
        """Approximate token count"""
        return len(text) // 4
```

### Step 1.6: Smart Router

**File**: `app/services/llm/providers/router.py`

```python
from app.services.llm.base import BaseLLMProvider, LLMRequest, LLMResponse
from app.services.llm.providers.gemini_provider import GeminiProvider
from app.services.llm.providers.groq_provider import GroqProvider

class LLMRouter:
    """Route requests to the best provider"""

    def __init__(self):
        self.gemini = GeminiProvider("gemini-1.5-flash")
        self.groq = GroqProvider("llama-3.1-70b-versatile")
        self.groq_fast = GroqProvider("llama-3.1-8b-instant")

    async def generate(
        self,
        request: LLMRequest,
        use_case: str = "general"
    ) -> LLMResponse:
        """Route to best provider based on use case"""

        # Chat and quick queries → Groq (ultra-fast)
        if use_case in ["chat", "quick", "pii_detection"]:
            return await self.groq_fast.generate(request)

        # Complex analysis → Gemini (better quality)
        elif use_case in ["report", "model_card", "compliance"]:
            return await self.gemini.generate(request)

        # Default → Groq (good balance)
        else:
            return await self.groq.generate(request)
```

### Step 1.7: Caching Layer

**File**: `app/services/llm/cache.py`

```python
import hashlib
import json
import redis
from datetime import datetime, timedelta
from typing import Optional
from app.core.config import settings

class LLMCache:
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url)
        self.ttl = settings.llm_cache_ttl  # seconds

    def _hash_request(self, request: dict) -> str:
        """Create hash of request for caching"""
        request_str = json.dumps(request, sort_keys=True)
        return hashlib.sha256(request_str.encode()).hexdigest()

    async def get(self, request: dict) -> Optional[str]:
        """Get cached response"""
        key = self._hash_request(request)
        cached = self.redis.get(f"llm_cache:{key}")

        if cached:
            # Increment hit count
            self.redis.incr(f"llm_cache:{key}:hits")
            return cached.decode()

        return None

    async def set(self, request: dict, response: str):
        """Cache response"""
        key = self._hash_request(request)
        self.redis.setex(
            f"llm_cache:{key}",
            self.ttl,
            response
        )
        self.redis.set(f"llm_cache:{key}:hits", 0)
```

---

## Phase 2: Report Intelligence (Weeks 2-3)

### Step 2.1: Report Translator Service

**File**: `app/services/llm/report_translator.py`

```python
import json
from typing import Dict, Any
from app.services.llm.providers.router import LLMRouter
from app.services.llm.base import LLMRequest
from app.services.llm.cache import LLMCache

class ReportTranslator:
    """Translate technical metrics into business insights"""

    def __init__(self):
        self.router = LLMRouter()
        self.cache = LLMCache()

    async def translate_evaluation(self, evaluation_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Generate natural language insights from evaluation metrics"""

        # Check cache first
        cache_key = {"type": "evaluation", "metrics": evaluation_metrics}
        cached = await self.cache.get(cache_key)
        if cached:
            return json.loads(cached)

        # Build prompt
        system_prompt = """You are a data quality analyst specializing in synthetic data evaluation.
Your role is to translate technical metrics into actionable business insights.
Always respond in JSON format."""

        user_prompt = f"""Analyze these evaluation metrics and provide:
1. executive_summary: 2-3 sentences summarizing overall quality
2. key_findings: Array of 3-5 bullet points highlighting important results
3. recommendations: Array of 2-3 actionable items for improvement
4. business_impact: 1 sentence describing business value

Metrics:
{json.dumps(evaluation_metrics, indent=2)}

Output JSON with keys: executive_summary, key_findings, recommendations, business_impact"""

        # Generate
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.0,
            response_format="json"
        )

        response = await self.router.generate(request, use_case="report")

        # Parse and cache
        insights = json.loads(response.content)
        await self.cache.set(cache_key, response.content)

        return insights
```

### Step 2.2: API Endpoint

**File**: `app/evaluations/routes.py` (add to existing file)

```python
from app.services.llm.report_translator import ReportTranslator

@router.post("/{evaluation_id}/explain")
async def explain_evaluation(
    evaluation_id: str,
    db: Session = Depends(get_db)
):
    """Generate natural language explanation of evaluation results"""

    # Get evaluation
    evaluation = db.query(Evaluation).filter_by(id=evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    # Check if already generated
    if evaluation.insights:
        return evaluation.insights

    # Generate insights
    translator = ReportTranslator()
    insights = await translator.translate_evaluation(evaluation.report)

    # Save to database
    evaluation.insights = insights
    db.commit()

    return insights
```

---

## Phase 3: Documentation Automation (Weeks 4-5)

### Step 3.1: Compliance Writer

**File**: `app/services/llm/compliance_writer.py`

```python
from typing import Dict, Any
from app.services.llm.providers.router import LLMRouter
from app.services.llm.base import LLMRequest

class ComplianceWriter:
    """Generate compliance documentation"""

    def __init__(self):
        self.router = LLMRouter()

    async def generate_model_card(self, generator_metadata: Dict[str, Any]) -> str:
        """Generate model card from generator metadata"""

        system_prompt = """You are a technical writer specializing in ML model documentation and compliance.
Generate comprehensive model cards following standard format."""

        user_prompt = f"""Create a model card for this synthetic data generator:

Metadata:
{json.dumps(generator_metadata, indent=2)}

Include sections:
- Model Details
- Intended Use (primary use cases and out-of-scope uses)
- Training Data
- Performance (statistical similarity, ML utility, privacy level)
- Privacy & Ethical Considerations
- Compliance Mapping (HIPAA, GDPR, CCPA, SOC 2)
- Usage Guidelines

Output in Markdown format."""

        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,  # Slight creativity for better writing
            max_tokens=3000
        )

        response = await self.router.generate(request, use_case="model_card")

        return response.content
```

### Step 3.2: API Endpoint

```python
@router.post("/compliance/model-card/{generator_id}")
async def generate_model_card(
    generator_id: str,
    db: Session = Depends(get_db)
):
    """Generate model card for generator"""

    generator = db.query(Generator).filter_by(id=generator_id).first()
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")

    # Extract metadata
    metadata = {
        "generator_id": str(generator.id),
        "type": generator.type,
        "training_config": generator.parameters_json,
        "privacy_config": generator.privacy_config,
        "evaluation_results": get_latest_evaluation(generator_id, db)
    }

    # Generate model card
    writer = ComplianceWriter()
    model_card = await writer.generate_model_card(metadata)

    # Save
    generator.model_card = {"content": model_card, "requires_review": True}
    db.commit()

    return {"model_card": model_card, "requires_review": True}
```

---

## Phase 4: Interactive Features (Weeks 6-7)

### Step 4.1: Chat Service

**File**: `app/services/llm/chat_service.py`

```python
from typing import List, Dict
from app.services.llm.providers.router import LLMRouter
from app.services.llm.base import LLMRequest

class ChatService:
    """Interactive chat for evaluation exploration"""

    def __init__(self):
        self.router = LLMRouter()

    async def chat(
        self,
        message: str,
        context: Dict,
        history: List[Dict] = None
    ) -> str:
        """Handle chat interaction"""

        # Build context-aware system prompt
        system_prompt = f"""You are a helpful assistant for Synth Studio, a synthetic data platform.
You help users understand their evaluation results and make decisions.

Current Context:
- Generator ID: {context.get('generator_id')}
- Evaluation Results: {json.dumps(context.get('evaluation', {}), indent=2)}

Answer questions clearly and provide actionable recommendations."""

        # Build conversation history
        conversation = ""
        if history:
            for msg in history[-5:]:  # Last 5 messages
                conversation += f"\nUser: {msg['user']}\nAssistant: {msg['assistant']}\n"

        user_prompt = f"{conversation}\nUser: {message}\nAssistant:"

        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,  # Slightly creative for natural conversation
            max_tokens=500
        )

        response = await self.router.generate(request, use_case="chat")

        return response.content
```

### Step 4.2: Chat API Endpoint

```python
@router.post("/llm/chat")
async def chat(
    message: str,
    context: Dict,
    history: List[Dict] = None,
    db: Session = Depends(get_db)
):
    """Interactive chat interface"""

    # Load context data
    if "generator_id" in context:
        generator = db.query(Generator).filter_by(id=context["generator_id"]).first()
        evaluation = get_latest_evaluation(context["generator_id"], db)
        context["evaluation"] = evaluation.report if evaluation else {}

    # Generate response
    chat_service = ChatService()
    response = await chat_service.chat(message, context, history)

    return {"response": response}
```

---

## Testing Strategy

### Unit Tests

```python
# tests/test_llm_services.py
import pytest
from app.services.llm.report_translator import ReportTranslator

@pytest.mark.asyncio
async def test_translate_evaluation():
    translator = ReportTranslator()

    metrics = {
        "statistical_similarity": {"pass_rate": 0.93},
        "ml_utility": {"utility_ratio": 0.95},
        "privacy": {"overall_privacy_level": "Good"}
    }

    insights = await translator.translate_evaluation(metrics)

    assert "executive_summary" in insights
    assert "key_findings" in insights
    assert isinstance(insights["key_findings"], list)
```

### Integration Tests

```bash
# Test Gemini provider
curl -X POST http://localhost:8000/evaluations/{eval_id}/explain

# Test chat
curl -X POST http://localhost:8000/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Why is my privacy score low?", "context": {"generator_id": "gen_123"}}'
```

---

## Deployment Checklist

### Week 7: Production Readiness

- [ ] Set up Redis for caching
- [ ] Configure API keys in production environment
- [ ] Add rate limiting (15 req/min for Gemini)
- [ ] Set up monitoring for LLM usage
- [ ] Create fallback mechanisms (return raw metrics if LLM fails)
- [ ] Add cost tracking dashboard
- [ ] Document API endpoints
- [ ] User acceptance testing

---

## Cost Monitoring

### Track Usage

```python
# app/services/llm/usage_tracker.py
from app.models import LLMInteraction

async def track_usage(response: LLMResponse, endpoint: str, user_id: str):
    """Track LLM usage for monitoring"""
    db.add(LLMInteraction(
        user_id=user_id,
        endpoint=endpoint,
        provider=response.provider,
        model=response.model,
        input_tokens=response.input_tokens,
        output_tokens=response.output_tokens,
        latency_ms=response.latency_ms
    ))
    db.commit()
```

### Usage Dashboard

```sql
-- Daily usage by provider
SELECT
    provider,
    DATE(created_at) as date,
    COUNT(*) as requests,
    SUM(input_tokens) as input_tokens,
    SUM(output_tokens) as output_tokens
FROM llm_interactions
GROUP BY provider, DATE(created_at)
ORDER BY date DESC;
```

---

## Summary

### Technology Decision: **Python (FastAPI)**

✅ **Pros:**

- Seamless integration with existing backend
- Direct database access
- No additional services needed
- Simpler deployment
- Consistent codebase

### Free API Strategy: **Gemini + Groq**

✅ **Gemini** for:

- Complex reports
- Model cards
- Compliance docs

✅ **Groq** for:

- Chat (ultra-fast)
- Quick queries
- Real-time features

### Timeline: **7 Weeks**

- Week 1: Infrastructure
- Weeks 2-3: Report intelligence
- Weeks 4-5: Documentation
- Weeks 6-7: Interactive features + deployment

### Cost: **$0**

Both APIs have generous free tiers that will cover your needs.

---

## Next Steps

1. **Review this plan** - Any questions or concerns?
2. **Get API keys** - Sign up for Gemini and Groq
3. **Start Week 1** - Set up infrastructure
4. **Iterate** - Test and refine as we build

Ready to proceed?
