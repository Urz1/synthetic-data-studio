"""
Production-grade HTTP caching middleware
Implements Vercel/GitHub/Cloudflare caching patterns
"""

import hashlib
import logging
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse, FileResponse
from starlette.datastructures import MutableHeaders

logger = logging.getLogger(__name__)


class CacheControlMiddleware(BaseHTTPMiddleware):
    """
    Add Cache-Control and ETag headers based on route patterns.
    Industry-standard caching for APIs and static content.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Skip if already has Cache-Control
        if "cache-control" in response.headers:
            return response

        path = request.url.path
        method = request.method
        
        # Only cache successful GET requests
        if method != "GET" or response.status_code >= 400:
            response.headers["Cache-Control"] = "no-store"
            return response

        headers = MutableHeaders(response.headers)
        
        # 1. Static assets - 1 year immutable
        if self._is_static_asset(path):
            headers["Cache-Control"] = "public, max-age=31536000, immutable"
            headers["Access-Control-Allow-Origin"] = "*"
            logger.debug(f"[Cache] Static asset: {path}")
        
        # 2. Public API endpoints - short-lived CDN cache
        elif self._is_public_list_api(path):
            # CDN caches for 30s, serves stale while revalidating for 5m
            headers["Cache-Control"] = "public, max-age=30, s-maxage=30, stale-while-revalidate=300"
            self._add_etag(response, headers)
            logger.debug(f"[Cache] Public API: {path}")
        
        # 3. Authenticated/personal API - private cache with ETag
        elif self._is_authenticated_api(path):
            # Browser caches for 10s, must revalidate after
            headers["Cache-Control"] = "private, max-age=10, must-revalidate"
            self._add_etag(response, headers)
            
            # Check If-None-Match for 304
            if self._check_etag_match(request, headers.get("ETag")):
                return Response(status_code=304, headers=dict(headers))
            
            logger.debug(f"[Cache] Private API: {path}")
        
        # 4. List/lookup APIs - shared cache
        elif self._is_lookup_api(path):
            headers["Cache-Control"] = "public, max-age=30, s-maxage=30, stale-while-revalidate=300"
            self._add_etag(response, headers)
            
            # Check If-None-Match for 304
            if self._check_etag_match(request, headers.get("ETag")):
                return Response(status_code=304, headers=dict(headers))
            
            logger.debug(f"[Cache] Lookup API: {path}")
        
        # 5. Details endpoints - moderate cache
        elif "/details" in path or path.endswith("/") and path.count("/") >= 3:
            headers["Cache-Control"] = "private, max-age=60, must-revalidate"
            self._add_etag(response, headers)
            
            # Check If-None-Match for 304
            if self._check_etag_match(request, headers.get("ETag")):
                return Response(status_code=304, headers=dict(headers))
            
            logger.debug(f"[Cache] Details API: {path}")
        
        # 6. Default - no cache for everything else
        else:
            headers["Cache-Control"] = "private, no-cache, must-revalidate"
            self._add_etag(response, headers)
            
            # Check If-None-Match for 304
            if self._check_etag_match(request, headers.get("ETag")):
                return Response(status_code=304, headers=dict(headers))
        
        response.headers.update(headers)
        return response
    
    def _is_static_asset(self, path: str) -> bool:
        """Check if path is a static asset (JS, CSS, images, fonts)"""
        static_extensions = (
            '.js', '.css', '.map',
            '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif', '.ico',
            '.woff', '.woff2', '.ttf', '.eot', '.otf'
        )
        return (
            path.startswith('/static/') or
            path.startswith('/_next/static/') or
            any(path.endswith(ext) for ext in static_extensions)
        )
    
    def _is_public_list_api(self, path: str) -> bool:
        """Public list endpoints that can be CDN cached"""
        # Add paths that are truly public (no auth required)
        public_patterns = [
            '/health',
            '/metrics',
            '/docs',
            '/openapi.json',
        ]
        return any(path.startswith(pattern) for pattern in public_patterns)
    
    def _is_authenticated_api(self, path: str) -> bool:
        """Personal/authenticated endpoints - short-lived private cache"""
        auth_patterns = [
            '/auth/me',
            '/auth/session',
            '/dashboard/summary',
            '/dashboard/stats',
            '/billing/usage',
            '/billing/quotas',
        ]
        return any(path.startswith(pattern) for pattern in auth_patterns)
    
    def _is_lookup_api(self, path: str) -> bool:
        """List/lookup endpoints - can be cached per-user with revalidation"""
        lookup_patterns = [
            '/projects',
            '/datasets',
            '/generators',
            '/evaluations',
            '/jobs',
            '/exports',
            '/synthetic-datasets',
            '/compliance',
            '/audit-logs',
            '/llm',  # LLM endpoints can be cached briefly
        ]
        # Match /projects, /projects/, but not /projects/{id}
        for pattern in lookup_patterns:
            if path == pattern or path == f"{pattern}/" or path.startswith(f"{pattern}?"):
                return True
        return False
    
    def _add_etag(self, response: Response, headers: MutableHeaders):
        """
        Generate and add ETag header based on response body.
        
        Note: StreamingResponse and FileResponse don't have .body attribute,
        so we skip ETag generation for those (they're typically large files
        or real-time data that shouldn't be cached with ETags anyway).
        """
        # Skip ETag for streaming responses and file responses
        if isinstance(response, (StreamingResponse, FileResponse)):
            logger.debug("[Cache] Skipping ETag for streaming/file response")
            return
        
        # Check if response has body attribute (regular Response)
        if not hasattr(response, 'body') or not response.body:
            return
        
        # Generate ETag from response body hash
        body_hash = hashlib.md5(response.body).hexdigest()
        etag = f'W/"{body_hash}"'  # Weak ETag
        headers["ETag"] = etag
    
    def _check_etag_match(self, request: Request, etag: str) -> bool:
        """Check if client's If-None-Match matches current ETag"""
        if not etag:
            return False
        
        if_none_match = request.headers.get("If-None-Match")
        if not if_none_match:
            return False
        
        # Handle multiple ETags in If-None-Match
        client_etags = [tag.strip() for tag in if_none_match.split(",")]
        return etag in client_etags or "*" in client_etags


class TrailingSlashMiddleware(BaseHTTPMiddleware):
    """
    Remove trailing slashes to avoid 307 redirects.
    Reduces request count by 50% for list endpoints.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        
        # Skip root and paths that should keep trailing slash
        if path != "/" and path.endswith("/") and not self._should_keep_slash(path):
            # Rewrite path without trailing slash
            new_path = path.rstrip("/")
            request.scope["path"] = new_path
            logger.debug(f"[TrailingSlash] Rewrite: {path} -> {new_path}")
        
        return await call_next(request)
    
    def _should_keep_slash(self, path: str) -> bool:
        """Paths that should keep trailing slash"""
        # Add any paths that explicitly need trailing slash
        return False  # For now, remove all trailing slashes


class CookieOptimizationMiddleware(BaseHTTPMiddleware):
    """
    Optimize cookies for caching:
    1. Strip cookies from static assets
    2. Set proper cookie attributes (HttpOnly, Secure, SameSite)
    3. Scope cookies to minimal paths
    
    NOTE: This middleware does NOT add HttpOnly to cookies that already have
    httponly attribute set (explicitly). It only adds defaults for cookies
    that don't specify these attributes.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        path = request.url.path
        
        # Strip Set-Cookie from static assets (allows CDN caching)
        if self._is_static_asset(path):
            if "set-cookie" in response.headers:
                del response.headers["set-cookie"]
                logger.debug(f"[Cookie] Stripped from static: {path}")
        
        # Optimize Set-Cookie headers for security and caching without squashing multiple cookies
        if "set-cookie" in response.headers:
            # We must work with the raw headers because Starlette's .headers["set-cookie"]
            # often only returns the last one set.
            
            # Count incoming cookies for debugging
            incoming_cookies = [h for h in response.raw_headers if h[0].lower() == b"set-cookie"]
            logger.info(f"[CookieMiddleware] Processing {len(incoming_cookies)} Set-Cookie headers for {path}")
            for i, (name, val) in enumerate(incoming_cookies):
                logger.info(f"[CookieMiddleware] Cookie {i+1}: {val[:80] if len(val) > 80 else val}")
            
            new_raw_headers = []
            for name, value in response.raw_headers:
                if name.lower() == b"set-cookie":
                    cookie_value = value.decode("latin-1")
                    
                    # DO NOT force HttpOnly - respect the original setting
                    # Only add HttpOnly if this looks like a session/auth cookie
                    # and doesn't explicitly have httponly=false or omit it intentionally
                    # If the cookie already has "HttpOnly" in the string (case-insensitive check),
                    # leave it alone
                    if "httponly" not in cookie_value.lower():
                        # Check if this is a known auth cookie
                        if any(auth_cookie in cookie_value for auth_cookie in ["ss_jwt", "ss_refresh", "ss_access"]):
                            cookie_value += "; HttpOnly"
                    
                    if "SameSite" not in cookie_value:
                        cookie_value += "; SameSite=Lax"
                    if not request.url.hostname in ["localhost", "127.0.0.1"] and "Secure" not in cookie_value:
                        cookie_value += "; Secure"
                    if "Path" not in cookie_value:
                        cookie_value += "; Path=/"
                    new_raw_headers.append((b"set-cookie", cookie_value.encode("latin-1")))
                else:
                    new_raw_headers.append((name, value))
            response.raw_headers = new_raw_headers
        
        return response
    
    def _is_static_asset(self, path: str) -> bool:
        """Check if path is a static asset"""
        static_extensions = (
            '.js', '.css', '.map',
            '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif', '.ico',
            '.woff', '.woff2', '.ttf', '.eot', '.otf'
        )
        return (
            path.startswith('/static/') or
            path.startswith('/_next/static/') or
            any(path.endswith(ext) for ext in static_extensions)
        )
