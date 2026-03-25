# Home Dashboard

A self-hosted wall-mounted kitchen dashboard for a Geekom Mini Air 12 (Windows 11). Displays real-time weather, traffic, bus departures, finance, world clocks, and garage door control.

## Features

- **Weather** - Today and tomorrow forecast for Bibra Lake, WA (Bureau of Meteorology)
- **Traffic** - Live conditions on Canning Hwy, Leach Hwy, and near Fremantle Hospital (TomTom)
- **Transperth Buses** - Next departures for routes 114, 115, 160 from Coolbellup and Garden City (GTFS schedule data)
- **Finance** - Bitcoin price (AUD), USD/AUD exchange rate, ASX top movers (CoinGecko, Frankfurter, yfinance)
- **World Clocks** - Perth, Lisbon, Sao Paulo, Houston
- **Garage** - Door status, toggle button, and open duration estimate (via Raspberry Pi at 192.168.1.143)
- **Dark / Light mode** - Defaults to dark for wall-mount display

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLite3, httpx, yfinance, APScheduler
- **Frontend**: React 18, Tailwind CSS 3, Axios, Lucide React icons

## Quick Start

See [SETUP.md](SETUP.md) for full deployment instructions on the Geekom.

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm start
```

## Configuration

Edit `backend/config.py` to update:

| Setting | Description |
|---------|-------------|
| `TOMTOM_API_KEY` | Free key from https://developer.tomtom.com/ |
| `GARAGE_PI_HOST` | IP address of the Raspberry Pi garage controller |
| `ASX_TICKERS` | List of ASX stock symbols to track |
| `BOM_GEOHASH` | BOM geohash for your location (default: Bibra Lake) |
| `CACHE_*` | Cache durations in seconds for each data source |

## Project Structure

```
HomeDashboard/
+-- backend/
|   +-- main.py                # FastAPI app with all endpoints
|   +-- config.py              # API keys, IPs, cache durations
|   +-- database.py            # SQLite3 caching layer
|   +-- requirements.txt
|   +-- gtfs_data/             # Transperth GTFS (downloaded at setup)
|   +-- services/
|       +-- weather.py         # BOM weather API
|       +-- traffic.py         # TomTom traffic API
|       +-- bus.py             # Transperth GTFS schedule parser
|       +-- finance.py         # BTC, USD/AUD, ASX
|       +-- garage.py          # Raspberry Pi proxy
+-- frontend/
|   +-- package.json
|   +-- tailwind.config.js
|   +-- src/
|       +-- App.js             # Dashboard grid layout + dark mode
|       +-- components/
|           +-- WeatherWidget.js
|           +-- TrafficWidget.js
|           +-- BusWidget.js
|           +-- WorldClocks.js
|           +-- GarageWidget.js
|           +-- FinanceWidget.js
|           +-- DarkModeToggle.js
+-- SETUP.md                   # Deployment guide
```

## Licence

MIT
