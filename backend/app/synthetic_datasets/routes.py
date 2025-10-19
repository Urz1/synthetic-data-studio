try:
    from fastapi import APIRouter
    from .models import SyntheticDataset
    from .crud import list_synthetic, create_synthetic

    router = APIRouter(prefix="/synthetic-datasets", tags=["synthetic-datasets"])


    @router.get("/", response_model=list[SyntheticDataset])
    def get_synthetic():
        return list_synthetic()


    @router.post("/", response_model=SyntheticDataset)
    def post_synthetic(s: SyntheticDataset):
        return create_synthetic(s)
except Exception:
    router = None
