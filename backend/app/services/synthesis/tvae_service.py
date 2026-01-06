"""
TVAE (Tabular Variational Autoencoder) synthesis service.

Implements ML-based synthetic data generation using TVAE from SDV library.
TVAE is faster than CTGAN and works well for datasets with smoother distributions.
"""

# Standard library
import logging
from typing import Any, Dict, List, Optional

# Third-party
import numpy as np
import pandas as pd
from sdv.metadata import SingleTableMetadata
from sdv.single_table import TVAESynthesizer

logger = logging.getLogger(__name__)


class TVAEService:
    """
    Service for generating synthetic data using TVAE.
    
    TVAE uses variational autoencoders to learn data distribution.
    Generally faster than CTGAN and suitable for datasets with continuous features.
    """
    
    def __init__(
        self,
        epochs: int = 300,
        batch_size: int = 500,
        embedding_dim: int = 128,
        compress_dims: tuple = (128, 128),
        decompress_dims: tuple = (128, 128),
        l2scale: float = 1e-5,
        loss_factor: int = 2,
        verbose: bool = False
    ):
        """
        Initialize TVAE service with hyperparameters.
        
        Args:
            epochs: Number of training epochs (default: 300)
            batch_size: Batch size for training (default: 500)
            embedding_dim: Size of latent space (default: 128)
            compress_dims: Encoder network dimensions (default: (128, 128))
            decompress_dims: Decoder network dimensions (default: (128, 128))
            l2scale: L2 regularization scale (default: 1e-5)
            loss_factor: Multiplier for reconstruction loss (default: 2)
            verbose: Whether to show training progress
        """
        self.epochs = epochs
        self.batch_size = batch_size
        self.embedding_dim = embedding_dim
        self.compress_dims = compress_dims
        self.decompress_dims = decompress_dims
        self.l2scale = l2scale
        self.loss_factor = loss_factor
        self.verbose = verbose
        
        self.synthesizer: Optional[TVAESynthesizer] = None
        self.metadata: Optional[SingleTableMetadata] = None
    
    def _create_metadata(self, df: pd.DataFrame, column_types: Optional[Dict[str, str]] = None) -> SingleTableMetadata:
        """
        Create SDV metadata from DataFrame.
        
        Args:
            df: Training DataFrame
            column_types: Optional dictionary mapping column names to SDV types
        
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
        Train TVAE model on real data.
        
        Args:
            data: Training DataFrame
            column_types: Optional column type overrides
            primary_key: Optional primary key column (will be excluded from training)
        
        Returns:
            Training summary dictionary
        """
        logger.info(f"Starting TVAE training on {len(data)} rows, {len(data.columns)} columns")
        
        # Remove primary key if specified
        train_data = data.copy()
        if primary_key and primary_key in train_data.columns:
            train_data = train_data.drop(columns=[primary_key])
            logger.info(f"Excluded primary key column: {primary_key}")
        
        # Create metadata
        self.metadata = self._create_metadata(train_data, column_types)
        
        # Initialize synthesizer
        self.synthesizer = TVAESynthesizer(
            metadata=self.metadata,
            epochs=self.epochs,
            batch_size=self.batch_size,
            embedding_dim=self.embedding_dim,
            compress_dims=self.compress_dims,
            decompress_dims=self.decompress_dims,
            l2scale=self.l2scale,
            loss_factor=self.loss_factor,
            verbose=self.verbose
        )
        
        # Train model
        logger.info("Training TVAE model...")
        self.synthesizer.fit(train_data)
        logger.info("✓ TVAE training completed")
        
        return {
            "status": "success",
            "model_type": "TVAE",
            "training_rows": len(data),
            "training_columns": len(train_data.columns),
            "epochs": self.epochs,
            "batch_size": self.batch_size,
            "embedding_dim": self.embedding_dim,
            "metadata": self.metadata.to_dict()
        }
    
    def generate(
        self,
        num_rows: int,
        conditions: Optional[Dict[str, Any]] = None
    ) -> pd.DataFrame:
        """
        Generate synthetic data using trained TVAE model.
        
        Args:
            num_rows: Number of synthetic rows to generate
            conditions: Optional conditional sampling constraints
        
        Returns:
            DataFrame with synthetic data
        
        Raises:
            ValueError: If model hasn't been trained yet
        """
        if self.synthesizer is None:
            raise ValueError("TVAE model not trained. Call train() first.")
        
        logger.info(f"Generating {num_rows} synthetic rows with TVAE")
        
        # Generate synthetic data
        if conditions:
            logger.info(f"Applying conditions: {conditions}")
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
        Save trained TVAE model to disk.
        
        Args:
            filepath: Path to save model file (.pkl)
        """
        if self.synthesizer is None:
            raise ValueError("No model to save. Train model first.")
        
        self.synthesizer.save(filepath)
        logger.info(f"✓ Model saved to {filepath}")
    
    def load_model(self, filepath: str) -> None:
        """
        Load trained TVAE model from disk.
        
        Args:
            filepath: Path to model file (.pkl)
        """
        self.synthesizer = TVAESynthesizer.load(filepath)
        self.metadata = self.synthesizer.metadata
        logger.info(f"✓ Model loaded from {filepath}")
    
    def get_loss_values(self) -> Optional[List[float]]:
        """
        Get training loss values for visualization.
        
        Returns:
            List of loss values per epoch
        """
        if self.synthesizer is None:
            return None
        
        try:
            return self.synthesizer._model._loss_values
        except AttributeError:
            logger.warning("Loss values not available")
            return None


def generate_synthetic_data_tvae(
    real_data: pd.DataFrame,
    num_synthetic_rows: int,
    epochs: int = 300,
    batch_size: int = 500,
    column_types: Optional[Dict[str, str]] = None,
    conditions: Optional[Dict[str, Any]] = None
) -> pd.DataFrame:
    """
    Convenience function to train TVAE and generate synthetic data in one call.
    
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
    service = TVAEService(epochs=epochs, batch_size=batch_size)
    service.train(real_data, column_types=column_types)
    return service.generate(num_synthetic_rows, conditions=conditions)
