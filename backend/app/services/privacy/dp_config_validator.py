"""
DP Configuration Validator

Validates differential privacy parameters before training to prevent
catastrophic privacy failures.
"""

import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


class DPConfigValidator:
    """Validates DP training configurations for privacy safety."""
    
    @staticmethod
    def validate_config(
        dataset_size: int,
        epochs: int,
        batch_size: int,
        target_epsilon: float,
        target_delta: float = None
    ) -> Tuple[bool, List[str], List[str]]:
        """
        Validate DP configuration before training.
        
        Args:
            dataset_size: Number of training samples
            epochs: Training epochs
            batch_size: Batch size
            target_epsilon: Target privacy budget
            target_delta: Target failure probability
        
        Returns:
            Tuple of (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        # Set delta if not provided
        if target_delta is None:
            target_delta = 1.0 / dataset_size
        
        # Calculate training characteristics
        sampling_rate = batch_size / dataset_size
        steps = epochs * (dataset_size // batch_size)
        
        # 1. Check sampling rate
        if sampling_rate > 0.5:
            errors.append(
                f"Batch size ({batch_size}) is too large (>{50}% of dataset). "
                f"Maximum recommended: {int(dataset_size * 0.5)}. "
                f"Large batches make privacy guarantees very difficult."
            )
        elif sampling_rate > 0.2:
            warnings.append(
                f"Batch size ({batch_size}) is {sampling_rate:.0%} of dataset. "
                f"Consider reducing to {int(dataset_size * 0.1)} for better privacy."
            )
        
        # 2. Check number of training steps
        if steps > 2000:
            errors.append(
                f"Too many training steps ({steps}). "
                f"With {epochs} epochs and batch_size {batch_size}, privacy budget will be exhausted. "
                f"Reduce epochs to {max(10, epochs // 4)} or increase batch_size to {min(batch_size * 2, dataset_size // 2)}."
            )
        elif steps > 1000:
            warnings.append(
                f"Many training steps ({steps}) will consume significant privacy budget. "
                f"Consider reducing epochs to {max(10, epochs // 2)}."
            )
        
        # 3. Check target epsilon reasonableness
        if target_epsilon > 50:
            warnings.append(
                f"Target epsilon ({target_epsilon}) is very high. "
                f"Privacy protection will be minimal. Consider ε < 10 for sensitive data."
            )
        elif target_epsilon < 0.1:
            warnings.append(
                f"Target epsilon ({target_epsilon}) is very strict. "
                f"Synthetic data quality may be significantly degraded. "
                f"This requires very high noise levels."
            )
        
        # 4. Check if configuration is mathematically feasible
        # Rough estimate: noise_multiplier ≈ sqrt(steps) / epsilon
        import numpy as np
        estimated_noise = np.sqrt(2 * steps * np.log(1.0 / target_delta)) / target_epsilon
        
        if estimated_noise < 0.3:
            errors.append(
                f"Configuration is mathematically infeasible. "
                f"Cannot achieve ε={target_epsilon} with {epochs} epochs and batch_size {batch_size}. "
                f"Options:\n"
                f"  - Reduce epochs to {max(5, int(epochs * 0.3 / estimated_noise))}\n"
                f"  - Reduce batch_size to {max(32, batch_size // 5)}\n"
                f"  - Increase target_epsilon to {target_epsilon * 5}"
            )
        elif estimated_noise < 0.5:
            warnings.append(
                f"Configuration may struggle to achieve target ε={target_epsilon}. "
                f"Computed noise multiplier ({estimated_noise:.2f}) is quite low. "
                f"Consider reducing epochs or batch_size."
            )
        
        # 5. Check dataset size vs batch size
        if dataset_size < 100:
            warnings.append(
                f"Dataset is very small ({dataset_size} rows). "
                f"DP-SGD works best with datasets > 1000 rows."
            )
        
        if batch_size < 32:
            warnings.append(
                f"Batch size ({batch_size}) is very small. "
                f"Training may be unstable. Consider increasing to at least 32."
            )
        
        is_valid = len(errors) == 0
        
        return is_valid, errors, warnings
    
    @staticmethod
    def get_recommended_config(
        dataset_size: int,
        target_epsilon: float = 10.0,
        desired_quality: str = "balanced"  # "high_privacy", "balanced", "high_quality"
    ) -> Dict[str, Any]:
        """
        Get recommended DP configuration for a dataset.
        
        Args:
            dataset_size: Number of training samples
            target_epsilon: Desired privacy budget
            desired_quality: Trade-off preference
        
        Returns:
            Dictionary with recommended parameters
        """
        # Base recommendations
        if desired_quality == "high_privacy":
            # Prioritize privacy (ε < 5)
            epochs = min(30, max(10, dataset_size // 50))
            batch_size = min(100, max(32, dataset_size // 20))
            recommended_epsilon = min(5.0, target_epsilon)
        elif desired_quality == "high_quality":
            # Prioritize utility (ε up to 15)
            epochs = min(100, max(30, dataset_size // 20))
            batch_size = min(500, max(64, dataset_size // 10))
            recommended_epsilon = min(15.0, target_epsilon)
        else:  # balanced
            # Balance privacy and quality (ε ≈ 10)
            epochs = min(50, max(20, dataset_size // 30))
            batch_size = min(200, max(50, dataset_size // 15))
            recommended_epsilon = min(10.0, target_epsilon)
        
        return {
            "epochs": epochs,
            "batch_size": batch_size,
            "target_epsilon": recommended_epsilon,
            "target_delta": 1.0 / dataset_size,
            "max_grad_norm": 1.0,
            "rationale": {
                "dataset_size": dataset_size,
                "desired_quality": desired_quality,
                "expected_privacy_level": DPConfigValidator._epsilon_to_level(recommended_epsilon),
                "estimated_training_time": f"{epochs * (dataset_size // batch_size) * 2}s (approximate)"
            }
        }
    
    @staticmethod
    def _epsilon_to_level(epsilon: float) -> str:
        """Convert epsilon to privacy level description."""
        if epsilon < 1.0:
            return "Very Strong"
        elif epsilon < 5.0:
            return "Strong"
        elif epsilon < 10.0:
            return "Moderate"
        elif epsilon < 20.0:
            return "Weak"
        else:
            return "Minimal"
