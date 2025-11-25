"""Enhanced PII Detection with LLM Context Analysis

Augments regex-based PII detection with contextual understanding to identify
encoded, obfuscated, or indirect identifiers.
"""

import json
import logging
from typing import Dict, Any, List
from app.services.llm.providers.router import LLMRouter
from app.services.llm.base import LLMRequest

logger = logging.getLogger(__name__)


class EnhancedPIIDetector:
    """Enhanced PII detection using LLM for contextual analysis"""
    
    def __init__(self):
        """Initialize enhanced PII detector"""
        self.router = LLMRouter()
    
    async def analyze_column(
        self,
        column_name: str,
        sample_values: List[Any],
        column_stats: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze a column for potential PII using contextual understanding
        
        Args:
            column_name: Name of the column
            sample_values: Sample values from the column (anonymized if needed)
            column_stats: Statistical information about the column
            
        Returns:
            PII analysis with risk assessment and recommendations
        """
        logger.info(f"Analyzing column '{column_name}' for PII")
        
        # Prepare safe sample (first 5 values, truncated)
        safe_samples = [str(v)[:50] for v in sample_values[:5]]
        
        system_prompt = """You are a data privacy expert specializing in PII detection.
Analyze column data for potential personally identifiable information, including:
- Direct identifiers (names, emails, SSNs, etc.)
- Indirect identifiers (user codes, customer IDs, etc.)
- Quasi-identifiers (combinations that could identify individuals)
- Encoded or obfuscated PII

Be thorough but avoid false positives."""
        
        user_prompt = f"""Analyze this column for PII:

Column Name: {column_name}
Sample Values: {json.dumps(safe_samples)}
Statistics: {json.dumps(column_stats)}

Provide a JSON response with:
{{
  "contains_pii": true/false,
  "pii_type": "direct_identifier|indirect_identifier|quasi_identifier|none",
  "confidence": 0.0-1.0,
  "risk_level": "High|Medium|Low|None",
  "explanation": "brief explanation of why this might be PII",
  "recommendations": ["specific recommendations for handling this column"]
}}

Consider:
- Column name semantics
- Value patterns and formats
- Uniqueness and cardinality
- Potential for re-identification"""
        
        request = LLMRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.0,  # Deterministic for consistency
            response_format="json",
            max_tokens=400
        )
        
        try:
            response = await self.router.generate(request, use_case="pii_detection")
            analysis = json.loads(response.content)
            
            logger.info(f"Column '{column_name}' PII analysis: {analysis.get('pii_type', 'unknown')}")
            return analysis
        
        except Exception as e:
            logger.error(f"PII analysis failed for column '{column_name}': {e}")
            return self._fallback_analysis(column_name)
    
    def _fallback_analysis(self, column_name: str) -> Dict[str, Any]:
        """Fallback PII analysis if LLM fails
        
        Args:
            column_name: Column name
            
        Returns:
            Basic PII analysis
        """
        logger.warning(f"Using fallback PII analysis for '{column_name}'")
        
        # Simple heuristic based on column name
        pii_keywords = ['name', 'email', 'phone', 'ssn', 'address', 'id', 'user', 'customer']
        contains_pii = any(keyword in column_name.lower() for keyword in pii_keywords)
        
        return {
            "contains_pii": contains_pii,
            "pii_type": "indirect_identifier" if contains_pii else "none",
            "confidence": 0.5 if contains_pii else 0.1,
            "risk_level": "Medium" if contains_pii else "None",
            "explanation": f"Column name suggests potential PII" if contains_pii else "No obvious PII indicators",
            "recommendations": [
                "Manual review recommended",
                "Consider applying anonymization techniques"
            ] if contains_pii else []
        }
    
    async def analyze_dataset(
        self,
        columns_data: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze entire dataset for PII patterns
        
        Args:
            columns_data: Dictionary of column data (name -> {samples, stats})
            
        Returns:
            Dataset-level PII analysis
        """
        logger.info(f"Analyzing dataset with {len(columns_data)} columns for PII")
        
        column_analyses = {}
        high_risk_columns = []
        medium_risk_columns = []
        
        # Analyze each column
        for col_name, col_data in columns_data.items():
            analysis = await self.analyze_column(
                column_name=col_name,
                sample_values=col_data.get("samples", []),
                column_stats=col_data.get("stats", {})
            )
            
            column_analyses[col_name] = analysis
            
            if analysis["risk_level"] == "High":
                high_risk_columns.append(col_name)
            elif analysis["risk_level"] == "Medium":
                medium_risk_columns.append(col_name)
        
        # Generate dataset-level summary
        summary = {
            "total_columns": len(columns_data),
            "columns_with_pii": len([a for a in column_analyses.values() if a["contains_pii"]]),
            "high_risk_columns": high_risk_columns,
            "medium_risk_columns": medium_risk_columns,
            "overall_risk_level": self._calculate_overall_risk(column_analyses),
            "column_analyses": column_analyses,
            "recommendations": self._generate_dataset_recommendations(column_analyses)
        }
        
        logger.info(f"Dataset PII analysis complete: {summary['overall_risk_level']} risk")
        return summary
    
    def _calculate_overall_risk(self, column_analyses: Dict[str, Dict[str, Any]]) -> str:
        """Calculate overall dataset risk level
        
        Args:
            column_analyses: Individual column analyses
            
        Returns:
            Overall risk level
        """
        risk_counts = {"High": 0, "Medium": 0, "Low": 0, "None": 0}
        
        for analysis in column_analyses.values():
            risk_level = analysis.get("risk_level", "None")
            risk_counts[risk_level] = risk_counts.get(risk_level, 0) + 1
        
        if risk_counts["High"] > 0:
            return "High"
        elif risk_counts["Medium"] > 2:
            return "High"
        elif risk_counts["Medium"] > 0:
            return "Medium"
        else:
            return "Low"
    
    def _generate_dataset_recommendations(
        self,
        column_analyses: Dict[str, Dict[str, Any]]
    ) -> List[str]:
        """Generate dataset-level recommendations
        
        Args:
            column_analyses: Individual column analyses
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        high_risk = [col for col, a in column_analyses.items() if a["risk_level"] == "High"]
        medium_risk = [col for col, a in column_analyses.items() if a["risk_level"] == "Medium"]
        
        if high_risk:
            recommendations.append(
                f"High-risk PII detected in {len(high_risk)} column(s): {', '.join(high_risk[:3])}. "
                "Consider removing or anonymizing these columns."
            )
        
        if medium_risk:
            recommendations.append(
                f"Potential PII in {len(medium_risk)} column(s): {', '.join(medium_risk[:3])}. "
                "Review these columns and consider using differential privacy."
            )
        
        if high_risk or medium_risk:
            recommendations.append(
                "Use DP-CTGAN or DP-TVAE with appropriate epsilon values for privacy protection."
            )
        else:
            recommendations.append(
                "No high-risk PII detected. Standard synthetic data generation is appropriate."
            )
        
        return recommendations
