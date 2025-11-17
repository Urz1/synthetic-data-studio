"""
CTGAN (Conditional Tabular GAN) synthesis service.

Implements ML-based synthetic data generation using CTGAN from SDV library.
CTGAN is ideal for complex tabular data with mixed data types and correlations.
"""

import logging
from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from sdv.single_table import CTGANSynthesizer
from sdv.metadata import SingleTableMetadata

logger = logging.getLogger(__name__)


class CTGANService:
    """
    Service for generating synthetic data using CTGAN.
    
    CTGAN uses conditional generative adversarial networks to learn
    the distribution of real data and generate realistic synthetic samples.
    """
    
    def __init__(
        self,
        epochs: int = 300,
        batch_size: int = 500,
        generator_dim: tuple = (256, 256),
        discriminator_dim: tuple = (256, 256),
        generator_lr: float = 2e-4,
        discriminator_lr: float = 2e-4,
        discriminator_steps: int = 1,
        verbose: bool = True
    ):
        """
        Initialize CTGAN service with hyperparameters.
        
        Args:
            epochs: Number of training epochs (default: 300)
            batch_size: Batch size for training (default: 500)
            generator_dim: Generator network dimensions (default: (256, 256))
            discriminator_dim: Discriminator network dimensions (default: (256, 256))
            generator_lr: Generator learning rate (default: 2e-4)
            discriminator_lr: Discriminator learning rate (default: 2e-4)
            discriminator_steps: Number of discriminator steps per generator step
            verbose: Whether to show training progress
        """
        self.epochs = epochs
        self.batch_size = batch_size
        self.generator_dim = generator_dim
        self.discriminator_dim = discriminator_dim
        self.generator_lr = generator_lr
        self.discriminator_lr = discriminator_lr
        self.discriminator_steps = discriminator_steps
        self.verbose = verbose
        
        self.synthesizer: Optional[CTGANSynthesizer] = None
        self.metadata: Optional[SingleTableMetadata] = None
    
    def _create_metadata(self, df: pd.DataFrame, column_types: Optional[Dict[str, str]] = None) -> SingleTableMetadata:
        """
        Create SDV metadata from DataFrame.
        
        Args:
            df: Training DataFrame
            column_types: Optional dictionary mapping column names to SDV types
                         ('categorical', 'numerical', 'datetime', 'boolean')
        
        Returns:
            SingleTableMetadata object
        """
        metadata = SingleTableMetadata()
        metadata.detect_from_dataframe(df)
        
        # Override detected types if provided
        if column_types:
            for col, dtype in column_types.items():
                if col in df.columns:
                    if dtype == 'categorical':
                        metadata.update_column(col, sdtype='categorical')
                    elif dtype == 'numerical':
                        metadata.update_column(col, sdtype='numerical')
                    elif dtype == 'datetime':
                        metadata.update_column(col, sdtype='datetime')
                    elif dtype == 'boolean':
                        metadata.update_column(col, sdtype='boolean')
        
        return metadata
    
    def train(
        self,
        data: pd.DataFrame,
        column_types: Optional[Dict[str, str]] = None,
        primary_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Train CTGAN model on real data.
        
        Args:
            data: Training DataFrame
            column_types: Optional column type overrides
            primary_key: Optional primary key column (will be excluded from training)
        
        Returns:
            Training summary dictionary
        """
        logger.info(f"Starting CTGAN training on {len(data)} rows, {len(data.columns)} columns")
        
        # Remove primary key if specified
        train_data = data.copy()
        if primary_key and primary_key in train_data.columns:
            train_data = train_data.drop(columns=[primary_key])
            logger.info(f"Excluded primary key column: {primary_key}")
        
        # Create metadata
        self.metadata = self._create_metadata(train_data, column_types)
        
        # Initialize synthesizer
        self.synthesizer = CTGANSynthesizer(
            metadata=self.metadata,
            epochs=self.epochs,
            batch_size=self.batch_size,
            generator_dim=self.generator_dim,
            discriminator_dim=self.discriminator_dim,
            generator_lr=self.generator_lr,
            discriminator_lr=self.discriminator_lr,
            discriminator_steps=self.discriminator_steps,
            verbose=self.verbose
        )
        
        # Train model
        logger.info("Training CTGAN model...")
        self.synthesizer.fit(train_data)
        logger.info("✓ CTGAN training completed")
        
        return {
            "status": "success",
            "model_type": "CTGAN",
            "training_rows": len(data),
            "training_columns": len(train_data.columns),
            "epochs": self.epochs,
            "batch_size": self.batch_size,
            "metadata": self.metadata.to_dict()
        }
    
    def generate(
        self,
        num_rows: int,
        conditions: Optional[Dict[str, Any]] = None
    ) -> pd.DataFrame:
        """
        Generate synthetic data using trained CTGAN model.
        
        Args:
            num_rows: Number of synthetic rows to generate
            conditions: Optional conditional sampling constraints
                       e.g., {"country": "USA", "age": 25}
        
        Returns:
            DataFrame with synthetic data
        
        Raises:
            ValueError: If model hasn't been trained yet
        """
        if self.synthesizer is None:
            raise ValueError("CTGAN model not trained. Call train() first.")
        
        logger.info(f"Generating {num_rows} synthetic rows with CTGAN")
        
        # Generate synthetic data
        if conditions:
            logger.info(f"Applying conditions: {conditions}")
            # SDV supports conditional sampling
            synthetic_data = self.synthesizer.sample(
                num_rows=num_rows,
                conditions=conditions
            )
        else:
            synthetic_data = self.synthesizer.sample(num_rows=num_rows)
        
        logger.info(f"✓ Generated {len(synthetic_data)} synthetic rows")
        return synthetic_data
    
    def save_model(self, filepath: str) -> None:
        """
        Save trained CTGAN model to disk.
        
        Args:
            filepath: Path to save model file (.pkl)
        """
        if self.synthesizer is None:
            raise ValueError("No model to save. Train model first.")
        
        self.synthesizer.save(filepath)
        logger.info(f"✓ Model saved to {filepath}")
    
    def load_model(self, filepath: str) -> None:
        """
        Load trained CTGAN model from disk.
        
        Args:
            filepath: Path to model file (.pkl)
        """
        self.synthesizer = CTGANSynthesizer.load(filepath)
        self.metadata = self.synthesizer.metadata
        logger.info(f"✓ Model loaded from {filepath}")
    
    def get_loss_values(self) -> Optional[Dict[str, List[float]]]:
        """
        Get training loss values for visualization.
        
        Returns:
            Dictionary with generator and discriminator loss histories
        """
        if self.synthesizer is None:
            return None
        
        # Access loss values if available
        try:
            return {
                "generator_loss": self.synthesizer._model._generator_loss,
                "discriminator_loss": self.synthesizer._model._discriminator_loss
            }
        except AttributeError:
            logger.warning("Loss values not available")
            return None


def generate_synthetic_data_ctgan(
    real_data: pd.DataFrame,
    num_synthetic_rows: int,
    epochs: int = 300,
    batch_size: int = 500,
    column_types: Optional[Dict[str, str]] = None,
    conditions: Optional[Dict[str, Any]] = None
) -> pd.DataFrame:
    """
    Convenience function to train CTGAN and generate synthetic data in one call.
    
    Args:
        real_data: Real training data
        num_synthetic_rows: Number of synthetic rows to generate
        epochs: Training epochs
        batch_size: Training batch size
        column_types: Optional column type overrides
        conditions: Optional conditional sampling constraints
    
    Returns:
        Synthetic DataFrame
    """
    service = CTGANService(epochs=epochs, batch_size=batch_size)
    service.train(real_data, column_types=column_types)
    return service.generate(num_synthetic_rows, conditions=conditions)
