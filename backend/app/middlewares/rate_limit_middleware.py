from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.rate_limit import get_client_identifier, _rate_limit_store
from time import time
from app.core.logging_config import app_logger


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for global rate limiting"""

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for certain paths
        if request.url.path.startswith("/docs") or request.url.path.startswith("/openapi.json"):
            return await call_next(request)

        identifier = get_client_identifier(request)
        now = time()
        window_seconds = 60
        max_requests = 100  # Global limit per minute

        # Clean old entries
        _rate_limit_store[identifier] = [
            (ts, count) for ts, count in _rate_limit_store[identifier]
            if now - ts < window_seconds
        ]

        # Count requests in window
        total_requests = sum(count for _, count in _rate_limit_store[identifier])

        if total_requests >= max_requests:
            app_logger.warning(f"Rate limit exceeded for {identifier}")
            return Response(
                content='{"detail": "Rate limit exceeded"}',
                status_code=429,
                media_type="application/json"
            )

        # Add current request
        _rate_limit_store[identifier].append((now, 1))

        response = await call_next(request)
        return response

