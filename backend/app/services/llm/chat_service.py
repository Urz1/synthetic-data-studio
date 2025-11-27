"""Chat Service for Interactive Evaluation Exploration

Provides conversational interface for users to explore evaluation results,
ask questions, and get recommendations.
"""

# Standard library
import json
import logging
from typing import List, Dict, Any, Optional

# Local - Module
from app.services.llm.providers.router import LLMRouter
from app.services.llm.base import LLMRequest

logger = logging.getLogger(__name__)


class ChatService:
    """Interactive chat for evaluation exploration"""
    
    def __init__(self):
        """Initialize chat service with LLM router"""
        self.router = LLMRouter()
    
    async def chat(
        self,
        message: str,
        context: Dict[str, Any],
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Handle chat interaction with context awareness
        
        Args:
            message: User's question or message
            context: Context data (generator info, evaluation results, etc.)
            history: Conversation history (list of {user, assistant} dicts)
            
        Returns:
            Assistant's response
        """
        logger.info(f"Processing chat message: {message[:50]}...")
        
        # Build context-aware system prompt
        system_prompt = self._build_system_prompt(context)
        
        # Build conversation with history
        conversation = self._build_conversation(message, history)
        
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=conversation,
            temperature=0.3,  # Slightly creative for natural conversation
            max_tokens=500
        )
        
        try:
            response = await self.router.generate(request, use_case="chat")
            logger.info(f"Chat response generated using {response.provider} in {response.latency_ms}ms")
            return response.content
        
        except Exception as e:
            logger.error(f"Chat failed: {e}")
            return "I'm having trouble processing your question right now. Please try rephrasing or ask something else."
    
    def _build_system_prompt(self, context: Dict[str, Any]) -> str:
        """Build context-aware system prompt
        
        Args:
            context: Context data
            
        Returns:
            System prompt with context
        """
        base_prompt = """You are a helpful AI assistant for Synth Studio, a synthetic data generation platform.
You help users understand their evaluation results, make decisions about data quality, and improve their synthetic data.

Guidelines:
- Be concise and clear
- Use specific numbers from the context when available
- Provide actionable recommendations
- If you don't know something, say so
- Focus on helping users make informed decisions"""
        
        # Add context information
        context_info = "\n\nCurrent Context:"
        
        if "generator_id" in context:
            context_info += f"\n- Generator ID: {context['generator_id']}"
        
        if "generator_type" in context:
            context_info += f"\n- Generator Type: {context['generator_type']}"
        
        if "evaluation" in context and context["evaluation"]:
            eval_data = context["evaluation"]
            
            # Add key metrics
            if "overall_assessment" in eval_data:
                overall = eval_data["overall_assessment"]
                context_info += f"\n- Overall Quality: {overall.get('overall_quality', 'Unknown')}"
                context_info += f"\n- Overall Score: {overall.get('overall_score', 'N/A')}"
            
            if "statistical_similarity" in eval_data:
                stats = eval_data["statistical_similarity"].get("summary", {})
                context_info += f"\n- Statistical Similarity: {stats.get('pass_rate', 0):.0%}"
            
            if "ml_utility" in eval_data:
                ml = eval_data["ml_utility"].get("summary", {})
                context_info += f"\n- ML Utility Ratio: {ml.get('utility_ratio', 0):.0%}"
            
            if "privacy" in eval_data:
                privacy = eval_data["privacy"].get("summary", {})
                context_info += f"\n- Privacy Level: {privacy.get('overall_privacy_level', 'Unknown')}"
        
        return base_prompt + context_info
    
    def _build_conversation(
        self,
        current_message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Build conversation string with history
        
        Args:
            current_message: Current user message
            history: Previous conversation turns
            
        Returns:
            Formatted conversation string
        """
        conversation = ""
        
        # Add last 5 messages from history for context
        if history:
            for msg in history[-5:]:
                conversation += f"User: {msg.get('user', '')}\n"
                conversation += f"Assistant: {msg.get('assistant', '')}\n\n"
        
        # Add current message
        conversation += f"User: {current_message}\nAssistant:"
        
        return conversation
    
    async def suggest_improvements(
        self,
        evaluation_results: Dict[str, Any]
    ) -> List[str]:
        """Suggest improvements based on evaluation results
        
        Args:
            evaluation_results: Evaluation report
            
        Returns:
            List of improvement suggestions
        """
        logger.info("Generating improvement suggestions")
        
        system_prompt = """You are a synthetic data quality expert.
Analyze evaluation results and provide specific, actionable improvement suggestions."""
        
        user_prompt = f"""Based on these evaluation results, suggest 3-5 specific improvements:

Evaluation Results:
{json.dumps(evaluation_results, indent=2)}

Provide a JSON array of improvement suggestions. Each suggestion should be:
- Specific and actionable
- Based on the actual metrics
- Prioritized by impact

Format: ["suggestion 1", "suggestion 2", "suggestion 3"]"""
        
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            response_format="json",
            max_tokens=400
        )
        
        try:
            response = await self.router.generate(request, use_case="quick")
            suggestions_data = json.loads(response.content)
            
            # Handle both list and dict formats
            if isinstance(suggestions_data, list):
                suggestions = suggestions_data
            elif isinstance(suggestions_data, dict):
                # Try common keys
                suggestions = (
                    suggestions_data.get('improvement_suggestions') or
                    suggestions_data.get('suggestions') or
                    suggestions_data.get('items') or
                    list(suggestions_data.values())[0] if suggestions_data else []
                )
            else:
                suggestions = []
            
            logger.info(f"LLM generated {len(suggestions)} suggestions")
            return suggestions if isinstance(suggestions, list) else []
        
        except Exception as e:
            logger.error(f"Suggestion generation failed: {e}, using rule-based fallback")
            
            # Rule-based fallback: Analyze metrics and provide specific suggestions
            suggestions = []
            
            # Extract metrics
            overall = evaluation_results.get("overall_assessment", {})
            overall_score = overall.get("overall_score", 0)
            overall_quality = overall.get("overall_quality", "Unknown")
            
            ml_utility = evaluation_results.get("evaluations", {}).get("ml_utility", {}).get("summary", {})
            utility_ratio = ml_utility.get("utility_ratio", 0)
            
            privacy = evaluation_results.get("evaluations", {}).get("privacy", {}).get("summary", {})
            privacy_level = privacy.get("overall_privacy_level", "Unknown").lower()
            membership_vuln = privacy.get("membership_vulnerability", "Unknown").lower()
            
            # Privacy-based suggestions
            if privacy_level in ["poor", "medium"]:
                suggestions.append(f"Privacy level is {privacy_level.title()}. Consider using DP-CTGAN or DP-TVAE for stronger differential privacy guarantees")
                if membership_vuln == "high":
                    suggestions.append("High membership inference vulnerability detected. Reduce epsilon value (e.g., epsilon=1.0) to strengthen privacy protection")
            
            # Utility-based suggestions
            if utility_ratio < 0.8:
                suggestions.append(f"ML utility ratio is {utility_ratio:.1%}. Increase training epochs (try 500-1000) to improve model convergence")
                suggestions.append("Consider using a larger batch size (256 or 512) for more stable training and better quality")
            elif utility_ratio > 3.0:
                suggestions.append(f"Excellent ML utility ({utility_ratio:.1%})! Your synthetic data performs better than expected")
            
            # Overall quality suggestions
            if overall_score < 0.5:
                suggestions.append("Overall quality score is low. Review generator hyperparameters and ensure sufficient training data")
            
            # Generic best practices if no specific issues
            if not suggestions:
                suggestions = [
                    f"Quality is {overall_quality} (score: {overall_score:.1f}). Consider experimenting with different generator types (CTGAN, TVAE, GaussianCopula)",
                    "For production use, always enable differential privacy to protect against re-identification attacks",
                    "Monitor privacy-utility tradeoff by adjusting epsilon parameter (lower = more private, higher = better utility)"
                ]
            
            logger.info(f"Generated {len(suggestions)} rule-based suggestions")
            return suggestions[:5]  # Limit to 5 suggestions
    
    async def explain_metric(
        self,
        metric_name: str,
        metric_value: Any,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Explain what a specific metric means
        
        Args:
            metric_name: Name of the metric (e.g., "ks_statistic", "utility_ratio")
            metric_value: Value of the metric
            context: Additional context
            
        Returns:
            Plain English explanation
        """
        logger.info(f"Explaining metric: {metric_name}")
        
        system_prompt = """You are a data science educator explaining technical metrics in simple terms.
Explain metrics clearly without jargon, suitable for non-technical stakeholders."""
        
        user_prompt = f"""Explain this metric in 2-3 sentences:

Metric: {metric_name}
Value: {metric_value}
{f"Context: {json.dumps(context)}" if context else ""}

Explain:
1. What this metric measures
2. What this specific value means
3. Whether this is good, bad, or neutral"""
        
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.1,
            max_tokens=200
        )
        
        try:
            response = await self.router.generate(request, use_case="quick")
            return response.content
        
            return f"The {metric_name} metric has a value of {metric_value}. Please refer to the documentation for details."


    async def generate_features(
        self,
        schema: Dict[str, Any],
        context: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """Generate feature engineering suggestions based on schema
        
        Args:
            schema: Dataset schema (columns and types)
            context: Optional context about the dataset domain
            
        Returns:
            List of feature suggestions
        """
        logger.info("Generating feature suggestions")
        
        system_prompt = """You are an expert data scientist specializing in feature engineering.
Suggest meaningful derived features that could improve model performance."""
        
        user_prompt = f"""Based on this schema, suggest 3-5 new features to generate:

Schema: {json.dumps(schema, indent=2)}
{f"Context: {context}" if context else ""}

Provide a JSON array of feature objects. Each object should have:
- "name": Name of the new feature
- "expression": Mathematical or logical expression to calculate it (e.g., "col1 / col2")
- "description": Why this feature is useful

Format: [{"name": "...", "expression": "...", "description": "..."}]"""
        
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            response_format="json",
            max_tokens=500
        )
        
        try:
            response = await self.router.generate(request, use_case="creative")
            features_data = json.loads(response.content)
            
            # Handle different JSON structures
            if isinstance(features_data, list):
                features = features_data
            elif isinstance(features_data, dict):
                features = (
                    features_data.get('features') or
                    features_data.get('suggestions') or
                    list(features_data.values())[0] if features_data else []
                )
            else:
                features = []
                
            return features if isinstance(features, list) else []
            
        except Exception as e:
            logger.error(f"Feature generation failed: {e}")
            # Fallback
            return [
                {
                    "name": "interaction_term",
                    "expression": "col1 * col2",
                    "description": "Capture interaction between numeric columns (fallback suggestion)"
                }
            ]
