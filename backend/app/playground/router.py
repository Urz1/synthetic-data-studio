"""Playground router - Anonymous synthetic data generation.

This module provides endpoints for guest users to generate synthetic data
without authentication. Key constraints:
- Max 5,000 rows per generation
- Max 3 generations per IP per hour (rate limited)
- No data persistence (ephemeral, streamed directly)
- Supports both schema-based AND ML-based generation
"""

import io
import logging
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List

import pandas as pd
from fastapi import APIRouter, Query, Request, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .schemas import PlaygroundGenerateRequest
from app.services.synthesis import GaussianCopulaService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/playground", tags=["playground"])

# ============================================================================
# CONSTANTS (Playground gets 1/3 of main system limits)
# ============================================================================

# Import main system limit for reference
from app.generators.schemas import MAX_COLUMNS_MAIN

MAX_ROWS_PLAYGROUND = 5000
MAX_COLUMNS_PLAYGROUND = MAX_COLUMNS_MAIN // 3  # 10 columns (1/3 of main)
MIN_ROWS_FOR_TRAINING = 100  # Minimum rows required for ML training
MAX_EPOCHS_PLAYGROUND = 50  # Cap epochs for speed
MAX_FILE_SIZE_MB = 5  # Max upload file size

DEMO_DATA_DIR = Path(__file__).parent.parent.parent / "demo_data"

SUPPORTED_MODELS = ["ctgan", "tvae"]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _normalize_schema(columns: list) -> Dict[str, Any]:
    """Convert column list to schema dict."""
    schema = {}
    for col in columns:
        schema[col.name] = {"type": col.type}
    return schema


def _validate_columns_unique(columns: list) -> None:
    """Validate column names are unique (case-insensitive)."""
    names = [col.name.lower() for col in columns]
    duplicates = [col.name for col in columns if names.count(col.name.lower()) > 1]
    if duplicates:
        unique_duplicates = list(set(duplicates))
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate column names not allowed: {', '.join(unique_duplicates)}"
        )


