"""
GaussianCopula synthesis service for schema-based generation.

Uses statistical copulas to generate realistic data from schema definitions
without requiring training data. Ideal for quick prototyping and testing.
"""

import logging
from typing import Dict, Any, Optional
import pandas as pd
from sdv.single_table import GaussianCopulaSynthesizer
from sdv.metadata import SingleTableMetadata

logger = logging.getLogger(__name__)


class GaussianCopulaService:
    """
    Service for generating synthetic data from schema using Gaussian Copula.
    
    Unlike CTGAN/TVAE, this doesn't require training data - it can generate
    realistic correlated data directly from schema definitions.
    """
    
    def __init__(self):
        """Initialize GaussianCopula service."""
        self.synthesizer: Optional[GaussianCopulaSynthesizer] = None
        self.metadata: Optional[SingleTableMetadata] = None
    
    def create_from_schema(self, schema: Dict[str, Dict[str, Any]], num_samples: int = 100) -> None:
        """
        Create synthesizer from schema definition and fit on realistic sample data.
        
        Schema format:
        {
            "column_name": {
                "type": "integer|float|categorical|datetime|boolean|string|uuid",
                "min": 0, "max": 100,  # for numeric
                "values": ["A", "B"],  # for categorical (will use actual values!)
                "precision": 2,  # for float decimal places
                "start_date": "2020-01-01", "end_date": "2025-12-31"  # for datetime
            }
        }
        
        Args:
            schema: Dictionary defining columns and their types
            num_samples: Number of sample rows to generate for fitting (default: 100)
        """
        from app.services.synthesis.realistic_schema_generator import generate_realistic_dataset
        
        logger.info(f"Creating GaussianCopula synthesizer from schema with {len(schema)} columns")
        
        # Generate realistic sample data using domain-agnostic generator
        logger.info(f"Generating {num_samples} realistic sample rows for fitting...")
        sample_data = generate_realistic_dataset(schema, num_samples)
        df_sample = pd.DataFrame(sample_data)
        
        # Create metadata
        self.metadata = SingleTableMetadata()
        self.metadata.detect_from_dataframe(df_sample)
        
        # Initialize and fit synthesizer
        self.synthesizer = GaussianCopulaSynthesizer(
            metadata=self.metadata,
            enforce_min_max_values=True,
            enforce_rounding=True
        )
        
        logger.info(f"Fitting GaussianCopula on {num_samples} realistic sample rows...")
        self.synthesizer.fit(df_sample)
        
        logger.info("✓ GaussianCopula synthesizer fitted and ready")
    
    def generate(self, num_rows: int) -> pd.DataFrame:
        """
        Generate synthetic data from schema.
        
        Args:
            num_rows: Number of rows to generate
        
        Returns:
            DataFrame with synthetic data
        
        Raises:
            ValueError: If synthesizer hasn't been created yet
        """
        if self.synthesizer is None:
            raise ValueError("Synthesizer not created. Call create_from_schema() first.")
        
        logger.info(f"Generating {num_rows} rows using GaussianCopula")
        
        # Generate synthetic data
        synthetic_data = self.synthesizer.sample(num_rows=num_rows)
        
        logger.info(f"✓ Generated {len(synthetic_data)} rows")
        return synthetic_data
    
    def generate_with_constraints(
        self,
        num_rows: int,
        schema: Dict[str, Dict[str, Any]]
    ) -> pd.DataFrame:
        """
        Generate data with schema constraints applied.
        
        Note: With the realistic generator, most constraints are already
        properly handled during fitting. This method now mainly ensures
        data types and clamps any edge cases.
        
        Args:
            num_rows: Number of rows to generate
            schema: Schema with constraints
        
        Returns:
            DataFrame with constrained synthetic data
        """
        # Generate base data
        synthetic_data = self.generate(num_rows)
        
        # Apply post-generation constraints for edge cases
        for col_name, col_info in schema.items():
            if col_name not in synthetic_data.columns:
                continue
            
            col_type = col_info.get('type', 'string')
            
            if col_type == 'integer' or col_type == 'int':
                # Ensure integer type and apply strict bounds
                min_val = col_info.get('min', 0)
                max_val = col_info.get('max', 100)
                synthetic_data[col_name] = synthetic_data[col_name].clip(min_val, max_val)
                synthetic_data[col_name] = synthetic_data[col_name].round().astype(int)
            
            elif col_type == 'float' or col_type == 'double':
                # Apply float constraints with proper precision
                min_val = col_info.get('min', 0.0)
                max_val = col_info.get('max', 100.0)
                precision = col_info.get('precision', 2)
                synthetic_data[col_name] = synthetic_data[col_name].clip(min_val, max_val)
                synthetic_data[col_name] = synthetic_data[col_name].round(precision)
            
            elif col_type == 'categorical' or col_type == 'category':
                # Ensure only valid categories (should already be correct)
                values = col_info.get('values', []) or col_info.get('categories', [])
                if values:
                    valid_categories = set(values)
                    # Map any invalid values to first valid category
                    synthetic_data[col_name] = synthetic_data[col_name].apply(
                        lambda x: x if x in valid_categories else values[0]
                    )
        
        return synthetic_data


def generate_from_schema_copula(
    schema: Dict[str, Dict[str, Any]],
    num_rows: int,
    sample_size: int = 100
) -> pd.DataFrame:
    """
    Convenience function to generate synthetic data from schema in one call.
    
    Args:
        schema: Schema definition
        num_rows: Number of rows to generate
        sample_size: Number of sample rows to generate for fitting (default: 100)
    
    Returns:
        Synthetic DataFrame
    """
    service = GaussianCopulaService()
    service.create_from_schema(schema, num_samples=sample_size)
    return service.generate_with_constraints(num_rows, schema)
