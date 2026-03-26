"""Dashboard configuration."""

# Garage Controller (Raspberry Pi)
GARAGE_PI_HOST = "192.168.1.143"
GARAGE_PI_PORT = 80
GARAGE_PI_URL = f"http://{GARAGE_PI_HOST}:{GARAGE_PI_PORT}"

# TomTom Traffic API
# Get your free key at https://developer.tomtom.com/
TOMTOM_API_KEY = "JWRqWy43nnkwQba0ucyvZpDlKM6PLzX8"

# BOM Weather - Bibra Lake, WA 6163
# Geohash for Bibra Lake area (Perth metro)
BOM_GEOHASH = "qd637s8"

# Traffic monitoring points (lat, lon, label)
TRAFFIC_POINTS = [
    (-32.0206, 115.8400, "Canning Hwy (near Riseley St)"),
    (-32.0580, 115.8170, "Leach Hwy (near Stock Rd)"),
    (-32.0290, 115.7640, "Fremantle Hospital area"),
    (-32.0440, 115.7570, "Hampton Rd (near South St)"),
    (-32.0710, 115.8230, "North Lake Rd (near Farrington Rd)"),
    (-32.0580, 115.7820, "Stock Rd (near Spearwood Ave)"),
]

# City of Perth Parking
PARKING_URL = "https://www.cityofperthparking.com.au"

# CoinGecko
COINGECKO_URL = "https://api.coingecko.com/api/v3"

# Frankfurter Exchange Rates
FRANKFURTER_URL = "https://api.frankfurter.app/latest"

# ASX top movers - tickers to track for top performers
ASX_TICKERS = [
    "BHP.AX", "CBA.AX", "CSL.AX", "NAB.AX", "WBC.AX",
    "ANZ.AX", "FMG.AX", "WDS.AX", "MQG.AX", "WES.AX",
    "TLS.AX", "RIO.AX", "ALL.AX", "COL.AX", "WOW.AX",
    "STO.AX", "JHX.AX", "REA.AX", "XRO.AX", "TCL.AX",
]

# Cache durations (seconds)
CACHE_WEATHER = 1800       # 30 minutes
CACHE_TRAFFIC = 300        # 5 minutes
CACHE_PARKING = 300        # 5 minutes
CACHE_BTC = 300            # 5 minutes
CACHE_FX = 3600            # 60 minutes
CACHE_ASX = 900            # 15 minutes

# Database
DATABASE_PATH = "dashboard.db"

# go2rtc proxy for UniFi Protect cameras
GO2RTC_HOST = "localhost"
GO2RTC_PORT = 1984
GO2RTC_URL = f"http://{GO2RTC_HOST}:{GO2RTC_PORT}"

# Camera definitions: id must match go2rtc stream name, name is display label
CAMERAS = [
    {"id": "front_ne1", "name": "Front NE1 Facing"},
    {"id": "front_ne2", "name": "Front NE2 Facing"},
    {"id": "front_nw", "name": "Front NW Facing"},
    {"id": "doorbell", "name": "Doorbell"},
    {"id": "entry_corridor", "name": "Entry Corridor"},
    {"id": "rear_sw", "name": "Rear SW Facing"},
    {"id": "kitchen_dining", "name": "Kitchen / Dining"},
    {"id": "service_corridor", "name": "Service Corridor"},
]

# CHANGEME: Carousel timing (seconds)
CAROUSEL_CAMERA_DURATION = 240   # time on cameras page before switching to dashboard
CAROUSEL_DASHBOARD_DURATION = 30  # time on dashboard page before switching back to cameras

# CHANGEME: seconds each individual camera is shown before cycling to the next
CAMERA_CYCLE_DURATION = 30