def _validate_dataframe(df: pd.DataFrame, source: str = "upload") -> None:
    """Validate uploaded/demo dataframe meets requirements."""
    if len(df) < MIN_ROWS_FOR_TRAINING:
        raise HTTPException(
            status_code=400,
            detail=f"Dataset has {len(df)} rows. Minimum {MIN_ROWS_FOR_TRAINING} rows required for ML training. "
                   f"Use schema-based generation for smaller datasets."
        )
    if len(df) > 10000:
        raise HTTPException(
            status_code=400,
            detail=f"Dataset has {len(df)} rows. Maximum 10,000 rows allowed for playground uploads. Sign up for larger datasets."
        )
    if len(df.columns) > MAX_COLUMNS_PLAYGROUND:
        raise HTTPException(
            status_code=400,
            detail=f"Dataset has {len(df.columns)} columns. Maximum {MAX_COLUMNS_PLAYGROUND} columns allowed in playground."
        )


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/generate")
async def playground_generate(
    request_body: PlaygroundGenerateRequest,
    request: Request,
):
    """
    Generate synthetic data anonymously using schema (instant).
    
    - No authentication required
    - Max 5,000 rows
    - Max 10 columns
    - Rate limited: 3 generations per IP per hour
    - Data is streamed, NOT saved
    
    Returns: CSV file as download
    """
    columns = request_body.columns
    num_rows = request_body.num_rows
    
    # Validate constraints
    if len(columns) > MAX_COLUMNS_PLAYGROUND:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_COLUMNS_PLAYGROUND} columns allowed in playground mode"
        )
    
    if num_rows > MAX_ROWS_PLAYGROUND:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_ROWS_PLAYGROUND} rows allowed in playground mode. Sign up for up to 1M rows."
        )
    
    # Validate column uniqueness
    _validate_columns_unique(columns)
    
    # Convert to schema format
    schema = _normalize_schema(columns)
    
    logger.info(f"Playground schema generation: {num_rows} rows, {len(columns)} columns from IP {request.client.host}")
    
    try:
        # Generate using GaussianCopula (fast, no training)
        copula_service = GaussianCopulaService()
        copula_service.create_from_schema(schema)
        df = copula_service.generate_with_constraints(num_rows, schema)
        
        logger.info(f"✓ Playground generated {len(df)} rows")
        
        # Convert to CSV in memory
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        
        # Return as streaming response (download)
        return StreamingResponse(
            iter([csv_buffer.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=synth_studio_schema.csv",
                "X-Generated-Rows": str(len(df)),
                "X-Generated-Columns": str(len(df.columns)),
                "X-Generation-Type": "schema",
            }
        )
        
    except Exception as e:
        logger.error(f"Playground generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {str(e)}"
        )


@router.post("/train-and-generate")
async def playground_train_and_generate(
    request: Request,
    file: Optional[UploadFile] = File(None),
    demo_dataset: Optional[str] = Form(None),
    model_type: str = Form("ctgan"),
    num_rows: int = Form(1000),
):
    """
    Train an ML model on uploaded/demo data and generate synthetic data.
    
    - No authentication required
    - Min 100 rows input, Max 5,000 rows output
    - Rate limited: 3 generations per IP per hour
    - Data is streamed, NOT saved. Model is NOT saved.
    - Training capped at 50 epochs for speed
    
    Args:
        file: CSV file upload (optional if demo_dataset provided)
        demo_dataset: ID of demo dataset to use (customers, transactions)
        model_type: ML model to use (ctgan, tvae)
        num_rows: Number of rows to generate (max 5000)
    
    Returns: CSV file as download
    """
    # Validate model type
    if model_type.lower() not in SUPPORTED_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model type: {model_type}. Supported: {SUPPORTED_MODELS}"
        )
    
    # Validate num_rows
    if num_rows > MAX_ROWS_PLAYGROUND:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_ROWS_PLAYGROUND} rows. Sign up for up to 1M rows."
        )
    if num_rows < 10:
        raise HTTPException(status_code=400, detail="Minimum 10 rows required.")
    
    # Load data from file or demo
    if file:
        # Read uploaded file
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400, 
                detail=f"File too large. Maximum {MAX_FILE_SIZE_MB}MB."
            )
        
        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
        
        _validate_dataframe(df, "upload")
        logger.info(f"Playground ML training: uploaded {len(df)} rows, {len(df.columns)} columns")
        
    elif demo_dataset:
        # Load demo dataset
        demo_files = {
            "customers": "customers_120.csv",
            "transactions": "transactions_150.csv",
        }
        
        if demo_dataset not in demo_files:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown demo dataset: {demo_dataset}. Available: {list(demo_files.keys())}"
            )
        
        demo_path = DEMO_DATA_DIR / demo_files[demo_dataset]
        if not demo_path.exists():
            raise HTTPException(status_code=500, detail=f"Demo dataset not found: {demo_dataset}")
        
        df = pd.read_csv(demo_path)
        logger.info(f"Playground ML training: demo '{demo_dataset}' with {len(df)} rows")
        
    else:
        raise HTTPException(
            status_code=400,
            detail="Either upload a CSV file or select a demo dataset."
        )
    
    try:
        # Train model (capped epochs for speed)
        if model_type.lower() == "ctgan":
            from app.services.synthesis import CTGANService
            service = CTGANService(epochs=MAX_EPOCHS_PLAYGROUND, batch_size=min(500, len(df)), verbose=False)
        else:  # tvae
            from app.services.synthesis import TVAEService
            service = TVAEService(epochs=MAX_EPOCHS_PLAYGROUND, batch_size=min(500, len(df)), verbose=False)
        
        logger.info(f"Training {model_type.upper()} for {MAX_EPOCHS_PLAYGROUND} epochs...")
        service.train(df)
        
        # Generate synthetic data
        logger.info(f"Generating {num_rows} synthetic rows...")
        synthetic_df = service.generate(min(num_rows, MAX_ROWS_PLAYGROUND))
        
        logger.info(f"✓ Playground ML generated {len(synthetic_df)} rows")
        
        # Convert to CSV in memory
        csv_buffer = io.StringIO()
        synthetic_df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        
        # Return as streaming response (download)
        return StreamingResponse(
            iter([csv_buffer.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=synth_studio_{model_type}.csv",
                "X-Generated-Rows": str(len(synthetic_df)),
                "X-Generated-Columns": str(len(synthetic_df.columns)),
                "X-Generation-Type": model_type,
                "X-Training-Rows": str(len(df)),
            }
        )
        
    except Exception as e:
        logger.error(f"Playground ML generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Training/generation failed: {str(e)}"
        )


@router.get("/demo-datasets")
async def get_demo_datasets():
    """
    Get available demo datasets for ML training.
    """
    demos = []
    
    # Check available demo files
    demo_info = {
        "customers": {
            "file": "customers_120.csv",
            "name": "Customer Database",
            "description": "120 customer records with names, emails, ages",
            "columns": ["customer_id", "first_name", "last_name", "email", "age", "signup_date"],
        },
        "transactions": {
            "file": "transactions_150.csv", 
            "name": "Financial Transactions",
            "description": "150 transaction records with amounts, categories, timestamps",
            "columns": ["transaction_id", "amount", "currency", "category", "timestamp"],
        },
    }
    
    for demo_id, info in demo_info.items():
        demo_path = DEMO_DATA_DIR / info["file"]
        if demo_path.exists():
            df = pd.read_csv(demo_path)
            demos.append({
                "id": demo_id,
                "name": info["name"],
                "description": info["description"],
                "row_count": len(df),
                "column_count": len(df.columns),
                "columns": info["columns"],
            })
    
    return {"demo_datasets": demos}


@router.get("/templates")
async def get_playground_templates():
    """
    Get pre-configured schema templates for quick start.
    """
    return {
        "templates": [
            {
                "id": "customer",
                "name": "Customer Database",
                "description": "Names, emails, and contact information",
                "columns": [
                    {"name": "customer_id", "type": "uuid"},
                    {"name": "first_name", "type": "string"},
                    {"name": "last_name", "type": "string"},
                    {"name": "email", "type": "email"},
                    {"name": "phone", "type": "phone"},
                ],
                "suggested_rows": 1000,
            },
            {
                "id": "transactions",
                "name": "Financial Transactions",
                "description": "Payment and transaction records",
                "columns": [
                    {"name": "transaction_id", "type": "uuid"},
                    {"name": "amount", "type": "float"},
                    {"name": "currency", "type": "string"},
                    {"name": "timestamp", "type": "datetime"},
                    {"name": "status", "type": "string"},
                ],
                "suggested_rows": 500,
            },
            {
                "id": "products",
                "name": "Product Catalog",
                "description": "E-commerce product data",
                "columns": [
                    {"name": "product_id", "type": "uuid"},
                    {"name": "name", "type": "string"},
                    {"name": "category", "type": "string"},
                    {"name": "price", "type": "float"},
                    {"name": "in_stock", "type": "boolean"},
                ],
                "suggested_rows": 200,
            },
        ]
    }


@router.get("/limits")
async def get_playground_limits():
    """
    Get current playground limits for display in UI.
    """
    return {
        "schema_mode": {
            "max_rows": MAX_ROWS_PLAYGROUND,
            "max_columns": MAX_COLUMNS_PLAYGROUND,
            "speed": "instant",
        },
        "ml_mode": {
            "min_input_rows": MIN_ROWS_FOR_TRAINING,
            "max_output_rows": MAX_ROWS_PLAYGROUND,
            "max_columns": MAX_COLUMNS_PLAYGROUND,
            "max_epochs": MAX_EPOCHS_PLAYGROUND,
            "supported_models": SUPPORTED_MODELS,
            "speed": "30s-2min",
        },
        "max_generations_per_hour": 3,
        "upgrade_message": "Sign up free to unlock 1M rows, 300 epochs, and saved datasets."
    }

