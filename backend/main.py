"""Home Dashboard FastAPI application."""

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

BUILD_DIR = Path(__file__).resolve().parent.parent / "frontend" / "build"
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database import init_db
from services.weather import fetch_weather
from services.traffic import fetch_traffic
from services.parking import fetch_parking
from services.finance import fetch_finance, fetch_btc, fetch_fx, fetch_asx
from services.garage import fetch_garage_status, toggle_garage, fetch_garage_events
from services.bus import fetch_bus_departures
from services.camera import fetch_cameras


scheduler = AsyncIOScheduler()


async def refresh_weather():
    await fetch_weather()


async def refresh_traffic():
    await fetch_traffic()


async def refresh_parking():
    await fetch_parking()


async def refresh_finance():
    await fetch_btc()
    await fetch_fx()
    fetch_asx()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    init_db()

    # Pre-fetch lightweight data on startup (ASX fetched lazily to avoid blocking)
    await asyncio.gather(
        refresh_weather(),
        refresh_traffic(),
        refresh_parking(),
        return_exceptions=True,
    )

    # Schedule background refreshes
    scheduler.add_job(refresh_weather, "interval", minutes=30, id="weather")
    scheduler.add_job(refresh_traffic, "interval", minutes=5, id="traffic")
    scheduler.add_job(refresh_parking, "interval", minutes=5, id="parking")
    scheduler.add_job(refresh_finance, "interval", minutes=5, id="finance")
    scheduler.start()

    yield

    scheduler.shutdown()


app = FastAPI(title="Home Dashboard", lifespan=lifespan)

# CORS for local dev (React dev server on :3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API Endpoints ---

@app.get("/api/weather")
async def api_weather():
    return await fetch_weather()


@app.get("/api/traffic")
async def api_traffic():
    return await fetch_traffic()


@app.get("/api/parking")
async def api_parking():
    return await fetch_parking()


@app.get("/api/finance")
async def api_finance():
    return await fetch_finance()


@app.get("/api/garage/status")
async def api_garage_status():
    return await fetch_garage_status()


@app.post("/api/garage/toggle")
async def api_garage_toggle():
    return await toggle_garage()


@app.get("/api/garage/events")
async def api_garage_events():
    return await fetch_garage_events()


@app.get("/api/bus")
async def api_bus():
    return fetch_bus_departures()


@app.get("/api/cameras")
async def api_cameras():
    return await fetch_cameras()


# Serve React static assets (JS, CSS, media)
app.mount("/static", StaticFiles(directory=str(BUILD_DIR / "static")), name="static-assets")


# Catch-all: serve React index.html for any non-API route (SPA support)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Serve actual files if they exist in the build directory
    file_path = BUILD_DIR / full_path
    if full_path and file_path.is_file():
        return FileResponse(file_path)
    # Otherwise serve index.html for SPA routing
    return FileResponse(BUILD_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
