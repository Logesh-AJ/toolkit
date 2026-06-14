"""
ToolForge Backend — FastAPI Application Entry Point
"""

import os
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Directory Setup
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Lifespan: background cleanup task
# ---------------------------------------------------------------------------

FILE_EXPIRY_MINUTES = int(os.getenv("FILE_EXPIRY_MINUTES", "30"))


async def cleanup_old_files():
    """Delete files older than FILE_EXPIRY_MINUTES from uploads and outputs."""
    while True:
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=FILE_EXPIRY_MINUTES)

        for directory in [UPLOAD_DIR, OUTPUT_DIR]:
            for file_path in directory.iterdir():
                if file_path.is_file():
                    modified = datetime.utcfromtimestamp(file_path.stat().st_mtime)
                    if modified < cutoff:
                        try:
                            file_path.unlink()
                        except Exception:
                            pass  # Ignore errors (file may already be deleted)

        await asyncio.sleep(300)  # Run every 5 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    task = asyncio.create_task(cleanup_old_files())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


# ---------------------------------------------------------------------------
# App Initialization
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ToolForge API",
    description="Backend API for ToolForge — a premium online file utility suite.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static file serving for output files
# ---------------------------------------------------------------------------

app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")

# ---------------------------------------------------------------------------
# Routers (will be added in Phase 3+)
# ---------------------------------------------------------------------------

# from routers import pdf, image, video, audio, qr, archive
# app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF Tools"])
# app.include_router(image.router, prefix="/api/image", tags=["Image Tools"])
# app.include_router(video.router, prefix="/api/video", tags=["Video Tools"])
# app.include_router(audio.router, prefix="/api/audio", tags=["Audio Tools"])
# app.include_router(qr.router, prefix="/api/qr", tags=["QR Code"])
# app.include_router(archive.router, prefix="/api/archive", tags=["Archive Tools"])

# ---------------------------------------------------------------------------
# Health & Root Endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "ToolForge API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "upload_dir": str(UPLOAD_DIR),
        "output_dir": str(OUTPUT_DIR),
        "file_expiry_minutes": FILE_EXPIRY_MINUTES,
    }


# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
        },
    )