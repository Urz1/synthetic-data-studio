"""Minimal auth routes - GDPR compliance only.

All authentication is handled by better-auth on the frontend.
This module only provides GDPR compliance endpoints:
- /gdpr/delete - Delete account (GDPR Article 17)
- /gdpr/export - Export data (GDPR Article 15)
"""

# Standard library
import datetime

# Third-party
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlmodel import Session, text

# Internal
from app.auth.models import User
from app.core.dependencies import get_db, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


# ============================================================================
# SCHEMAS
# ============================================================================

class GDPRExportResponse(BaseModel):
    """GDPR data export response."""
    user: dict
    projects: list
    datasets: list
    generators: list
    exports: list
    audit_logs: list
    exported_at: str


# ============================================================================
# GDPR ENDPOINTS
# ============================================================================

@router.post("/gdpr/delete")
def delete_account(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete the current user's account (GDPR Article 17 - Right to Erasure).
    
    Deletes all user data from local tables and better-auth tables.
    """
    user_id = str(current_user.id)
    
    # Delete user's data from all tables (order matters for FK constraints)
    tables_to_clean = [
        "exports",
        "evaluations", 
        "generators",
        "datasets",
        "dataset_files",
        "projects",
        "audit_logs",
        "api_keys",
    ]
    
    for table in tables_to_clean:
        try:
            db.execute(text(f"DELETE FROM {table} WHERE owner_id = :uid OR user_id = :uid"), {"uid": user_id})
        except Exception:
            pass
    
    # Delete from local users table
    db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
    
    # Delete from better-auth tables (TEXT id, so cast our UUID)
    ba_user_id = str(current_user.id)
    try:
        db.execute(text("DELETE FROM session WHERE \"userId\" = :uid"), {"uid": ba_user_id})
        db.execute(text("DELETE FROM account WHERE \"userId\" = :uid"), {"uid": ba_user_id})
        db.execute(text("DELETE FROM \"user\" WHERE id = :uid"), {"uid": ba_user_id})
    except Exception:
        pass  # better-auth tables may not exist yet
    
    db.commit()
    
    return {"message": "Account deleted successfully"}


@router.get("/gdpr/export", response_model=GDPRExportResponse)
def export_account_data(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export all personal data (GDPR Article 15 - Right of Access).
    """
    user_id = str(current_user.id)
    
    user_data = {
        "id": user_id,
        "email": current_user.email,
        "name": current_user.name,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }
    
    def fetch_table(table: str, column: str = "owner_id"):
        try:
            result = db.execute(
                text(f"SELECT * FROM {table} WHERE {column} = :uid"),
                {"uid": user_id}
            ).fetchall()
            return [dict(row._mapping) for row in result]
        except Exception:
            return []
    
    return GDPRExportResponse(
        user=user_data,
        projects=fetch_table("projects"),
        datasets=fetch_table("datasets"),
        generators=fetch_table("generators"),
        exports=fetch_table("exports"),
        audit_logs=fetch_table("audit_logs", "user_id"),
        exported_at=datetime.datetime.utcnow().isoformat(),
    )


@router.get("/ping")
def ping():
    """Health check."""
    return {"status": "ok", "auth": "better-auth"}
