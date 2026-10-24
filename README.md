# Bus Passenger Assistant

A professional, offline-first Android mobile application and FastAPI backend engineered for intercity bus drivers, conductors, and fleet operators.

Bus Passenger Assistant transforms static, cumbersome paper and PDF passenger manifests into a dynamic, interactive mobile passenger management system with visual seat maps, one-tap calling, stop-by-stop passenger grouping, arrival/boarding separation, and resilient offline synchronization.

---

## 🌟 Key Features

### 1. Home Dashboard (Screen 1)
- **Active Trip Route & Bus Number**: Live trip banner with route (`Pune to Bangalore`), vehicle number (`MH 12 QX 4521`), journey date, and status.
- **Primary Operational Action Cards**: Prominent, high-contrast, outdoor-readable cards for **Boarding Points** and **Dropping Points**.
- **Real-time Metrics**: Live counters for Total Passengers, Arrived, Boarded, Currently Onboard, Dropped Off, and Awaiting Boarding.
- **Progress Trackers**: Percentage bars for Boarding and Drop-off progress.
- **Quick Tools**: Fast access to Seat Map, PDF Upload, Trip Switcher, and Sync Queue.

### 2. PDF Upload & Manifest Review (Screen 2)
- **Native Document Picker**: Pick any intercity bus PDF manifest from the device storage.
- **Intelligent Heuristic & Tabular Parser**: Extracts Passenger Name, Seat Assignment, Mobile Number, Boarding Point, Drop-off Destination, and PNR Reference.
- **Editable Manifest Review**: Edit extracted names, seats, phone numbers, or stops in place before activation.
- **Validation & Duplicate Protection**: Automatically flags duplicate seats, missing phone numbers, or unassigned berths.
- **Add Missing Passengers**: Add walk-in or phone-booked passengers manually.
- **One-Tap Demo Manifest**: Immediate test and verification with realistic synthetic data.

### 3. Boarding Points Workflow (Screen 3)
- **Dynamic Boarding Sections**: Automatically generates sections for each pickup stop (e.g., *Pune — Swargate*, *Pune — Wakad*, *Pune — Katraj*, *Satara — Highway*, *Kolhapur — Bus Stand*).
- **Expandable / Collapsible Stop Cards**: Displays pending, arrived, and boarded counters per stop with progress indicators.
- **Independent Arrival Confirmation**: Checkbox to record when a passenger is physically spotted at the pickup stop.
- **Independent Boarding Confirmation**: Action button to mark passenger as safely onboard.
- **One-Tap Native Phone Calling**: Directly opens the device's native phone dialer (`tel:<number>`) with number validation.
- **Multi-Field Search & Filter**: Search by passenger name, seat number, mobile, or PNR; filter by *All*, *Awaiting Arrival*, *Arrived*, or *Boarded*.

### 4. Dropping Points Workflow (Screen 4)
- **Dynamic Destination Sections**: Groups passengers by destination (e.g., *Belgaum — Bypass*, *Hubli — Old Bus Stand*, *Davanagere*, *Tumkur*, *Bangalore — Majestic*).
- **Onboard Warnings**: Highlights upcoming stops that have passengers still onboard.
- **Drop-off Confirmation**: One-tap action to confirm passenger drop-off with safety checks.

### 5. Interactive Bus Seat Dashboard (Screen 6)
- **Visual Top-Down Seating Grid**: Realistic bus layout featuring driver cabin, door orientation, and center aisle.
- **Status Color Legend**:
  - ⬜ **Grey**: Vacant / Unassigned Seat
  - 🟧 **Amber**: Awaiting Boarding
  - 🟦 **Blue**: Arrived at Pickup Stop
  - 🟩 **Green**: Passenger Safely Onboard
  - 🟪 **Purple**: Dropped Off at Destination
- **Interactive Inspection**: Tap any seat to open the passenger inspection sheet.
- **Configurable Layouts**: Supports 2+2 Luxury Seater (40 capacity) and 2+1 Sleeper/Seater formats.

### 6. Passenger Details & Audit History (Screen 5)
- Reusable bottom sheet with complete passenger details, PNR, phone dialer button, arrival time, boarding time, drop-off time, and authorized status corrections.

### 7. Offline Synchronization (Screen 8) & SQLite Storage
- **Expo SQLite Local Database**: Automatically persists active trips, stops, and passenger records locally.
- **ACID Event Queue**: Stores arrival, boarding, and drop-off events locally when offline.
- **Idempotency Protection**: Every event uses a unique idempotency key (`evt_<id>_<type>_<timestamp>`) to prevent duplicate transitions during retries.
- **Safe Batch Sync**: Automatically synchronizes queued events to `/api/sync/batch` upon reconnection.

