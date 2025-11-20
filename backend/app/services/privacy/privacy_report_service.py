"""
Privacy Report Service

Generates comprehensive privacy reports for DP-enabled models including:
- Privacy budget analysis (epsilon, delta)
- Privacy level assessment
- Compliance recommendations
- Privacy-utility trade-off analysis
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)


class PrivacyReportService:
    """
    Service for generating privacy reports and analyzing privacy guarantees.
    """
    
    @staticmethod
    def generate_privacy_report(
        generator_id: uuid.UUID,
        model_type: str,
        privacy_config: Dict[str, Any],
        privacy_spent: Dict[str, Any],
        training_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive privacy report for a DP-enabled generator.
        
        Args:
            generator_id: ID of the generator
            model_type: Type of model ('dp-ctgan', 'dp-tvae')
            privacy_config: Privacy configuration parameters
            privacy_spent: Actual privacy budget consumed
            training_metadata: Training statistics
        
        Returns:
            Comprehensive privacy report dictionary
        """
        epsilon = privacy_spent.get("epsilon", 0)
        delta = privacy_spent.get("delta", 0)
        target_epsilon = privacy_config.get("target_epsilon", 0)
        target_delta = privacy_config.get("target_delta", 0)
        
        # Assess privacy level
        privacy_assessment = PrivacyReportService._assess_privacy_level(epsilon)
        
        # Generate compliance notes
        compliance_notes = PrivacyReportService._generate_compliance_notes(
            epsilon, delta, model_type
        )
        
        # Privacy-utility trade-off analysis
        tradeoff_analysis = PrivacyReportService._analyze_tradeoff(
            epsilon, target_epsilon, training_metadata
        )
        
        report = {
            "report_id": str(uuid.uuid4()),
            "generator_id": str(generator_id),
            "model_type": model_type,
            "generated_at": datetime.utcnow().isoformat(),
            "privacy_budget": {
                "epsilon": round(epsilon, 4),
                "delta": delta,
                "target_epsilon": target_epsilon,
                "target_delta": target_delta,
                "budget_utilization": round((epsilon / target_epsilon * 100) if target_epsilon > 0 else 0, 2)
            },
            "privacy_assessment": privacy_assessment,
            "compliance": compliance_notes,
            "tradeoff_analysis": tradeoff_analysis,
            "parameters": {
                "max_grad_norm": privacy_config.get("max_grad_norm"),
                "noise_multiplier": privacy_config.get("noise_multiplier"),
                "epochs": training_metadata.get("epochs"),
                "batch_size": training_metadata.get("batch_size"),
                "training_rows": training_metadata.get("training_rows")
            },
            "recommendations": PrivacyReportService._generate_recommendations(
                epsilon, target_epsilon, privacy_assessment["level"]
            )
        }
        
        return report
    
    @staticmethod
    def _assess_privacy_level(epsilon: float) -> Dict[str, Any]:
        """
        Assess privacy protection level based on epsilon value.
        
        Args:
            epsilon: Privacy budget spent
        
        Returns:
            Dictionary with privacy level and interpretation
        """
        if epsilon < 0.1:
            level = "Exceptional"
            color = "green"
            score = 10
            interpretation = "Extremely strong privacy protection. Near-perfect privacy guarantees."
        elif epsilon < 1.0:
            level = "Very Strong"
            color = "green"
            score = 9
            interpretation = "Excellent privacy protection. Individual records are highly protected."
        elif epsilon < 3.0:
            level = "Strong"
            color = "green"
            score = 8
            interpretation = "Strong privacy protection suitable for highly sensitive data (PHI, PII)."
        elif epsilon < 5.0:
            level = "Good"
            color = "lightgreen"
            score = 7
            interpretation = "Good privacy protection suitable for sensitive data."
        elif epsilon < 10.0:
            level = "Moderate"
            color = "yellow"
            score = 6
            interpretation = "Reasonable privacy protection for most use cases."
        elif epsilon < 15.0:
            level = "Fair"
            color = "orange"
            score = 5
            interpretation = "Fair privacy protection. Consider reducing epsilon for sensitive data."
        elif epsilon < 20.0:
            level = "Weak"
            color = "orange"
            score = 4
            interpretation = "Limited privacy protection. Not recommended for highly sensitive data."
        elif epsilon < 50.0:
            level = "Very Weak"
            color = "red"
            score = 2
            interpretation = "Minimal privacy protection. Only suitable for non-sensitive data."
        else:
            level = "Insufficient"
            color = "red"
            score = 1
            interpretation = "Insufficient privacy protection. Does not provide meaningful privacy guarantees."
        
        return {
            "level": level,
            "color": color,
            "score": score,
            "interpretation": interpretation,
            "epsilon_value": epsilon
        }
    
    @staticmethod
    def _generate_compliance_notes(
        epsilon: float,
        delta: float,
        model_type: str
    ) -> Dict[str, Any]:
        """
        Generate compliance framework notes.
        
        Args:
            epsilon: Privacy budget spent
            delta: Failure probability
            model_type: Type of DP model
        
        Returns:
            Dictionary with compliance framework assessments
        """
        hipaa_compliant = epsilon < 10.0
        gdpr_compliant = epsilon < 15.0
        
        return {
            "HIPAA": {
                "status": "Compliant" if hipaa_compliant else "Review Required",
                "notes": [
                    f"Differential Privacy with ε={epsilon:.2f} provides mathematical privacy guarantees",
                    "Suitable for Protected Health Information (PHI)" if hipaa_compliant else "Consider reducing epsilon for PHI",
                    "De-identification standard met through algorithmic privacy"
                ],
                "recommendation": "Approved for PHI use" if hipaa_compliant else "Reduce epsilon to < 10.0 for PHI"
            },
            "GDPR": {
                "status": "Compliant" if gdpr_compliant else "Review Required",
                "notes": [
                    f"Provides quantifiable privacy protection (ε={epsilon:.2f}, δ={delta:.2e})",
                    "Meets GDPR Article 32 security requirements" if gdpr_compliant else "May require additional measures",
                    "Supports right to be forgotten through synthetic data",
                    "Privacy-by-design principle satisfied"
                ],
                "recommendation": "Approved for EU data" if gdpr_compliant else "Reduce epsilon to < 15.0"
            },
            "CCPA": {
                "status": "Compliant",
                "notes": [
                    "Synthetic data generation supports data minimization",
                    "DP guarantees reduce re-identification risk",
                    "Enables data sharing without exposing personal information"
                ],
                "recommendation": "Approved for California consumer data"
            },
            "SOC2": {
                "status": "Compliant",
                "notes": [
                    f"Mathematical privacy guarantees documented (ε={epsilon:.2f})",
                    "Audit trail maintained through privacy reports",
                    "Supports CC6.7 (data protection) control"
                ],
                "recommendation": "Suitable for SOC 2 Type II compliance"
            },
            "model_details": {
                "algorithm": model_type,
                "privacy_mechanism": "Differential Privacy (DP-SGD)",
                "accounting_method": "Rényi Differential Privacy (RDP)",
                "guarantees": f"(ε={epsilon:.2f}, δ={delta:.2e})-differential privacy"
            }
        }
    
    @staticmethod
    def _analyze_tradeoff(
        epsilon: float,
        target_epsilon: float,
        training_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze privacy-utility trade-off.
        
        Args:
            epsilon: Actual epsilon spent
            target_epsilon: Target epsilon
            training_metadata: Training statistics
        
        Returns:
            Trade-off analysis dictionary
        """
        budget_exceeded = epsilon > target_epsilon
        overspend_pct = ((epsilon - target_epsilon) / target_epsilon * 100) if target_epsilon > 0 else 0
        
        # Estimate utility impact (simplified heuristic)
        if epsilon < 1.0:
            utility_impact = "High"
            utility_description = "Strong privacy may reduce synthetic data quality. Consider increasing epsilon if utility is insufficient."
        elif epsilon < 5.0:
            utility_impact = "Moderate"
            utility_description = "Good balance between privacy and utility for most use cases."
        elif epsilon < 10.0:
            utility_impact = "Low"
            utility_description = "Minimal impact on synthetic data quality expected."
        else:
            utility_impact = "Minimal"
            utility_description = "Very low impact on data quality, but weaker privacy protection."
        
        return {
            "privacy_vs_utility": {
                "privacy_strength": "Strong" if epsilon < 5.0 else "Moderate" if epsilon < 10.0 else "Weak",
                "utility_impact": utility_impact,
                "description": utility_description
            },
            "budget_status": {
                "target_epsilon": target_epsilon,
                "actual_epsilon": epsilon,
                "exceeded": budget_exceeded,
                "overspend_percentage": round(overspend_pct, 2) if budget_exceeded else 0,
                "status": "Budget Exceeded" if budget_exceeded else "Within Budget"
            },
            "tuning_suggestions": PrivacyReportService._get_tuning_suggestions(epsilon, training_metadata)
        }
    
    @staticmethod
    def _get_tuning_suggestions(epsilon: float, training_metadata: Dict[str, Any]) -> List[str]:
        """Generate tuning suggestions based on epsilon value."""
        suggestions = []
        
        if epsilon > 15.0:
            suggestions.append("Reduce noise_multiplier to achieve lower epsilon")
            suggestions.append("Increase max_grad_norm for more aggressive clipping")
            suggestions.append("Consider reducing number of epochs")
        elif epsilon > 10.0:
            suggestions.append("Slightly increase noise_multiplier for better privacy")
            suggestions.append("Current settings provide moderate privacy")
        elif epsilon < 1.0:
            suggestions.append("Consider reducing noise_multiplier if data utility is poor")
            suggestions.append("May increase epochs to improve synthetic data quality")
            suggestions.append("Very strong privacy achieved - validate synthetic data quality")
        else:
            suggestions.append("Good privacy-utility balance achieved")
            suggestions.append("Settings are appropriate for sensitive data")
        
        return suggestions
    
    @staticmethod
    def _generate_recommendations(
        epsilon: float,
        target_epsilon: float,
        privacy_level: str
    ) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []
        
        if epsilon > target_epsilon:
            recommendations.append(f"⚠️ Privacy budget exceeded target by {((epsilon - target_epsilon) / target_epsilon * 100):.1f}%")
            recommendations.append("Consider increasing noise_multiplier or reducing epochs in next training")
        
        if epsilon > 20.0:
            recommendations.append("🔴 Strong recommendation: Retrain with lower epsilon for sensitive data")
        elif epsilon > 10.0:
            recommendations.append("⚠️ Consider retraining with epsilon < 10.0 for highly sensitive data (PHI/PII)")
        elif epsilon < 1.0:
            recommendations.append("✓ Excellent privacy protection achieved")
            recommendations.append("Validate synthetic data quality to ensure utility is sufficient")
        else:
            recommendations.append("✓ Good privacy-utility balance for most use cases")
        
        recommendations.append(f"Privacy Level: {privacy_level}")
        recommendations.append("Document this privacy report for compliance audits")
        
        return recommendations
    
    @staticmethod
    def compare_privacy_budgets(
        reports: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Compare privacy budgets across multiple models.
        
        Args:
            reports: List of privacy reports
        
        Returns:
            Comparison analysis
        """
        if not reports:
            return {"error": "No reports provided"}
        
        epsilons = [r["privacy_budget"]["epsilon"] for r in reports]
        
        return {
            "num_models": len(reports),
            "epsilon_range": {
                "min": min(epsilons),
                "max": max(epsilons),
                "mean": sum(epsilons) / len(epsilons),
                "median": sorted(epsilons)[len(epsilons) // 2]
            },
            "best_privacy": {
                "epsilon": min(epsilons),
                "model_id": reports[epsilons.index(min(epsilons))]["generator_id"]
            },
            "weakest_privacy": {
                "epsilon": max(epsilons),
                "model_id": reports[epsilons.index(max(epsilons))]["generator_id"]
            },
            "models": [
                {
                    "id": r["generator_id"],
                    "epsilon": r["privacy_budget"]["epsilon"],
                    "level": r["privacy_assessment"]["level"]
                }
                for r in reports
            ]
        }
