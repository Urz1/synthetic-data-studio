"""
Privacy leakage tests for synthetic data.

Implements tests to detect potential privacy vulnerabilities:
- Distance to closest record (DCR)
- Membership inference attacks
- Attribute inference attacks
"""

import logging
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from scipy.spatial.distance import cdist
from sklearn.neighbors import NearestNeighbors
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

logger = logging.getLogger(__name__)


class PrivacyEvaluator:
    """
    Evaluates privacy leakage risks in synthetic data.
    
    Tests for:
    1. Distance to Closest Record (DCR): Are synthetic records too similar to real ones?
    2. Membership Inference: Can we determine if a record was in training data?
    3. Attribute Inference: Can we infer sensitive attributes from synthetic data?
    """
    
    def __init__(
        self,
        real_data: pd.DataFrame,
        synthetic_data: pd.DataFrame,
        sensitive_columns: Optional[List[str]] = None
    ):
        """
        Initialize privacy evaluator.
        
        Args:
            real_data: Original real dataset
            synthetic_data: Generated synthetic dataset
            sensitive_columns: List of sensitive attribute columns
        """
        self.real_data = real_data
        self.synthetic_data = synthetic_data
        self.sensitive_columns = sensitive_columns or []
        
        # Prepare numerical data for distance calculations
        self.real_numerical = self._prepare_numerical(real_data)
        self.synthetic_numerical = self._prepare_numerical(synthetic_data)
        
        logger.info(f"Initialized PrivacyEvaluator with {len(real_data)} real and {len(synthetic_data)} synthetic records")
    
    def _prepare_numerical(self, df: pd.DataFrame) -> np.ndarray:
        """Convert DataFrame to numerical array for distance calculations."""
        df_copy = df.copy()
        
        # Encode categorical variables
        categorical_cols = df_copy.select_dtypes(include=['object', 'category']).columns
        for col in categorical_cols:
            df_copy[col] = pd.Categorical(df_copy[col]).codes
        
        # Fill NaN
        df_copy = df_copy.fillna(0)
        
        # Normalize to [0, 1]
        from sklearn.preprocessing import MinMaxScaler
        scaler = MinMaxScaler()
        normalized = scaler.fit_transform(df_copy)
        
        return normalized
    
    def distance_to_closest_record(self, metric: str = 'euclidean') -> Dict[str, Any]:
        """
        Calculate Distance to Closest Record (DCR) for each synthetic record.
        
        DCR measures how close synthetic records are to real training data.
        Low DCR = potential privacy leakage (too similar to real data).
        
        Args:
            metric: Distance metric ('euclidean', 'manhattan', 'cosine')
        
        Returns:
            Dictionary with DCR statistics and privacy assessment
        """
        logger.info(f"Calculating Distance to Closest Record ({metric})...")
        
        # Calculate pairwise distances
        distances = cdist(self.synthetic_numerical, self.real_numerical, metric=metric)
        
        # Find minimum distance for each synthetic record
        min_distances = distances.min(axis=1)
        
        # Statistics
        dcr_stats = {
            "mean": float(np.mean(min_distances)),
            "median": float(np.median(min_distances)),
            "std": float(np.std(min_distances)),
            "min": float(np.min(min_distances)),
            "max": float(np.max(min_distances)),
            "q25": float(np.percentile(min_distances, 25)),
            "q75": float(np.percentile(min_distances, 75))
        }
        
        # Risk assessment
        # Threshold: records within 5% of feature space range
        threshold_high_risk = 0.05
        threshold_medium_risk = 0.10
        
        high_risk = (min_distances < threshold_high_risk).sum()
        medium_risk = ((min_distances >= threshold_high_risk) & 
                      (min_distances < threshold_medium_risk)).sum()
        low_risk = (min_distances >= threshold_medium_risk).sum()
        
        total = len(min_distances)
        
        # Overall risk level
        if high_risk / total > 0.1:
            risk_level = "High"
            interpretation = "WARNING: Many synthetic records are very close to real data. Potential privacy leakage."
        elif high_risk / total > 0.05:
            risk_level = "Medium"
            interpretation = "CAUTION: Some synthetic records are close to real data. Review sensitive cases."
        else:
            risk_level = "Low"
            interpretation = "GOOD: Synthetic records maintain safe distance from real data."
        
        return {
            "test": "Distance to Closest Record",
            "metric": metric,
            "statistics": dcr_stats,
            "risk_distribution": {
                "high_risk": int(high_risk),
                "medium_risk": int(medium_risk),
                "low_risk": int(low_risk),
                "high_risk_percentage": float(high_risk / total * 100),
                "medium_risk_percentage": float(medium_risk / total * 100),
                "low_risk_percentage": float(low_risk / total * 100)
            },
            "risk_level": risk_level,
            "interpretation": interpretation
        }
    
    def membership_inference_attack(self) -> Dict[str, Any]:
        """
        Test vulnerability to membership inference attacks.
        
        Attempts to train a classifier to distinguish between:
        - Records used in training (real data)
        - Records not used in training (synthetic data)
        
        High accuracy = vulnerability (attacker can infer membership)
        
        Returns:
            Dictionary with attack results and vulnerability assessment
        """
        logger.info("Running membership inference attack...")
        
        # Prepare data
        # Label: 1 = real (member), 0 = synthetic (non-member)
        real_labeled = np.column_stack([self.real_numerical, np.ones(len(self.real_numerical))])
        synth_labeled = np.column_stack([self.synthetic_numerical, np.zeros(len(self.synthetic_numerical))])
        
        # Combine and shuffle
        combined = np.vstack([real_labeled, synth_labeled])
        np.random.shuffle(combined)
        
        X = combined[:, :-1]
        y = combined[:, -1]
        
        # Split for training the attacker
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42
        )
        
        # Train attacker model
        attacker = RandomForestClassifier(n_estimators=100, random_state=42)
        attacker.fit(X_train, y_train)
        
        # Evaluate attack
        y_pred = attacker.predict(X_test)
        y_pred_proba = attacker.predict_proba(X_test)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_pred_proba)
        
        # Vulnerability assessment
        # Random guessing = 50% accuracy
        # Good privacy = near 50% accuracy (can't distinguish)
        advantage = (accuracy - 0.5) * 2  # Convert to 0-1 scale
        
        if advantage > 0.3:
            vulnerability = "High"
            interpretation = "WARNING: High vulnerability to membership inference. Attacker can distinguish real from synthetic."
        elif advantage > 0.15:
            vulnerability = "Medium"
            interpretation = "CAUTION: Moderate vulnerability to membership inference."
        else:
            vulnerability = "Low"
            interpretation = "GOOD: Low vulnerability to membership inference. Real and synthetic are hard to distinguish."
        
        return {
            "test": "Membership Inference Attack",
            "attack_accuracy": float(accuracy),
            "attack_auc": float(auc),
            "attack_advantage": float(advantage),
            "vulnerability": vulnerability,
            "interpretation": interpretation,
            "baseline_accuracy": 0.5,
            "note": "Lower attack accuracy = better privacy"
        }
    
    def attribute_inference_attack(self, target_column: str) -> Dict[str, Any]:
        """
        Test vulnerability to attribute inference attacks.
        
        Attempts to infer a sensitive attribute from synthetic data using
        other attributes as features.
        
        Args:
            target_column: Sensitive attribute to try to infer
        
        Returns:
            Dictionary with attack results and vulnerability assessment
        """
        logger.info(f"Running attribute inference attack on '{target_column}'...")
        
        if target_column not in self.real_data.columns:
            return {
                "test": "Attribute Inference Attack",
                "status": "skipped",
                "reason": f"Column '{target_column}' not found"
            }
        
        # Prepare data
        real_df = self.real_data.copy()
        synth_df = self.synthetic_data.copy()
        
        # Encode categorical
        from sklearn.preprocessing import LabelEncoder
        for col in real_df.select_dtypes(include=['object', 'category']).columns:
            le = LabelEncoder()
            real_df[col] = le.fit_transform(real_df[col].astype(str))
            if col in synth_df.columns:
                synth_df[col] = le.transform(synth_df[col].astype(str))
        
        # Prepare features and target
        X_real = real_df.drop(columns=[target_column]).fillna(0)
        y_real = real_df[target_column]
        
        X_synth = synth_df.drop(columns=[target_column]).fillna(0)
        y_synth = synth_df[target_column]
        
        # Ensure same columns
        common_cols = list(set(X_real.columns) & set(X_synth.columns))
        X_real = X_real[common_cols]
        X_synth = X_synth[common_cols]
        
        # Train on synthetic, test on real
        attacker = RandomForestClassifier(n_estimators=100, random_state=42)
        attacker.fit(X_synth, y_synth)
        
        X_real_train, X_real_test, y_real_train, y_real_test = train_test_split(
            X_real, y_real, test_size=0.3, random_state=42
        )
        
        y_pred = attacker.predict(X_real_test)
        accuracy = accuracy_score(y_real_test, y_pred)
        
        # Vulnerability assessment
        # High accuracy = attribute can be inferred from other features
        if accuracy > 0.8:
            vulnerability = "High"
            interpretation = f"WARNING: Attribute '{target_column}' can be inferred with {accuracy*100:.1f}% accuracy. High leakage risk."
        elif accuracy > 0.7:
            vulnerability = "Medium"
            interpretation = f"CAUTION: Attribute '{target_column}' can be inferred with {accuracy*100:.1f}% accuracy."
        else:
            vulnerability = "Low"
            interpretation = f"GOOD: Attribute '{target_column}' is difficult to infer ({accuracy*100:.1f}% accuracy)."
        
        return {
            "test": "Attribute Inference Attack",
            "target_attribute": target_column,
            "inference_accuracy": float(accuracy),
            "vulnerability": vulnerability,
            "interpretation": interpretation
        }
    
    def evaluate_all(self) -> Dict[str, Any]:
        """
        Run all privacy tests and compile comprehensive report.
        
        Returns:
            Dictionary with all test results and privacy assessment
        """
        logger.info("Running comprehensive privacy evaluation...")
        
        results = {
            "tests": {},
            "summary": {}
        }
        
        # DCR test
        dcr_result = self.distance_to_closest_record()
        results["tests"]["distance_to_closest_record"] = dcr_result
        
        # Membership inference
        membership_result = self.membership_inference_attack()
        results["tests"]["membership_inference"] = membership_result
        
        # Attribute inference for sensitive columns
        if self.sensitive_columns:
            attribute_results = {}
            for col in self.sensitive_columns:
                attr_result = self.attribute_inference_attack(col)
                attribute_results[col] = attr_result
            results["tests"]["attribute_inference"] = attribute_results
        
        # Overall privacy assessment
        risk_levels = [
            dcr_result.get("risk_level", "Unknown"),
            membership_result.get("vulnerability", "Unknown")
        ]
        
        if "High" in risk_levels:
            overall_privacy = "Poor"
        elif "Medium" in risk_levels:
            overall_privacy = "Fair"
        else:
            overall_privacy = "Good"
        
        results["summary"] = {
            "overall_privacy_level": overall_privacy,
            "dcr_risk": dcr_result.get("risk_level"),
            "membership_vulnerability": membership_result.get("vulnerability"),
            "num_sensitive_attributes_tested": len(self.sensitive_columns)
        }
        
        logger.info(f"✓ Privacy evaluation complete: {overall_privacy} privacy level")
        
        return results
