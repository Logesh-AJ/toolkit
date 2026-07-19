"""
ToolForge Backend — FastAPI Application Entry Point
All 25 tools across 6 routers (pdf, image, video, audio, qr, archive) are live.
"""

import os
import asyncio
import shutil
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from routers import pdf, image, video, audio, qr, archive

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
    """
    Delete files/directories older than FILE_EXPIRY_MINUTES from uploads
    and outputs. Handles both flat files and the extraction subdirectories
    created by the archive /unzip endpoint.
    """
    while True:
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=FILE_EXPIRY_MINUTES)

        for directory in [UPLOAD_DIR, OUTPUT_DIR]:
            for entry in directory.iterdir():
                try:
                    modified = datetime.utcfromtimestamp(entry.stat().st_mtime)
                    if modified < cutoff:
                        if entry.is_file():
                            entry.unlink()
                        elif entry.is_dir():
                            shutil.rmtree(entry, ignore_errors=True)
                except Exception:
                    pass

        await asyncio.sleep(300)


@asynccontextmanager
async def lifespan(app: FastAPI):
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
        "http://172.21.48.1:5173",
        "https://toolkit-sage-two.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static file serving for output files (downloads)
# ---------------------------------------------------------------------------

app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")

# ---------------------------------------------------------------------------
# Routers — all 25 tools
# ---------------------------------------------------------------------------

app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF Tools"])
app.include_router(image.router, prefix="/api/image", tags=["Image Tools"])
app.include_router(video.router, prefix="/api/video", tags=["Video Tools"])
app.include_router(audio.router, prefix="/api/audio", tags=["Audio Tools"])
app.include_router(qr.router, prefix="/api/qr", tags=["QR Code"])
app.include_router(archive.router, prefix="/api/archive", tags=["Archive Tools"])

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
# Consistent Error Handlers
# ---------------------------------------------------------------------------

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": "Validation error", "detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "detail": str(exc)},
    )