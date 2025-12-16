"""
ML Utility evaluation for synthetic data.

Tests how well ML models trained on synthetic data perform compared to
models trained on real data.
"""

# Standard library
import logging
from typing import Dict, Any, Optional, List, Tuple

# Third-party
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, mean_absolute_error, r2_score
)
from sklearn.preprocessing import LabelEncoder

logger = logging.getLogger(__name__)


class MLUtilityEvaluator:
    """
    Evaluates ML utility of synthetic data by training models.
    
    Compares performance of models trained on:
    1. Real data (baseline)
    2. Synthetic data (test)
    3. Mixed data (real + synthetic)
    """
    
    def __init__(
        self,
        real_data: pd.DataFrame,
        synthetic_data: pd.DataFrame,
        target_column: str,
        task_type: str = 'auto'
    ):
        """
        Initialize ML utility evaluator.
        
        Args:
            real_data: Original real dataset
            synthetic_data: Generated synthetic dataset
            target_column: Target variable for prediction
            task_type: 'classification', 'regression', or 'auto' (default)
        """
        self.real_data = real_data
        self.synthetic_data = synthetic_data
        self.target_column = target_column
        
        # Determine task type
        if task_type == 'auto':
            self.task_type = self._detect_task_type()
        else:
            self.task_type = task_type
        
        logger.info(f"Initialized MLUtilityEvaluator for {self.task_type} task")
    
    def _detect_task_type(self) -> str:
        """Auto-detect if task is classification or regression."""
        target = self.real_data[self.target_column]
        
        # Check if target is numeric and has many unique values
        if pd.api.types.is_numeric_dtype(target):
            unique_ratio = len(target.unique()) / len(target)
            if unique_ratio > 0.05:  # More than 5% unique values
                return 'regression'
        
        return 'classification'
    
    def _prepare_data(
        self,
        data: pd.DataFrame,
        test_size: float = 0.2
    ) -> tuple:
        """
        Prepare data for ML training.
        
        Args:
            data: Input DataFrame
            test_size: Fraction for test split
        
        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        df = data.copy()
        
        # Separate features and target
        y = df[self.target_column]
        X = df.drop(columns=[self.target_column])
        
        # Handle categorical features
        categorical_cols = X.select_dtypes(include=['object', 'category']).columns
        for col in categorical_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
        
        # Handle missing values
        X = X.fillna(X.mean())
        
        # Encode target if classification
        if self.task_type == 'classification':
            le = LabelEncoder()
            y = le.fit_transform(y.astype(str))
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        return X_train, X_test, y_train, y_test
    
    def train_on_real_test_on_real(self) -> Dict[str, Any]:
        """
        Baseline: Train on real data, test on real data.
        
        Returns:
            Dictionary with performance metrics
        """
        logger.info("Training baseline model (real → real)...")
        
        X_train, X_test, y_train, y_test = self._prepare_data(self.real_data)
        
        # Train model
        if self.task_type == 'classification':
            model = RandomForestClassifier(n_estimators=100, random_state=42)
        else:
            model = RandomForestRegressor(n_estimators=100, random_state=42)
        
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        metrics = self._calculate_metrics(y_test, y_pred)
        metrics['model'] = 'Real → Real (Baseline)'
        
        logger.info(f"✓ Baseline model trained")
        return metrics
    
    def train_on_synthetic_test_on_real(self) -> Dict[str, Any]:
        """
        Test: Train on synthetic data, test on real data.
        
        This is the key utility test: can synthetic data train effective models?
        
        Returns:
            Dictionary with performance metrics
        """
        logger.info("Training synthetic model (synthetic → real)...")
        
        # Prepare synthetic for training
        X_train_synth, _, y_train_synth, _ = self._prepare_data(self.synthetic_data, test_size=0.01)
        
        # Prepare real for testing
        _, X_test_real, _, y_test_real = self._prepare_data(self.real_data)
        
        # Ensure same features
        common_features = list(set(X_train_synth.columns) & set(X_test_real.columns))
        X_train_synth = X_train_synth[common_features]
        X_test_real = X_test_real[common_features]
        
        # Train model
        if self.task_type == 'classification':
            model = RandomForestClassifier(n_estimators=100, random_state=42)
        else:
            model = RandomForestRegressor(n_estimators=100, random_state=42)
        
        model.fit(X_train_synth, y_train_synth)
        y_pred = model.predict(X_test_real)
        
        # Calculate metrics
        metrics = self._calculate_metrics(y_test_real, y_pred)
        metrics['model'] = 'Synthetic → Real (Test)'
        
        logger.info(f"✓ Synthetic model trained")
        return metrics
    
    def train_on_mixed_test_on_real(self, synthetic_ratio: float = 0.5) -> Dict[str, Any]:
        """
        Train on mixed data (real + synthetic), test on real.
        
        Args:
            synthetic_ratio: Ratio of synthetic data in training set
        
        Returns:
            Dictionary with performance metrics
        """
        logger.info(f"Training mixed model (ratio={synthetic_ratio})...")
        
        # Prepare data
        X_train_real, X_test_real, y_train_real, y_test_real = self._prepare_data(self.real_data)
        X_train_synth, _, y_train_synth, _ = self._prepare_data(self.synthetic_data, test_size=0.01)
        
        # Ensure same features
        common_features = list(set(X_train_real.columns) & set(X_train_synth.columns))
        X_train_real = X_train_real[common_features]
        X_train_synth = X_train_synth[common_features]
        X_test_real = X_test_real[common_features]
        
        # Mix data
        n_synth = int(len(X_train_real) * synthetic_ratio / (1 - synthetic_ratio))
        if n_synth > len(X_train_synth):
            n_synth = len(X_train_synth)
        
        # Sample synthetic data (FIXED: add seed for reproducibility)
        np.random.seed(42)
        sample_indices = np.random.choice(len(X_train_synth), size=n_synth, replace=False)
        X_train_synth_sample = X_train_synth.iloc[sample_indices].reset_index(drop=True)
        y_train_synth_sample = y_train_synth[sample_indices] if isinstance(y_train_synth, np.ndarray) else y_train_synth.iloc[sample_indices].values
        
        # Mix data
        X_train_mixed = pd.concat([X_train_real.reset_index(drop=True), X_train_synth_sample], ignore_index=True)
        y_train_mixed = np.concatenate([y_train_real, y_train_synth_sample])
        
        # Train model
        if self.task_type == 'classification':
            model = RandomForestClassifier(n_estimators=100, random_state=42)
        else:
            model = RandomForestRegressor(n_estimators=100, random_state=42)
        
        model.fit(X_train_mixed, y_train_mixed)
        y_pred = model.predict(X_test_real)
        
        # Calculate metrics
        metrics = self._calculate_metrics(y_test_real, y_pred)
        metrics['model'] = f'Mixed (Real + {synthetic_ratio:.0%} Synthetic) → Real'
        
        logger.info(f"✓ Mixed model trained")
        return metrics
    
    def _calculate_metrics(self, y_true, y_pred) -> Dict[str, float]:
        """Calculate performance metrics based on task type."""
        if self.task_type == 'classification':
            return {
                'accuracy': float(accuracy_score(y_true, y_pred)),
                'precision': float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
                'recall': float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
                'f1_score': float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
            }
        else:
            return {
                'r2_score': float(r2_score(y_true, y_pred)),
                'mse': float(mean_squared_error(y_true, y_pred)),
                'rmse': float(np.sqrt(mean_squared_error(y_true, y_pred))),
                'mae': float(mean_absolute_error(y_true, y_pred))
            }
    
    def evaluate_all(self) -> Dict[str, Any]:
        """
        Run all ML utility tests and compile comprehensive report.
        
        Returns:
            Dictionary with all test results and utility assessment
        """
        logger.info("Running comprehensive ML utility evaluation...")
        
        results = {
            "task_type": self.task_type,
            "target_column": self.target_column,
            "models": {}
        }
        
        # Train all models
        baseline = self.train_on_real_test_on_real()
        synthetic = self.train_on_synthetic_test_on_real()
        mixed = self.train_on_mixed_test_on_real()
        
        results["models"]["baseline"] = baseline
        results["models"]["synthetic"] = synthetic
        results["models"]["mixed"] = mixed
        
        # Calculate utility score
        if self.task_type == 'classification':
            baseline_score = baseline['f1_score']
            synthetic_score = synthetic['f1_score']
            metric_name = 'f1_score'
        else:
            baseline_score = baseline['r2_score']
            synthetic_score = synthetic['r2_score']
            metric_name = 'r2_score'
        
        utility_ratio = synthetic_score / baseline_score if baseline_score > 0 else 0
        
        results["summary"] = {
            "utility_ratio": float(utility_ratio),
            "utility_percentage": float(utility_ratio * 100),
            "baseline_score": float(baseline_score),
            "synthetic_score": float(synthetic_score),
            "metric_used": metric_name,
            "quality_level": self._get_utility_level(utility_ratio)
        }
        
        logger.info(f"✓ ML utility evaluation complete: {utility_ratio*100:.1f}% of baseline")
        
        return results
    
    def _get_utility_level(self, utility_ratio: float) -> str:
        """Get utility quality level based on ratio to baseline."""
        if utility_ratio >= 0.95:
            return "Excellent"
        elif utility_ratio >= 0.85:
            return "Good"
        elif utility_ratio >= 0.70:
            return "Fair"
        else:
            return "Poor"
