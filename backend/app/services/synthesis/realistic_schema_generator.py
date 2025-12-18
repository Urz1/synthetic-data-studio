"""
Domain-agnostic realistic data generator from schema.

Generates realistic synthetic data that respects schema constraints
without requiring domain-specific knowledge. Works for any data type.
"""

import random
import uuid
import string
from typing import Dict, Any, List
from datetime import datetime, timedelta
import numpy as np


def generate_realistic_value(column_name: str, column_spec: Dict[str, Any]) -> Any:
    """
    Generate a single realistic value based on column specification.
    
    Uses realistic distributions and proper type handling:
    - UUID: Proper UUID4 format
    - Integer: Gaussian distribution within constraints
    - Float: Gaussian distribution with proper precision
    - Categorical: Random choice from actual values
    - Boolean: 50/50 distribution
    - Datetime: Random date within range
    - String: Random alphanumeric
    
    Args:
        column_name: Name of the column
        column_spec: Specification with type and constraints
        
    Returns:
        Generated value of appropriate type
    """
    col_type = column_spec.get('type', 'string').lower()
    
    # UUID type
    if col_type == 'uuid':
        return str(uuid.uuid4())
    
    # Integer type
    elif col_type == 'integer' or col_type == 'int':
        min_val = column_spec.get('min', 0)
        max_val = column_spec.get('max', 100)
        
        # Use gaussian distribution centered in range for realism
        mean = (min_val + max_val) / 2
        std = (max_val - min_val) / 6  # 99.7% values within range
        
        value = int(np.random.normal(mean, std))
        # Clamp to constraints
        value = max(min_val, min(max_val, value))
        return value
    
    # Float type
    elif col_type == 'float' or col_type == 'double' or col_type == 'decimal':
        min_val = column_spec.get('min', 0.0)
        max_val = column_spec.get('max', 100.0)
        precision = column_spec.get('precision', 2)  # Default 2 decimal places
        
        # Use gaussian distribution
        mean = (min_val + max_val) / 2
        std = (max_val - min_val) / 6
        
        value = np.random.normal(mean, std)
        # Clamp to constraints
        value = max(min_val, min(max_val, value))
        # Round to precision
        return round(value, precision)
    
    # Categorical type
    elif col_type == 'categorical' or col_type == 'category' or col_type == 'enum':
        # Use actual values from schema, not A/B/C!
        values = column_spec.get('values', [])
        categories = column_spec.get('categories', [])
        options = values or categories
        
        if not options:
            # Fallback if no values specified
            return 'Unknown'
        
        # Can add weights if specified
        weights = column_spec.get('weights')
        if weights and len(weights) == len(options):
            return random.choices(options, weights=weights)[0]
        else:
            return random.choice(options)
    
    # Boolean type
    elif col_type == 'boolean' or col_type == 'bool':
        probability = column_spec.get('true_probability', 0.5)
        return random.random() < probability
    
    # Datetime type
    elif col_type == 'datetime' or col_type == 'date':
        start_date = column_spec.get('start_date', '2020-01-01')
        end_date = column_spec.get('end_date', '2025-12-31')
        
        # Parse dates
        if isinstance(start_date, str):
            start = datetime.fromisoformat(start_date)
        else:
            start = start_date
            
        if isinstance(end_date, str):
            end = datetime.fromisoformat(end_date)
        else:
            end = end_date
        
        # Random date in range
        days_between = (end - start).days
        random_days = random.randint(0, days_between)
        random_date = start + timedelta(days=random_days)
        
        # Return format
        date_format = column_spec.get('format', '%Y-%m-%d')
        return random_date.strftime(date_format)
    
    # String type (default)
    else:
        length = column_spec.get('length', 10)
        min_length = column_spec.get('min_length', length)
        max_length = column_spec.get('max_length', length)
        
        actual_length = random.randint(min_length, max_length)
        
        # Pattern options
        pattern = column_spec.get('pattern', 'alphanumeric')
        
        if pattern == 'alphanumeric':
            chars = string.ascii_letters + string.digits
        elif pattern == 'alpha':
            chars = string.ascii_letters
        elif pattern == 'numeric':
            chars = string.digits
        else:
            chars = string.ascii_letters + string.digits
        
        return ''.join(random.choices(chars, k=actual_length))


def generate_realistic_dataset(
    schema: Dict[str, Dict[str, Any]],
    num_rows: int,
    seed: int = None
) -> List[Dict[str, Any]]:
    """
    Generate a realistic dataset from schema definition.
    
    Args:
        schema: Dictionary mapping column names to their specifications
        num_rows: Number of rows to generate
        seed: Random seed for reproducibility (optional)
        
    Returns:
        List of dictionaries (rows) with generated data
        
    Example schema:
        {
            "patient_id": {"type": "uuid"},
            "age": {"type": "integer", "min": 18, "max": 90},
            "temperature": {"type": "float", "min": 36.0, "max": 42.0, "precision": 1},
            "status": {"type": "categorical", "values": ["Active", "Inactive", "Pending"]}
        }
    """
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
    
    dataset = []
    for _ in range(num_rows):
        row = {}
        for column_name, column_spec in schema.items():
            row[column_name] = generate_realistic_value(column_name, column_spec)
        dataset.append(row)
    
    return dataset


def validate_schema_constraints(data: List[Dict[str, Any]], schema: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validate that generated data meets schema constraints.
    
    Returns:
        Dictionary with validation results and statistics
    """
    issues = []
    
    for idx, row in enumerate(data):
        for col_name, col_spec in schema.items():
            value = row.get(col_name)
            col_type = col_spec.get('type', 'string')
            
            # Check integer constraints
            if col_type == 'integer':
                min_val = col_spec.get('min')
                max_val = col_spec.get('max')
                if min_val is not None and value < min_val:
                    issues.append(f"Row {idx}, {col_name}: {value} < min {min_val}")
                if max_val is not None and value > max_val:
                    issues.append(f"Row {idx}, {col_name}: {value} > max {max_val}")
            
            # Check float constraints
            elif col_type == 'float':
                min_val = col_spec.get('min')
                max_val = col_spec.get('max')
                if min_val is not None and value < min_val:
                    issues.append(f"Row {idx}, {col_name}: {value} < min {min_val}")
                if max_val is not None and value > max_val:
                    issues.append(f"Row {idx}, {col_name}: {value} > max {max_val}")
            
            # Check categorical constraints
            elif col_type == 'categorical':
                valid_values = col_spec.get('values', []) or col_spec.get('categories', [])
                if valid_values and value not in valid_values:
                    issues.append(f"Row {idx}, {col_name}: '{value}' not in {valid_values}")
    
    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "total_rows": len(data),
        "total_checks": len(data) * len(schema)
    }
