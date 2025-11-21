"""
Statistical similarity tests for synthetic data evaluation.

Implements various statistical tests to measure how well synthetic data
matches the real data distribution.
"""

import logging
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np
from scipy import stats
from scipy.spatial.distance import jensenshannon
from scipy.stats import ks_2samp, chi2_contingency, wasserstein_distance

logger = logging.getLogger(__name__)


class StatisticalEvaluator:
    """
    Evaluates statistical similarity between real and synthetic data.
    
    Uses multiple statistical tests to assess distribution similarity:
    - Kolmogorov-Smirnov test (continuous features)
    - Chi-square test (categorical features)
    - Wasserstein distance (distribution difference)
    - Jensen-Shannon divergence (probability distributions)
    - Correlation comparison
    """
    
    def __init__(self, real_data: pd.DataFrame, synthetic_data: pd.DataFrame):
        """
        Initialize evaluator with real and synthetic datasets.
        
        Args:
            real_data: Original real dataset
            synthetic_data: Generated synthetic dataset
        """
        self.real_data = real_data
        self.synthetic_data = synthetic_data
        
        # Ensure same columns
        common_cols = set(real_data.columns) & set(synthetic_data.columns)
        self.real_data = real_data[list(common_cols)]
        self.synthetic_data = synthetic_data[list(common_cols)]
        
        logger.info(f"Initialized StatisticalEvaluator with {len(common_cols)} columns")
    
    def kolmogorov_smirnov_test(self, column: str) -> Dict[str, Any]:
        """
        Perform Kolmogorov-Smirnov test for numerical column.
        
        Tests if two samples come from the same distribution.
        
        Args:
            column: Column name to test
        
        Returns:
            Dictionary with statistic, p-value, and interpretation
        """
        real_col = self.real_data[column].dropna()
        synth_col = self.synthetic_data[column].dropna()
        
        # Check for empty data
        if len(real_col) == 0 or len(synth_col) == 0:
            return {
                "test": "Kolmogorov-Smirnov",
                "column": column,
                "statistic": None,
                "p_value": None,
                "similarity": "Unknown",
                "interpretation": "SKIP: Insufficient data for statistical test",
                "passed": False
            }
        
        statistic, p_value = ks_2samp(real_col, synth_col)
        
        # Interpretation
        if p_value > 0.05:
            interpretation = "PASS: Distributions are statistically similar (p > 0.05)"
            similarity = "High"
        elif p_value > 0.01:
            interpretation = "WARNING: Some distribution differences detected (0.01 < p < 0.05)"
            similarity = "Moderate"
        else:
            interpretation = "FAIL: Distributions are significantly different (p < 0.01)"
            similarity = "Low"
        
        return {
            "test": "Kolmogorov-Smirnov",
            "column": column,
            "statistic": float(statistic),
            "p_value": float(p_value),
            "similarity": similarity,
            "interpretation": interpretation,
            "passed": bool(p_value > 0.05)
        }
    
    def chi_square_test(self, column: str, bins: int = 10) -> Dict[str, Any]:
        """
        Perform Chi-square test for categorical or binned numerical data.
        
        Args:
            column: Column name to test
            bins: Number of bins for numerical data (default: 10)
        
        Returns:
            Dictionary with statistic, p-value, and interpretation
        """
        real_col = self.real_data[column].dropna()
        synth_col = self.synthetic_data[column].dropna()
        
        # Check for empty data
        if len(real_col) == 0 or len(synth_col) == 0:
            return {
                "test": "Chi-Square",
                "column": column,
                "statistic": None,
                "p_value": None,
                "degrees_of_freedom": None,
                "similarity": "Unknown",
                "interpretation": "SKIP: Insufficient data for statistical test",
                "passed": False
            }
        
        # Check if categorical or numerical
        if real_col.dtype == 'object' or real_col.dtype.name == 'category':
            # Categorical: use value counts
            real_counts = real_col.value_counts()
            synth_counts = synth_col.value_counts()
            
            # Align categories
            all_categories = set(real_counts.index) | set(synth_counts.index)
            real_freq = [real_counts.get(cat, 0) for cat in all_categories]
            synth_freq = [synth_counts.get(cat, 0) for cat in all_categories]
        else:
            # Numerical: bin the data
            min_val = min(real_col.min(), synth_col.min())
            max_val = max(real_col.max(), synth_col.max())
            bin_edges = np.linspace(min_val, max_val, bins + 1)
            
            real_freq, _ = np.histogram(real_col, bins=bin_edges)
            synth_freq, _ = np.histogram(synth_col, bins=bin_edges)
        
        # Create contingency table
        contingency_table = np.array([real_freq, synth_freq])
        
        # Perform chi-square test
        chi2, p_value, dof, expected = chi2_contingency(contingency_table)
        
        # Interpretation
        if p_value > 0.05:
            interpretation = "PASS: Distributions are statistically similar (p > 0.05)"
            similarity = "High"
        elif p_value > 0.01:
            interpretation = "WARNING: Some distribution differences detected (0.01 < p < 0.05)"
            similarity = "Moderate"
        else:
            interpretation = "FAIL: Distributions are significantly different (p < 0.01)"
            similarity = "Low"
        
        return {
            "test": "Chi-Square",
            "column": column,
            "statistic": float(chi2),
            "p_value": float(p_value),
            "degrees_of_freedom": int(dof),
            "similarity": similarity,
            "interpretation": interpretation,
            "passed": bool(p_value > 0.05)
        }
    
    def wasserstein_distance_test(self, column: str) -> Dict[str, Any]:
        """
        Calculate Wasserstein distance (Earth Mover's Distance) for numerical column.
        
        Measures the minimum amount of "work" needed to transform one distribution
        into another.
        
        Args:
            column: Column name to test
        
        Returns:
            Dictionary with distance and interpretation
        """
        real_col = self.real_data[column].dropna()
        synth_col = self.synthetic_data[column].dropna()
        
        # Check for empty data
        if len(real_col) == 0 or len(synth_col) == 0:
            return {
                "test": "Wasserstein Distance",
                "column": column,
                "distance": None,
                "normalized_distance": None,
                "similarity": "Unknown",
                "interpretation": "SKIP: Insufficient data for statistical test"
            }
        
        distance = wasserstein_distance(real_col, synth_col)
        
        # Normalize by data range
        data_range = real_col.max() - real_col.min()
        normalized_distance = distance / data_range if data_range > 0 else 0
        
        # Interpretation
        if normalized_distance < 0.1:
            interpretation = "Excellent: Very similar distributions"
            similarity = "High"
        elif normalized_distance < 0.2:
            interpretation = "Good: Similar distributions"
            similarity = "Moderate-High"
        elif normalized_distance < 0.3:
            interpretation = "Fair: Some differences in distributions"
            similarity = "Moderate"
        else:
            interpretation = "Poor: Significant distribution differences"
            similarity = "Low"
        
        return {
            "test": "Wasserstein Distance",
            "column": column,
            "distance": float(distance),
            "normalized_distance": float(normalized_distance),
            "similarity": similarity,
            "interpretation": interpretation
        }
    
    def jensen_shannon_divergence(self, column: str, bins: int = 50) -> Dict[str, Any]:
        """
        Calculate Jensen-Shannon divergence between distributions.
        
        JS divergence is a symmetric measure of similarity between two probability
        distributions. Range: [0, 1], where 0 = identical, 1 = completely different.
        
        Args:
            column: Column name to test
            bins: Number of bins for histogram (default: 50)
        
        Returns:
            Dictionary with divergence and interpretation
        """
        real_col = self.real_data[column].dropna()
        synth_col = self.synthetic_data[column].dropna()
        
        # Check for empty data
        if len(real_col) == 0 or len(synth_col) == 0:
            return {
                "test": "Jensen-Shannon Divergence",
                "column": column,
                "divergence": None,
                "similarity": "Unknown",
                "interpretation": "SKIP: Insufficient data for statistical test"
            }
        
        # Create histograms
        min_val = min(real_col.min(), synth_col.min())
        max_val = max(real_col.max(), synth_col.max())
        bin_edges = np.linspace(min_val, max_val, bins + 1)
        
        real_hist, _ = np.histogram(real_col, bins=bin_edges, density=True)
        synth_hist, _ = np.histogram(synth_col, bins=bin_edges, density=True)
        
        # Normalize to probability distributions
        real_prob = real_hist / real_hist.sum()
        synth_prob = synth_hist / synth_hist.sum()
        
        # Add small epsilon to avoid log(0)
        epsilon = 1e-10
        real_prob = real_prob + epsilon
        synth_prob = synth_prob + epsilon
        
        # Calculate JS divergence
        divergence = jensenshannon(real_prob, synth_prob)
        
        # Interpretation
        if divergence < 0.1:
            interpretation = "Excellent: Nearly identical distributions"
            similarity = "High"
        elif divergence < 0.2:
            interpretation = "Good: Very similar distributions"
            similarity = "Moderate-High"
        elif divergence < 0.3:
            interpretation = "Fair: Moderately similar distributions"
            similarity = "Moderate"
        else:
            interpretation = "Poor: Significantly different distributions"
            similarity = "Low"
        
        return {
            "test": "Jensen-Shannon Divergence",
            "column": column,
            "divergence": float(divergence),
            "similarity": similarity,
            "interpretation": interpretation
        }
    
    def correlation_comparison(self) -> Dict[str, Any]:
        """
        Compare correlation matrices between real and synthetic data.
        
        Returns:
            Dictionary with correlation difference metrics
        """
        # Select only numerical columns
        real_numerical = self.real_data.select_dtypes(include=[np.number])
        synth_numerical = self.synthetic_data.select_dtypes(include=[np.number])
        
        if len(real_numerical.columns) < 2:
            return {
                "test": "Correlation Comparison",
                "status": "skipped",
                "reason": "Less than 2 numerical columns"
            }
        
        # Calculate correlation matrices
        real_corr = real_numerical.corr()
        synth_corr = synth_numerical.corr()
        
        # Calculate Frobenius norm of difference
        corr_diff = np.linalg.norm(real_corr - synth_corr, 'fro')
        
        # Calculate mean absolute error
        mae = np.abs(real_corr - synth_corr).mean().mean()
        
        # Interpretation
        if mae < 0.1:
            interpretation = "Excellent: Correlations well preserved"
            similarity = "High"
        elif mae < 0.2:
            interpretation = "Good: Correlations mostly preserved"
            similarity = "Moderate-High"
        elif mae < 0.3:
            interpretation = "Fair: Some correlation differences"
            similarity = "Moderate"
        else:
            interpretation = "Poor: Significant correlation differences"
            similarity = "Low"
        
        return {
            "test": "Correlation Comparison",
            "frobenius_norm": float(corr_diff),
            "mean_absolute_error": float(mae),
            "similarity": similarity,
            "interpretation": interpretation,
            "num_features": len(real_numerical.columns)
        }
    
    def evaluate_all(self) -> Dict[str, Any]:
        """
        Run all statistical tests and compile comprehensive report.
        
        Returns:
            Dictionary with all test results and overall assessment
        """
        logger.info("Running comprehensive statistical evaluation...")
        
        results = {
            "column_tests": {},
            "overall_tests": {},
            "summary": {}
        }
        
        # Test each column
        numerical_cols = self.real_data.select_dtypes(include=[np.number]).columns
        categorical_cols = self.real_data.select_dtypes(include=['object', 'category']).columns
        
        total_tests = 0
        passed_tests = 0
        
        for col in numerical_cols:
            col_results = []
            
            # KS test
            ks_result = self.kolmogorov_smirnov_test(col)
            col_results.append(ks_result)
            total_tests += 1
            if ks_result.get('passed'): passed_tests += 1
            
            # Wasserstein distance
            ws_result = self.wasserstein_distance_test(col)
            col_results.append(ws_result)
            
            # JS divergence
            js_result = self.jensen_shannon_divergence(col)
            col_results.append(js_result)
            
            results["column_tests"][col] = col_results
        
        for col in categorical_cols:
            # Chi-square test
            chi_result = self.chi_square_test(col)
            results["column_tests"][col] = [chi_result]
            total_tests += 1
            if chi_result.get('passed'): passed_tests += 1
        
        # Overall tests
        corr_result = self.correlation_comparison()
        results["overall_tests"]["correlation"] = corr_result
        
        # Summary
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        results["summary"] = {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "pass_rate": pass_rate,
            "overall_quality": self._get_quality_level(pass_rate),
            "num_columns_tested": len(results["column_tests"]),
            "num_numerical": len(numerical_cols),
            "num_categorical": len(categorical_cols)
        }
        
        logger.info(f"✓ Statistical evaluation complete: {pass_rate:.1f}% pass rate")
        
        return results
    
    def _get_quality_level(self, pass_rate: float) -> str:
        """Get quality level based on pass rate."""
        if pass_rate >= 90:
            return "Excellent"
        elif pass_rate >= 75:
            return "Good"
        elif pass_rate >= 60:
            return "Fair"
        else:
            return "Poor"
