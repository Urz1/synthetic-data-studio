"""Auth API routes (APIRouter) - safe import if FastAPI isn't installed."""

try:
    from fastapi import APIRouter

    router = APIRouter(prefix="/auth", tags=["auth"])


    @router.get("/ping")
    def ping():
        return {"msg": "auth ok"}
except Exception:
    # Provide a placeholder for tooling that imports this module without FastAPI
    router = None
