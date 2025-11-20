"""
API routes for synthetic data evaluation.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..core.dependencies import get_db
from ..generators import crud as generators_crud
from ..datasets import crud as datasets_crud
from .quality_report import QualityReportGenerator
from . import crud as evaluations_crud

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


class EvaluationRequest(BaseModel):
    """Request model for evaluation."""
    generator_id: str
    dataset_id: str
    target_column: Optional[str] = None
    sensitive_columns: Optional[List[str]] = None
    include_statistical: bool = True
    include_ml_utility: bool = True
    include_privacy: bool = True


class EvaluationResponse(BaseModel):
    """Response model for evaluation."""
    evaluation_id: str
    generator_id: str
    dataset_id: str
    status: str
    report: dict
    
    class Config:
        from_attributes = True


@router.post("/run", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
async def run_evaluation(
    request: EvaluationRequest,
    db: Session = Depends(get_db)
):
    """
    Run comprehensive quality evaluation on generated synthetic data.
    
    Evaluates:
    - Statistical similarity between real and synthetic data
    - ML utility (can you train good models?)
    - Privacy leakage risks
    
    Args:
        request: Evaluation configuration
        db: Database session
    
    Returns:
        Comprehensive quality report with scores and recommendations
    """
    logger.info(f"Running evaluation for generator {request.generator_id}")
    
    # Load generator
    generator = generators_crud.get_generator_by_id(db, request.generator_id)
    if not generator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generator {request.generator_id} not found"
        )
    
    # Load dataset
    dataset = datasets_crud.get_dataset_by_id(db, request.dataset_id)
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
        import pandas as pd
        
        # Get file path from dataset
        if dataset.file_path:
            real_data = pd.read_csv(dataset.file_path)
        else:
            # Fallback to constructing path
            from pathlib import Path
            file_path = Path("uploads") / dataset.original_filename
            real_data = pd.read_csv(file_path)
        
        # Load synthetic data from output dataset
        output_dataset = datasets_crud.get_dataset_by_id(db, str(generator.output_dataset_id))
        if not output_dataset:
            raise FileNotFoundError(f"Output dataset {generator.output_dataset_id} not found")
        
        if output_dataset.file_path:
            synthetic_data = pd.read_csv(output_dataset.file_path)
        else:
            # Fallback
            from pathlib import Path
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
        
        # Save evaluation to database
        evaluation = evaluations_crud.create_evaluation(
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
async def get_evaluation(
    evaluation_id: str,
    db: Session = Depends(get_db)
):
    """
    Get evaluation results by ID.
    
    Args:
        evaluation_id: Evaluation ID
        db: Database session
    
    Returns:
        Evaluation results with quality report
    """
    evaluation = evaluations_crud.get_evaluation(db, evaluation_id)
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
    db: Session = Depends(get_db)
):
    """
    List all evaluations for a specific generator.
    
    Args:
        generator_id: Generator ID
        db: Database session
    
    Returns:
        List of evaluations for the generator
    """
    evaluations = evaluations_crud.list_evaluations_by_generator(db, generator_id)
    
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


@router.post("/quick/{generator_id}", response_model=dict)
async def quick_evaluation(
    generator_id: str,
    db: Session = Depends(get_db)
):
    """
    Run quick statistical evaluation (no ML utility or privacy tests).
    
    Fast evaluation for immediate feedback.
    
    Args:
        generator_id: Generator ID
        db: Database session
    
    Returns:
        Statistical summary report
    """
    logger.info(f"Running quick evaluation for generator {generator_id}")
    
    # Load generator
    generator = generators_crud.get_generator_by_id(db, generator_id)
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
        import pandas as pd
        from pathlib import Path
        
        # Load data
        dataset = datasets_crud.get_dataset_by_id(db, str(generator.dataset_id))
        if dataset.file_path:
            real_data = pd.read_csv(dataset.file_path)
        else:
            real_data = pd.read_csv(Path("uploads") / dataset.original_filename)
        
        # Load synthetic data
        output_dataset = datasets_crud.get_dataset_by_id(db, str(generator.output_dataset_id))
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
