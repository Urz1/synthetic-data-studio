"""LLM Router - Routes requests to optimal provider"""

import logging
from app.services.llm.base import BaseLLMProvider, LLMRequest, LLMResponse
from app.services.llm.providers.gemini_provider import GeminiProvider
from app.services.llm.providers.groq_provider import GroqProvider

logger = logging.getLogger(__name__)


class LLMRouter:
    """Smart router for LLM requests
    
    Routes requests to the best provider based on use case:
    - Gemini: Complex analysis, reports, documentation
    - Groq: Chat, quick queries, real-time interactions
    """
    
    def __init__(self):
        """Initialize router with all providers"""
        try:
            self.gemini = GeminiProvider("gemini-pro")
            logger.info("Gemini provider initialized")
        except Exception as e:
            logger.warning(f"Gemini provider initialization failed: {e}")
            self.gemini = None
        
        try:
            # Updated to current Groq models (llama-3.1-70b-versatile is decommissioned)
            self.groq = GroqProvider("llama-3.3-70b-versatile")  # New 70B model
            self.groq_fast = GroqProvider("llama-3.1-8b-instant")  # Fast 8B model
            logger.info("Groq providers initialized")
        except Exception as e:
            logger.warning(f"Groq provider initialization failed: {e}")
            self.groq = None
            self.groq_fast = None
    
    async def generate(
        self, 
        request: LLMRequest,
        use_case: str = "general"
    ) -> LLMResponse:
        """Route request to best provider
        
        Args:
            request: LLM request
            use_case: Use case for routing decision
                - "chat": Interactive chat (Groq fast)
                - "quick": Quick queries (Groq fast)
                - "pii_detection": PII analysis (Groq fast)
                - "report": Evaluation reports (Groq standard)
                - "model_card": Model cards (Groq standard)
                - "compliance": Compliance docs (Groq standard)
                - "general": Default (Groq standard)
                
        Returns:
            LLM response from selected provider
        """
        # Chat and quick queries → Groq fast (ultra-fast)
        if use_case in ["chat", "quick", "pii_detection"]:
            if self.groq_fast:
                logger.info(f"Routing {use_case} to Groq (fast)")
                return await self.groq_fast.generate(request)
            elif self.groq:
                logger.info(f"Routing {use_case} to Groq (standard, fallback)")
                return await self.groq.generate(request)
        
        # Complex analysis → Groq standard (Gemini having API issues)
        # Use Groq 70B for better quality on complex tasks
        if use_case in ["report", "model_card", "compliance"]:
            if self.groq:
                logger.info(f"Routing {use_case} to Groq (70B)")
                return await self.groq.generate(request)
            elif self.groq_fast:
                logger.info(f"Routing {use_case} to Groq (fast, fallback)")
                return await self.groq_fast.generate(request)
            elif self.gemini:
                logger.info(f"Routing {use_case} to Gemini (fallback)")
                return await self.gemini.generate(request)
        
        # Default → Groq standard (good balance)
        if self.groq:
            logger.info(f"Routing {use_case} to Groq (standard)")
            return await self.groq.generate(request)
        elif self.groq_fast:
            logger.info(f"Routing {use_case} to Groq (fast, fallback)")
            return await self.groq_fast.generate(request)
        elif self.gemini:
            logger.info(f"Routing {use_case} to Gemini (fallback)")
            return await self.gemini.generate(request)
        
        # No providers available
        raise RuntimeError("No LLM providers available. Check API keys.")
