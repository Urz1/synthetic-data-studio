"""Business logic for data generators (CTGAN, TimeGAN, schema-based)."""

import pandas as pd
import json
import random
import string
import hashlib
import numpy as np
from pathlib import Path
from typing import Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from sqlmodel import Session
from app.datasets.crud import create_dataset, get_dataset_by_id
from app.datasets.models import Dataset
from app.models.services import create_trained_model, get_trained_model
from .models import Generator

# Try to import CTGAN, fallback to our PyTorch implementation
try:
    from sdv.single_table import CTGANSynthesizer
    from sdv.metadata import SingleTableMetadata
    SDV_AVAILABLE = True
except ImportError:
    SDV_AVAILABLE = False
    print("SDV not available, using PyTorch CTGAN implementation")

# Import PyTorch components for our CTGAN implementation
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False
    print("PyTorch not available, using basic statistical generation")


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
    if not generator.dataset_id:
        raise ValueError("dataset_id is required for dataset-based generation")

    # Load the source dataset
    source_dataset = get_dataset_by_id(db, str(generator.dataset_id))
    if not source_dataset:
        raise ValueError(f"Source dataset {generator.dataset_id} not found")

    # Load the actual data (for now, assume it's stored as CSV)
    from app.datasets.routes import UPLOAD_DIR
    data_file = UPLOAD_DIR / f"{source_dataset.name}.csv"

    if not data_file.exists():
        raise FileNotFoundError(f"Data file not found: {data_file}")

    # Load the data
    real_data = pd.read_csv(data_file)

    if generator.type.lower() == 'ctgan':
        return _run_ctgan(generator, real_data, db)
    elif generator.type.lower() == 'timegan':
        return _run_timegan(generator, real_data, db)
    else:
        raise ValueError(f"Unsupported generator type: {generator.type}")


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


class SimpleCTGAN(nn.Module):
    """Simplified CTGAN implementation using PyTorch."""

    def __init__(self, input_dim, hidden_dim=128, latent_dim=64):
        super(SimpleCTGAN, self).__init__()

        # Generator
        self.generator = nn.Sequential(
            nn.Linear(latent_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, input_dim),
            nn.Tanh()  # Output between -1 and 1
        )

        # Discriminator
        self.discriminator = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1),
            nn.Sigmoid()
        )

    def generate(self, num_samples):
        """Generate synthetic samples."""
        noise = torch.randn(num_samples, 64)
        return self.generator(noise)


def _run_ctgan(generator: Generator, real_data: pd.DataFrame, db: Session) -> Dataset:
    """Run CTGAN synthesis with proper statistical modeling."""
    if not PYTORCH_AVAILABLE:
        # Basic statistical fallback
        print("PyTorch not available, using statistical modeling fallback")
        synthetic_data = _statistical_synthesis(real_data, generator.parameters_json.get('num_rows', len(real_data)))
        model_version = None  # No model saved for statistical method
    elif not SDV_AVAILABLE:
        # Use our PyTorch CTGAN implementation
        print("Using PyTorch CTGAN implementation")
        synthetic_data, trained_model = _pytorch_ctgan_synthesis(real_data, generator.parameters_json)

        # Save the trained model
        model_version = create_trained_model(
            db=db,
            model_type="ctgan",
            trained_model=trained_model,
            metadata={
                "input_shape": real_data.shape,
                "epochs": generator.parameters_json.get('epochs', 50),
                "batch_size": generator.parameters_json.get('batch_size', 32),
                "columns": list(real_data.columns),
                "dtypes": real_data.dtypes.astype(str).to_dict()
            },
            created_by=str(generator.created_by)
        )
    else:
        # Use SDV CTGAN (preferred)
        print("Using SDV CTGAN")
        metadata = SingleTableMetadata()
        metadata.detect_from_dataframe(real_data)

        synthesizer = CTGANSynthesizer(
            metadata,
            epochs=generator.parameters_json.get('epochs', 50),
            batch_size=generator.parameters_json.get('batch_size', 500),
            verbose=True
        )

        synthesizer.fit(real_data)
        num_rows = generator.parameters_json.get('num_rows', len(real_data))
        synthetic_data = synthesizer.sample(num_rows)
        model_version = None  # SDV doesn't expose the underlying model easily

    # Continue with saving the synthetic data (this code was missing the return)
    from app.datasets.routes import UPLOAD_DIR
    file_path = UPLOAD_DIR / f"{generator.name}_ctgan_synthetic.csv"
    synthetic_data.to_csv(file_path, index=False)

    # Calculate checksum
    checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()

    # Create output dataset
    schema_data = {}
    if model_version:
        schema_data = {
            "model_version_id": str(model_version.id),
            "generation_method": "ctgan_ml_model"
        }

    output_dataset = Dataset(
        project_id=uuid.uuid4(),  # TODO: Get from generator or user
        name=f"{generator.name}_ctgan_synthetic",
        original_filename=f"{generator.name}_ctgan_synthetic.csv",
        size_bytes=file_path.stat().st_size,
        row_count=len(synthetic_data),
        schema_data=schema_data,
        checksum=checksum,
        uploader_id=generator.created_by
    )

    return create_dataset(db, output_dataset)


