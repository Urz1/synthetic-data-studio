"""
Risk Assessment Service

Calculates privacy and quality risk scores for synthetic data evaluations.
Provides actionable risk ratings (Low/Medium/High) and recommendations.
"""

import logging
import math
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class RiskAssessor:
    """
    Enterprise-grade risk assessment for synthetic data.
    
    Calculates:
    - Privacy Risk (0-100): Lower is better
    - Quality Risk (0-100): Lower is better
    - Overall Risk Rating: Low/Medium/High
    """
    
    def __init__(self, evaluation_report: Dict[str, Any]):
        """
        Initialize risk assessor with evaluation report.
        
        Args:
            evaluation_report: Complete evaluation report from QualityReportGenerator
        """
        self.report = evaluation_report
        self.privacy_metrics = evaluation_report.get('privacy_metrics', {})
        self.statistical_metrics = evaluation_report.get('statistical_similarity', {})
        self.ml_utility = evaluation_report.get('ml_utility', {})
        self.overall_assessment = evaluation_report.get('overall_assessment', {})
        
    def calculate_privacy_risk(self) -> Dict[str, Any]:
        """
        Calculate privacy risk score (0-100).
        
        Lower score = better privacy protection.
        
        Components:
        - DP Epsilon Risk (0-30): Based on differential privacy guarantee
        - Re-identification Risk (0-40): Based on similarity to original records
        - Membership Inference Risk (0-30): Based on ability to detect training data
        
        Returns:
            Dict with score, breakdown, and details
        """
        logger.info("Calculating privacy risk score")
        
        # Component 1: DP Epsilon Risk (0-30 points)
        dp_epsilon_risk = self._calculate_dp_epsilon_risk()
        
        # Component 2: Re-identification Risk (0-40 points)
        reidentification_risk = self._calculate_reidentification_risk()
        
        # Component 3: Membership Inference Risk (0-30 points)
        membership_risk = self._calculate_membership_inference_risk()
        
        # Total privacy risk
        total_risk = dp_epsilon_risk + reidentification_risk + membership_risk
        
        # Generate details
        details = self._generate_privacy_risk_details(
            dp_epsilon_risk, reidentification_risk, membership_risk
        )
        
        result = {
            "score": round(total_risk, 2),
            "breakdown": {
                "dp_epsilon_risk": round(dp_epsilon_risk, 2),
                "reidentification_risk": round(reidentification_risk, 2),
                "membership_inference_risk": round(membership_risk, 2)
            },
            "details": details,
            "has_differential_privacy": self.privacy_metrics.get('has_differential_privacy', False)
        }
        
        logger.info(f"Privacy risk score: {result['score']}/100")
        return result
    
    def calculate_quality_risk(self) -> Dict[str, Any]:
        """
        Calculate quality risk score (0-100).
        
        Lower score = better data quality.
        
        Components:
        - Statistical Fidelity Risk (0-40): Based on distribution similarity
        - ML Utility Risk (0-40): Based on model performance
        - Data Completeness Risk (0-20): Based on data integrity
        
        Returns:
            Dict with score, breakdown, and details
        """
        logger.info("Calculating quality risk score")
        
        # Component 1: Statistical Fidelity Risk (0-40 points)
        statistical_risk = self._calculate_statistical_fidelity_risk()
        
        # Component 2: ML Utility Risk (0-40 points)
        ml_utility_risk = self._calculate_ml_utility_risk()
        
        # Component 3: Data Completeness Risk (0-20 points)
        completeness_risk = self._calculate_completeness_risk()
        
        # Total quality risk
        total_risk = statistical_risk + ml_utility_risk + completeness_risk
        
        # Generate details
        details = self._generate_quality_risk_details(
            statistical_risk, ml_utility_risk, completeness_risk
        )
        
        result = {
            "score": round(total_risk, 2),
            "breakdown": {
                "statistical_fidelity_risk": round(statistical_risk, 2),
                "ml_utility_risk": round(ml_utility_risk, 2),
                "completeness_risk": round(completeness_risk, 2)
            },
            "details": details
        }
        
        logger.info(f"Quality risk score: {result['score']}/100")
        return result
    
    def calculate_overall_risk(self, privacy_weight: float = 0.6) -> Dict[str, Any]:
        """
        Calculate overall risk rating combining privacy and quality.
        
        Args:
            privacy_weight: Weight for privacy vs quality (default 60% privacy, 40% quality)
        
        Returns:
            Complete risk assessment with recommendations
        """
        logger.info(f"Calculating overall risk (privacy_weight={privacy_weight})")
        
        # Calculate component risks
        privacy_risk = self.calculate_privacy_risk()
        quality_risk = self.calculate_quality_risk()
        
        # Weighted overall score
        overall_score = (
            privacy_risk['score'] * privacy_weight +
            quality_risk['score'] * (1 - privacy_weight)
        )
        
        # Determine risk level
        risk_level = self._determine_risk_level(overall_score)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            privacy_risk['score'],
            quality_risk['score'],
            privacy_risk['has_differential_privacy']
        )
        
        # Determine if safe for release
        safe_for_release = overall_score < 30
        
        result = {
            "overall_score": round(overall_score, 2),
            "risk_level": risk_level,
            "privacy_risk": privacy_risk,
            "quality_risk": quality_risk,
            "recommendations": recommendations,
            "safe_for_release": safe_for_release,
            "privacy_weight": privacy_weight
        }
        
        logger.info(f"Overall risk: {overall_score:.2f}/100 ({risk_level})")
        return result
    
    # ============================================================================
    # Privacy Risk Components
    # ============================================================================
    
    def _calculate_dp_epsilon_risk(self) -> float:
        """Calculate risk based on differential privacy epsilon value."""
        epsilon = self.privacy_metrics.get('epsilon')
        
        if epsilon is None:
            # No differential privacy = maximum risk
            return 30.0
        
        # Lower epsilon = better privacy = lower risk
        if epsilon < 1.0:
            return 5.0  # Excellent privacy
        elif epsilon < 3.0:
            return 10.0  # Strong privacy
        elif epsilon < 5.0:
            return 15.0  # Good privacy
        elif epsilon < 10.0:
            return 25.0  # Acceptable privacy
        else:
            return 30.0  # Weak privacy
    
    def _calculate_reidentification_risk(self) -> float:
        """Calculate risk of re-identifying individuals from synthetic data."""
        # Get nearest neighbor distance metric
        nn_distance = self.privacy_metrics.get('nearest_neighbor_distance_ratio', 0.5)
        
        # If synthetic records are very similar to real ones = high risk
        if nn_distance > 0.7:
            return 5.0  # Very different from real data = low risk
        elif nn_distance > 0.5:
            return 10.0  # Reasonably different
        elif nn_distance > 0.3:
            return 20.0  # Somewhat similar
        elif nn_distance > 0.15:
            return 30.0  # Very similar = higher risk
        else:
            return 40.0  # Nearly identical = critical risk
    
    def _calculate_membership_inference_risk(self) -> float:
        """Calculate risk of membership inference attacks."""
        # Get membership inference accuracy (if available)
        mi_accuracy = self.privacy_metrics.get('membership_inference_accuracy', 0.5)
        
        # Random guessing = 0.5, perfect detection = 1.0
        # Lower detection = lower risk
        if mi_accuracy < 0.55:
            return 5.0  # Cannot reliably detect membership = low risk
        elif mi_accuracy < 0.65:
            return 15.0  # Weak membership signal
        elif mi_accuracy < 0.75:
            return 25.0  # Moderate membership signal
        else:
            return 30.0  # Strong membership signal = high risk
    
    # ============================================================================
    # Quality Risk Components
    # ============================================================================
    
    def _calculate_statistical_fidelity_risk(self) -> float:
        """Calculate risk based on statistical similarity to real data."""
        # Get KS test average p-value
        ks_avg_pvalue = self.statistical_metrics.get('ks_test', {}).get('average_pvalue', 0.0)
        
        # Get correlation difference (Frobenius norm)
        correlation_diff = self.statistical_metrics.get('correlation_comparison', {}).get('frobenius_norm', float('inf'))
        
        # KS test scoring (higher p-value = better match = lower risk)
        if ks_avg_pvalue > 0.05:
            ks_risk = 5.0  # Distributions match well
        elif ks_avg_pvalue > 0.01:
            ks_risk = 15.0  # Acceptable match
        elif ks_avg_pvalue > 0.001:
            ks_risk = 25.0  # Poor match
        else:
            ks_risk = 40.0  # Very poor match
        
        # Correlation difference scoring (lower norm = better match = lower risk)
        if correlation_diff < 0.1 or math.isnan(correlation_diff) or math.isinf(correlation_diff):
            corr_risk = 0.0  # Excellent correlation preservation
        elif correlation_diff < 0.5:
            corr_risk = 10.0  # Good correlation preservation
        elif correlation_diff < 1.0:
            corr_risk = 20.0  # Acceptable correlation preservation
        else:
            corr_risk = 30.0  # Poor correlation preservation
        
        # Average the two components (max 40 points)
        return min(40.0, (ks_risk + corr_risk) / 2)
    
    def _calculate_ml_utility_risk(self) -> float:
        """Calculate risk based on ML utility metrics."""
        # Get ML utility scores if available
        if not self.ml_utility or 'real_model_performance' not in self.ml_utility:
            # No ML utility data = assume moderate risk
            return 20.0
        
        # Get F1 score difference
        real_f1 = self.ml_utility.get('real_model_performance', {}).get('f1_score', 0)
        synthetic_f1 = self.ml_utility.get('synthetic_model_performance', {}).get('f1_score', 0)
        f1_delta = abs(real_f1 - synthetic_f1)
        
        # Lower delta = better utility = lower risk
        if f1_delta < 0.05:
            return 5.0  # Excellent ML utility
        elif f1_delta < 0.10:
            return 15.0  # Good ML utility
        elif f1_delta < 0.20:
            return 25.0  # Acceptable ML utility
        else:
            return 40.0  # Poor ML utility
    
    def _calculate_completeness_risk(self) -> float:
        """Calculate risk based on data completeness and integrity."""
        # Check for basic quality indicators in the report
        overall_quality = self.overall_assessment.get('overall_quality', 'unknown')
        
        if overall_quality == 'excellent':
            return 0.0
        elif overall_quality == 'good':
            return 5.0
        elif overall_quality == 'acceptable':
            return 10.0
        elif overall_quality == 'poor':
            return 15.0
        else:
            return 10.0  # Unknown = assume moderate risk
    
    # ============================================================================
    # Risk Level Determination
    # ============================================================================
    
    def _determine_risk_level(self, overall_score: float) -> str:
        """Determine risk level category from overall score."""
        if overall_score < 30:
            return "low"
        elif overall_score < 60:
            return "medium"
        else:
            return "high"
    
    # ============================================================================
    # Recommendations Engine
    # ============================================================================
    
    def _generate_recommendations(
        self,
        privacy_risk: float,
        quality_risk: float,
        has_dp: bool
    ) -> List[str]:
        """Generate actionable recommendations based on risk scores."""
        recommendations = []
        
        # Privacy recommendations
        if privacy_risk > 60:
            if not has_dp:
                recommendations.append(
                    "❌ CRITICAL: No differential privacy detected. "
                    "Use DP-CTGAN or DP-TVAE for stronger privacy guarantees"
                )
            recommendations.append(
                "❌ HIGH PRIVACY RISK: This data should NOT be released publicly"
            )
            recommendations.append(
                "⚠️ Consider reducing epsilon value for stronger privacy protection"
            )
            recommendations.append(
                "⚠️ Increase training dataset size to reduce overfitting and privacy risk"
            )
        elif privacy_risk > 30:
            recommendations.append(
                "⚠️ MEDIUM PRIVACY RISK: Suitable for internal use only with proper controls"
            )
            if not has_dp:
                recommendations.append(
                    "⚠️ Consider using differential privacy (DP-CTGAN/DP-TVAE) for public release"
                )
        else:
            recommendations.append(
                "✅ LOW PRIVACY RISK: Strong privacy guarantees in place"
            )
        
        # Quality recommendations
        if quality_risk > 60:
            recommendations.append(
                "❌ HIGH QUALITY RISK: Synthetic data quality is poor"
            )
            recommendations.append(
                "⚠️ Increase training epochs significantly (try 500-1000 epochs)"
            )
            recommendations.append(
                "⚠️ Try a different generator type (CTGAN vs TVAE)"
            )
            recommendations.append(
                "⚠️ Ensure sufficient training data (minimum 1000 rows recommended)"
            )
        elif quality_risk > 30:
            recommendations.append(
                "⚠️ MEDIUM QUALITY RISK: Data quality could be improved"
            )
            recommendations.append(
                "⚠️ Consider increasing training epochs for better statistical similarity"
            )
        else:
            recommendations.append(
                "✅ LOW QUALITY RISK: Excellent statistical fidelity and ML utility"
            )
        
        # Overall assessment
        if privacy_risk < 30 and quality_risk < 30:
            recommendations.append(
                "✅ EXCELLENT! This synthetic data is safe for public release and maintains high quality"
            )
        
        return recommendations
    
    # ============================================================================
    # Details Generation
    # ============================================================================
    
    def _generate_privacy_risk_details(
        self,
        dp_risk: float,
        reident_risk: float,
        mi_risk: float
    ) -> str:
        """Generate human-readable privacy risk details."""
        epsilon = self.privacy_metrics.get('epsilon', 'N/A')
        
        details = f"Privacy Risk Analysis:\n"
        details += f"- Differential Privacy: {dp_risk:.1f}/30 points (ε={epsilon})\n"
        details += f"- Re-identification Risk: {reident_risk:.1f}/40 points\n"
        details += f"- Membership Inference: {mi_risk:.1f}/30 points"
        
        return details
    
    def _generate_quality_risk_details(
        self,
        stat_risk: float,
        ml_risk: float,
        comp_risk: float
    ) -> str:
        """Generate human-readable quality risk details."""
        details = f"Quality Risk Analysis:\n"
        details += f"- Statistical Fidelity: {stat_risk:.1f}/40 points\n"
        details += f"- ML Utility: {ml_risk:.1f}/40 points\n"
        details += f"- Data Completeness: {comp_risk:.1f}/20 points"
        
        return details
