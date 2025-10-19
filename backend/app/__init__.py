"""Backend app package for Synthetic Data Studio.

This file exposes the FastAPI `app` and mounts routers from submodules when
available. The structure was refactored to separate modules such as
`datasets`, `projects`, `generators`, and worker utilities.
"""

from importlib import import_module

__all__ = ["app"]

# Lazy import the FastAPI app from main so tooling can import the package
# without side-effects when FastAPI isn't installed.
try:
	from .main import app  # type: ignore
except Exception:
	# If main or FastAPI isn't available, provide a simple placeholder
	app = None

# Try to include routers if modules exist
for mod_name in ("datasets.routes", "projects.routes"):
	try:
		mod = import_module(f"app.{mod_name}")
		if app is not None and hasattr(mod, "router"):
			app.include_router(mod.router)
	except Exception:
		# ignore missing modules during refactor
		pass

