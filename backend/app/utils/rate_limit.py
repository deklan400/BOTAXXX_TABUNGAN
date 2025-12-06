from functools import wraps
from time import time
from typing import Dict, Tuple
from collections import defaultdict
from fastapi import Request, HTTPException, status

# In-memory rate limit storage
# Format: {identifier: [(timestamp, count), ...]}
_rate_limit_store: Dict[str, list] = defaultdict(list)


def get_client_identifier(request: Request) -> str:
    """Get client identifier for rate limiting (IP address)"""
    if request.client:
        return request.client.host
    return "unknown"


def rate_limit(max_requests: int = 60, window_seconds: int = 60):
    """
    Rate limit decorator for FastAPI endpoints
    
    Args:
        max_requests: Maximum number of requests allowed
        window_seconds: Time window in seconds
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                for key, value in kwargs.items():
                    if isinstance(value, Request):
                        request = value
                        break

            if not request:
                return await func(*args, **kwargs)

            identifier = get_client_identifier(request)
            now = time()

            # Clean old entries
            _rate_limit_store[identifier] = [
                (ts, count) for ts, count in _rate_limit_store[identifier]
                if now - ts < window_seconds
            ]

            # Count requests in window
            total_requests = sum(count for _, count in _rate_limit_store[identifier])

            if total_requests >= max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded: {max_requests} requests per {window_seconds} seconds"
                )

            # Add current request
            _rate_limit_store[identifier].append((now, 1))

            return await func(*args, **kwargs)
        return wrapper
    return decorator

