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
        Create synthesizer from schema definition and fit on synthetic sample data.
        
        Since GaussianCopula requires training data, we generate a small sample first.
        
        Schema format:
        {
            "column_name": {
                "type": "integer|float|categorical|datetime|boolean|string",
                "constraints": {
                    "min": 0, "max": 100,  # for numeric
                    "categories": ["A", "B"],  # for categorical
                    "start_date": "2020-01-01", "end_date": "2024-12-31"  # for datetime
                }
            }
        }
        
        Args:
            schema: Dictionary defining columns and their types
            num_samples: Number of sample rows to generate for fitting (default: 100)
        """
        import random
        import string
        from datetime import datetime, timedelta
        
        logger.info(f"Creating GaussianCopula synthesizer from schema with {len(schema)} columns")
        
        # Generate sample data from schema for fitting
        sample_data = []
        for _ in range(num_samples):
            row = {}
            for col_name, col_info in schema.items():
                col_type = col_info.get('type', 'string')
                constraints = col_info.get('constraints', {})
                
                if col_type == 'integer':
                    min_val = constraints.get('min', 0)
                    max_val = constraints.get('max', 100)
                    row[col_name] = random.randint(min_val, max_val)
                elif col_type == 'float':
                    min_val = constraints.get('min', 0.0)
                    max_val = constraints.get('max', 100.0)
                    row[col_name] = random.uniform(min_val, max_val)
                elif col_type == 'categorical':
                    categories = constraints.get('categories', ['A', 'B', 'C'])
                    row[col_name] = random.choice(categories)
                elif col_type == 'boolean':
                    row[col_name] = random.choice([True, False])
                elif col_type == 'datetime':
                    start_date = constraints.get('start_date', '2020-01-01')
                    end_date = constraints.get('end_date', '2024-12-31')
                    start = datetime.fromisoformat(start_date)
                    end = datetime.fromisoformat(end_date)
                    random_date = start + timedelta(days=random.randint(0, (end - start).days))
                    row[col_name] = random_date.strftime('%Y-%m-%d')
                else:
                    # String
                    length = constraints.get('length', 10)
                    row[col_name] = ''.join(random.choices(string.ascii_letters + string.digits, k=length))
            
            sample_data.append(row)
        
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
        
        logger.info(f"Fitting GaussianCopula on {num_samples} sample rows...")
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
        Generate data and apply schema constraints.
        
        Args:
            num_rows: Number of rows to generate
            schema: Schema with constraints
        
        Returns:
            DataFrame with constrained synthetic data
        """
        # Generate base data
        synthetic_data = self.generate(num_rows)
        
        # Apply constraints from schema
        for col_name, col_info in schema.items():
            if col_name not in synthetic_data.columns:
                continue
            
            col_type = col_info.get('type', 'string')
            constraints = col_info.get('constraints', {})
            
            if col_type == 'integer':
                # Apply integer constraints
                min_val = constraints.get('min', 0)
                max_val = constraints.get('max', 100)
                synthetic_data[col_name] = synthetic_data[col_name].clip(min_val, max_val)
                synthetic_data[col_name] = synthetic_data[col_name].round().astype(int)
            
            elif col_type == 'float':
                # Apply float constraints
                min_val = constraints.get('min', 0.0)
                max_val = constraints.get('max', 100.0)
                synthetic_data[col_name] = synthetic_data[col_name].clip(min_val, max_val)
            
            elif col_type == 'categorical':
                # Ensure only valid categories
                categories = constraints.get('categories', [])
                if categories:
                    # Map to closest valid category if needed
                    valid_categories = set(categories)
                    synthetic_data[col_name] = synthetic_data[col_name].apply(
                        lambda x: x if x in valid_categories else categories[0]
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
