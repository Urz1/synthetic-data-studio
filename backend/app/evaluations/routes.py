"""Evaluation API endpoints."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import math
import logging
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any

# Third-party
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Local - Core
from app.core.dependencies import get_db, get_current_user
from app.core.validators import validate_uuid

# Local - Services
from app.datasets.repositories import get_dataset_by_id
from app.generators.repositories import get_generator_by_id
from app.services.llm.report_translator import ReportTranslator

# Local - Module
from .quality_report import QualityReportGenerator
from .repositories import (
    get_evaluation,
    create_evaluation,
    list_evaluations_by_generator
)
from .schemas import EvaluationRequest, EvaluationResponse, ComparisonRequest

# ============================================================================
# SETUP
# ============================================================================

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/evaluations", tags=["evaluations"])

# ============================================================================
# ENDPOINTS
# ============================================================================

def sanitize_json_floats(obj):
    """
    Recursively replace NaN, Infinity, and -Infinity with None (null in JSON).
    PostgreSQL JSONB does not support NaN/Infinity.
    """
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_json_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_json_floats(v) for v in obj]
    return obj


@router.post("/run", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
async def run_evaluation(
    request: EvaluationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> EvaluationResponse:
    """
    Run comprehensive quality evaluation on generated synthetic data.
    
    Evaluates:
    - Statistical similarity between real and synthetic data
    - ML utility (can you train good models?)
    - Privacy leakage risks
    
    Args:
        request: Evaluation configuration
        db: Database session
        current_user: Authenticated user
    
    Returns:
        Comprehensive quality report with scores and recommendations
    """
    logger.info(f"Running evaluation for generator {request.generator_id}")
    
    # Validate UUIDs
    validate_uuid(request.generator_id, "generator_id")
    validate_uuid(request.dataset_id, "dataset_id")
    
    # Load generator
    generator = get_generator_by_id(db, request.generator_id)
    if not generator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generator {request.generator_id} not found"
        )
    
    # Load dataset
    dataset = get_dataset_by_id(db, request.dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset {request.dataset_id} not found"
        )
    
    # Check if generator has been trained
    if generator.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Generator status is {generator.status}. Must be 'completed' to evaluate."
        )
    
    # Check if synthetic data exists
    if not generator.output_dataset_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generator has no synthetic data output"
        )
    
    try:
        # Load real data
        if dataset.file_path:
            real_data = pd.read_csv(dataset.file_path)
        else:
            file_path = Path("uploads") / dataset.original_filename
            real_data = pd.read_csv(file_path)
        
        # Load synthetic data from output dataset
        output_dataset = get_dataset_by_id(db, str(generator.output_dataset_id))
        if not output_dataset:
            raise FileNotFoundError(f"Output dataset {generator.output_dataset_id} not found")
        
        if output_dataset.file_path:
            synthetic_data = pd.read_csv(output_dataset.file_path)
        else:
            synth_file_path = Path("uploads") / output_dataset.original_filename
            synthetic_data = pd.read_csv(synth_file_path)
        
        # Generate quality report
        report_generator = QualityReportGenerator(
            real_data=real_data,
            synthetic_data=synthetic_data,
            generator_id=request.generator_id,
            generator_type=generator.type
        )
        
        report = report_generator.generate_full_report(
            target_column=request.target_column,
            sensitive_columns=request.sensitive_columns,
            include_statistical=request.include_statistical,
            include_ml_utility=request.include_ml_utility,
            include_privacy=request.include_privacy
        )
        
        # Sanitize report for JSON compliance (remove NaN/Infinity)
        report = sanitize_json_floats(report)
        
        # Save evaluation to database
        evaluation = create_evaluation(
            db=db,
            generator_id=request.generator_id,
            dataset_id=request.dataset_id,
            report=report
        )
        
        logger.info(f"✓ Evaluation {evaluation.id} completed: {report['overall_assessment']['overall_quality']}")
        
        return EvaluationResponse(
            evaluation_id=str(evaluation.id),
            generator_id=str(evaluation.generator_id),
            dataset_id=str(evaluation.dataset_id),
            status="completed",
            report=report
        )
        
    except FileNotFoundError as e:
        logger.error(f"Data file not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Data file not found: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Evaluation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}"
        )


@router.get("/{evaluation_id}", response_model=EvaluationResponse)
def get_evaluation_endpoint(
    evaluation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> EvaluationResponse:
    """Get a specific evaluation by ID."""
    # Validate UUID format
    eval_uuid = validate_uuid(evaluation_id, "evaluation_id")
    
    evaluation = get_evaluation(db, str(eval_uuid))
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation {evaluation_id} not found"
        )
    
    return EvaluationResponse(
        evaluation_id=str(evaluation.id),
        generator_id=str(evaluation.generator_id),
        dataset_id=str(evaluation.dataset_id),
        status="completed",
        report=evaluation.report
    )


@router.get("/generator/{generator_id}", response_model=List[EvaluationResponse])
async def list_generator_evaluations(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> List[EvaluationResponse]:
    """
    List all evaluations for a specific generator.
    
    Args:
        generator_id: Generator ID
        db: Database session
        current_user: Authenticated user
    
    Returns:
        List of evaluations for the generator
    """
    # Validate UUID
    validate_uuid(generator_id, "generator_id")
    
    evaluations = list_evaluations_by_generator(db, generator_id)
    
    return [
        EvaluationResponse(
            evaluation_id=str(e.id),
            generator_id=str(e.generator_id),
            dataset_id=str(e.dataset_id),
            status="completed",
            report=e.report
        )
        for e in evaluations
    ]


@router.post("/quick/{generator_id}", response_model=Dict[str, Any])
async def quick_evaluation(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Run quick statistical evaluation (no ML utility or privacy tests).
    
    Fast evaluation for immediate feedback.
    
    Args:
        generator_id: Generator ID
        db: Database session
        current_user: Authenticated user
    
    Returns:
        Statistical summary report
    """
    logger.info(f"Running quick evaluation for generator {generator_id}")
    
    # Validate UUID
    validate_uuid(generator_id, "generator_id")
    
    # Load generator
    generator = get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generator {generator_id} not found"
        )
    
    if generator.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Generator status is {generator.status}. Must be 'completed' to evaluate."
        )
    
    if not generator.output_dataset_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generator has no synthetic data output"
        )
    
    try:
        # Load data
        dataset = get_dataset_by_id(db, str(generator.dataset_id))
        if dataset.file_path:
            real_data = pd.read_csv(dataset.file_path)
        else:
            real_data = pd.read_csv(Path("uploads") / dataset.original_filename)
        
        # Load synthetic data
        output_dataset = get_dataset_by_id(db, str(generator.output_dataset_id))
        if not output_dataset:
            raise FileNotFoundError(f"Output dataset {generator.output_dataset_id} not found")
        
        if output_dataset.file_path:
            synthetic_data = pd.read_csv(output_dataset.file_path)
        else:
            synthetic_data = pd.read_csv(Path("uploads") / output_dataset.original_filename)
        
        # Quick report
        report_generator = QualityReportGenerator(
            real_data=real_data,
            synthetic_data=synthetic_data,
            generator_id=generator_id,
            generator_type=generator.type
        )
        
        summary = report_generator.generate_summary_report()
        
        logger.info(f"✓ Quick evaluation complete: {summary['quality_level']}")
        
        return summary
        
    except Exception as e:
        logger.error(f"Quick evaluation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quick evaluation failed: {str(e)}"
        )


