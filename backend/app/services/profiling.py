"""
Advanced Data Profiling Service

Provides comprehensive statistical analysis of datasets including:
- Type detection and validation
- Missing value analysis
- Distribution statistics
- Outlier detection (IQR and Isolation Forest)
- Correlation analysis
- Cardinality assessment
"""

# Standard library
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

# Third-party
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import IsolationForest

logger = logging.getLogger(__name__)


class DataProfiler:
    """
    Comprehensive data profiling for uploaded datasets.
    """
    
    def __init__(self, dataframe: pd.DataFrame):
        self.df = dataframe
        self.profile_results = {}
        
    def profile(self) -> Dict[str, Any]:
        """
        Run complete profiling analysis.
        
        Returns:
            Dictionary with comprehensive profiling results
        """
        logger.info(f"Starting profiling for dataset with {len(self.df)} rows and {len(self.df.columns)} columns")
        
        self.profile_results = {
            "dataset_summary": self._get_dataset_summary(),
            "columns": self._profile_columns(),
            "correlations": self._analyze_correlations(),
            "missing_values": self._analyze_missing_values(),
            "duplicates": self._analyze_duplicates(),
            "profiling_timestamp": datetime.utcnow().isoformat()
        }
        
        return self.profile_results
    
    def _get_dataset_summary(self) -> Dict[str, Any]:
        """Get high-level dataset summary."""
        return {
            "row_count": len(self.df),
            "column_count": len(self.df.columns),
            "memory_usage_bytes": int(self.df.memory_usage(deep=True).sum()),
            "duplicate_row_count": int(self.df.duplicated().sum()),
            "total_missing_cells": int(self.df.isna().sum().sum()),
            "columns": list(self.df.columns)
        }
    
    def _profile_columns(self) -> Dict[str, Dict[str, Any]]:
        """
        Profile each column individually.
        
        Returns:
            Dictionary mapping column names to their profiles
        """
        column_profiles = {}
        
        for col in self.df.columns:
            try:
                column_profiles[col] = self._profile_single_column(col)
            except Exception as e:
                logger.error(f"Error profiling column {col}: {e}")
                column_profiles[col] = {
                    "error": str(e),
                    "dtype": str(self.df[col].dtype)
                }
        
        return column_profiles
    
    def _profile_single_column(self, col: str) -> Dict[str, Any]:
        """Profile a single column with type-specific analysis."""
        series = self.df[col]
        
        base_profile = {
            "dtype": str(series.dtype),
            "missing_count": int(series.isna().sum()),
            "missing_percentage": float(series.isna().sum() / len(series) * 100),
            "unique_count": int(series.nunique()),
            "cardinality": float(series.nunique() / len(series)),
        }
        
        # Infer semantic type
        semantic_type = self._infer_semantic_type(series)
        base_profile["semantic_type"] = semantic_type
        
        # Type-specific profiling
        if pd.api.types.is_numeric_dtype(series):
            base_profile.update(self._profile_numeric_column(series))
        elif pd.api.types.is_datetime64_any_dtype(series):
            base_profile.update(self._profile_datetime_column(series))
        elif pd.api.types.is_bool_dtype(series):
            base_profile.update(self._profile_boolean_column(series))
        else:
            base_profile.update(self._profile_categorical_column(series))
        
        return base_profile
    
    def _infer_semantic_type(self, series: pd.Series) -> str:
        """
        Infer semantic type of column (beyond pandas dtype).
        
        Returns:
            String identifier for semantic type
        """
        # Check if numeric
        if pd.api.types.is_numeric_dtype(series):
            # Check if it's actually an ID (high cardinality, integers)
            if series.nunique() / len(series) > 0.95 and pd.api.types.is_integer_dtype(series):
                return "identifier"
            return "numeric"
        
        # Check if datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"
        
        # Check if boolean
        if pd.api.types.is_bool_dtype(series):
            return "boolean"
        
        # For object types, try to infer more
        if series.dtype == 'object':
            # Check cardinality for categorical vs free text
            cardinality_ratio = series.nunique() / len(series)
            
            if cardinality_ratio < 0.05:  # Less than 5% unique
                return "categorical"
            elif cardinality_ratio > 0.95:  # More than 95% unique
                return "text"
            else:
                return "categorical"
        
        return "unknown"
    
    def _profile_numeric_column(self, series: pd.Series) -> Dict[str, Any]:
        """Profile numeric column with comprehensive statistics."""
        clean_series = series.dropna()
        
        if len(clean_series) == 0:
            return {"error": "No non-null values"}
        
        # Convert boolean to int if needed for numeric operations
        if clean_series.dtype == 'bool':
            clean_series = clean_series.astype(int)
        
        # Basic statistics
        profile = {
            "mean": float(clean_series.mean()),
            "median": float(clean_series.median()),
            "std": float(clean_series.std()),
            "min": float(clean_series.min()),
            "max": float(clean_series.max()),
            "q25": float(clean_series.quantile(0.25)),
            "q75": float(clean_series.quantile(0.75)),
        }
        
        # IQR-based outlier detection
        q1 = profile["q25"]
        q3 = profile["q75"]
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = clean_series[(clean_series < lower_bound) | (clean_series > upper_bound)]
        profile["outlier_count_iqr"] = len(outliers)
        profile["outlier_percentage_iqr"] = float(len(outliers) / len(clean_series) * 100)
        
        # Isolation Forest outlier detection (if enough data)
        if len(clean_series) >= 10:
            try:
                iso_forest = IsolationForest(contamination=0.1, random_state=42)
                outlier_labels = iso_forest.fit_predict(clean_series.values.reshape(-1, 1))
                outlier_count_iso = int((outlier_labels == -1).sum())
                profile["outlier_count_isolation_forest"] = outlier_count_iso
                profile["outlier_percentage_isolation_forest"] = float(outlier_count_iso / len(clean_series) * 100)
            except Exception as e:
                logger.warning(f"Isolation Forest failed: {e}")
        
        # Skewness and kurtosis
        profile["skewness"] = float(clean_series.skew())
        profile["kurtosis"] = float(clean_series.kurtosis())
        
        # Histogram data (for visualization)
        hist, bin_edges = np.histogram(clean_series, bins=20)
        profile["histogram"] = {
            "counts": hist.tolist(),
            "bin_edges": bin_edges.tolist()
        }
        
        return profile
    
    def _profile_datetime_column(self, series: pd.Series) -> Dict[str, Any]:
        """Profile datetime column."""
        clean_series = series.dropna()
        
        if len(clean_series) == 0:
            return {"error": "No non-null values"}
        
        return {
            "min": clean_series.min().isoformat() if hasattr(clean_series.min(), 'isoformat') else str(clean_series.min()),
            "max": clean_series.max().isoformat() if hasattr(clean_series.max(), 'isoformat') else str(clean_series.max()),
            "range_days": (clean_series.max() - clean_series.min()).days if hasattr(clean_series.max() - clean_series.min(), 'days') else None
        }
    
    def _profile_boolean_column(self, series: pd.Series) -> Dict[str, Any]:
        """Profile boolean column."""
        value_counts = series.value_counts()
        
        return {
            "true_count": int(value_counts.get(True, 0)),
            "false_count": int(value_counts.get(False, 0)),
            "true_percentage": float(value_counts.get(True, 0) / len(series) * 100)
        }
    
    def _profile_categorical_column(self, series: pd.Series) -> Dict[str, Any]:
        """Profile categorical/text column."""
        value_counts = series.value_counts()
        
        profile = {
            "top_values": value_counts.head(10).to_dict(),
            "mode": str(series.mode()[0]) if len(series.mode()) > 0 else None,
            "entropy": float(stats.entropy(value_counts.values)) if len(value_counts) > 0 else 0
        }
        
        # For text, add length statistics
        if series.dtype == 'object':
            lengths = series.dropna().astype(str).str.len()
            if len(lengths) > 0:
                profile["text_length_mean"] = float(lengths.mean())
                profile["text_length_min"] = int(lengths.min())
                profile["text_length_max"] = int(lengths.max())
        
        return profile
    
    def _analyze_correlations(self) -> Dict[str, Any]:
        """
        Analyze correlations between numeric columns.
        
        Returns:
            Correlation matrix and highly correlated pairs
        """
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) < 2:
            return {"message": "Not enough numeric columns for correlation analysis"}
        
        corr_matrix = self.df[numeric_cols].corr()
        
        # Find highly correlated pairs (abs correlation > 0.7)
        high_corr_pairs = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) > 0.7:
                    high_corr_pairs.append({
                        "column1": corr_matrix.columns[i],
                        "column2": corr_matrix.columns[j],
                        "correlation": float(corr_value)
                    })
        
        return {
            "correlation_matrix": corr_matrix.to_dict(),
            "highly_correlated_pairs": high_corr_pairs
        }
    
    def _analyze_missing_values(self) -> Dict[str, Any]:
        """
        Analyze missing value patterns.
        
        Returns:
            Missing value statistics and patterns
        """
        missing_counts = self.df.isna().sum()
        missing_cols = missing_counts[missing_counts > 0].sort_values(ascending=False)
        
        return {
            "total_missing_cells": int(missing_counts.sum()),
            "columns_with_missing": {
                col: {
                    "count": int(count),
                    "percentage": float(count / len(self.df) * 100)
                }
                for col, count in missing_cols.items()
            }
        }
    
    def _analyze_duplicates(self) -> Dict[str, Any]:
        """
        Analyze duplicate rows.
        
        Returns:
            Duplicate statistics
        """
        duplicate_mask = self.df.duplicated()
        duplicate_count = duplicate_mask.sum()
        
        return {
            "duplicate_row_count": int(duplicate_count),
            "duplicate_percentage": float(duplicate_count / len(self.df) * 100),
            "unique_row_count": int(len(self.df) - duplicate_count)
        }


def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Convenience function to profile a dataset.
    
    Args:
        df: Pandas DataFrame to profile
        
    Returns:
        Comprehensive profiling results
    """
    profiler = DataProfiler(df)
    return profiler.profile()
