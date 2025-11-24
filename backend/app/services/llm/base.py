"""Base classes for LLM providers"""

from abc import ABC, abstractmethod
from typing import Optional
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
        """Generate response from LLM
        
        Args:
            request: LLM request with prompts and configuration
            
        Returns:
            LLM response with content and metadata
        """
        pass
    
    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """Count tokens in text
        
        Args:
            text: Text to count tokens for
            
        Returns:
            Approximate token count
        """
        pass
