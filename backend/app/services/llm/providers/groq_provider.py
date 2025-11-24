"""Groq Provider"""

import os
import time
import logging
from groq import AsyncGroq
from app.services.llm.base import BaseLLMProvider, LLMRequest, LLMResponse

logger = logging.getLogger(__name__)


class GroqProvider(BaseLLMProvider):
    """Groq LLM Provider
    
    Uses Groq's ultra-fast inference for real-time interactions.
    Recommended for chat, quick queries, and interactive features.
    """
    
    def __init__(self, model: str = "llama-3.3-70b-versatile"):
        """Initialize Groq provider
        
        Args:
            model: Model name (llama-3.3-70b-versatile, llama-3.1-8b-instant, etc.)
        """
        api_key = os.getenv("GROQ_API")
        if not api_key:
            raise ValueError("GROQ_API environment variable not set")
        
        self.client = AsyncGroq(api_key=api_key)
        self.model_name = model
        logger.info(f"Initialized Groq provider with model: {model}")
    
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate response using Groq
        
        Args:
            request: LLM request with prompts and configuration
            
        Returns:
            LLM response with generated content
        """
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
        
        try:
            # Generate response
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
        
        except Exception as e:
            logger.error(f"Groq generation failed: {e}")
            raise
    
    def count_tokens(self, text: str) -> int:
        """Approximate token count
        
        Args:
            text: Text to count tokens for
            
        Returns:
            Approximate token count (4 chars ≈ 1 token)
        """
        return len(text) // 4
