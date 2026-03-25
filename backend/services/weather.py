"""Bureau of Meteorology weather service for Bibra Lake, WA."""

import httpx
from database import get_cached, set_cached
from config import BOM_GEOHASH, CACHE_WEATHER

CACHE_KEY = "weather"
BOM_BASE = "https://api.weather.bom.gov.au/v1"


async def fetch_weather() -> dict:
    """Fetch weather forecast from BOM API."""
    cached = get_cached(CACHE_KEY, CACHE_WEATHER)
    if cached:
        return cached

    data = await _fetch_from_bom()
    if data:
        set_cached(CACHE_KEY, data)
    return data or {"error": "Failed to fetch weather data"}


async def _fetch_from_bom() -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Fetch daily forecast
            headers = {
                "User-Agent": "HomeDashboard/1.0",
                "Accept": "application/json",
            }
            resp = await client.get(
                f"{BOM_BASE}/locations/{BOM_GEOHASH}/forecasts/daily",
                headers=headers,
            )
            resp.raise_for_status()
            forecast_data = resp.json()

            # Fetch current observations (requires exactly 6-char geohash)
            obs_geohash = BOM_GEOHASH[:6]
            obs_resp = await client.get(
                f"{BOM_BASE}/locations/{obs_geohash}/observations",
                headers=headers,
            )
            obs_resp.raise_for_status()
            obs_data = obs_resp.json()

        forecasts = forecast_data.get("data", [])
        observations = obs_data.get("data", {})

        today = forecasts[0] if len(forecasts) > 0 else {}
        tomorrow = forecasts[1] if len(forecasts) > 1 else {}

        return {
            "current": {
                "temp": observations.get("temp"),
                "humidity": observations.get("humidity"),
                "wind_speed_kmh": observations.get("wind", {}).get("speed_kilometre"),
                "wind_direction": observations.get("wind", {}).get("direction"),
            },
            "today": _format_day(today),
            "tomorrow": _format_day(tomorrow),
        }
    except Exception as e:
        print(f"BOM weather error: {e}")
        return None


def _format_day(day: dict) -> dict:
    return {
        "date": day.get("date", ""),
        "temp_min": day.get("temp_min"),
        "temp_max": day.get("temp_max"),
        "short_text": day.get("short_text", ""),
        "extended_text": day.get("extended_text", ""),
        "icon_descriptor": day.get("icon_descriptor", ""),
        "rain_chance": day.get("rain", {}).get("chance"),
        "rain_amount_min": day.get("rain", {}).get("amount", {}).get("min"),
        "rain_amount_max": day.get("rain", {}).get("amount", {}).get("max"),
        "uv_category": day.get("uv", {}).get("category"),
        "uv_max_index": day.get("uv", {}).get("max_index"),
    }
