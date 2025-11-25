"""LLM Chat API Routes

Interactive chat interface for evaluation exploration.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

from app.core.dependencies import get_db, get_current_user
from app.evaluations import crud as evaluations_crud
from app.generators import crud as generators_crud
from app.services.llm.chat_service import ChatService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/llm", tags=["llm"])


class ChatRequest(BaseModel):
    """Chat request model"""
    message: str
    evaluation_id: Optional[str] = None
    generator_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    """Chat response model"""
    response: str
    context_used: Dict[str, Any]


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Interactive chat for evaluation exploration
    
    Allows users to ask questions about their evaluations and get
    context-aware responses with recommendations.
    
    Args:
        request: Chat request with message and optional context IDs
        
    Returns:
        AI-generated response with context information
    """
    logger.info(f"Chat request: {request.message[:50]}...")
    
    # Build context from evaluation or generator
    context = {}
    
    if request.evaluation_id:
        evaluation = evaluations_crud.get_evaluation(db, request.evaluation_id)
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        context["evaluation_id"] = str(evaluation.id)
        context["evaluation"] = evaluation.report
        context["generator_id"] = str(evaluation.generator_id)
        
        # Get generator info
        generator = generators_crud.get_generator_by_id(db, str(evaluation.generator_id))
        if generator:
            context["generator_type"] = generator.type
    
    elif request.generator_id:
        generator = generators_crud.get_generator_by_id(db, request.generator_id)
        if not generator:
            raise HTTPException(status_code=404, detail="Generator not found")
        
        context["generator_id"] = str(generator.id)
        context["generator_type"] = generator.type
    
    # Generate response
    try:
        chat_service = ChatService()
        response = await chat_service.chat(
            message=request.message,
            context=context,
            history=request.history
        )
        
        logger.info("✓ Chat response generated")
        
        return ChatResponse(
            response=response,
            context_used=context
        )
    
    except Exception as e:
        logger.error(f"Chat failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}"
        )


@router.post("/suggest-improvements/{evaluation_id}")
async def suggest_improvements(
    evaluation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get AI-powered improvement suggestions based on evaluation results
    
    Analyzes evaluation metrics and provides specific, actionable
    recommendations for improving synthetic data quality.
    
    Args:
        evaluation_id: Evaluation ID
        
    Returns:
        List of improvement suggestions
    """
    logger.info(f"Generating improvement suggestions for evaluation {evaluation_id}")
    
    # Get evaluation
    evaluation = evaluations_crud.get_evaluation(db, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    try:
        chat_service = ChatService()
        suggestions = await chat_service.suggest_improvements(evaluation.report)
        
        logger.info(f"[OK] Generated {len(suggestions)} improvement suggestions")
        
        return {
            "evaluation_id": evaluation_id,
            "suggestions": suggestions,
            "count": len(suggestions)
        }
    
    except Exception as e:
        logger.error(f"Suggestion generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Suggestion generation failed: {str(e)}"
        )


@router.get("/explain-metric")
async def explain_metric(
    metric_name: str,
    metric_value: str,
    current_user=Depends(get_current_user)
):
    """Get plain English explanation of a technical metric
    
    Helps non-technical users understand what specific metrics mean
    and whether the values are good or bad.
    
    Args:
        metric_name: Name of the metric (e.g., "ks_statistic")
        metric_value: Value of the metric
        
    Returns:
        Plain English explanation
    """
    logger.info(f"Explaining metric: {metric_name}")
    
    try:
        chat_service = ChatService()
        explanation = await chat_service.explain_metric(
            metric_name=metric_name,
            metric_value=metric_value
        )
        
        logger.info("✓ Metric explanation generated")
        
        return {
            "metric_name": metric_name,
            "metric_value": metric_value,
            "explanation": explanation
        }
    
    except Exception as e:
        logger.error(f"Metric explanation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Metric explanation failed: {str(e)}"
        )
