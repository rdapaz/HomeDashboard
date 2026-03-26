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

Download the LTS version from https://nodejs.org/ or install via winget:

```powershell
winget install OpenJS.NodeJS.LTS
node --version
npm --version
```

### 3. Git

Download from https://git-scm.com/download/win and install.

### 4. FFmpeg

Required by go2rtc for camera streaming. Install via winget:

```powershell
winget install Gyan.FFmpeg
```

After installation, restart your shell so FFmpeg is on PATH. Verify:

```powershell
ffmpeg -version
```

### 5. go2rtc

Download the latest Windows release from https://github.com/AlexxIT/go2rtc/releases. Place `go2rtc.exe` in the project root directory.

## Installation

### 1. Clone the Repository

```powershell
cd C:\Users\%USERNAME%\Documents\Projects
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

### 3. Configure Backend

Edit `backend/config.py`:

- **TomTom API key**: Sign up free at https://developer.tomtom.com/ and set `TOMTOM_API_KEY`
- **Garage Pi IP**: Update `GARAGE_PI_HOST` if different from `192.168.1.143`
- **Camera list**: Update the `CAMERAS` list with your camera IDs and display names (IDs must match go2rtc stream names)
- **Carousel timing**: Adjust `CAROUSEL_CAMERA_DURATION`, `CAROUSEL_DASHBOARD_DURATION`, and `CAMERA_CYCLE_DURATION` as desired

### 4. Configure Camera Streaming

Edit `go2rtc.yaml` in the project root:

1. **Get RTSP URLs from UniFi Protect**: For each camera, go to Camera Settings > Advanced > RTSP and copy the **medium-quality** RTSP URL. High-quality streams use H.265 which does not play reliably in browsers.

2. **Configure streams**: Each stream must use the `ffmpeg:` prefix and `#video=copy` suffix:

```yaml
streams:
  front_ne1:
    - "ffmpeg:rtsps://192.168.1.4:7441/YOUR_STREAM_KEY?enableSrtp#video=copy"
  doorbell:
    - "ffmpeg:rtsps://192.168.1.4:7441/ANOTHER_STREAM_KEY?enableSrtp#video=copy"
```

3. **Set FFmpeg path**: Update the `ffmpeg.bin` value to match your FFmpeg installation:

```yaml
ffmpeg:
  bin: "C:\\Users\\YourUser\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe"
```

To find your FFmpeg path, run: `where.exe ffmpeg`

4. **Match IDs**: The stream names in `go2rtc.yaml` (e.g. `front_ne1`) must exactly match the `id` values in `backend/config.py` `CAMERAS` list.

### 5. Frontend Setup

```powershell
cd ..\frontend
npm install
npm run build
```

## Running

### Starting All Services (Production)

You need three processes running:

**1. go2rtc (camera streaming):**
```powershell
cd C:\Users\%USERNAME%\Documents\Projects\HomeDashboard
.\go2rtc.exe -config go2rtc.yaml
```

**2. Backend (API + static files):**
```powershell
cd C:\Users\%USERNAME%\Documents\Projects\HomeDashboard\backend
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

**3. Browser:**
Open http://localhost:8000 in Chrome (fullscreen / kiosk mode).

### Development Mode (two terminals + go2rtc)

**Terminal 1 - go2rtc:**
```powershell
cd C:\Users\%USERNAME%\Documents\Projects\HomeDashboard
.\go2rtc.exe -config go2rtc.yaml
```

**Terminal 2 - Backend:**
```powershell
cd C:\Users\%USERNAME%\Documents\Projects\HomeDashboard\backend
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 - Frontend:**
```powershell
cd C:\Users\%USERNAME%\Documents\Projects\HomeDashboard\frontend
npm start
```

Access at http://localhost:3000

## Auto-Start on Boot

### Using Task Scheduler

Create **two** scheduled tasks:

#### Task 1: go2rtc

1. Open **Task Scheduler** > **Create Task**
2. **General**: Name `go2rtc`, check "Run whether user is logged on or not"
3. **Triggers**: New > "At startup", delay 15 seconds
4. **Actions**: Start a program
   - Program: `C:\Users\%USERNAME%\Documents\Projects\HomeDashboard\go2rtc.exe`
   - Arguments: `-config go2rtc.yaml`
   - Start in: `C:\Users\%USERNAME%\Documents\Projects\HomeDashboard`

#### Task 2: HomeDashboard Backend

1. **Create Task**
2. **General**: Name `HomeDashboard`, check "Run whether user is logged on or not", check "Run with highest privileges"
3. **Triggers**: New > "At startup", delay 30 seconds
4. **Actions**: Start a program
   - Program: `C:\Users\%USERNAME%\Documents\Projects\HomeDashboard\backend\venv\Scripts\uvicorn.exe`
   - Arguments: `main:app --host 0.0.0.0 --port 8000`
   - Start in: `C:\Users\%USERNAME%\Documents\Projects\HomeDashboard\backend`
5. **Settings**: Check "If the task fails, restart every: 1 minute", up to 3 times

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
cd C:\Users\%USERNAME%\Documents\Projects\HomeDashboard\backend\gtfs_data
curl -L -o google_transit.zip "https://www.transperth.wa.gov.au/TimetablePDFs/GoogleTransit/Production/google_transit.zip"
tar -xf google_transit.zip stops.txt routes.txt stop_times.txt trips.txt calendar.txt calendar_dates.txt
```

Then restart the backend service.

## Troubleshooting

### Cameras show black/green screen

- You are likely using high-quality RTSP streams (H.265/HEVC). Switch to **medium-quality** streams (H.264) in UniFi Protect
- Verify RTSP is enabled: UniFi Protect > Camera Settings > Advanced > Enable RTSP
- Ensure all three quality levels (high/medium/low) have RTSP enabled

### Cameras show "Offline"

- Check go2rtc is running: http://localhost:1984
- Check the camera API: `curl http://localhost:8000/api/cameras`
- Verify stream names in `go2rtc.yaml` match camera IDs in `config.py`

### Cameras show FFmpeg errors

- Ensure FFmpeg is installed and the path in `go2rtc.yaml` `ffmpeg.bin` is correct
- Test FFmpeg can connect: `ffmpeg -rtsp_transport tcp -i "rtsps://192.168.1.4:7441/YOUR_KEY?enableSrtp" -frames:v 1 -update 1 test.jpg`
- Check the RTSP URL is valid and the camera is online

### go2rtc stream.html works but dashboard cameras don't

- Hard refresh the dashboard: Ctrl+Shift+R
- Check browser console (F12) for errors
- Ensure the backend was restarted after config changes

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

| Service | URL / Host | Port |
|---------|-----------|------|
| go2rtc API | localhost | 1984 |
| UniFi Protect RTSPS | 192.168.1.4 | 7441 |
| BOM Weather | api.weather.bom.gov.au | 443 |
| TomTom Traffic | api.tomtom.com | 443 |
| CoinGecko | api.coingecko.com | 443 |
| Frankfurter | api.frankfurter.app | 443 |
| Yahoo Finance | query1.finance.yahoo.com | 443 |
| Transperth GTFS | www.transperth.wa.gov.au | 443 |
| Garage Pi | 192.168.1.143 | 80 |
