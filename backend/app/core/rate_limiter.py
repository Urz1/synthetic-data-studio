"""Rate limiting middleware for API protection."""

# Standard library
import asyncio
import time
from collections import defaultdict
from typing import Callable, Dict, Optional

# Third-party
from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_429_TOO_MANY_REQUESTS


class RateLimitExceeded(HTTPException):
    """Exception raised when rate limit is exceeded."""
    def __init__(self, detail: str = "Rate limit exceeded", retry_after: int = 60):
        super().__init__(
            status_code=HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            headers={"Retry-After": str(retry_after)}
        )


class InMemoryRateLimiter:
    """
    In-memory rate limiter using sliding window algorithm.
    
    For production, consider using Redis-based rate limiting.
    """
    
    def __init__(self):
        self._requests: Dict[str, list] = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def is_allowed(
        self,
        key: str,
        limit: int,
        window_seconds: int
    ) -> tuple[bool, int, int]:
        """
        Check if request is allowed under rate limit.
        
        Returns: (is_allowed, remaining, retry_after)
        """
        async with self._lock:
            now = time.time()
            window_start = now - window_seconds
            
            # Clean old requests
            self._requests[key] = [
                ts for ts in self._requests[key]
                if ts > window_start
            ]
            
            current_count = len(self._requests[key])
            
            if current_count >= limit:
                # Calculate retry-after
                oldest = min(self._requests[key]) if self._requests[key] else now
                retry_after = int(oldest + window_seconds - now) + 1
                return False, 0, retry_after
            
            # Allow request
            self._requests[key].append(now)
            remaining = limit - current_count - 1
            
            return True, remaining, 0
    
    async def cleanup(self):
        """Remove expired entries."""
        async with self._lock:
            now = time.time()
            keys_to_remove = []
            
            for key, timestamps in self._requests.items():
                # Remove if all timestamps are older than 1 hour
                if all(ts < now - 3600 for ts in timestamps):
                    keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del self._requests[key]


# Global rate limiter instance
rate_limiter = InMemoryRateLimiter()


# Rate limit configurations per endpoint pattern
RATE_LIMITS = {
    # Authentication - stricter limits
    "/auth/login": {"limit": 10, "window": 60},  # 10 per minute
    "/auth/register": {"limit": 5, "window": 60},  # 5 per minute
    
    # Generation endpoints - resource intensive
    "/generators/*/generate": {"limit": 20, "window": 60},  # 20 per minute
    "/generators/dataset/*/generate": {"limit": 10, "window": 60},  # 10 per minute
    
    # Evaluation endpoints
    "/evaluations/run": {"limit": 30, "window": 60},  # 30 per minute
    "/evaluations/quick/*": {"limit": 60, "window": 60},  # 60 per minute
    
    # LLM endpoints - API cost consideration
    "/llm/chat": {"limit": 30, "window": 60},  # 30 per minute
    "/llm/model-card": {"limit": 20, "window": 60},  # 20 per minute
    "/llm/*": {"limit": 60, "window": 60},  # 60 per minute default
    
    # Dataset operations
    "/datasets/upload": {"limit": 30, "window": 60},  # 30 per minute
    "/datasets/*": {"limit": 100, "window": 60},  # 100 per minute
    
    # Default for all other endpoints
    "default": {"limit": 200, "window": 60},  # 200 per minute
}

# Debug mode multiplier - increase limits for easier testing
DEBUG_RATE_LIMIT_MULTIPLIER = 10


def get_rate_limit_config(path: str) -> dict:
    """Get rate limit configuration for a path."""
    import re
    from app.core.config import settings
    
    # Check specific patterns
    for pattern, config in RATE_LIMITS.items():
        if pattern == "default":
            continue
        
        # Convert pattern to regex
        regex_pattern = pattern.replace("*", "[^/]+")
        if re.match(f"^{regex_pattern}$", path):
            # Apply debug multiplier if in debug mode
            if settings.debug:
                return {"limit": config["limit"] * DEBUG_RATE_LIMIT_MULTIPLIER, "window": config["window"]}
            return config
    
    default_config = RATE_LIMITS["default"]
    if settings.debug:
        return {"limit": default_config["limit"] * DEBUG_RATE_LIMIT_MULTIPLIER, "window": default_config["window"]}
    return default_config


def get_client_identifier(request: Request) -> str:
    """
    Get a unique identifier for the client.
    
    Uses: Authorization token > X-API-Key > IP address
    """
    # Try to get user from auth header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        # Use hash of token as identifier
        import hashlib
        token_hash = hashlib.sha256(auth_header.encode()).hexdigest()[:16]
        return f"token:{token_hash}"
    
    # Try API key
    api_key = request.headers.get("X-API-Key", "")
    if api_key:
        import hashlib
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()[:16]
        return f"apikey:{key_hash}"
    
    # Fall back to IP address
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    
    return f"ip:{ip}"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware.
    
    Implements per-client, per-endpoint rate limiting with sliding window.
    """
    
    def __init__(self, app, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.enabled:
            return await call_next(request)
        
        # Skip rate limiting for health checks, metrics, and CORS preflights (OPTIONS)
        path = request.url.path
        if request.method == "OPTIONS" or path in ["/health", "/health/ready", "/health/live", "/metrics", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Get client identifier and rate limit config
        client_id = get_client_identifier(request)
        config = get_rate_limit_config(path)
        
        # Create rate limit key
        rate_key = f"{client_id}:{path}"
        
        # Check rate limit
        is_allowed, remaining, retry_after = await rate_limiter.is_allowed(
            key=rate_key,
            limit=config["limit"],
            window_seconds=config["window"]
        )
        
        if not is_allowed:
            raise RateLimitExceeded(
                detail=f"Rate limit exceeded. Maximum {config['limit']} requests per {config['window']} seconds.",
                retry_after=retry_after
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(config["limit"])
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Window"] = str(config["window"])
        
        return response
