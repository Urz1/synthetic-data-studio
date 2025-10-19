try:
    from fastapi import APIRouter
    from .models import Generator
    from .crud import list_generators, create_generator

    router = APIRouter(prefix="/generators", tags=["generators"])


    @router.get("/", response_model=list[Generator])
    def get_generators():
        return list_generators()


    @router.post("/", response_model=Generator)
    def post_generator(g: Generator):
        return create_generator(g)
except Exception:
    router = None
