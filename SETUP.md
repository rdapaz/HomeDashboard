# Deployment Guide - Home Dashboard on Geekom Mini Air 12

This guide covers deploying the Home Dashboard on a Geekom Mini Air 12 running Windows 11, intended as a wall-mounted kitchen display.

## Prerequisites

Install the following on the Geekom:

### 1. Python 3.11+

Download from https://www.python.org/downloads/ and install. Ensure "Add Python to PATH" is ticked during installation.

```powershell
python --version
```

### 2. Node.js 18+

Download the LTS version from https://nodejs.org/ and install.

```powershell
node --version
npm --version
```

### 3. Git

Download from https://git-scm.com/download/win and install.

## Installation

### 1. Clone the Repository

```powershell
cd C:\Users\%USERNAME%
git clone https://github.com/rdapaz/HomeDashboard.git
cd HomeDashboard
```

### 2. Backend Setup

```powershell
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download Transperth GTFS data
mkdir gtfs_data
curl -L -o gtfs_data\google_transit.zip "https://www.transperth.wa.gov.au/TimetablePDFs/GoogleTransit/Production/google_transit.zip"

# Extract required GTFS files
cd gtfs_data
tar -xf google_transit.zip stops.txt routes.txt stop_times.txt trips.txt calendar.txt calendar_dates.txt
cd ..
```

### 3. Configure

Edit `backend/config.py`:

- **TomTom API key**: Sign up free at https://developer.tomtom.com/ and paste your key into `TOMTOM_API_KEY`
- **Garage Pi IP**: Update `GARAGE_PI_HOST` if different from `192.168.1.143`
- Everything else works out of the box

### 4. Frontend Setup

```powershell
cd ..\frontend
npm install
```

### 5. Build Frontend for Production

```powershell
npm run build
```

### 6. Enable Static File Serving

In `backend/main.py`, uncomment the last `app.mount` line to serve the React build:

```python
app.mount("/", StaticFiles(directory="../frontend/build", html=True), name="static")
```

## Running

### Option A: Development Mode (two terminals)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\%USERNAME%\HomeDashboard\backend
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\%USERNAME%\HomeDashboard\frontend
npm start
```

Access at http://localhost:3000

### Option B: Production Mode (single process)

After building the frontend and enabling static file serving:

```powershell
cd C:\Users\%USERNAME%\HomeDashboard\backend
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

Access at http://localhost:8000

## Auto-Start on Boot

### Using Task Scheduler

1. Open **Task Scheduler** (search in Start menu)
2. Click **Create Task** (not Basic Task)
3. **General** tab:
   - Name: `HomeDashboard`
   - Check "Run whether user is logged on or not"
   - Check "Run with highest privileges"
4. **Triggers** tab:
   - New trigger: "At startup"
   - Delay task for: 30 seconds
5. **Actions** tab:
   - New action: Start a program
   - Program: `C:\Users\%USERNAME%\HomeDashboard\backend\venv\Scripts\uvicorn.exe`
   - Arguments: `main:app --host 0.0.0.0 --port 8000`
   - Start in: `C:\Users\%USERNAME%\HomeDashboard\backend`
6. **Settings** tab:
   - Check "If the task fails, restart every: 1 minute"
   - Attempt to restart up to: 3 times

### Auto-Launch Browser in Kiosk Mode

Create a shortcut in the Startup folder (`shell:startup`):

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --start-fullscreen http://localhost:8000
```

Or for Edge:
```
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk http://localhost:8000 --edge-kiosk-type=fullscreen
```

## Updating GTFS Data

The Transperth GTFS feed updates periodically. To refresh:

```powershell
cd C:\Users\%USERNAME%\HomeDashboard\backend\gtfs_data
curl -L -o google_transit.zip "https://www.transperth.wa.gov.au/TimetablePDFs/GoogleTransit/Production/google_transit.zip"
tar -xf google_transit.zip stops.txt routes.txt stop_times.txt trips.txt calendar.txt calendar_dates.txt
```

Then restart the backend service.

## Troubleshooting

### Backend won't start

```powershell
# Check Python is on PATH
python --version

# Check venv is activated (should see (venv) in prompt)
venv\Scripts\activate

# Check all packages installed
pip list | findstr fastapi
```

### Bus data shows no departures

- GTFS data may be outdated; re-download (see above)
- Check the current time matches AWST (UTC+8)
- Stop IDs may have changed; check `backend/services/bus.py`

### Weather shows error

- BOM geohash may have changed
- Test manually: `curl https://api.weather.bom.gov.au/v1/locations/qd637s/observations`

### ASX data empty

- yfinance may be rate-limited; works best during ASX trading hours (10am-4pm AWST)
- Data caches for 15 minutes once fetched

### Garage shows Unavailable

- Check the Raspberry Pi is on the network at the configured IP
- Test: `curl http://192.168.1.143/api/status`

## Network Requirements

The dashboard needs access to:

| Service | URL | Port |
|---------|-----|------|
| BOM Weather | api.weather.bom.gov.au | 443 |
| TomTom Traffic | api.tomtom.com | 443 |
| CoinGecko | api.coingecko.com | 443 |
| Frankfurter | api.frankfurter.app | 443 |
| Yahoo Finance | query1.finance.yahoo.com | 443 |
| Transperth GTFS | www.transperth.wa.gov.au | 443 |
| Garage Pi | 192.168.1.143 | 80 |
