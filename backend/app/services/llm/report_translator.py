"""Report Translator Service

Translates technical evaluation metrics into natural language insights
for business stakeholders.
"""

import json
import logging
from typing import Dict, Any
from app.services.llm.providers.router import LLMRouter
from app.services.llm.base import LLMRequest

logger = logging.getLogger(__name__)


class ReportTranslator:
    """Translate technical metrics into business insights"""
    
    def __init__(self):
        """Initialize report translator with LLM router"""
        self.router = LLMRouter()
    
    async def translate_evaluation(
        self, 
        evaluation_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate natural language insights from evaluation metrics
        
        Args:
            evaluation_metrics: Raw evaluation metrics from evaluation system
            
        Returns:
            Dictionary with:
                - executive_summary: 2-3 sentence overview
                - key_findings: List of 3-5 bullet points
                - recommendations: List of 2-3 actionable items
                - business_impact: 1 sentence business value statement
        """
        logger.info("Translating evaluation metrics to natural language")
        
        # Build prompts
        system_prompt = """You are a data quality analyst specializing in synthetic data evaluation.
Your role is to translate technical metrics into actionable business insights.
Always respond in JSON format with the exact structure requested."""
        
        user_prompt = f"""Analyze these evaluation metrics and provide insights:

Metrics:
{json.dumps(evaluation_metrics, indent=2)}

Provide a JSON response with these exact keys:
1. "executive_summary": A 2-3 sentence overview of overall quality
2. "key_findings": An array of 3-5 bullet points highlighting important results (start each with ✓ or ⚠)
3. "recommendations": An array of 2-3 actionable items for improvement or next steps
4. "business_impact": A single sentence describing the business value

Focus on:
- Statistical similarity (how well synthetic matches real data)
- ML utility (can models be trained on synthetic data?)
- Privacy protection (are there leakage risks?)
- Production readiness (is it safe to use?)

Be specific with numbers from the metrics. Use clear, non-technical language."""
        
        # Generate insights
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.0,  # Deterministic
            response_format="json",
            max_tokens=1000
        )
        
        try:
            response = await self.router.generate(request, use_case="report")
            
            # Parse JSON response
            insights = json.loads(response.content)
            
            # Add metadata
            insights["_metadata"] = {
                "provider": response.provider,
                "model": response.model,
                "latency_ms": response.latency_ms,
                "tokens": {
                    "input": response.input_tokens,
                    "output": response.output_tokens
                }
            }
            
            logger.info(f"Generated insights using {response.provider} in {response.latency_ms}ms")
            return insights
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            # Fallback to basic summary
            return self._fallback_summary(evaluation_metrics)
        
        except Exception as e:
            logger.error(f"Report translation failed: {e}")
            return self._fallback_summary(evaluation_metrics)
    
    def _fallback_summary(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Generate basic summary if LLM fails
        
        Args:
            metrics: Evaluation metrics
            
        Returns:
            Basic summary without LLM
        """
        logger.warning("Using fallback summary (LLM unavailable)")
        
        # Extract key metrics
        stat_pass_rate = metrics.get("statistical_similarity", {}).get("summary", {}).get("pass_rate", 0)
        ml_utility = metrics.get("ml_utility", {}).get("summary", {}).get("utility_ratio", 0)
        privacy_level = metrics.get("privacy", {}).get("summary", {}).get("overall_privacy_level", "Unknown")
        
        return {
            "executive_summary": f"Evaluation complete. Statistical similarity: {stat_pass_rate:.0%}, ML utility: {ml_utility:.0%}, Privacy: {privacy_level}.",
            "key_findings": [
                f"✓ Statistical tests passed: {stat_pass_rate:.0%}",
                f"✓ ML utility ratio: {ml_utility:.0%}",
                f"✓ Privacy level: {privacy_level}"
            ],
            "recommendations": [
                "Review detailed metrics for specific improvements",
                "Consider differential privacy for production use"
            ],
            "business_impact": "Synthetic data quality assessment completed.",
            "_metadata": {
                "provider": "fallback",
                "model": "rule-based",
                "latency_ms": 0
            }
        }
    
    async def compare_evaluations(
        self,
        evaluations: list[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Compare multiple evaluations and provide recommendations
        
        Args:
            evaluations: List of evaluation results with metadata
            
        Returns:
            Comparative analysis with recommendations
        """
        logger.info(f"Comparing {len(evaluations)} evaluations")
        
        system_prompt = """You are a data quality analyst helping users choose the best synthetic data generation approach.
Compare multiple evaluations and provide clear recommendations."""
        
        # Build comparison table
        comparison_data = []
        for i, eval_data in enumerate(evaluations, 1):
            comparison_data.append({
                "generation": i,
                "generator_type": eval_data.get("generator_type", "unknown"),
                "metrics": eval_data.get("metrics", {})
            })
        
        user_prompt = f"""Compare these synthetic data generations:

{json.dumps(comparison_data, indent=2)}

Provide a JSON response with:
1. "summary": Brief comparison overview
2. "winner": Which generation is best overall (by number)
3. "trade_offs": Key trade-offs between approaches
4. "recommendation": Specific recommendation for which to use and when

Consider: quality vs privacy, speed vs accuracy, use case requirements."""
        
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.0,
            response_format="json",
            max_tokens=800
        )
        
        try:
            response = await self.router.generate(request, use_case="report")
            return json.loads(response.content)
        except Exception as e:
            logger.error(f"Comparison failed: {e}")
            return {
                "summary": "Comparison unavailable",
                "winner": 1,
                "trade_offs": ["Unable to generate comparison"],
                "recommendation": "Review metrics manually"
            }