@router.post("/{evaluation_id}/explain", response_model=Dict[str, Any])
async def explain_evaluation(
    evaluation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate natural language explanation of evaluation results.
    
    Uses LLM to translate technical metrics into business insights:
    - Executive summary
    - Key findings
    - Actionable recommendations
    - Business impact statement
    
    Args:
        evaluation_id: Evaluation ID
        db: Database session
        current_user: Authenticated user
    
    Returns:
        Natural language insights with metadata
    """
    logger.info(f"Generating natural language insights for evaluation {evaluation_id}")
    
    # Validate UUID
    validate_uuid(evaluation_id, "evaluation_id")
    
    # Get evaluation
    evaluation = get_evaluation(db, evaluation_id)
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation {evaluation_id} not found"
        )
    
    # Check if insights already exist
    if hasattr(evaluation, 'insights') and evaluation.insights:
        logger.info("Returning cached insights")
        return evaluation.insights
    
    try:
        # Generate insights using LLM
        translator = ReportTranslator()
        insights = await translator.translate_evaluation(evaluation.report)
        
        # Save insights to database (if insights column exists)
        try:
            evaluation.insights = insights
            db.commit()
            logger.info(f"✓ Insights generated and cached using {insights['_metadata']['provider']}")
        except Exception as e:
            logger.warning(f"Could not save insights to database: {e}")
        
        return insights
        
    except Exception as e:
        logger.error(f"Failed to generate insights: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {str(e)}"
        )


@router.post("/compare", response_model=Dict[str, Any])
async def compare_evaluations(
    request: ComparisonRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Compare multiple evaluations and provide recommendations.
    
    Helps users choose the best synthetic data generation approach
    by comparing quality, privacy, and utility trade-offs.
    
    Args:
        request: Comparison request with evaluation IDs
        db: Database session
        current_user: Authenticated user
    
    Returns:
        Comparative analysis with recommendations
    """
    evaluation_ids = request.evaluation_ids
    logger.info(f"Comparing {len(evaluation_ids)} evaluations")
    
    # Validate UUIDs
    for eval_id in evaluation_ids:
        validate_uuid(eval_id, "evaluation_id")
    
    if len(evaluation_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 evaluations required for comparison"
        )
    
    if len(evaluation_ids) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 evaluations can be compared at once"
        )
    
    # Load all evaluations
    evaluations_data = []
    for eval_id in evaluation_ids:
        evaluation = get_evaluation(db, eval_id)
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evaluation {eval_id} not found"
            )
        
        # Get generator info
        generator = get_generator_by_id(db, str(evaluation.generator_id))
        
        evaluations_data.append({
            "evaluation_id": str(evaluation.id),
            "generator_type": generator.type if generator else "unknown",
            "metrics": evaluation.report
        })
    
    try:
        # Generate comparison using LLM
        translator = ReportTranslator()
        comparison = await translator.compare_evaluations(evaluations_data)
        
        logger.info("✓ Comparison generated successfully")
        return comparison
        
    except Exception as e:
        logger.error(f"Failed to generate comparison: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate comparison: {str(e)}"
        )
