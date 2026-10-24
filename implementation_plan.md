# Bus Passenger Assistant - Implementation Plan & Architecture

## 1. Project Overview
The **Bus Passenger Assistant** is an offline-first Android mobile application and FastAPI backend engineered for intercity bus drivers, conductors, and depot managers. It solves the friction of managing paper/PDF passenger manifests across intermediate boarding and dropping points.

### Key Objectives:
1. **Interactive Manifest Ingestion**: Parse unstructured and tabular PDF bus manifests (e.g., RedBus, AbhiBus, SRS, VRL, Neeta formats) extracting passenger names, seat numbers, phone numbers, pickup/drop-off points, and PNR booking references with verification & editing.
2. **Dynamic Boarding Management**: Group passengers automatically by boarding location with arrival & boarding separation, native dialer calling (`tel:`), search, and filters.
3. **Dropping Point Tracking**: Manage drop-off destinations, identify pending onboard passengers, and confirm drop-offs.
4. **Interactive Visual Seat Dashboard**: Configurable top-down bus seating layout (e.g. 2+2 luxury, 2+1 sleeper/seater) with real-time status color coding (unassigned, awaiting, arrived, onboard, dropped off) and direct passenger detail inspection.
5. **Robust Offline-First SQLite Sync**: Expo SQLite on device persisting trips, stops, passengers, and audit event logs with automatic synchronization queue and idempotency keys to the backend.

---

## 2. Architecture & Technology Stack

### Backend:
- **FastAPI (Python 3.12)**: Async REST API server with OpenAPI documentation.
- **SQLAlchemy 2.0 & SQLite**: Persistent relational storage with foreign keys and ACID transactions.
- **Pydantic v2**: Strict validation schemas for requests and responses.
- **PDF Extraction Engine**: `pypdf` / `pdfplumber` / regex heuristics with confidence scoring and fallback extraction.
- **ReportLab**: Programmatic PDF manifest generation for synthetic test data and reporting.
- **Pytest & HTTPX**: Comprehensive backend automated testing.

### Mobile:
- **React Native (Expo SDK 51/52)**: Cross-platform mobile runtime.
- **TypeScript**: Strict type safety.
- **Expo Router**: File-based native navigation.
- **Expo SQLite**: High-performance local relational database for offline sync.
- **Expo Document Picker & FileSystem**: Native PDF selection and multipart upload.
- **Expo Linking**: Direct native dialer invocation.
- **React Hook Form & Zod**: Form handling and input validation.
- **Lucide Icons**: Crisp, outdoor-readable mobile iconography.

---

## 3. Database Schema

### Backend & Local SQLite Tables:
1. `trips`:
   - `id` (VARCHAR PK)
   - `route_name` (VARCHAR, e.g. "Pune to Bangalore")
   - `bus_number` (VARCHAR, e.g. "MH 12 QX 4521")
   - `journey_date` (VARCHAR, e.g. "2026-10-25")
   - `status` (VARCHAR: `draft`, `active`, `completed`, `archived`)
   - `total_seats` (INTEGER, default 40)
   - `seat_layout_type` (VARCHAR: `2x2_seater`, `2x1_sleeper`)
   - `created_at` (DATETIME)
   - `updated_at` (DATETIME)

2. `stops`:
   - `id` (VARCHAR PK)
   - `trip_id` (VARCHAR FK -> trips.id)
   - `stop_type` (VARCHAR: `boarding` or `dropping`)
   - `name` (VARCHAR, e.g. "Pune - Swargate")
   - `sequence_order` (INTEGER)
   - `scheduled_time` (VARCHAR)

3. `passengers`:
   - `id` (VARCHAR PK)
   - `trip_id` (VARCHAR FK -> trips.id)
   - `booking_reference` (VARCHAR, PNR)
   - `name` (VARCHAR)
   - `seat_number` (VARCHAR)
   - `phone_number` (VARCHAR)
   - `boarding_stop_id` (VARCHAR FK -> stops.id)
   - `boarding_stop_name` (VARCHAR)
   - `dropoff_stop_id` (VARCHAR FK -> stops.id)
   - `dropoff_stop_name` (VARCHAR)
   - `current_status` (VARCHAR: `awaiting_boarding`, `arrived`, `onboard`, `dropped_off`)
   - `arrival_time` (DATETIME nullable)
   - `boarding_time` (DATETIME nullable)
   - `dropoff_time` (DATETIME nullable)
   - `validation_warnings` (TEXT nullable)
   - `created_at` (DATETIME)
   - `updated_at` (DATETIME)

