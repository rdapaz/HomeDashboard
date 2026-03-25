"""Proxy to Raspberry Pi garage controller."""

import httpx
from datetime import datetime
from config import GARAGE_PI_URL


async def fetch_garage_status() -> dict:
    """Get current garage door status from the Pi."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{GARAGE_PI_URL}/api/status")
            resp.raise_for_status()
            data = resp.json()

        # Also fetch events to calculate open duration
        events = await _fetch_events()
        if events and data.get("status") == "Open":
            open_since = _calculate_open_duration(events)
            if open_since:
                data["open_since"] = open_since["timestamp"]
                data["open_minutes"] = open_since["minutes"]

        return data
    except Exception as e:
        print(f"Garage status error: {e}")
        return {"status": "Unavailable", "error": str(e)}


async def toggle_garage() -> dict:
    """Toggle the garage door via the Pi."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{GARAGE_PI_URL}/api/toggle")
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"Garage toggle error: {e}")
        return {"status": "Error", "error": str(e)}


async def fetch_garage_events() -> dict:
    """Fetch recent events from the Pi with open duration info."""
    events = await _fetch_events()
    result = {"events": events or []}

    if events:
        open_info = _calculate_open_duration(events)
        if open_info:
            result["open_since"] = open_info["timestamp"]
            result["open_minutes"] = open_info["minutes"]

    return result


async def _fetch_events() -> list | None:
    """Get last 10 events from the Pi."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{GARAGE_PI_URL}/api/events")
            resp.raise_for_status()
            data = resp.json()
        # The Pi returns events as list of dicts or list of tuples
        if isinstance(data, dict):
            return data.get("events", data.get("data", []))
        return data
    except Exception as e:
        print(f"Garage events error: {e}")
        return None


def _calculate_open_duration(events: list) -> dict | None:
    """Calculate how long the garage has been open from event history.

    Events are ordered most recent first. Walk through them to find
    when the current 'Open' state began.
    """
    if not events:
        return None

    # Normalise event format — could be dicts or tuples
    def get_status(ev):
        if isinstance(ev, dict):
            return ev.get("status", "")
        if isinstance(ev, (list, tuple)) and len(ev) >= 1:
            return ev[0]
        return ""

    def get_timestamp(ev):
        if isinstance(ev, dict):
            return ev.get("timestamp", "")
        if isinstance(ev, (list, tuple)) and len(ev) >= 2:
            return ev[1]
        return ""

    # Check if the most recent status is "Open"
    latest_status = get_status(events[0])
    if latest_status != "Open":
        return None

    # Find when it was last "Closed" — the Open event right after is when it opened
    open_timestamp = get_timestamp(events[0])

    for ev in events[1:]:
        status = get_status(ev)
        if status == "Closed":
            break
        open_timestamp = get_timestamp(ev)

    if not open_timestamp:
        return None

    # Calculate minutes open
    try:
        # Try common timestamp formats
        for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S.%f"]:
            try:
                open_dt = datetime.strptime(open_timestamp, fmt)
                minutes = (datetime.now() - open_dt).total_seconds() / 60
                return {
                    "timestamp": open_timestamp,
                    "minutes": round(minutes),
                }
            except ValueError:
                continue
    except Exception:
        pass

    return {"timestamp": open_timestamp, "minutes": 0}
