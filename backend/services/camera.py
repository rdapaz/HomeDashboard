"""Camera feed metadata and health checks via go2rtc."""

import httpx
from config import GO2RTC_URL, CAMERAS, CAROUSEL_CAMERA_DURATION, CAROUSEL_DASHBOARD_DURATION, CAMERA_CYCLE_DURATION


async def fetch_cameras() -> dict:
    """Return camera list with stream URLs and go2rtc health status."""
    go2rtc_online = False
    active_streams = {}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{GO2RTC_URL}/api/streams")
            resp.raise_for_status()
            active_streams = resp.json()
            go2rtc_online = True
    except Exception:
        pass

    cameras = []
    for cam in CAMERAS:
        stream_id = cam["id"]
        cameras.append({
            "id": stream_id,
            "name": cam["name"],
            "stream_url": f"{GO2RTC_URL}/stream.html?src={stream_id}&mode=mse",
            "active": stream_id in active_streams,
        })

    return {
        "cameras": cameras,
        "go2rtc_online": go2rtc_online,
        "carousel": {
            "camera_duration": CAROUSEL_CAMERA_DURATION,
            "dashboard_duration": CAROUSEL_DASHBOARD_DURATION,
        },
        "camera_cycle_duration": CAMERA_CYCLE_DURATION,
    }
