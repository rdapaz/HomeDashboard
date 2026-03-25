"""Transperth bus departure service using GTFS static schedule data."""

import csv
import os
from datetime import datetime, timedelta
from database import get_cached, set_cached
from config import CACHE_TRAFFIC  # reuse 5-min cache

CACHE_KEY = "bus"
GTFS_DIR = os.path.join(os.path.dirname(__file__), "..", "gtfs_data")

# Stops to monitor
MONITORED_STOPS = [
    {
        "stop_id": "20324",
        "label": "Coolbellup (Waverley Rd)",
        "routes": ["115"],
    },
    {
        "stop_id": "10723",
        "label": "Garden City Stand A1",
        "routes": ["114", "115", "160"],
    },
    {
        "stop_id": "11133",
        "label": "Garden City Stand D1",
        "routes": ["115"],
    },
    {
        "stop_id": "11140",
        "label": "Garden City Stand C2",
        "routes": ["114"],
    },
    {
        "stop_id": "11139",
        "label": "Garden City Stand C3",
        "routes": ["160"],
    },
]

# Route IDs mapping
ROUTE_ID_MAP = {
    "SCT-FRE-3612": "114",
    "SCT-FRE-3624": "115",
    "SCT-FRE-2802": "160",
}

# Loaded GTFS data (cached in memory)
_gtfs_loaded = False
_trip_routes = {}       # trip_id -> route_short_name
_trip_services = {}     # trip_id -> service_id
_stop_departures = {}   # stop_id -> [(departure_time_str, route_name, trip_id)]
_calendar = {}          # service_id -> set of weekday indices (0=Mon)
_calendar_dates = {}    # (service_id, date_str) -> "added" or "removed"


def _clean_row(row):
    return {k.strip(): v.strip() if isinstance(v, str) else v for k, v in row.items()}


def _load_gtfs():
    """Load GTFS data into memory (once)."""
    global _gtfs_loaded, _trip_routes, _trip_services, _stop_departures, _calendar, _calendar_dates

    if _gtfs_loaded:
        return

    target_route_ids = set(ROUTE_ID_MAP.keys())
    monitored_stop_ids = {s["stop_id"] for s in MONITORED_STOPS}

    # Load trips
    trips_path = os.path.join(GTFS_DIR, "trips.txt")
    with open(trips_path, "r") as f:
        for row in csv.DictReader(f):
            r = _clean_row(row)
            if r["route_id"] in target_route_ids:
                _trip_routes[r["trip_id"]] = ROUTE_ID_MAP[r["route_id"]]
                _trip_services[r["trip_id"]] = r["service_id"]

    # Load stop_times for monitored stops and target trips
    stop_times_path = os.path.join(GTFS_DIR, "stop_times.txt")
    _stop_departures = {s["stop_id"]: [] for s in MONITORED_STOPS}

    with open(stop_times_path, "r") as f:
        for row in csv.DictReader(f):
            r = _clean_row(row)
            tid = r["trip_id"]
            sid = r["stop_id"]
            if tid in _trip_routes and sid in monitored_stop_ids:
                _stop_departures[sid].append((
                    r["departure_time"],
                    _trip_routes[tid],
                    tid,
                ))

    # Sort departures by time
    for sid in _stop_departures:
        _stop_departures[sid].sort(key=lambda x: x[0])

    # Load calendar
    calendar_path = os.path.join(GTFS_DIR, "calendar.txt")
    if os.path.exists(calendar_path):
        with open(calendar_path, "r") as f:
            for row in csv.DictReader(f):
                r = _clean_row(row)
                days = set()
                for i, day in enumerate(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]):
                    if r.get(day) == "1":
                        days.add(i)
                _calendar[r["service_id"]] = {
                    "days": days,
                    "start": r.get("start_date", ""),
                    "end": r.get("end_date", ""),
                }

    # Load calendar_dates (exceptions)
    cal_dates_path = os.path.join(GTFS_DIR, "calendar_dates.txt")
    if os.path.exists(cal_dates_path):
        with open(cal_dates_path, "r") as f:
            for row in csv.DictReader(f):
                r = _clean_row(row)
                exc_type = "added" if r.get("exception_type") == "1" else "removed"
                _calendar_dates[(r["service_id"], r["date"])] = exc_type

    _gtfs_loaded = True
    print(f"GTFS loaded: {len(_trip_routes)} trips, {sum(len(v) for v in _stop_departures.values())} stop_times")


def _is_service_active(service_id: str, date: datetime) -> bool:
    """Check if a service runs on a given date."""
    date_str = date.strftime("%Y%m%d")
    weekday = date.weekday()

    # Check exceptions first
    key = (service_id, date_str)
    if key in _calendar_dates:
        return _calendar_dates[key] == "added"

    # Check regular calendar
    cal = _calendar.get(service_id)
    if cal is None:
        return False

    if cal["start"] and date_str < cal["start"]:
        return False
    if cal["end"] and date_str > cal["end"]:
        return False

    return weekday in cal["days"]


def fetch_bus_departures() -> dict:
    """Get next departures for monitored stops."""
    cached = get_cached(CACHE_KEY, 120)  # 2-min cache
    if cached:
        return cached

    _load_gtfs()

    now = datetime.now()
    current_time = now.strftime("%H:%M:%S")

    results = []
    for stop_info in MONITORED_STOPS:
        sid = stop_info["stop_id"]
        wanted_routes = set(stop_info["routes"])
        departures = _stop_departures.get(sid, [])

        next_buses = []
        for dep_time, route_name, trip_id in departures:
            if route_name not in wanted_routes:
                continue
            if dep_time < current_time:
                continue

            # Check if service is active today
            service_id = _trip_services.get(trip_id)
            if service_id and not _is_service_active(service_id, now):
                continue

            # Calculate minutes until departure
            dep_parts = dep_time.split(":")
            dep_h, dep_m = int(dep_parts[0]), int(dep_parts[1])
            now_minutes = now.hour * 60 + now.minute
            dep_minutes = dep_h * 60 + dep_m
            mins_until = dep_minutes - now_minutes

            if mins_until < 0:
                continue

            next_buses.append({
                "route": route_name,
                "departure": dep_time[:5],  # HH:MM
                "minutes": mins_until,
            })

            if len(next_buses) >= 4:
                break

        results.append({
            "stop": stop_info["label"],
            "stop_id": sid,
            "departures": next_buses,
        })

    data = {"stops": results}
    set_cached(CACHE_KEY, data)
    return data
