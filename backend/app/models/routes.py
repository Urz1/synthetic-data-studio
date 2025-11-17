"""Routes for ML model management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.core.dependencies import get_db, get_current_user
from .models import Model, ModelVersion
from .crud import get_models, create_model, get_model_by_id, get_model_versions, create_model_version
from app.generators.services import generate_from_trained_model
from app.generators.models import Generator

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/", response_model=list[Model])
def list_models(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_models(db)


@router.get("/{model_id}", response_model=Model)
def get_model(model_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    model = get_model_by_id(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.post("/", response_model=Model)
def create_new_model(model: Model, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_model(db, model)


@router.get("/{model_id}/versions", response_model=list[ModelVersion])
def list_model_versions(model_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_model_versions(db, model_id)


@router.post("/{model_id}/versions", response_model=ModelVersion)
def create_model_version_endpoint(
    model_id: str,
    version: ModelVersion,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    version.model_id = model_id
    version.created_by = current_user.id
    return create_model_version(db, version)


@router.post("/{model_id}/versions/{version_id}/generate")
def generate_from_model(
    model_id: str,
    version_id: str,
    num_rows: int = 1000,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Generate synthetic data using a trained model."""
    # Create a dummy generator for now
    # TODO: Allow users to specify generator parameters
    generator = Generator(
        name=f"model_{model_id}_v{version_id}_generation",
        type="ctgan",
        created_by=current_user.id,
        parameters_json={"num_rows": num_rows}
    )

    try:
        dataset = generate_from_trained_model(version_id, num_rows, db, generator)
        return {
            "message": "Synthetic data generated successfully",
            "dataset_id": dataset.id,
            "rows_generated": dataset.row_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")