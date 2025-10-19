try:
    from fastapi import FastAPI

    app = FastAPI(title="Synthetic Data Studio - Backend")


    @app.get("/")
    def read_root():
        return {"message": "Synthetic Data Studio backend is running."}

    # Try to include dataset routes if available (safe import)
    try:
        from .datasets import routes as datasets_routes

        app.include_router(datasets_routes.router)
    except Exception:
        # Ignore if datasets module isn't ready yet
        pass
except Exception:
    # FastAPI isn't installed in the environment. Provide a lightweight
    # placeholder object so importing the package doesn't fail during static
    # analysis or light-weight tests.
    class _PlaceholderApp:
        def __init__(self):
            self.routes = []

        def include_router(self, router):
            self.routes.append(router)

        def __repr__(self):
            return "<PlaceholderApp>"


    app = _PlaceholderApp()