4. `journey_events`:
   - `id` (VARCHAR PK)
   - `trip_id` (VARCHAR FK)
   - `passenger_id` (VARCHAR FK)
   - `event_type` (VARCHAR: `arrival`, `boarding`, `dropoff`, `status_correction`)
   - `previous_status` (VARCHAR)
   - `new_status` (VARCHAR)
   - `event_timestamp` (DATETIME)
   - `performed_by` (VARCHAR)
   - `notes` (TEXT)
   - `idempotency_key` (VARCHAR UNIQUE)
   - `sync_status` (VARCHAR: `local_pending`, `synced`, `failed`)

---

## 4. API Endpoints

- `GET /health` - Health check & server status
- `POST /api/trips` - Create a trip
- `GET /api/trips` - List trips (filter by status)
- `GET /api/trips/active` - Get currently active trip
- `GET /api/trips/{trip_id}` - Get trip details + dashboard stats
- `PUT /api/trips/{trip_id}/activate` - Set trip as active
- `PUT /api/trips/{trip_id}/complete` - Complete trip
- `POST /api/trips/{trip_id}/manifest/upload` - Upload PDF manifest & extract passengers
- `POST /api/trips/{trip_id}/manifest/confirm` - Confirm reviewed manifest & persist passengers
- `GET /api/trips/{trip_id}/passengers` - Get passengers for trip (with search & filters)
- `GET /api/trips/{trip_id}/boarding-points` - Get dynamic boarding points with passenger counts & lists
- `GET /api/trips/{trip_id}/dropping-points` - Get dynamic drop-off destinations with counts & lists
- `GET /api/trips/{trip_id}/seat-map` - Get seat map arrangement with passenger occupancy
- `POST /api/trips/{trip_id}/events` - Record journey event (arrival, boarding, drop-off, correction)
- `POST /api/sync/batch` - Batch sync offline events with idempotency keys
- `GET /api/trips/{trip_id}/export-report` - Generate status report / CSV / JSON

---

## 5. Development Phases & Milestones

1. **Phase 1: Backend Foundation & PDF Extraction**
   - SQLite models, SQLAlchemy DB session, Pydantic schemas.
   - Robust PDF manifest parser handling table layouts and free text with fallback.
   - Trip and Passenger API endpoints with business logic.
   - Comprehensive Pytest suite.

2. **Phase 2: Mobile Setup & Navigation**
   - Expo React Native project with TypeScript.
   - Expo Router navigation with bottom tabs & modals.
   - Outdoor-readable high-contrast UI design system.

3. **Phase 3: Screen 1 - Home Dashboard & Screen 7 - Trip Management**
   - Active trip card, route, date, stats summary.
   - Boarding & Dropping primary CTA cards.
   - Trip switcher, creator, and status tracker.

4. **Phase 4: Screen 2 - PDF Selection, Upload & Manifest Review**
   - Document picker for PDF files.
   - Live extraction feedback with editable table/cards.
   - Add/edit/delete passengers and duplicate detection.
   - Manifest confirmation activating trip.

5. **Phase 5: Screen 3 - Boarding Points Workflow**
   - Dynamic grouping by boarding location.
   - Independent "Arrived" toggle and "Mark Boarded" button.
   - One-tap native dialer calling (`tel:`).
   - Fast search and status filters (All, Awaiting, Arrived, Boarded).

6. **Phase 6: Screen 4 - Dropping Points Workflow**
   - Destination-based grouping and counts.
   - "Confirm Dropped Off" action with state checks.
   - Pending passenger warnings for upcoming stops.

7. **Phase 7: Screen 6 - Interactive Bus Seat Dashboard & Screen 5 - Passenger Details**
   - Top-down 2+2 and 2+1 visual seating layouts.
   - High-contrast visual legend (Awaiting, Arrived, Onboard, Dropped off).
   - Tap-to-inspect passenger details modal with contextual actions.

8. **Phase 8: Screen 8 - Offline SQLite Persistence & Synchronization**
   - Local Expo SQLite tables mirroring backend.
   - Event queue with idempotency keys.
   - Network status monitor and background/manual sync.

9. **Phase 9: Screen 9 - Settings & Diagnostics**
   - Configurable API Base URL (with auto emulator 10.0.2.2 vs localhost vs LAN options).
   - Bus layout configuration, offline queue inspector, data reset.

10. **Phase 10: Automated Testing & Verification**
    - Pytest backend test suite.
    - React Native Jest unit/integration tests.
    - End-to-end verification and documentation.
