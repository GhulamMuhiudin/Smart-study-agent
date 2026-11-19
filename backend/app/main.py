"""
Smart Study Agent — FastAPI application entry point.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Smart Study Agent backend...")
    from app.database.connection import init_db, SessionLocal
    from app.services.scheduler_service import start_scheduler

    init_db()
    start_scheduler(db_factory=SessionLocal)
    logger.info("Database initialised and scheduler started.")

    yield  # Application runs here

    # Shutdown
    from app.services.scheduler_service import stop_scheduler
    stop_scheduler()
    logger.info("Shutdown complete.")


# ---------------------------------------------------------------------------
# App & Rate Limiter
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title="Smart Study Agent API",
    description="AI-powered study assistant backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
cors_origins = [origin.strip() for origin in cors_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.agent import router as agent_router
from app.api.dashboard import router as dashboard_router
from app.api.study_plans import router as study_plans_router
from app.api.tasks import router as tasks_router
from app.api.quizzes import router as quizzes_router
from app.api.activity import router as activity_router
from app.api.settings import router as settings_router

app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(agent_router, prefix="/api", tags=["Agent"])
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(study_plans_router, prefix="/api", tags=["Study Plans"])
app.include_router(tasks_router, prefix="/api", tags=["Tasks"])
app.include_router(quizzes_router, prefix="/api", tags=["Quizzes"])
app.include_router(activity_router, prefix="/api", tags=["Activity"])
app.include_router(settings_router, prefix="/api", tags=["Settings"])
