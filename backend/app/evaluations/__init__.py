"""
Evaluation module for synthetic data quality assessment.

This module provides comprehensive evaluation tools including:
- Statistical similarity tests
- ML utility benchmarks
- Privacy leakage detection
- Quality scoring and reporting
"""

from .models import Evaluation
from .statistical_tests import StatisticalEvaluator
from .ml_utility import MLUtilityEvaluator
from .privacy_tests import PrivacyEvaluator
from .quality_report import QualityReportGenerator

__all__ = [
    "Evaluation",
    "StatisticalEvaluator"
]
