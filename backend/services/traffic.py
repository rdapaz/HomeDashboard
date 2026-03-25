"""TomTom Traffic Flow service for Perth roads."""

import httpx
from database import get_cached, set_cached
from config import TOMTOM_API_KEY, TRAFFIC_POINTS, CACHE_TRAFFIC

CACHE_KEY = "traffic"
TOMTOM_FLOW_URL = "https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json"


async def fetch_traffic() -> dict:
    """Fetch traffic flow data for monitored road segments."""
    cached = get_cached(CACHE_KEY, CACHE_TRAFFIC)
    if cached:
        return cached

    if not TOMTOM_API_KEY:
        return {"error": "TomTom API key not configured", "roads": []}

    data = await _fetch_from_tomtom()
    if data:
        set_cached(CACHE_KEY, data)
    return data or {"error": "Failed to fetch traffic data", "roads": []}


async def _fetch_from_tomtom() -> dict | None:
    try:
        roads = []
        async with httpx.AsyncClient(timeout=15.0) as client:
            for lat, lon, label in TRAFFIC_POINTS:
                resp = await client.get(
                    TOMTOM_FLOW_URL,
                    params={
                        "key": TOMTOM_API_KEY,
                        "point": f"{lat},{lon}",
                        "unit": "KMPH",
                        "thickness": 1,
                    },
                )
                resp.raise_for_status()
                result = resp.json()

                flow = result.get("flowSegmentData", {})
                current_speed = flow.get("currentSpeed", 0)
                free_flow_speed = flow.get("freeFlowSpeed", 0)
                current_travel_time = flow.get("currentTravelTime", 0)
                free_flow_travel_time = flow.get("freeFlowTravelTime", 0)

                # Calculate congestion level
                if free_flow_speed > 0:
                    ratio = current_speed / free_flow_speed
                    if ratio >= 0.8:
                        congestion = "free"
                    elif ratio >= 0.5:
                        congestion = "moderate"
                    else:
                        congestion = "heavy"
                else:
                    congestion = "unknown"

                roads.append({
                    "label": label,
                    "current_speed_kmh": round(current_speed),
                    "free_flow_speed_kmh": round(free_flow_speed),
                    "current_travel_time": current_travel_time,
                    "free_flow_travel_time": free_flow_travel_time,
                    "congestion": congestion,
                })

        return {"roads": roads}
    except Exception as e:
        print(f"TomTom traffic error: {e}")
        return None