def generate_from_trained_model(
    model_version_id: str,
    num_rows: int,
    db: Session,
    generator: Generator
) -> Dataset:
    """Generate synthetic data using a pre-trained ML model."""
    # Get model version metadata
    from app.models.crud import get_model_versions
    # This is a simplified approach - in practice we'd need to get the model by version ID
    # For now, assume we have the model_id and version_id
    # TODO: Add proper model version lookup

    # For now, we'll create a dummy model class to load
    # In practice, we'd need to reconstruct the model architecture from metadata
    input_dim = 4  # This should come from model metadata
    model = SimpleCTGAN(input_dim)

    # Load the trained model (this would need proper implementation)
    # trained_model = get_trained_model(db, model_id, model_version_id, model)

    # For now, fall back to statistical generation
    # TODO: Implement proper model loading and generation
    print("Pre-trained model generation not fully implemented yet, using statistical fallback")
    synthetic_data = _statistical_synthesis(pd.DataFrame(), num_rows)  # Empty dataframe as placeholder

    # Save synthetic data
    from app.datasets.routes import UPLOAD_DIR
    file_path = UPLOAD_DIR / f"{generator.name}_model_generated.csv"
    synthetic_data.to_csv(file_path, index=False)

    checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()

    output_dataset = Dataset(
        project_id=uuid.uuid4(),
        name=f"{generator.name}_model_generated",
        original_filename=f"{generator.name}_model_generated.csv",
        size_bytes=file_path.stat().st_size,
        row_count=len(synthetic_data),
        schema_data={"model_version_id": model_version_id, "generation_method": "pretrained_model"},
        checksum=checksum,
        uploader_id=generator.created_by
    )

    return create_dataset(db, output_dataset)


def _statistical_synthesis(real_data: pd.DataFrame, num_rows: int) -> pd.DataFrame:
    """Generate synthetic data using statistical modeling of correlations."""
    synthetic_data = []

    # Calculate correlation matrix for numeric columns
    numeric_cols = real_data.select_dtypes(include=['number']).columns
    if len(numeric_cols) > 1:
        corr_matrix = real_data[numeric_cols].corr()

        # Use multivariate normal for correlated numeric data
        means = real_data[numeric_cols].mean().values
        cov_matrix = real_data[numeric_cols].cov().values

        # Generate correlated samples
        samples = np.random.multivariate_normal(means, cov_matrix, num_rows)
        numeric_df = pd.DataFrame(samples, columns=numeric_cols)

        # Clip to reasonable ranges
        for col in numeric_cols:
            min_val = real_data[col].min()
            max_val = real_data[col].max()
            numeric_df[col] = np.clip(numeric_df[col], min_val, max_val)
    else:
        # Single numeric column or no numeric columns
        numeric_df = pd.DataFrame()

    # Handle categorical columns with proper distributions
    for col in real_data.columns:
        if col in numeric_df.columns:
            continue  # Already handled

        if real_data[col].dtype == 'object' or pd.api.types.is_categorical_dtype(real_data[col]):
            # Sample from empirical distribution
            value_counts = real_data[col].value_counts(normalize=True)
            synthetic_values = np.random.choice(
                value_counts.index,
                size=num_rows,
                p=value_counts.values
            )
            numeric_df[col] = synthetic_values
        else:
            # Other types (boolean, etc.)
            if real_data[col].dtype == 'bool':
                prob = real_data[col].mean()
                numeric_df[col] = np.random.choice([True, False], size=num_rows, p=[1-prob, prob])
            else:
                # Fallback to sampling
                synthetic_values = real_data[col].sample(n=num_rows, replace=True, random_state=42).values
                numeric_df[col] = synthetic_values

    return numeric_df


