"""Business logic for data generators (CTGAN, TVAE, TimeGAN, schema-based)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import hashlib
import json
import logging
import random
import string
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any

# Third-party
import numpy as np
import pandas as pd
from sqlmodel import Session

# Local - Core
from app.core.config import settings

# Local - Storage
from app.storage.s3 import (
    get_storage_service,
    S3ConfigurationError,
    S3StorageError,
)

# Local - Services
from app.datasets.models import Dataset
from app.datasets.repositories import create_dataset, get_dataset_by_id
from app.services.synthesis import CTGANService, TVAEService
from app.services.synthesis.dp_ctgan_service import DPCTGANService
from app.services.synthesis.dp_tvae_service import DPTVAEService
from app.services.privacy.privacy_report_service import PrivacyReportService

def _get_source_project_id(db: Session, generator):
    """Get project_id from source dataset."""
    source_dataset = db.get(Dataset, generator.dataset_id)
    if not source_dataset:
        raise ValueError(f"Source dataset {generator.dataset_id} not found")
    return source_dataset.project_id


def _is_s3_available() -> bool:
    """Check if S3 storage is configured."""
    try:
        get_storage_service()
        return True
    except S3ConfigurationError:
        return False


def _upload_synthetic_to_s3(
    file_path: Path,
    user_id: str,
    dataset_id: str,
    filename: str
) -> Optional[str]:
    """Upload synthetic data to S3 and return the key."""
    if not _is_s3_available():
        return None
    
    try:
        storage = get_storage_service()
        with open(file_path, "rb") as f:
            result = storage.upload_synthetic_data(
                file_obj=f,
                user_id=user_id,
                dataset_id=dataset_id,
                filename=filename,
                content_type="text/csv",
            )
        logger.info(f"Uploaded synthetic data to S3: {result['key']}")
        return result["key"]
    except S3StorageError as e:
        logger.warning(f"S3 upload failed, using local only: {e}")
        return None


def _upload_model_to_s3(
    model_path: Path,
    user_id: str,
    model_type: str
) -> Optional[str]:
    """Upload trained model to S3 and return the key."""
    if not _is_s3_available():
        return None
    
    try:
        storage = get_storage_service()
        with open(model_path, "rb") as f:
            result = storage.upload_model(
                file_obj=f,
                user_id=user_id,
                filename=model_path.name,
                model_type=model_type,
            )
        logger.info(f"Uploaded model to S3: {result['key']}")
        return result["key"]
    except S3StorageError as e:
        logger.warning(f"S3 model upload failed: {e}")
        return None


# Local - Module
from .models import Generator
from .schemas import MLGenerationConfig
from .repositories import update_generator

logger = logging.getLogger(__name__)

# Check SDV availability
try:
    from sdv.single_table import CTGANSynthesizer
    SDV_AVAILABLE = True
    logger.info("✓ SDV library available for ML synthesis")
except ImportError:
    SDV_AVAILABLE = False
    logger.warning("⚠ SDV not available, ML synthesis will be limited")

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

    # Load the actual data
    UPLOAD_DIR = Path(settings.upload_dir)
    data_file = UPLOAD_DIR / f"{source_dataset.original_filename}"

    if not data_file.exists():
        raise FileNotFoundError(f"Data file not found: {data_file}")

    # Load data based on file type
    if data_file.suffix == '.csv':
        real_data = pd.read_csv(data_file)
    elif data_file.suffix == '.json':
        real_data = pd.read_json(data_file)
    else:
        raise ValueError(f"Unsupported file format: {data_file.suffix}")

    # Route to appropriate generator
    generator_type = generator.type.lower()
    if generator_type == 'ctgan':
        return _run_ctgan(generator, real_data, db)
    elif generator_type == 'tvae':
        return _run_tvae(generator, real_data, db)
    elif generator_type == 'dp-ctgan':
        return _run_dp_ctgan(generator, real_data, db)
    elif generator_type == 'dp-tvae':
        return _run_dp_tvae(generator, real_data, db)
    elif generator_type == 'timegan':
        return _run_timegan(generator, real_data, db)
    else:
        raise ValueError(f"Unsupported generator type: {generator.type}")


def _generate_from_schema(generator: Generator, db: Session) -> Dataset:
    """Generate from manual schema definition using GaussianCopula."""
    schema = generator.schema_json
    num_rows = generator.parameters_json.get('num_rows', 1000)
    
    logger.info(f"Generating {num_rows} rows from schema using GaussianCopula")
    
    # Use GaussianCopula for realistic data generation
    from app.services.synthesis import GaussianCopulaService
    
    copula_service = GaussianCopulaService()
    copula_service.create_from_schema(schema)
    df = copula_service.generate_with_constraints(num_rows, schema)

    # Save to file locally
    UPLOAD_DIR = Path(settings.upload_dir)
    unique_filename = f"{generator.id}_copula_synthetic.csv"
    file_path = UPLOAD_DIR / unique_filename
    df.to_csv(file_path, index=False)
    
    # Upload to S3
    s3_key = _upload_synthetic_to_s3(
        file_path,
        str(generator.created_by),
        str(generator.id),  # Use generator ID as dataset_id for schema-based
        unique_filename
    )
    
    # Calculate checksum
    checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()
    
    # Create output dataset
    output_dataset = Dataset(
        project_id=_get_source_project_id(db, generator),
        name=f"{generator.name}_copula_synthetic",
        original_filename=unique_filename,
        s3_key=s3_key,  # S3 key if uploaded
        size_bytes=file_path.stat().st_size,
        row_count=len(df),
        schema_data={
            "generation_method": "gaussian_copula",
            "schema": schema
        },
        checksum=checksum,
        uploader_id=generator.created_by
    )
    
    created_dataset = create_dataset(db, output_dataset)
    logger.info(f"✓ Copula synthesis complete. Generated dataset: {created_dataset.id}")
    return created_dataset


def _run_ctgan(generator: Generator, real_data: pd.DataFrame, db: Session) -> Dataset:
    """Run CTGAN synthesis using SDV library."""
    if not SDV_AVAILABLE:
        logger.error("SDV library not available for CTGAN synthesis")
        raise RuntimeError("SDV library required for CTGAN. Install with: pip install sdv")
    
    logger.info(f"Starting CTGAN synthesis for generator {generator.id}")
    
    # Extract parameters
    params = generator.parameters_json
    epochs = params.get('epochs', 300)
    batch_size = params.get('batch_size', 500)
    num_rows = params.get('num_rows', len(real_data))
    column_types = params.get('column_types')
    conditions = params.get('conditions')
    
    # Initialize CTGAN service
    ctgan_service = CTGANService(
        epochs=epochs,
        batch_size=batch_size,
        generator_dim=tuple(params.get('generator_dim', [256, 256])),
        discriminator_dim=tuple(params.get('discriminator_dim', [256, 256])),
        generator_lr=params.get('generator_lr', 2e-4),
        discriminator_lr=params.get('discriminator_lr', 2e-4),
        verbose=True
    )
    
    # Train model
    logger.info(f"Training CTGAN on {len(real_data)} rows...")
    training_summary = ctgan_service.train(real_data, column_types=column_types)
    
    # Save model locally
    UPLOAD_DIR = Path(settings.upload_dir)
    model_dir = UPLOAD_DIR / "models"
    model_dir.mkdir(exist_ok=True)
    model_path = model_dir / f"{generator.id}_ctgan.pkl"
    ctgan_service.save_model(str(model_path))
    
    # Upload model to S3
    s3_model_key = _upload_model_to_s3(
        model_path, str(generator.created_by), "ctgan"
    )
    
    # Update generator with model path and training metadata
    generator.model_path = str(model_path)
    generator.s3_model_key = s3_model_key  # Save S3 key to generator
    generator.training_metadata = training_summary
    
    # Generate synthetic data
    logger.info(f"Generating {num_rows} synthetic rows...")
    synthetic_data = ctgan_service.generate(num_rows, conditions=conditions)
    
    # Save synthetic data locally
    unique_filename = f"{generator.id}_ctgan_synthetic.csv"
    file_path = UPLOAD_DIR / unique_filename
    synthetic_data.to_csv(file_path, index=False)
    
    # Upload synthetic data to S3
    s3_key = _upload_synthetic_to_s3(
        file_path,
        str(generator.created_by),
        str(generator.dataset_id),
        unique_filename
    )
    
    # Calculate checksum
    checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()
    
    # Create output dataset
    output_dataset = Dataset(
        project_id=_get_source_project_id(db, generator),
        name=f"{generator.name}_ctgan_synthetic",
        original_filename=unique_filename,
        s3_key=s3_key,  # S3 key if uploaded
        size_bytes=file_path.stat().st_size,
        row_count=len(synthetic_data),
        schema_data={
            "generation_method": "ctgan",
            "training_summary": training_summary,
            "source_dataset_id": str(generator.dataset_id),
            "s3_model_key": s3_model_key
        },
        checksum=checksum,
        uploader_id=generator.created_by
    )
    
    created_dataset = create_dataset(db, output_dataset)
    logger.info(f"✓ CTGAN synthesis complete. Generated dataset: {created_dataset.id}")
    return created_dataset


def _run_tvae(generator: Generator, real_data: pd.DataFrame, db: Session) -> Dataset:
    """Run TVAE synthesis using SDV library."""
    if not SDV_AVAILABLE:
        logger.error("SDV library not available for TVAE synthesis")
        raise RuntimeError("SDV library required for TVAE. Install with: pip install sdv")
    
    logger.info(f"Starting TVAE synthesis for generator {generator.id}")
    
    # Extract parameters
    params = generator.parameters_json
    epochs = params.get('epochs', 300)
    batch_size = params.get('batch_size', 500)
    num_rows = params.get('num_rows', len(real_data))
    column_types = params.get('column_types')
    conditions = params.get('conditions')
    
    # Initialize TVAE service
    tvae_service = TVAEService(
        epochs=epochs,
        batch_size=batch_size,
        embedding_dim=params.get('embedding_dim', 128),
        compress_dims=tuple(params.get('compress_dims', [128, 128])),
        decompress_dims=tuple(params.get('decompress_dims', [128, 128])),
        l2scale=params.get('l2scale', 1e-5),
        loss_factor=params.get('loss_factor', 2),
        verbose=False
    )
    
    # Train model
    logger.info(f"Training TVAE on {len(real_data)} rows...")
    training_summary = tvae_service.train(real_data, column_types=column_types)
    
    # Save model locally
    UPLOAD_DIR = Path(settings.upload_dir)
    model_dir = UPLOAD_DIR / "models"
    model_dir.mkdir(exist_ok=True)
    model_path = model_dir / f"{generator.id}_tvae.pkl"
    tvae_service.save_model(str(model_path))
    
    # Upload model to S3
    s3_model_key = _upload_model_to_s3(
        model_path, str(generator.created_by), "tvae"
    )
    
    # Update generator with model path and training metadata
    generator.model_path = str(model_path)
    generator.s3_model_key = s3_model_key  # Save S3 key to generator
    generator.training_metadata = training_summary
    generator.status = "generating"
    update_generator(db, generator)
    
    # Generate synthetic data
    logger.info(f"Generating {num_rows} synthetic rows...")
    synthetic_data = tvae_service.generate(num_rows, conditions=conditions)
    
    # Save synthetic data locally
    unique_filename = f"{generator.id}_tvae_synthetic.csv"
    file_path = UPLOAD_DIR / unique_filename
    synthetic_data.to_csv(file_path, index=False)
    
    # Upload synthetic data to S3
    s3_key = _upload_synthetic_to_s3(
        file_path,
        str(generator.created_by),
        str(generator.dataset_id),
        unique_filename
    )
    
    # Calculate checksum
    checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()
    
    # Create output dataset
    output_dataset = Dataset(
        project_id=_get_source_project_id(db, generator),
        name=f"{generator.name}_tvae_synthetic",
        original_filename=unique_filename,
        s3_key=s3_key,  # S3 key if uploaded
        size_bytes=file_path.stat().st_size,
        row_count=len(synthetic_data),
        schema_data={
            "generation_method": "tvae",
            "training_summary": training_summary,
            "source_dataset_id": str(generator.dataset_id),
            "s3_model_key": s3_model_key
        },
        checksum=checksum,
        uploader_id=generator.created_by
    )
    
    created_dataset = create_dataset(db, output_dataset)
    logger.info(f"✓ TVAE synthesis complete. Generated dataset: {created_dataset.id}")
    return created_dataset


def _run_dp_ctgan(generator: Generator, real_data: pd.DataFrame, db: Session) -> Dataset:
    """Run DP-CTGAN synthesis with differential privacy guarantees."""
    if not SDV_AVAILABLE:
        logger.error("SDV library not available for DP-CTGAN synthesis")
        raise RuntimeError("SDV library required for DP-CTGAN. Install with: pip install sdv opacus")
    
    logger.info(f"Starting DP-CTGAN synthesis for generator {generator.id}")
    
    # Extract parameters
    params = generator.parameters_json
    epochs = params.get('epochs', 300)
    batch_size = params.get('batch_size', 500)
    num_rows = params.get('num_rows', len(real_data))
    column_types = params.get('column_types')
    conditions = params.get('conditions')
    
    # Privacy parameters
    target_epsilon = params.get('target_epsilon', 10.0)
    target_delta = params.get('target_delta')
    max_grad_norm = params.get('max_grad_norm', 1.0)
    noise_multiplier = params.get('noise_multiplier')
    force = params.get('force', False)  # User acknowledged risks
    
    logger.info(f"Privacy target: ε={target_epsilon}, δ={target_delta or '1/n'}, force={force}")
    
    # Initialize DP-CTGAN service
    dp_ctgan_service = DPCTGANService(
        epochs=epochs,
        batch_size=batch_size,
        generator_dim=tuple(params.get('generator_dim', [256, 256])),
        discriminator_dim=tuple(params.get('discriminator_dim', [256, 256])),
        generator_lr=params.get('generator_lr', 2e-4),
        discriminator_lr=params.get('discriminator_lr', 2e-4),
        target_epsilon=target_epsilon,
        target_delta=target_delta,
        max_grad_norm=max_grad_norm,
        noise_multiplier=noise_multiplier,
        verbose=True,
        force=force
    )
    
    # Train model with DP
    logger.info(f"Training DP-CTGAN on {len(real_data)} rows with privacy guarantees...")
    training_summary = dp_ctgan_service.train(real_data, column_types=column_types)
    
    # Get privacy report
    privacy_report = dp_ctgan_service.get_privacy_report()
    
    # Save model locally
    UPLOAD_DIR = Path(settings.upload_dir)
    model_dir = UPLOAD_DIR / "models"
    model_dir.mkdir(exist_ok=True)
    model_path = model_dir / f"{generator.id}_dp_ctgan.pkl"
    dp_ctgan_service.save_model(str(model_path))
    
    # Upload model to S3
    s3_model_key = _upload_model_to_s3(
        model_path, str(generator.created_by), "dp-ctgan"
    )
    
    # Update generator with privacy information
    generator.model_path = str(model_path)
    generator.s3_model_key = s3_model_key  # Save S3 key to generator
    generator.training_metadata = training_summary
    generator.privacy_config = training_summary.get("privacy_config")
    generator.privacy_spent = training_summary.get("privacy_spent")
    generator.status = "generating"
    update_generator(db, generator)
    
    # Generate synthetic data
    logger.info(f"Generating {num_rows} synthetic rows with DP-CTGAN...")
    synthetic_data = dp_ctgan_service.generate(num_rows, conditions=conditions)
    
    # Save synthetic data locally
    unique_filename = f"{generator.id}_dp_ctgan_synthetic.csv"
    file_path = UPLOAD_DIR / unique_filename
    synthetic_data.to_csv(file_path, index=False)
    
    # Upload synthetic data to S3
    s3_key = _upload_synthetic_to_s3(
        file_path,
        str(generator.created_by),
        str(generator.dataset_id),
        unique_filename
    )
    
    # Calculate checksum
    checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()
    
    # Create output dataset
    output_dataset = Dataset(
        project_id=_get_source_project_id(db, generator),
        name=f"{generator.name}_dp_ctgan_synthetic",
        original_filename=unique_filename,
        s3_key=s3_key,  # S3 key if uploaded
        size_bytes=file_path.stat().st_size,
        row_count=len(synthetic_data),
        schema_data={
            "generation_method": "dp-ctgan",
            "training_summary": training_summary,
            "privacy_report": privacy_report,
            "source_dataset_id": str(generator.dataset_id),
            "s3_model_key": s3_model_key
        },
        checksum=checksum,
        uploader_id=generator.created_by
    )
    
    created_dataset = create_dataset(db, output_dataset)
    logger.info(f"✓ DP-CTGAN synthesis complete. Generated dataset: {created_dataset.id}")
    logger.info(f"✓ Privacy spent: ε={privacy_report['privacy_budget']['epsilon']:.2f}")
    return created_dataset


def _run_dp_tvae(generator: Generator, real_data: pd.DataFrame, db: Session) -> Dataset:
    """Run DP-TVAE synthesis with differential privacy guarantees."""
    if not SDV_AVAILABLE:
        logger.error("SDV library not available for DP-TVAE synthesis")
        raise RuntimeError("SDV library required for DP-TVAE. Install with: pip install sdv opacus")
    
    logger.info(f"Starting DP-TVAE synthesis for generator {generator.id}")
    
    # Extract parameters
    params = generator.parameters_json
    epochs = params.get('epochs', 300)
    batch_size = params.get('batch_size', 500)
    num_rows = params.get('num_rows', len(real_data))
    column_types = params.get('column_types')
    conditions = params.get('conditions')
    
    # Privacy parameters
    target_epsilon = params.get('target_epsilon', 10.0)
    target_delta = params.get('target_delta')
    max_grad_norm = params.get('max_grad_norm', 1.0)
    noise_multiplier = params.get('noise_multiplier')
    force = params.get('force', False)  # User acknowledged risks
    
    logger.info(f"Privacy target: ε={target_epsilon}, δ={target_delta or '1/n'}, force={force}")
    
    # Initialize DP-TVAE service
    dp_tvae_service = DPTVAEService(
        epochs=epochs,
        batch_size=batch_size,
        embedding_dim=params.get('embedding_dim', 128),
        compress_dims=tuple(params.get('compress_dims', [128, 128])),
        decompress_dims=tuple(params.get('decompress_dims', [128, 128])),
        l2scale=params.get('l2scale', 1e-5),
        loss_factor=params.get('loss_factor', 2),
        target_epsilon=target_epsilon,
        target_delta=target_delta,
        max_grad_norm=max_grad_norm,
        noise_multiplier=noise_multiplier,
        verbose=False,
        force=force
    )
    
    # Train model with DP
    logger.info(f"Training DP-TVAE on {len(real_data)} rows with privacy guarantees...")
    training_summary = dp_tvae_service.train(real_data, column_types=column_types)
    
    # Get privacy report
    privacy_report = dp_tvae_service.get_privacy_report()
    
    # Save model locally
    UPLOAD_DIR = Path(settings.upload_dir)
    model_dir = UPLOAD_DIR / "models"
    model_dir.mkdir(exist_ok=True)
    model_path = model_dir / f"{generator.id}_dp_tvae.pkl"
    dp_tvae_service.save_model(str(model_path))
    
    # Upload model to S3
    s3_model_key = _upload_model_to_s3(
        model_path, str(generator.created_by), "dp-tvae"
    )
    
    # Update generator with privacy information
    generator.model_path = str(model_path)
    generator.s3_model_key = s3_model_key  # Save S3 key to generator
    generator.training_metadata = training_summary
    generator.privacy_config = training_summary.get("privacy_config")
    generator.privacy_spent = training_summary.get("privacy_spent")
    generator.status = "generating"
    update_generator(db, generator)
    
    # Generate synthetic data
    logger.info(f"Generating {num_rows} synthetic rows with DP-TVAE...")
    synthetic_data = dp_tvae_service.generate(num_rows, conditions=conditions)
    
    # Save synthetic data locally
    unique_filename = f"{generator.id}_dp_tvae_synthetic.csv"
    file_path = UPLOAD_DIR / unique_filename
    synthetic_data.to_csv(file_path, index=False)
    
    # Upload synthetic data to S3
    s3_key = _upload_synthetic_to_s3(
        file_path,
        str(generator.created_by),
        str(generator.dataset_id),
        unique_filename
    )
    
    # Calculate checksum
    checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()
    
    # Create output dataset
    output_dataset = Dataset(
        project_id=_get_source_project_id(db, generator),
        name=f"{generator.name}_dp_tvae_synthetic",
        original_filename=unique_filename,
        s3_key=s3_key,  # S3 key if uploaded
        size_bytes=file_path.stat().st_size,
        row_count=len(synthetic_data),
        schema_data={
            "generation_method": "dp-tvae",
            "training_summary": training_summary,
            "privacy_report": privacy_report,
            "source_dataset_id": str(generator.dataset_id),
            "s3_model_key": s3_model_key
        },
        checksum=checksum,
        uploader_id=generator.created_by
    )
    
    created_dataset = create_dataset(db, output_dataset)
    logger.info(f"✓ DP-TVAE synthesis complete. Generated dataset: {created_dataset.id}")
    logger.info(f"✓ Privacy spent: ε={privacy_report['privacy_budget']['epsilon']:.2f}")
    return created_dataset


def generate_from_trained_model(
    model_version_id: str,
    num_rows: int,
    db: Session,
    generator: Generator
) -> Dataset:
    """Generate synthetic data using a pre-trained ML model (CTGAN/TVAE)."""
    logger.info(f"Loading pre-trained model: {model_version_id}")
    
    # TODO: Implement proper model loading from saved .pkl files
    # For now, raise not implemented
    raise NotImplementedError(
        "Pre-trained model loading coming soon. "
        "Use POST /generators/dataset/{id}/generate to train and generate in one step."
    )


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


def _run_timegan(generator: Generator, real_data: pd.DataFrame, db: Session) -> Dataset:
    """Run TimeGAN synthesis for time-series data."""
    # TimeGAN implementation will be added in future phase
    logger.warning("TimeGAN not implemented yet - this is a Phase 2 extension")
    raise NotImplementedError("TimeGAN synthesis coming in Phase 2. Use CTGAN or TVAE for now.")
