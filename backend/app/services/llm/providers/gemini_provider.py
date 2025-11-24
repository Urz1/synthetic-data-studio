"""Google Gemini Provider"""

import os
import time
import logging
import google.generativeai as genai
from app.services.llm.base import BaseLLMProvider, LLMRequest, LLMResponse

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """Google Gemini LLM Provider
    
    Uses Google's Gemini models for high-quality text generation.
    Recommended for complex analysis, reports, and documentation.
    """
    
    def __init__(self, model: str = "gemini-pro"):
        """Initialize Gemini provider
        
        Args:
            model: Model name (gemini-pro, gemini-1.5-pro, etc.)
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)
        self.model_name = model
        logger.info(f"Initialized Gemini provider with model: {model}")
    
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate response using Gemini
        
        Args:
            request: LLM request with prompts and configuration
            
        Returns:
            LLM response with generated content
        """
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
        
        try:
            # Generate response
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
        
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise
    
    def count_tokens(self, text: str) -> int:
        """Approximate token count
        
        Args:
            text: Text to count tokens for
            
        Returns:
            Approximate token count (4 chars ≈ 1 token)
        """
        return len(text) // 4
