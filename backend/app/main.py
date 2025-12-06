from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, users, overview, savings, loans, targets
from app.db.session import engine
from app.db.base import Base

# Create all database tables (only for first setup, later use Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BOTAXXX API",
    description="Backend API for BOTAXXX Financial Suite",
    version="1.0.0"
)

# CORS settings for dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # nanti bisa spesifik: dashboard domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(overview.router, prefix="/overview", tags=["Overview"])
app.include_router(savings.router, prefix="/savings", tags=["Savings"])
app.include_router(loans.router, prefix="/loans", tags=["Loans"])
app.include_router(targets.router, prefix="/targets", tags=["Targets"])


@app.get("/")
def root():
    return {"message": "BOTAXXX API Running"}

