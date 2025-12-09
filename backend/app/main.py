import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.routers import auth, users, overview, savings, loans, targets
from app.core.config import settings
from app.core.logging_config import app_logger, setup_logging
from app.middlewares.rate_limit_middleware import RateLimitMiddleware

# Import base to ensure all models are registered
from app.db.base import Base  # noqa: F401
# Models are auto-imported via base.py

# Setup logging
setup_logging()

app = FastAPI(
    title="BOTAXXX API",
    description="Backend API for BOTAXXX Tabungan System",
    version="1.0.0"
)

# CORS for dashboard
cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
if settings.RATE_LIMIT_ENABLED:
    app.add_middleware(RateLimitMiddleware)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        app_logger.info(
            f"Request: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "client": request.client.host if request.client else "unknown"
            }
        )

        try:
            response = await call_next(request)
            process_time = time.time() - start_time

            # Log response
            app_logger.info(
                f"Response: {request.method} {request.url.path} - {response.status_code}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round(process_time * 1000, 2)
                }
            )

            response.headers["X-Process-Time"] = str(process_time)
            return response
        except Exception as e:
            process_time = time.time() - start_time
            app_logger.error(
                f"Error: {request.method} {request.url.path} - {str(e)}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round(process_time * 1000, 2)
                },
                exc_info=True
            )
            raise


app.add_middleware(LoggingMiddleware)

# API ROUTES
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(overview.router, prefix="/overview", tags=["Overview"])
app.include_router(savings.router, prefix="/savings", tags=["Savings"])
app.include_router(loans.router, prefix="/loans", tags=["Loans"])
app.include_router(targets.router, prefix="/targets", tags=["Targets"])


@app.get("/")
def root():
    return {"message": "BOTAXXX API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    """Health check endpoint with database connectivity test"""
    from app.db.session import SessionLocal
    from sqlalchemy import text
    
    db_status = "unknown"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        app_logger.error(f"Database health check failed: {str(e)}")
    
    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0"
    }
