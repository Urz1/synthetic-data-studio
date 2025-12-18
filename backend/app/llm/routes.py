"""LLM Chat API Routes

Interactive chat interface for evaluation exploration.
"""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import logging
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

# Third-party
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

# Local - Core
from app.core.dependencies import get_db, get_current_user
from app.core.validators import validate_uuid

# Local - Services
from app.evaluations import repositories as evaluations_repo
from app.generators import repositories as generators_repo
from app.services.llm.chat_service import ChatService
from app.services.llm.enhanced_pii_detector import EnhancedPIIDetector
from app.services.llm.compliance_writer import ComplianceWriter

# Local - Module
from .schemas import (
    ChatRequest,
    ChatResponse,
    FeatureGenerationRequest,
    PIIDetectionRequest,
    PrivacyReportRequest,
    ModelCardRequest
)

# ============================================================================
# SETUP
# ============================================================================

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/llm", tags=["llm"])

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/chat/stream")
@router.post("/chat/stream/")
async def chat_stream(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Interactive chat with streaming response"""
    logger.info(f"Chat stream request: {request.message[:50]}...")
    
    # Build context from evaluation or generator
    context = {}
    
    if request.evaluation_id:
        validate_uuid(request.evaluation_id, "evaluation_id")
        evaluation = evaluations_repo.get_evaluation(db, request.evaluation_id)
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        context["evaluation_id"] = str(evaluation.id)
        context["evaluation"] = evaluation.report
        context["generator_id"] = str(evaluation.generator_id)
        
        # Get generator info
        generator = generators_repo.get_generator_by_id(db, str(evaluation.generator_id))
        if generator:
            context["generator_type"] = generator.type
    
    elif request.generator_id:
        validate_uuid(request.generator_id, "generator_id")
        generator = generators_repo.get_generator_by_id(db, request.generator_id)
        if not generator:
            raise HTTPException(status_code=404, detail="Generator not found")
        
        context["generator_id"] = str(generator.id)
        context["generator_type"] = generator.type
    
    try:
        chat_service = ChatService()
        
        async def event_generator():
            async for chunk in chat_service.chat_stream(
                message=request.message,
                context=context,
                history=request.history
            ):
                yield f"data: {chunk}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    
    except Exception as e:
        logger.error(f"Chat stream failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Chat stream failed: {str(e)}"
        )


@router.post("/chat", response_model=ChatResponse)
@router.post("/chat/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> ChatResponse:
    """Interactive chat for evaluation exploration (non-streaming)"""
    logger.info(f"Chat request: {request.message[:50]}...")
    
    # Build context from evaluation or generator
    context = {}
    
    if request.evaluation_id:
        validate_uuid(request.evaluation_id, "evaluation_id")
        evaluation = evaluations_repo.get_evaluation(db, request.evaluation_id)
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        context["evaluation_id"] = str(evaluation.id)
        context["evaluation"] = evaluation.report
        context["generator_id"] = str(evaluation.generator_id)
        
        # Get generator info
        generator = generators_repo.get_generator_by_id(db, str(evaluation.generator_id))
        if generator:
            context["generator_type"] = generator.type
    
    elif request.generator_id:
        validate_uuid(request.generator_id, "generator_id")
        generator = generators_repo.get_generator_by_id(db, request.generator_id)
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
@router.post("/suggest-improvements/{evaluation_id}/")
async def suggest_improvements(
    evaluation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get AI-powered improvement suggestions based on evaluation results"""
    logger.info(f"Generating improvement suggestions for evaluation {evaluation_id}")
    
    # Validate UUID
    validate_uuid(evaluation_id, "evaluation_id")
    
    # Get evaluation
    evaluation = evaluations_repo.get_evaluation(db, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    # SECURITY: Verify ownership (admin can view any)
    is_admin = hasattr(current_user, "role") and current_user.role == "admin"
    if evaluation.created_by != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this evaluation"
        )
    
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
@router.get("/explain-metric/")
async def explain_metric(
    metric_name: str,
    metric_value: Optional[str] = None,
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get plain English explanation of a technical metric"""
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


@router.post("/generate-features")
@router.post("/generate-features/")
async def generate_features(
    request: FeatureGenerationRequest,
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Generate new features based on schema using LLM."""
    schema = request.data_schema
    if not schema:
         raise HTTPException(status_code=422, detail="Schema cannot be empty")
         
    try:
        chat_service = ChatService()
        features = await chat_service.generate_features(
            schema=schema,
            context=request.context
        )
        return {"features": features}
    except Exception as e:
        logger.error(f"Feature generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-pii")
@router.post("/detect-pii/")
async def detect_pii(
    request: PIIDetectionRequest,
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Detect PII in provided data samples."""
    if not request.data:
        raise HTTPException(status_code=422, detail="Data cannot be empty")
        
    try:
        detector = EnhancedPIIDetector()
        
        # Convert list of dicts to column-based format expected by detector
        # Input: [{"name": "John", "email": "john@example.com"}, ...]
        # Output: {"name": {"samples": ["John", ...], "stats": {...}}, ...}
        columns_data: Dict[str, Dict[str, Any]] = {}
        
        for record in request.data:
            if isinstance(record, dict):
                for col_name, value in record.items():
                    if col_name not in columns_data:
                        columns_data[col_name] = {"samples": [], "stats": {"dtype": "object"}}
                    columns_data[col_name]["samples"].append(value)
        
        if not columns_data:
            raise HTTPException(status_code=422, detail="No valid columns found in data")
        
        # Add basic stats
        for col_name, col_data in columns_data.items():
            samples = col_data["samples"]
            col_data["stats"] = {
                "dtype": "object",
                "unique_count": len(set(str(s) for s in samples)),
                "total_count": len(samples)
            }
        
        analysis = await detector.analyze_dataset(columns_data)
        
        # Also return in a format friendly for the frontend
        pii_detected = []
        for col_name, col_analysis in analysis.get("column_analyses", {}).items():
            if col_analysis.get("contains_pii"):
                pii_detected.append({
                    "field": col_name,
                    "type": col_analysis.get("pii_type", "unknown"),
                    "confidence": col_analysis.get("confidence", 0),
                    "risk_level": col_analysis.get("risk_level", "unknown")
                })
        
        return {
            "overall_risk_level": analysis.get("overall_risk_level", "low"),
            "pii_detected": pii_detected,
            "total_columns": analysis.get("total_columns", len(columns_data)),
            "columns_with_pii": analysis.get("columns_with_pii", len(pii_detected)),
            "recommendations": analysis.get("recommendations", [])
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PII detection failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="PII detection failed. Please try again."
        )


@router.get("/privacy-report/{generator_id}")
@router.get("/privacy-report/{generator_id}/")
async def get_privacy_report_cached(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get cached privacy report from S3 if available, otherwise generate new one."""
    validate_uuid(generator_id, "generator_id")
    
    # Check if cached version exists in S3
    from app.exports import repositories as exports_repo
    from app.exports.models import ExportType
    
    exports = exports_repo.list_exports_by_generator(db, uuid.UUID(generator_id), limit=5)
    privacy_export = next(
        (e for e in exports if e.export_type == ExportType.PRIVACY_REPORT.value and e.format == "pdf"),
        None
    )
    
    if privacy_export:
        # Return cached version with download URL
        from app.storage.s3 import get_storage_service
        try:
            storage = get_storage_service()
            download_url = storage.generate_presigned_url(privacy_export.s3_key, expires_in=3600)
            logger.info(f"✓ Returning cached privacy report from S3: {privacy_export.id}")
            return {
                "cached": True,
                "export_id": str(privacy_export.id),
                "download_url": download_url,
                "created_at": privacy_export.created_at.isoformat(),
                "file_size_bytes": privacy_export.file_size_bytes,
                "message": "Using cached privacy report from S3"
            }
        except Exception as e:
            logger.warning(f"Failed to get cached privacy report from S3: {e}")
            # Fall through to generate new one
    
    # No cached version, generate new one
    generator = generators_repo.get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # SECURITY: Verify ownership (admin can view any)
    is_admin = hasattr(current_user, "role") and current_user.role == "admin"
    if generator.created_by != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this generator"
        )
    
    try:
        writer = ComplianceWriter()
        metadata = {
            "generator_id": generator_id,
            "name": generator.name,
            "type": generator.type,
            "privacy_config": generator.privacy_config,
            "training_metadata": generator.training_metadata,
            "status": generator.status
        }
        
        # Use generate_privacy_report (NOT generate_compliance_report) for privacy reports
        report_markdown = await writer.generate_privacy_report(generator_metadata=metadata)
        return {"report": report_markdown, "generator_id": generator_id, "cached": False}
    except Exception as e:
        logger.error(f"Privacy report generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/privacy-report")
@router.post("/privacy-report/")
async def privacy_report(
    request: PrivacyReportRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Generate a privacy compliance report in markdown format (for JSON download)."""
    validate_uuid(request.dataset_id, "dataset_id")
    if request.generator_id:
        validate_uuid(request.generator_id, "generator_id")
        generator = generators_repo.get_generator_by_id(db, request.generator_id)
        if not generator:
            raise HTTPException(status_code=404, detail="Generator not found")
    else:
        generator = None
        
    try:
        writer = ComplianceWriter()
        
        # Build generator metadata
        metadata = {
            "id": str(generator.id) if generator else None,
            "name": generator.name if generator else "Unknown",
            "type": generator.type if generator else "Unknown",
            "privacy_config": generator.privacy_config if generator else {},
            "training_metadata": generator.training_metadata if generator else {},
            "status": generator.status if generator else "Unknown"
        }
        
        # Generate privacy report in markdown format
        report_markdown = await writer.generate_privacy_report(generator_metadata=metadata)
        
        return {
            "report": report_markdown,
            "generator_id": str(generator.id) if generator else None,
            "generator_name": generator.name if generator else "Unknown",
            "generator_type": generator.type if generator else "Unknown",
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Privacy report generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-card/{generator_id}")
@router.get("/model-card/{generator_id}/")
async def get_model_card_cached(
    generator_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get cached model card from S3 if available, otherwise generate new one."""
    validate_uuid(generator_id, "generator_id")
    
    # Check if cached version exists in S3
    from app.exports import repositories as exports_repo
    from app.exports.models import ExportType
    
    exports = exports_repo.list_exports_by_generator(db, uuid.UUID(generator_id), limit=5)
    model_card_export = next(
        (e for e in exports if e.export_type == ExportType.MODEL_CARD.value and e.format == "pdf"),
        None
    )
    
    if model_card_export:
        # Return cached version with download URL
        from app.storage.s3 import get_storage_service
        try:
            storage = get_storage_service()
            download_url = storage.generate_presigned_url(model_card_export.s3_key, expires_in=3600)
            logger.info(f"✓ Returning cached model card from S3: {model_card_export.id}")
            return {
                "cached": True,
                "export_id": str(model_card_export.id),
                "download_url": download_url,
                "created_at": model_card_export.created_at.isoformat(),
                "file_size_bytes": model_card_export.file_size_bytes,
                "message": "Using cached model card from S3"
            }
        except Exception as e:
            logger.warning(f"Failed to get cached model card from S3: {e}")
            # Fall through to generate new one
    
    # No cached version, generate new one
    generator = generators_repo.get_generator_by_id(db, generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    # SECURITY: Verify ownership (admin can view any)
    is_admin = hasattr(current_user, "role") and current_user.role == "admin"
    if generator.created_by != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this generator"
        )
    
    try:
        writer = ComplianceWriter()
        metadata = {
            "id": str(generator.id),
            "name": generator.name,
            "type": generator.type,
            "parameters": generator.parameters_json,
            "privacy_config": generator.privacy_config,
            "training_metadata": generator.training_metadata,
            "status": generator.status
        }
        
        card = await writer.generate_model_card(generator_metadata=metadata)
        if isinstance(card, str):
            return {"model_card": card, "generator_id": str(generator.id), "cached": False}
        return {**card, "cached": False}
    except Exception as e:
        logger.error(f"Model card generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/model-card")
@router.post("/model-card/")
async def model_card(
    request: ModelCardRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Generate a model card for the generator."""
    validate_uuid(request.generator_id, "generator_id")
    validate_uuid(request.dataset_id, "dataset_id")
    
    # Get generator
    generator = generators_repo.get_generator_by_id(db, request.generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    try:
        writer = ComplianceWriter()
        
        # Build generator metadata
        metadata = {
            "id": str(generator.id),
            "name": generator.name,
            "type": generator.type,
            "parameters": generator.parameters_json,
            "privacy_config": generator.privacy_config,
            "training_metadata": generator.training_metadata,
            "status": generator.status
        }
        
        # Use correct method signature
        card = await writer.generate_model_card(
            generator_metadata=metadata
        )
        # Wrap markdown in dict for JSON response
        if isinstance(card, str):
            return {"model_card": card, "generator_id": str(generator.id)}
        return card
    except Exception as e:
        logger.error(f"Model card generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/model-card/export/pdf")
@router.post("/model-card/export/pdf/")
async def export_model_card_pdf(
    request: ModelCardRequest,
    save_to_s3: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Export model card as PDF.
    
    Args:
        request: Model card request with generator_id
        save_to_s3: If True (default), save to S3 and return download URL instead of file
    """
    validate_uuid(request.generator_id, "generator_id")
    
    # Get generator
    generator = generators_repo.get_generator_by_id(db, request.generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    try:
        # Generate content
        writer = ComplianceWriter()
        metadata = {
            "id": str(generator.id),
            "name": generator.name,
            "type": generator.type,
            "parameters": generator.parameters_json,
            "privacy_config": generator.privacy_config,
            "training_metadata": generator.training_metadata,
            "status": generator.status
        }
        
        content = await writer.generate_model_card(generator_metadata=metadata)
        if isinstance(content, dict):
            content = content.get("model_card", "")
        
        title = f"Model Card: {generator.name}"
        
        if save_to_s3:
            # Save to S3 and create export record
            from app.services.export import report_exporter
            from app.exports.models import ExportCreate, ExportType, ExportFormat
            from app.exports import repositories as exports_repo
            
            pdf_bytes, s3_info = report_exporter.export_pdf_to_s3(
                content_markdown=content,
                title=title,
                user_id=str(current_user.id),
                export_type="model_card",
                metadata={"generator_id": str(generator.id), "type": generator.type}
            )
            
            # Create export record
            export_data = ExportCreate(
                export_type=ExportType.MODEL_CARD,
                format=ExportFormat.PDF,
                title=title,
                generator_id=generator.id,
                s3_key=s3_info["s3_key"],
                s3_bucket=s3_info["s3_bucket"],
                file_size_bytes=s3_info["file_size_bytes"],
                metadata_json={"generator_type": generator.type}
            )
            export_record = exports_repo.create_export(db, export_data, current_user.id)
            
            return {
                "export_id": str(export_record.id),
                "download_url": s3_info["download_url"],
                "filename": s3_info["filename"],
                "file_size_bytes": s3_info["file_size_bytes"],
                "expires_in": 3600,
                "message": "Export saved to S3. Use download_url to retrieve."
            }
        else:
            # Direct download (original behavior)
            from app.services.export import report_exporter
            from fastapi.responses import Response
            
            pdf_bytes = report_exporter.export_to_pdf(
                content_markdown=content,
                title=title,
                metadata={"generator_id": str(generator.id), "type": generator.type}
            )
            
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=model_card_{generator.id}.pdf"}
            )
        
    except Exception as e:
        logger.error(f"PDF export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/model-card/export/docx")
@router.post("/model-card/export/docx/")
async def export_model_card_docx(
    request: ModelCardRequest,
    save_to_s3: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Export model card as Word document.
    
    Args:
        request: Model card request with generator_id
        save_to_s3: If True, save to S3 and return download URL instead of file
    """
    validate_uuid(request.generator_id, "generator_id")
    
    # Get generator
    generator = generators_repo.get_generator_by_id(db, request.generator_id)
    if not generator:
        raise HTTPException(status_code=404, detail="Generator not found")
    
    try:
        # Generate content
        writer = ComplianceWriter()
        metadata = {
            "id": str(generator.id),
            "name": generator.name,
            "type": generator.type,
            "parameters": generator.parameters_json,
            "privacy_config": generator.privacy_config,
            "training_metadata": generator.training_metadata,
            "status": generator.status
        }
        
        content = await writer.generate_model_card(generator_metadata=metadata)
        if isinstance(content, dict):
            content = content.get("model_card", "")
        
        title = f"Model Card: {generator.name}"
        
        if save_to_s3:
            # Save to S3 and create export record
            from app.services.export import report_exporter
            from app.exports.models import ExportCreate, ExportType, ExportFormat
            from app.exports import repositories as exports_repo
            
            local_path, s3_info = report_exporter.export_docx_to_s3(
                content_markdown=content,
                title=title,
                user_id=str(current_user.id),
                export_type="model_card",
                metadata={"generator_id": str(generator.id), "type": generator.type}
            )
            
            # Create export record
            export_data = ExportCreate(
                export_type=ExportType.MODEL_CARD,
                format=ExportFormat.DOCX,
                title=title,
                generator_id=generator.id,
                s3_key=s3_info["s3_key"],
                s3_bucket=s3_info["s3_bucket"],
                file_size_bytes=s3_info["file_size_bytes"],
                metadata_json={"generator_type": generator.type}
            )
            export_record = exports_repo.create_export(db, export_data, current_user.id)
            
            # Clean up local temp file
            import os
            if os.path.exists(local_path):
                os.remove(local_path)
            
            return {
                "export_id": str(export_record.id),
                "download_url": s3_info["download_url"],
                "filename": s3_info["filename"],
                "file_size_bytes": s3_info["file_size_bytes"],
                "expires_in": 3600,
                "message": "Export saved to S3. Use download_url to retrieve."
            }
        else:
            # Direct download (original behavior)
            from app.services.export import report_exporter
            from fastapi.responses import FileResponse
            
            file_path = report_exporter.export_to_docx(
                content_markdown=content,
                title=title,
                metadata={"generator_id": str(generator.id), "type": generator.type}
            )
            
            return FileResponse(
                path=file_path,
                filename=f"model_card_{generator.id}.docx",
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                background=None
            )
        
    except Exception as e:
        logger.error(f"DOCX export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/privacy-report/export/pdf")
@router.post("/privacy-report/export/pdf/")
async def export_privacy_report_pdf(
    request: PrivacyReportRequest,
    save_to_s3: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Export privacy report as PDF.
    
    Args:
        request: Privacy report request with dataset_id and optional generator_id
        save_to_s3: If True (default), save to S3 and return download URL instead of file
    """
    validate_uuid(request.dataset_id, "dataset_id")
    
    generator = None
    if request.generator_id:
        generator = generators_repo.get_generator_by_id(db, request.generator_id)
    
    try:
        # Generate comprehensive privacy report using LLM (markdown format)
        writer = ComplianceWriter()
        metadata = {
            "id": str(generator.id) if generator else None,
            "name": generator.name if generator else "Unknown",
            "type": generator.type if generator else "Unknown",
            "privacy_config": generator.privacy_config if generator else {},
            "training_metadata": generator.training_metadata if generator else {},
            "status": generator.status if generator else "Unknown"
        }
        
        logger.info(f"[PRIVACY REPORT] Generating privacy report for generator {request.generator_id}")
        # Generate privacy report in markdown format (NOT model card)
        content = await writer.generate_privacy_report(generator_metadata=metadata)
        logger.info(f"[PRIVACY REPORT] Generated content starts with: {content[:100] if content else 'EMPTY'}...")
        
        title = f"Privacy Report: {generator.name if generator else 'Unknown Generator'}"
        
        if save_to_s3:
            # Save to S3 and create export record
            from app.services.export import report_exporter
            from app.exports.models import ExportCreate, ExportType, ExportFormat
            from app.exports import repositories as exports_repo
            import uuid as uuid_lib
            
            pdf_bytes, s3_info = report_exporter.export_pdf_to_s3(
                content_markdown=content,
                title=title,
                user_id=str(current_user.id),
                export_type="privacy_report",
                metadata={
                    "dataset_id": request.dataset_id,
                    "generator_id": request.generator_id
                }
            )
            
            # Create export record
            export_data = ExportCreate(
                export_type=ExportType.PRIVACY_REPORT,
                format=ExportFormat.PDF,
                title=title,
                generator_id=uuid_lib.UUID(request.generator_id) if request.generator_id else None,
                dataset_id=uuid_lib.UUID(request.dataset_id),
                s3_key=s3_info["s3_key"],
                s3_bucket=s3_info["s3_bucket"],
                file_size_bytes=s3_info["file_size_bytes"],
                metadata_json={"framework": "Privacy"}
            )
            export_record = exports_repo.create_export(db, export_data, current_user.id)
            
            return {
                "export_id": str(export_record.id),
                "download_url": s3_info["download_url"],
                "filename": s3_info["filename"],
                "file_size_bytes": s3_info["file_size_bytes"],
                "expires_in": 3600,
                "message": "Export saved to S3. Use download_url to retrieve."
            }
        else:
            # Direct download (original behavior)
            from app.services.export import report_exporter
            from fastapi.responses import Response
            
            pdf_bytes = report_exporter.export_to_pdf(
                content_markdown=content,
                title=title,
                metadata={
                    "dataset_id": request.dataset_id,
                    "generator_id": request.generator_id
                }
            )
            
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=privacy_report.pdf"}
            )
        
    except Exception as e:
        logger.error(f"PDF export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/privacy-report/export/docx")
@router.post("/privacy-report/export/docx/")
async def export_privacy_report_docx(
    request: PrivacyReportRequest,
    save_to_s3: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Export privacy report as DOCX.
    
    Args:
        request: Privacy report request with dataset_id and optional generator_id
        save_to_s3: If True (default), save to S3 and return download URL instead of file
    """
    validate_uuid(request.dataset_id, "dataset_id")
    
    generator = None
    if request.generator_id:
        generator = generators_repo.get_generator_by_id(db, request.generator_id)
    
    try:
        # Generate comprehensive privacy report using LLM (markdown format)
        writer = ComplianceWriter()
        metadata = {
            "id": str(generator.id) if generator else None,
            "name": generator.name if generator else "Unknown",
            "type": generator.type if generator else "Unknown",
            "privacy_config": generator.privacy_config if generator else {},
            "training_metadata": generator.training_metadata if generator else {},
            "status": generator.status if generator else "Unknown"
        }
        
        # Generate privacy report in markdown format (like model card)
        content = await writer.generate_privacy_report(generator_metadata=metadata)
        
        title = f"Privacy Report: {generator.name if generator else 'Unknown Generator'}"
        
        if save_to_s3:
            # Save to S3 and create export record
            from app.services.export import report_exporter
            from app.exports.models import ExportCreate, ExportType, ExportFormat
            from app.exports import repositories as exports_repo
            import uuid as uuid_lib
            
            docx_bytes, s3_info = report_exporter.export_docx_to_s3(
                content_markdown=content,
                title=title,
                user_id=str(current_user.id),
                export_type="privacy_report",
                metadata={
                    "dataset_id": request.dataset_id,
                    "generator_id": request.generator_id
                }
            )
            
            # Create export record
            export_data = ExportCreate(
                export_type=ExportType.PRIVACY_REPORT,
                format=ExportFormat.DOCX,
                title=title,
                generator_id=uuid_lib.UUID(request.generator_id) if request.generator_id else None,
                dataset_id=uuid_lib.UUID(request.dataset_id),
                s3_key=s3_info["s3_key"],
                s3_bucket=s3_info["s3_bucket"],
                file_size_bytes=s3_info["file_size_bytes"],
                metadata_json={"framework": "Privacy"}
            )
            export_record = exports_repo.create_export(db, export_data, current_user.id)
            
            return {
                "export_id": str(export_record.id),
                "download_url": s3_info["download_url"],
                "filename": s3_info["filename"],
                "file_size_bytes": s3_info["file_size_bytes"],
                "expires_in": 3600,
                "message": "Export saved to S3. Use download_url to retrieve."
            }
        else:
            # Direct download (original behavior)
            from app.services.export import report_exporter
            from fastapi.responses import Response
            
            pdf_bytes = report_exporter.export_to_pdf(
                content_markdown=content,
                title=title,
                metadata={
                    "dataset_id": request.dataset_id,
                    "generator_id": request.generator_id
                }
            )
            
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=privacy_report.pdf"}
            )
        
    except Exception as e:
        logger.error(f"PDF export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

