"""
Redis utility module for shared Redis access.

Reuses the existing REDIS_URL configuration used by Celery.
Provides graceful fallback to in-memory storage for development.
"""

# Standard library
import logging
from typing import Optional

# Third-party
from redis import ConnectionError as RedisConnectionError, Redis

# Internal
from app.core.config import settings

logger = logging.getLogger(__name__)

# Singleton Redis client
_redis_client: Optional[Redis] = None
_redis_available: Optional[bool] = None


def get_redis() -> Optional[Redis]:
    """
    Get the shared Redis client instance.
    
    Returns None if Redis is not configured or unavailable.
    Uses the same REDIS_URL as Celery for consistency.
    """
    global _redis_client, _redis_available
    
    # If we already know Redis is unavailable, don't retry
    if _redis_available is False:
        return None
    
    if _redis_client is None:
        if not settings.redis_url:
            logger.warning("REDIS_URL not configured - using in-memory fallback")
            _redis_available = False
            return None
        
        try:
            _redis_client = Redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            # Test the connection
            _redis_client.ping()
            _redis_available = True
            logger.info("Redis connection established")
        except (RedisConnectionError, Exception) as e:
            logger.warning(f"Redis unavailable ({e}) - using in-memory fallback")
            _redis_available = False
            _redis_client = None
            return None
    
    return _redis_client


def redis_available() -> bool:
    """Check if Redis is available without creating a connection."""
    if _redis_available is not None:
        return _redis_available
    # Trigger connection check
    get_redis()
    return _redis_available or False


# ============================================================================
# KEY-VALUE OPERATIONS WITH FALLBACK
# ============================================================================

# In-memory fallback stores (for development without Redis)
_memory_store: dict[str, str] = {}
_memory_expiry: dict[str, float] = {}


def _cleanup_expired_memory():
    """Remove expired keys from memory store."""
    import time
    now = time.time()
    expired = [k for k, exp in _memory_expiry.items() if exp <= now]
    for k in expired:
        _memory_store.pop(k, None)
        _memory_expiry.pop(k, None)


def set_with_expiry(key: str, value: str, expire_seconds: int) -> bool:
    """
    Set a key with TTL. Uses Redis if available, memory fallback otherwise.
    
    Args:
        key: The key to set
        value: The value to store
        expire_seconds: TTL in seconds
        
    Returns:
        True if successful
    """
    redis = get_redis()
    
    if redis:
        try:
            redis.setex(key, expire_seconds, value)
            return True
        except Exception as e:
            logger.error(f"Redis setex failed: {e}")
            # Fall through to memory store
    
    # In-memory fallback
    import time
    _cleanup_expired_memory()
    _memory_store[key] = value
    _memory_expiry[key] = time.time() + expire_seconds
    return True


def get_value(key: str) -> Optional[str]:
    """
    Get a value by key. Uses Redis if available, memory fallback otherwise.
    
    Args:
        key: The key to retrieve
        
    Returns:
        The value or None if not found/expired
    """
    redis = get_redis()
    
    if redis:
        try:
            return redis.get(key)
        except Exception as e:
            logger.error(f"Redis get failed: {e}")
            # Fall through to memory store
    
    # In-memory fallback
    import time
    _cleanup_expired_memory()
    if key in _memory_store:
        return _memory_store[key]
    return None


def delete_key(key: str) -> bool:
    """
    Delete a key. Uses Redis if available, memory fallback otherwise.
    
    Args:
        key: The key to delete
        
    Returns:
        True if successful
    """
    redis = get_redis()
    
    if redis:
        try:
            redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis delete failed: {e}")
            # Fall through to memory store
    
    # In-memory fallback
    _memory_store.pop(key, None)
    _memory_expiry.pop(key, None)
    return True


def exists(key: str) -> bool:
    """
    Check if a key exists. Uses Redis if available, memory fallback otherwise.
    
    Args:
        key: The key to check
        
    Returns:
        True if key exists and hasn't expired
    """
    redis = get_redis()
    
    if redis:
        try:
            return bool(redis.exists(key))
        except Exception as e:
            logger.error(f"Redis exists failed: {e}")
            # Fall through to memory store
    
    # In-memory fallback
    import time
    _cleanup_expired_memory()
    return key in _memory_store
