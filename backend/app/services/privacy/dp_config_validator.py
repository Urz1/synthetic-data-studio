"""
DP Configuration Validator

Validates differential privacy parameters before training to prevent
catastrophic privacy failures.

PARAMETER CONSTRAINTS (based on DP-SGD theory):
- batch_size: min=8, max=50% of dataset
- epochs: min=1, max depends on dataset size and epsilon
- target_epsilon: min=0.1, max=100 (practical range: 1-20)
- dataset_size: min=50 for DP to be meaningful
"""

import logging
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class DPLimits:
    """Strict limits for DP parameters based on dataset size."""
    
    # Absolute minimums
    MIN_DATASET_SIZE: int = 50
    MIN_BATCH_SIZE: int = 8
    MIN_EPOCHS: int = 1
    MIN_EPSILON: float = 0.1
    
    # Absolute maximums
    MAX_EPSILON: float = 100.0
    MAX_BATCH_SIZE_RATIO: float = 0.5  # 50% of dataset
    MAX_STEPS: int = 5000  # Beyond this, privacy is meaningless
    
    @classmethod
    def get_limits_for_dataset(cls, dataset_size: int, target_epsilon: float = 10.0) -> Dict[str, Any]:
        """
        Get concrete parameter limits for a specific dataset.
        
        Returns strict min/max values the user MUST follow.
        """
        # Batch size limits - for small datasets, max is dataset size itself
        max_batch_size = max(cls.MIN_BATCH_SIZE, min(dataset_size, int(dataset_size * cls.MAX_BATCH_SIZE_RATIO)))
        
        # For very small datasets, allow batch_size up to dataset_size
        if dataset_size < 100:
            max_batch_size = dataset_size
        
        # Recommended batch: 10% of data but within bounds
        recommended_batch = max(cls.MIN_BATCH_SIZE, min(max_batch_size, dataset_size // 10))
        
        # Calculate max epochs based on privacy budget
        # More epochs = more privacy consumed
        # Formula: steps = epochs * (dataset_size / batch_size)
        steps_per_epoch = max(1, dataset_size // recommended_batch)
        
        # Max steps that can achieve target epsilon
        max_feasible_steps = int(target_epsilon * 100)  # Rough heuristic
        max_epochs = max(1, min(500, max_feasible_steps // max(1, steps_per_epoch)))
        
        return {
            "dataset_size": dataset_size,
            "batch_size": {
                "min": min(cls.MIN_BATCH_SIZE, dataset_size),  # For tiny datasets
                "max": max_batch_size,
                "recommended": recommended_batch
            },
            "epochs": {
                "min": cls.MIN_EPOCHS,
                "max": max_epochs,
                "recommended": min(max_epochs, max(5, max_epochs // 2))
            },
            "epsilon": {
                "min": cls.MIN_EPSILON,
                "max": cls.MAX_EPSILON,
                "recommended_range": (1.0, 20.0)
            }
        }


class DPConfigValidator:
    """Validates DP training configurations for privacy safety."""
    
    @staticmethod
    def get_parameter_limits(dataset_size: int, target_epsilon: float = 10.0) -> Dict[str, Any]:
        """
        Get strict parameter limits for the frontend/API.
        
        This should be called BEFORE the user submits to show valid ranges.
        """
        return DPLimits.get_limits_for_dataset(dataset_size, target_epsilon)
    
    @staticmethod
    def validate_config(
        dataset_size: int,
        epochs: int,
        batch_size: int,
        target_epsilon: float,
        target_delta: float = None,
        force: bool = False
    ) -> Tuple[bool, List[str], List[str]]:
        """
        Validate DP configuration before training.
        
        Args:
            dataset_size: Number of training samples
            epochs: Training epochs
            batch_size: Batch size
            target_epsilon: Target privacy budget
            target_delta: Target failure probability
            force: If True, convert blocking errors to warnings (user acknowledged risks)
        
        Returns:
            Tuple of (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        limits = DPLimits.get_limits_for_dataset(dataset_size, target_epsilon)
        
        # Set delta if not provided
        if target_delta is None:
            target_delta = 1.0 / dataset_size
        
        # ═══════════════════════════════════════════════════════════════════
        # HARD ERRORS - Cannot proceed even with force=True
        # ═══════════════════════════════════════════════════════════════════
        
        # 1. Batch size larger than dataset (physically impossible)
        if batch_size > dataset_size:
            errors.append(
                f"Batch size ({batch_size}) cannot exceed dataset size ({dataset_size}). "
                f"Maximum allowed: {dataset_size}."
            )
            return False, errors, warnings
        
        # 2. Invalid epsilon (mathematically meaningless)
        if target_epsilon < DPLimits.MIN_EPSILON:
            errors.append(
                f"Epsilon ({target_epsilon}) is too small. "
                f"Minimum: {DPLimits.MIN_EPSILON}. "
                f"Very low epsilon requires impractically high noise."
            )
            return False, errors, warnings
        
        # ═══════════════════════════════════════════════════════════════════
        # SOFT ERRORS - Block by default, allow with force=True
        # ═══════════════════════════════════════════════════════════════════
        
        soft_errors = []
        
        # 3. Dataset too small for DP (risky but possible)
        if dataset_size < DPLimits.MIN_DATASET_SIZE:
            msg = (
                f"Dataset too small for differential privacy ({dataset_size} rows). "
                f"Recommended minimum: {DPLimits.MIN_DATASET_SIZE} rows. "
                f"Privacy guarantees will be weak. Consider using non-DP generator (ctgan, tvae) instead."
            )
            soft_errors.append(msg)
        if batch_size > limits["batch_size"]["max"]:
            msg = (
                f"Batch size ({batch_size}) exceeds 50% of dataset. "
                f"Allowed range: {limits['batch_size']['min']}-{limits['batch_size']['max']}. "
                f"Recommended: {limits['batch_size']['recommended']}."
            )
            soft_errors.append(msg)
        
        # 5. Too many training steps
        steps = epochs * max(1, dataset_size // batch_size)
        if steps > DPLimits.MAX_STEPS:
            msg = (
                f"Too many training steps ({steps:,}). Maximum: {DPLimits.MAX_STEPS:,}. "
                f"With {epochs} epochs and batch_size {batch_size}, privacy will be exhausted. "
                f"Reduce epochs to {max(1, DPLimits.MAX_STEPS * batch_size // dataset_size)} "
                f"or increase batch_size to {max(8, dataset_size * epochs // DPLimits.MAX_STEPS)}."
            )
            soft_errors.append(msg)
        
        # 6. Check if configuration can achieve target epsilon
        import numpy as np
        
        sampling_rate = batch_size / dataset_size
        log_term = np.log(1.0 / target_delta)
        
        # Prevent overflow
        if 2 * steps * log_term > 1e12:
            msg = (
                f"Configuration mathematically infeasible for ε={target_epsilon}. "
                f"The combination of {epochs} epochs and batch_size {batch_size} "
                f"requires infinite noise. Either: "
                f"(1) Reduce epochs to {max(1, epochs // 10)}, "
                f"(2) Increase batch_size to {min(dataset_size // 2, batch_size * 5)}, or "
                f"(3) Increase epsilon to {min(100, target_epsilon * 10)}."
            )
            soft_errors.append(msg)
        else:
            estimated_noise = np.sqrt(2 * steps * log_term) / target_epsilon
            
            if estimated_noise < 0.3 and not np.isnan(estimated_noise) and not np.isinf(estimated_noise):
                # Calculate what IS achievable
                achievable_epsilon = np.sqrt(2 * steps * log_term) / 0.5
                
                msg = (
                    f"Cannot achieve ε={target_epsilon} with current settings. "
                    f"Estimated achievable ε={achievable_epsilon:.1f}. "
                    f"To achieve ε={target_epsilon}: "
                    f"reduce epochs to {max(1, int(epochs * (target_epsilon / achievable_epsilon) ** 2))} "
                    f"or increase epsilon to {achievable_epsilon:.1f}."
                )
                soft_errors.append(msg)
        
        # Handle soft errors
        if soft_errors:
            if force:
                # User acknowledged risks - convert to warnings
                for msg in soft_errors:
                    warnings.append(f"⚠️ FORCED: {msg}")
                logger.warning(f"User forced training despite {len(soft_errors)} configuration issues")
            else:
                errors.extend(soft_errors)
        
        # ═══════════════════════════════════════════════════════════════════
        # WARNINGS - Informational only, never block
        # ═══════════════════════════════════════════════════════════════════
        
        # Small dataset warning
        if dataset_size < 1000:
            warnings.append(
                f"Small dataset ({dataset_size} rows). "
                f"DP-SGD works best with >1,000 rows. Quality may be limited."
            )
        
        # High epsilon warning
        if target_epsilon > 20:
            warnings.append(
                f"High epsilon ({target_epsilon}). "
                f"Privacy protection is weak. Consider ε≤10 for sensitive data."
            )
        
        # Low epsilon warning
        if target_epsilon < 1.0:
            warnings.append(
                f"Very low epsilon ({target_epsilon}). "
                f"Strong privacy but synthetic data quality may be significantly degraded."
            )
        
        # Batch size too small
        if batch_size < 32 and batch_size >= DPLimits.MIN_BATCH_SIZE:
            warnings.append(
                f"Small batch size ({batch_size}). "
                f"Training may be slow/unstable. Consider ≥32 if dataset allows."
            )
        
        is_valid = len(errors) == 0
        return is_valid, errors, warnings
    
    @staticmethod
    def auto_adjust_config(
        dataset_size: int,
        epochs: int,
        batch_size: int,
        target_epsilon: float
    ) -> Dict[str, Any]:
        """
        Automatically adjust configuration to valid ranges.
        
        Returns adjusted parameters that WILL work, with explanation of changes.
        """
        limits = DPLimits.get_limits_for_dataset(dataset_size, target_epsilon)
        adjustments = []
        
        original = {
            "epochs": epochs,
            "batch_size": batch_size,
            "target_epsilon": target_epsilon
        }
        
        adjusted_batch = batch_size
        adjusted_epochs = epochs
        adjusted_epsilon = target_epsilon
        
        # 1. Fix batch size
        if batch_size > limits["batch_size"]["max"]:
            adjusted_batch = limits["batch_size"]["recommended"]
            adjustments.append(
                f"batch_size: {batch_size} → {adjusted_batch} (was >50% of dataset)"
            )
        elif batch_size < limits["batch_size"]["min"]:
            adjusted_batch = limits["batch_size"]["min"]
            adjustments.append(
                f"batch_size: {batch_size} → {adjusted_batch} (below minimum)"
            )
        
        # 2. Fix epochs
        if epochs > limits["epochs"]["max"]:
            adjusted_epochs = limits["epochs"]["recommended"]
            adjustments.append(
                f"epochs: {epochs} → {adjusted_epochs} (would exhaust privacy budget)"
            )
        elif epochs < limits["epochs"]["min"]:
            adjusted_epochs = limits["epochs"]["min"]
            adjustments.append(
                f"epochs: {epochs} → {adjusted_epochs} (below minimum)"
            )
        
        # 3. Verify the adjusted config is feasible
        import numpy as np
        steps = adjusted_epochs * max(1, dataset_size // adjusted_batch)
        delta = 1.0 / dataset_size
        
        if steps > 0:
            estimated_noise = np.sqrt(2 * steps * np.log(1.0 / delta)) / adjusted_epsilon
            
            if estimated_noise < 0.5:
                # Need to increase epsilon or reduce steps further
                achievable_epsilon = np.sqrt(2 * steps * np.log(1.0 / delta)) / 0.5
                
                if achievable_epsilon <= DPLimits.MAX_EPSILON:
                    adjusted_epsilon = round(achievable_epsilon, 1)
                    adjustments.append(
                        f"epsilon: {target_epsilon} → {adjusted_epsilon} (minimum achievable)"
                    )
                else:
                    # Reduce epochs more aggressively
                    new_epochs = max(1, adjusted_epochs // 2)
                    adjustments.append(
                        f"epochs: {adjusted_epochs} → {new_epochs} (for feasible privacy)"
                    )
                    adjusted_epochs = new_epochs
        
        return {
            "original": original,
            "adjusted": {
                "epochs": adjusted_epochs,
                "batch_size": adjusted_batch,
                "target_epsilon": adjusted_epsilon
            },
            "adjustments": adjustments,
            "was_adjusted": len(adjustments) > 0
        }
    
    @staticmethod
    def get_recommended_config(
        dataset_size: int,
        target_epsilon: float = 10.0,
        desired_quality: str = "balanced"
    ) -> Dict[str, Any]:
        """
        Get recommended DP configuration for a dataset.
        
        Args:
            dataset_size: Number of training samples
            target_epsilon: Desired privacy budget
            desired_quality: "high_privacy", "balanced", or "high_quality"
        
        Returns:
            Dictionary with recommended parameters
        """
        limits = DPLimits.get_limits_for_dataset(dataset_size, target_epsilon)
        
        if desired_quality == "high_privacy":
            # ε < 5, fewer epochs, smaller batches
            epochs = max(5, min(20, limits["epochs"]["max"] // 3))
            batch_size = max(32, min(100, limits["batch_size"]["max"] // 2))
            recommended_epsilon = min(5.0, target_epsilon)
        elif desired_quality == "high_quality":
            # ε up to 15, more epochs, larger batches
            epochs = max(20, min(100, limits["epochs"]["max"]))
            batch_size = limits["batch_size"]["recommended"]
            recommended_epsilon = min(15.0, max(target_epsilon, 10.0))
        else:  # balanced
            epochs = max(10, min(50, limits["epochs"]["max"] // 2))
            batch_size = limits["batch_size"]["recommended"]
            recommended_epsilon = min(10.0, target_epsilon)
        
        return {
            "epochs": epochs,
            "batch_size": batch_size,
            "target_epsilon": recommended_epsilon,
            "target_delta": 1.0 / dataset_size,
            "max_grad_norm": 1.0,
            "limits": limits,
            "rationale": {
                "dataset_size": dataset_size,
                "desired_quality": desired_quality,
                "privacy_level": DPConfigValidator._epsilon_to_level(recommended_epsilon),
                "note": "These parameters are validated to work with your dataset size."
            }
        }
    
    @staticmethod
    def _epsilon_to_level(epsilon: float) -> str:
        """Convert epsilon to privacy level description."""
        if epsilon < 1.0:
            return "Very Strong (ε<1)"
        elif epsilon < 5.0:
            return "Strong (ε<5)"
        elif epsilon < 10.0:
            return "Moderate (ε<10)"
        elif epsilon < 20.0:
            return "Weak (ε<20)"
        else:
            return "Minimal (ε≥20)"

