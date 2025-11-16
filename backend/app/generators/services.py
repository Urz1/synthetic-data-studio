"""Business logic for data generators (CTGAN, TimeGAN, schema-based)."""

import pandas as pd
import json
import random
import string
from pathlib import Path
from typing import Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from sqlmodel import Session
from app.datasets.crud import create_dataset
from app.datasets.models import Dataset
from .models import Generator


def generate_synthetic_data(generator: Generator, db: Session) -> Dataset:
    """Generate synthetic data based on generator config."""
    if generator.dataset_id:
        # Generate from existing dataset
        return _generate_from_dataset(generator, db)
    elif generator.schema_json:
        # Generate from manual schema
        return _generate_from_schema(generator, db)
    else:
        raise ValueError("Either dataset_id or schema_json must be provided")


def _generate_from_dataset(generator: Generator, db: Session) -> Dataset:
    """Generate from uploaded dataset."""
    # TODO: Load actual dataset data from DB/filesystem
    # For now, placeholder
    raise NotImplementedError("Generation from existing dataset not implemented yet")


def _generate_from_schema(generator: Generator, db: Session) -> Dataset:
    """Generate from manual schema definition."""
    schema = generator.schema_json
    num_rows = generator.parameters_json.get('num_rows', 1000)

    # Generate synthetic data based on schema
    synthetic_data = []
    for _ in range(num_rows):
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
                row[col_name] = round(random.uniform(min_val, max_val), 2)
            elif col_type == 'datetime':
                start_date = constraints.get('start_date', '2020-01-01')
                end_date = constraints.get('end_date', '2024-12-31')
                start = datetime.fromisoformat(start_date)
                end = datetime.fromisoformat(end_date)
                random_date = start + timedelta(days=random.randint(0, (end - start).days))
                row[col_name] = random_date.isoformat()
            elif col_type == 'boolean':
                row[col_name] = random.choice([True, False])
            elif col_type == 'categorical':
                categories = constraints.get('categories', ['A', 'B', 'C'])
                row[col_name] = random.choice(categories)
            else:  # string
                length = constraints.get('length', 10)
                row[col_name] = ''.join(random.choices(string.ascii_letters + string.digits, k=length))

        synthetic_data.append(row)

    # Convert to DataFrame and CSV
    df = pd.DataFrame(synthetic_data)
    csv_content = df.to_csv(index=False)

    # Save to file
    from app.datasets.routes import UPLOAD_DIR
    file_path = UPLOAD_DIR / f"{generator.name}_synthetic.csv"
    with open(file_path, "w") as f:
        f.write(csv_content)

    # Create output dataset
    output_dataset = Dataset(
        project_id=uuid.uuid4(),  # TODO: Get from generator or user
        name=f"{generator.name}_synthetic",
        original_filename=f"{generator.name}_synthetic.csv",
        size_bytes=len(csv_content.encode()),
        row_count=len(df),
        schema_data=schema,
        checksum="placeholder",  # TODO: Calculate SHA256
        uploader_id=generator.created_by
    )

    return create_dataset(db, output_dataset)


def _run_ctgan(generator: Generator, db: Session) -> Dataset:
    """Run CTGAN synthesis."""
    raise NotImplementedError("CTGAN not implemented yet - requires SDV")


def _run_timegan(generator: Generator, db: Session) -> Dataset:
    """Run TimeGAN synthesis."""
    raise NotImplementedError("TimeGAN not implemented yet - requires SDV")