### 8. Settings & Diagnostics (Screen 9)
- **Configurable API Endpoint**: Seamlessly toggle between Android Emulator (`http://10.0.2.2:8000`), Localhost (`http://127.0.0.1:8000`), or LAN IP.
- **Passenger Privacy**: Mask phone numbers for outdoor confidentiality.
- **Connection Test**: Immediate diagnostic check of backend reachability.

---

## 🏗️ Project Architecture

```text
bus-passenger-assistant/
├── implementation_plan.md      # Master implementation plan
├── README.md                   # Project overview & documentation
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py    # REST routes (trips, passengers, events, sync, manifests)
│   │   ├── core/
│   │   │   ├── config.py       # App settings & CORS
│   │   │   └── database.py     # SQLAlchemy DB engine & session
│   │   ├── models/
│   │   │   └── trip.py         # Trip, Stop, Passenger, JourneyEvent models
│   │   ├── schemas/
│   │   │   └── trip.py         # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── pdf_extractor.py # Manifest parser for text & tables
│   │   │   ├── seat_layout.py   # Top-down seat layout generator
│   │   │   └── pdf_generator.py # Sample PDF manifest generator
│   │   └── main.py             # FastAPI entrypoint
│   ├── tests/
│   │   └── test_api.py         # 4 automated test suites (Pytest)
│   ├── uploads/                # Manifest storage directory
│   └── requirements.txt        # Backend dependencies
├── mobile/                     # React Native Expo Android app
│   ├── src/
│   │   ├── components/         # Header, StatCard, PassengerCard, SeatMap, etc.
│   │   ├── database/           # Expo SQLite offline persistence layer
│   │   ├── screens/            # Home, Boarding, Dropping, Seats, Upload, Trips, Settings
│   │   ├── services/           # api.ts (REST client) & sync.ts (offline manager)
│   │   ├── state/              # AppContext.tsx (reactive state container)
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # dialer.ts & helpers.ts
│   ├── tests/
│   │   └── app.test.ts         # 7 automated unit & persistence tests
│   ├── app.json                # Expo config (package: com.busassistant.app)
│   ├── package.json            # Expo 51 stable dependencies
│   └── App.tsx                 # Main application with bottom navigation
└── docs/
    ├── architecture.md         # Mermaid diagrams & system design
    └── mobile-setup.md         # APK / AAB build and setup guide
```

---

## 🚀 Running the Project

### 1. Start the Backend API Server
```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base: `http://localhost:8000`
- Swagger UI Documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Start the Mobile Application
```powershell
cd mobile
$env:PATH = "C:\Users\Admin\.node\node-v20.18.0-win-x64;" + $env:PATH
npx expo start
```
- Press `a` to open on Android Emulator.
- Scan QR code via **Expo Go** on a physical Android device.
- Press `w` to run in Web browser preview.

---

## 🧪 Verification & Test Results

### 1. Backend Automated Tests (Pytest)
Command: `python -m pytest backend/tests/test_api.py -v`
```text
backend/tests/test_api.py::test_health_check PASSED                      [ 25%]
backend/tests/test_api.py::test_trip_lifecycle_and_passengers PASSED     [ 50%]
backend/tests/test_api.py::test_offline_batch_sync PASSED                [ 75%]
backend/tests/test_api.py::test_sample_manifest_pdf_generation_and_upload PASSED [100%]
======================= 4 passed in 5.72s ========================
```

### 2. Mobile Automated Tests (TypeScript & SQLite Queue)
Command: `npx ts-node tests/app.test.ts`
```text
# Subtest: Bus Passenger Assistant - Utility Tests
    ok 1 - should clean phone numbers correctly removing formatting characters
    ok 2 - should have distinct status configuration for all journey states
    ok 3 - should format ISO timestamps properly
ok 1 - Bus Passenger Assistant - Utility Tests

# Subtest: Bus Passenger Assistant - Offline SQLite Persistence Tests
    ok 1 - should initialize database and save trip
    ok 2 - should save and retrieve passengers locally
    ok 3 - should queue offline events with idempotency keys and retrieve them
    ok 4 - should safely mark offline events synced and remove from pending queue
ok 2 - Bus Passenger Assistant - Offline SQLite Persistence Tests

# tests 7
# suites 2
# pass 7
# fail 0
```

### 3. TypeScript Strict Type-Check
Command: `npx tsc --noEmit`
- Result: **0 errors**, fully type-safe.

---

## 📱 Building the Standalone Android APK

To generate an installable `.apk` for direct sideloading:
```powershell
cd mobile
npx eas build -p android --profile preview
```
Or for local compilation via Android Studio:
```powershell
cd mobile
npx expo prebuild
npx expo run:android --variant release
```
See [`docs/mobile-setup.md`](file:///c:/Users/Admin/OneDrive/Desktop/BUS/docs/mobile-setup.md) for full deployment and Google Play Store (`.aab`) instructions.