def _pytorch_ctgan_synthesis(real_data: pd.DataFrame, params: dict) -> tuple[pd.DataFrame, SimpleCTGAN]:
    """Generate synthetic data using PyTorch-based CTGAN."""
    # Preprocess data
    processed_data, transformers = _preprocess_data(real_data)

    # Convert to tensor
    data_tensor = torch.FloatTensor(processed_data.values)

    # Create data loader
    batch_size = params.get('batch_size', 32)
    dataset = TensorDataset(data_tensor)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    # Initialize model
    input_dim = data_tensor.shape[1]
    model = SimpleCTGAN(input_dim)

    # Training parameters
    epochs = params.get('epochs', 50)
    lr = 0.001

    optimizer_g = optim.Adam(model.generator.parameters(), lr=lr)
    optimizer_d = optim.Adam(model.discriminator.parameters(), lr=lr)
    criterion = nn.BCELoss()

    # Training loop
    for epoch in range(epochs):
        for real_batch in dataloader:
            real_samples = real_batch[0]

            # Train Discriminator
            optimizer_d.zero_grad()

            # Real samples
            real_output = model.discriminator(real_samples)
            real_labels = torch.ones_like(real_output)
            d_loss_real = criterion(real_output, real_labels)

            # Fake samples
            fake_samples = model.generate(real_samples.size(0))
            fake_output = model.discriminator(fake_samples.detach())
            fake_labels = torch.zeros_like(fake_output)
            d_loss_fake = criterion(fake_output, fake_labels)

            d_loss = d_loss_real + d_loss_fake
            d_loss.backward()
            optimizer_d.step()

            # Train Generator
            optimizer_g.zero_grad()
            fake_output = model.discriminator(fake_samples)
            g_loss = criterion(fake_output, real_labels)  # Generator wants discriminator to think fake is real
            g_loss.backward()
            optimizer_g.step()

    # Generate synthetic data
    num_samples = params.get('num_rows', len(real_data))
    with torch.no_grad():
        synthetic_tensor = model.generate(num_samples)

    # Convert back to dataframe
    synthetic_array = synthetic_tensor.numpy()
    synthetic_df = pd.DataFrame(synthetic_array, columns=processed_data.columns)

    # Inverse transform to original data types
    synthetic_df = _inverse_transform_data(synthetic_df, transformers, real_data)

    return synthetic_df, model


def _preprocess_data(data: pd.DataFrame):
    """Preprocess data for CTGAN training."""
    processed_data = data.copy()
    transformers = {}

    for col in data.columns:
        if data[col].dtype == 'object' or pd.api.types.is_categorical_dtype(data[col]):
            # Label encode categorical columns
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            processed_data[col] = le.fit_transform(data[col].astype(str))
            transformers[col] = {'encoder': le, 'type': 'categorical'}
        elif data[col].dtype == 'bool':
            processed_data[col] = data[col].astype(int)
            transformers[col] = {'type': 'boolean'}
        else:
            # Min-max scale numeric columns
            from sklearn.preprocessing import MinMaxScaler
            scaler = MinMaxScaler()
            processed_data[col] = scaler.fit_transform(data[col].values.reshape(-1, 1)).flatten()
            transformers[col] = {'scaler': scaler, 'type': 'numeric'}

    return processed_data, transformers


def _inverse_transform_data(data: pd.DataFrame, transformers: dict, original_data: pd.DataFrame):
    """Convert synthetic data back to original data types."""
    restored_data = data.copy()

    for col in data.columns:
        if col in transformers:
            transform_info = transformers[col]

            if transform_info['type'] == 'categorical':
                # Inverse label encoding
                encoder = transform_info['encoder']
                # Get original categories
                original_categories = original_data[col].unique()
                # Map back (this is approximate)
                restored_data[col] = np.random.choice(original_categories, size=len(data))
            elif transform_info['type'] == 'boolean':
                restored_data[col] = data[col] > 0.5
            elif transform_info['type'] == 'numeric':
                # Inverse scaling
                scaler = transform_info['scaler']
                restored_data[col] = scaler.inverse_transform(data[col].values.reshape(-1, 1)).flatten()

    return restored_data


def _run_timegan(generator: Generator, db: Session) -> Dataset:
    """Run TimeGAN synthesis."""
    raise NotImplementedError("TimeGAN not implemented yet - requires SDV")