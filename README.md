# Home Dashboard

A self-hosted wall-mounted kitchen dashboard for a Geekom Mini Air 12 (Windows 11). Displays live security camera feeds, real-time weather, traffic, bus departures, finance, world clocks, and garage door control.

## Features

- **Security Cameras** - Live feeds from UniFi Protect cameras via go2rtc, cycling one camera at a time with auto-advance and manual navigation
- **Weather** - Today and tomorrow forecast for Bibra Lake, WA (Bureau of Meteorology)
- **Traffic** - Live conditions on Canning Hwy, Leach Hwy, and near Fremantle Hospital (TomTom)
- **Transperth Buses** - Next departures for routes 114, 115, 160 from Coolbellup and Garden City (GTFS schedule data)
- **Finance** - Bitcoin price (AUD), USD/AUD exchange rate, ASX top movers (CoinGecko, Frankfurter, yfinance)
- **World Clocks** - Perth, Lisbon, Sao Paulo, Houston
- **Garage** - Door status, toggle button, and open duration estimate (via Raspberry Pi at 192.168.1.143)
- **Dark / Light mode** - Defaults to dark for wall-mount display

## How It Works

The dashboard has a two-page carousel:

1. **Camera Page** - Shows one full-screen camera feed at a time, cycling through all configured cameras every 30 seconds. Includes left/right navigation arrows, dot indicators, and a progress bar.
2. **Dashboard Page** - Shows all widgets in a 3-column grid for 30 seconds.

The pages auto-cycle. Pressing the pause button freezes both the page carousel and the camera cycling.

Camera feeds are streamed from UniFi Protect via [go2rtc](https://github.com/AlexxIT/go2rtc), which uses FFmpeg to pull RTSPS streams and re-serve them as browser-playable MSE video.

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLite3, httpx, yfinance, APScheduler
- **Frontend**: React 18, Tailwind CSS 3, Axios, Lucide React icons
- **Camera Streaming**: go2rtc + FFmpeg

## Quick Start

See [SETUP.md](SETUP.md) for full deployment instructions on the Geekom.

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend (separate terminal for dev, or build for production)
cd frontend
npm install
npm run build

# Camera streaming
# Download go2rtc from https://github.com/AlexxIT/go2rtc/releases
# Configure go2rtc.yaml with your camera RTSP URLs
.\go2rtc.exe -config go2rtc.yaml
```

## Configuration

### Backend (`backend/config.py`)

| Setting | Description |
|---------|-------------|
| `TOMTOM_API_KEY` | Free key from https://developer.tomtom.com/ |
| `GARAGE_PI_HOST` | IP address of the Raspberry Pi garage controller |
| `ASX_TICKERS` | List of ASX stock symbols to track |
| `BOM_GEOHASH` | BOM geohash for your location (default: Bibra Lake) |
| `CAMERAS` | List of camera IDs and display names (must match go2rtc stream names) |
| `CAROUSEL_CAMERA_DURATION` | Seconds on camera page before switching to dashboard |
| `CAROUSEL_DASHBOARD_DURATION` | Seconds on dashboard page before switching back |
| `CAMERA_CYCLE_DURATION` | Seconds each camera is shown before advancing to the next |
| `CACHE_*` | Cache durations in seconds for each data source |

### Camera Streaming (`go2rtc.yaml`)

Each stream uses the `ffmpeg:` source prefix to pull RTSPS streams via FFmpeg:

```yaml
streams:
  front_ne1:
    - "ffmpeg:rtsps://192.168.1.4:7441/YOUR_STREAM_KEY?enableSrtp#video=copy"

ffmpeg:
  bin: "C:\\path\\to\\ffmpeg.exe"

api:
  listen: ":1984"

webrtc:
  listen: ":8555"
```

**Important notes:**
- RTSP URLs come from UniFi Protect > Camera Settings > RTSP
- Use **medium-quality** RTSP streams (H.264) - high-quality streams use H.265 which causes green/black screens in browsers
- The `#video=copy` suffix passes video through without transcoding and strips audio (required for Chrome autoplay)
- The `ffmpeg.bin` path must point to your FFmpeg installation
- Camera `id` values in `config.py` must match the stream names in `go2rtc.yaml`

## Project Structure

```
HomeDashboard/
+-- backend/
|   +-- main.py                # FastAPI app with all endpoints + SPA serving
|   +-- config.py              # API keys, IPs, cache durations, camera config
|   +-- database.py            # SQLite3 caching layer
|   +-- requirements.txt
|   +-- gtfs_data/             # Transperth GTFS (downloaded at setup)
|   +-- services/
|       +-- weather.py         # BOM weather API
|       +-- traffic.py         # TomTom traffic API
|       +-- bus.py             # Transperth GTFS schedule parser
|       +-- finance.py         # BTC, USD/AUD, ASX
|       +-- garage.py          # Raspberry Pi proxy
|       +-- camera.py          # go2rtc camera metadata and health
+-- frontend/
|   +-- package.json
|   +-- tailwind.config.js
|   +-- src/
|       +-- App.js             # Two-page carousel (cameras + dashboard)
|       +-- components/
|           +-- CameraGrid.js  # Single-camera cycling view with navigation
|           +-- WeatherWidget.js
|           +-- TrafficWidget.js
|           +-- BusWidget.js
|           +-- WorldClocks.js
|           +-- GarageWidget.js
|           +-- FinanceWidget.js
|           +-- DarkModeToggle.js
+-- go2rtc.yaml                # Camera stream configuration
+-- SETUP.md                   # Deployment guide
```

## Licence

MIT
