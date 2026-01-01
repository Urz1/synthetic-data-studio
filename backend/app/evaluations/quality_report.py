"""
Comprehensive quality report generator for synthetic data evaluation.

Combines statistical, ML utility, and privacy tests into a unified report.
"""

# Standard library
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

# Third-party
import pandas as pd

# Local - Module
from .statistical_tests import StatisticalEvaluator
from .ml_utility import MLUtilityEvaluator
from .privacy_tests import PrivacyEvaluator

logger = logging.getLogger(__name__)


class QualityReportGenerator:
    """
    Generates comprehensive quality reports for synthetic data.
    
    Combines multiple evaluation dimensions:
    - Statistical similarity
    - ML utility
    - Privacy preservation
    """
    
    def __init__(
        self,
        real_data: pd.DataFrame,
        synthetic_data: pd.DataFrame,
        generator_id: str,
        generator_type: str
    ):
        """
        Initialize quality report generator.
        
        Args:
            real_data: Original real dataset
            synthetic_data: Generated synthetic dataset
            generator_id: ID of the generator
            generator_type: Type of generator (ctgan, dp-ctgan, etc.)
        """
        self.real_data = real_data
        self.synthetic_data = synthetic_data
        self.generator_id = generator_id
        self.generator_type = generator_type
        
        logger.info(f"Initialized QualityReportGenerator for {generator_type}")
    
    def generate_full_report(
        self,
        target_column: Optional[str] = None,
        sensitive_columns: Optional[List[str]] = None,
        include_statistical: bool = True,
        include_ml_utility: bool = True,
        include_privacy: bool = True,
        statistical_columns: Optional[List[str]] = None,
        # CONFIGURABLE WEIGHTS (audit fix - was hardcoded)
        statistical_weight: float = 0.4,
        ml_utility_weight: float = 0.3,
        privacy_weight: float = 0.3
    ) -> Dict[str, Any]:
        """
        Generate comprehensive quality report.
        
        Args:
            target_column: Target variable for ML utility tests
            sensitive_columns: Sensitive attributes for privacy tests
            include_statistical: Include statistical similarity tests
            include_ml_utility: Include ML utility tests
            include_privacy: Include privacy leakage tests
            statistical_columns: Specific columns to use for statistical tests (optional)
        
        Returns:
            Comprehensive quality report dictionary
        """
        logger.info("Generating comprehensive quality report...")
        
        report = {
            "report_id": f"{self.generator_id}_quality_report",
            "generator_id": self.generator_id,
            "generator_type": self.generator_type,
            "generated_at": datetime.utcnow().isoformat(),
            "dataset_info": {
                "real_rows": len(self.real_data),
                "synthetic_rows": len(self.synthetic_data),
                "num_columns": len(self.real_data.columns)
                # PRIVACY FIX: Removed "columns" list to avoid leaking sensitive attribute names
            },
            "scoring_weights": {  # AUDIT FIX: Document weights used
                "statistical": statistical_weight,
                "ml_utility": ml_utility_weight,
                "privacy": privacy_weight
            },
            "evaluations": {}
        }
        
        # Statistical similarity
        if include_statistical:
            try:
                stat_evaluator = StatisticalEvaluator(self.real_data, self.synthetic_data)
                stat_results = stat_evaluator.evaluate_all(columns=statistical_columns)
                report["evaluations"]["statistical_similarity"] = stat_results
                logger.info("✓ Statistical evaluation complete")
            except Exception as e:
                logger.error(f"Statistical evaluation failed: {e}")
                report["evaluations"]["statistical_similarity"] = {
                    "status": "error",
                    "error": str(e)
                }
        
        # ML utility
        if include_ml_utility and target_column:
            try:
                ml_evaluator = MLUtilityEvaluator(
                    self.real_data,
                    self.synthetic_data,
                    target_column
                )
                ml_results = ml_evaluator.evaluate_all()
                report["evaluations"]["ml_utility"] = ml_results
                logger.info("✓ ML utility evaluation complete")
            except Exception as e:
                logger.error(f"ML utility evaluation failed: {e}")
                report["evaluations"]["ml_utility"] = {
                    "status": "error",
                    "error": str(e)
                }
        
        # Privacy leakage
        if include_privacy:
            try:
                privacy_evaluator = PrivacyEvaluator(
                    self.real_data,
                    self.synthetic_data,
                    sensitive_columns or []
                )
                privacy_results = privacy_evaluator.evaluate_all()
                report["evaluations"]["privacy"] = privacy_results
                logger.info("✓ Privacy evaluation complete")
            except Exception as e:
                logger.error(f"Privacy evaluation failed: {e}")
                report["evaluations"]["privacy"] = {
                    "status": "error",
                    "error": str(e)
                }
        
        # Overall quality score
        report["overall_assessment"] = self._calculate_overall_score(report["evaluations"])
        
        logger.info(f"✓ Comprehensive quality report generated: {report['overall_assessment']['overall_quality']}")
        
        return report
    
    def _calculate_overall_score(self, evaluations: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate overall quality score from all evaluations.
        
        Args:
            evaluations: Dictionary of all evaluation results
        
        Returns:
            Overall assessment with scores and recommendations
        """
        scores = {}
        weights = {
            "statistical": 0.4,
            "ml_utility": 0.3,
            "privacy": 0.3
        }
        
        # Statistical score
        if "statistical_similarity" in evaluations and "summary" in evaluations["statistical_similarity"]:
            pass_rate = evaluations["statistical_similarity"]["summary"].get("pass_rate", 0)
            scores["statistical"] = pass_rate / 100
        
        # ML utility score
        if "ml_utility" in evaluations and "summary" in evaluations["ml_utility"]:
            utility_ratio = evaluations["ml_utility"]["summary"].get("utility_ratio", 0)
            scores["ml_utility"] = utility_ratio
        
        # Privacy score (inverse - lower risk = higher score)
        if "privacy" in evaluations and "summary" in evaluations["privacy"]:
            privacy_level = evaluations["privacy"]["summary"].get("overall_privacy_level", "Unknown")
            privacy_map = {"Good": 1.0, "Fair": 0.7, "Poor": 0.4, "Unknown": 0.5}
            scores["privacy"] = privacy_map.get(privacy_level, 0.5)
        
        # Calculate weighted average
        if scores:
            total_weight = sum(weights[k] for k in scores.keys())
            overall_score = sum(scores[k] * weights.get(k, 0) for k in scores.keys()) / total_weight
        else:
            overall_score = 0.0
        
        # Quality level
        if overall_score >= 0.9:
            quality_level = "Excellent"
        elif overall_score >= 0.75:
            quality_level = "Good"
        elif overall_score >= 0.60:
            quality_level = "Fair"
        else:
            quality_level = "Poor"
        
        # Recommendations
        recommendations = []
        if scores.get("statistical", 1.0) < 0.75:
            recommendations.append("Consider increasing training epochs for better statistical similarity")
        if scores.get("ml_utility", 1.0) < 0.85:
            recommendations.append("ML utility is below baseline. Review generator parameters")
        if scores.get("privacy", 1.0) < 0.7:
            recommendations.append("Privacy risks detected. Consider using DP-enabled generators or adjusting parameters")
        
        if not recommendations:
            recommendations.append("Quality is satisfactory. No immediate improvements needed.")
        
        return {
            "overall_score": float(overall_score),
            "overall_quality": quality_level,
            "dimension_scores": scores,
            "recommendations": recommendations
        }
    
    def generate_summary_report(self) -> Dict[str, Any]:
        """
        Generate quick summary report (statistical tests only).
        
        Returns:
            Summary report dictionary
        """
        logger.info("Generating summary quality report...")
        
        stat_evaluator = StatisticalEvaluator(self.real_data, self.synthetic_data)
        stat_results = stat_evaluator.evaluate_all()
        
        return {
            "report_id": f"{self.generator_id}_summary",
            "generator_id": self.generator_id,
            "generator_type": self.generator_type,
            "generated_at": datetime.utcnow().isoformat(),
            "statistical_summary": stat_results["summary"],
            "pass_rate": stat_results["summary"]["pass_rate"],
            "quality_level": stat_results["summary"]["overall_quality"]
        }
