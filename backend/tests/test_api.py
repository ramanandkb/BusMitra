import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base, get_db
from backend.app.main import app
from backend.app.services.pdf_generator import generate_sample_manifest_pdf

# Setup in-memory SQLite database for test isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_bus.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_trip_lifecycle_and_passengers():
    # 1. Create a trip
    trip_data = {
        "route_name": "Pune to Bangalore",
        "bus_number": "MH 12 QX 4521",
        "journey_date": "2026-10-25",
        "total_seats": 40,
        "seat_layout_type": "2x2_seater"
    }
    create_res = client.post("/api/trips", json=trip_data)
    assert create_res.status_code == 201
    trip = create_res.json()
    trip_id = trip["id"]
    assert trip["status"] == "active"
    assert trip["stats"]["total_passengers"] == 0

    # 2. Add two passengers
    p1_data = {
        "name": "Rajesh Sharma",
        "seat_number": "1A",
        "phone_number": "9823012345",
        "boarding_stop_name": "Pune - Swargate",
        "dropoff_stop_name": "Bangalore - Majestic",
        "booking_reference": "PNR1001"
    }
    p1_res = client.post(f"/api/trips/{trip_id}/passengers", json=p1_data)
    assert p1_res.status_code == 201
    p1 = p1_res.json()

    p2_data = {
        "name": "Amit Patil",
        "seat_number": "1B",
        "phone_number": "9822198765",
        "boarding_stop_name": "Pune - Wakad",
        "dropoff_stop_name": "Hubli - Old Bus Stand",
        "booking_reference": "PNR1002"
    }
    p2_res = client.post(f"/api/trips/{trip_id}/passengers", json=p2_data)
    assert p2_res.status_code == 201
    p2 = p2_res.json()

    # 3. Check active trip stats
    active_res = client.get("/api/trips/active")
    assert active_res.status_code == 200
    active_trip = active_res.json()
    assert active_trip["stats"]["total_passengers"] == 2
    assert active_trip["stats"]["awaiting_boarding"] == 2

    # 4. Boarding Points endpoint
    bp_res = client.get(f"/api/trips/{trip_id}/boarding-points")
    assert bp_res.status_code == 200
    bp_data = bp_res.json()
    assert len(bp_data) == 2  # Swargate and Wakad

    # 5. Mark p1 as arrived
    arr_res = client.post(f"/api/trips/{trip_id}/events", json={
        "passenger_id": p1["id"],
        "event_type": "arrival",
        "new_status": "arrived",
        "idempotency_key": "event-arr-1"
    })
    assert arr_res.status_code == 200

    # Verify p1 arrival reflects in passenger query
    p1_get = client.get(f"/api/trips/{trip_id}/passengers?status=arrived")
    assert len(p1_get.json()) == 1
    assert p1_get.json()[0]["name"] == "Rajesh Sharma"

    # 6. Mark p1 as onboard
    board_res = client.post(f"/api/trips/{trip_id}/events", json={
        "passenger_id": p1["id"],
        "event_type": "boarding",
        "new_status": "onboard",
        "idempotency_key": "event-board-1"
    })
    assert board_res.status_code == 200

    # 7. Check Dropping Points endpoint
    dp_res = client.get(f"/api/trips/{trip_id}/dropping-points")
    assert dp_res.status_code == 200
    dp_data = dp_res.json()
    majestic = next(d for d in dp_data if "Majestic" in d["dropoff_stop_name"])
    assert majestic["currently_onboard"] == 1

    # 8. Seat Map check
    seat_res = client.get(f"/api/trips/{trip_id}/seat-map")
    assert seat_res.status_code == 200
    seat_map = seat_res.json()
    seat_1a = next(s for s in seat_map["seats"] if s["seat_number"] == "1A")
    assert seat_1a["status"] == "onboard"
    assert seat_1a["passenger"]["name"] == "Rajesh Sharma"

    # 9. Mark p1 dropped off
    drop_res = client.post(f"/api/trips/{trip_id}/events", json={
        "passenger_id": p1["id"],
        "event_type": "dropoff",
        "new_status": "dropped_off",
        "idempotency_key": "event-drop-1"
    })
    assert drop_res.status_code == 200

    # Check updated stats
    trip_updated = client.get(f"/api/trips/{trip_id}").json()
    assert trip_updated["stats"]["dropped_off"] == 1
    assert trip_updated["stats"]["onboard"] == 0

def test_offline_batch_sync():
    trip_res = client.post("/api/trips", json={
        "route_name": "Mumbai to Goa",
        "bus_number": "MH 04 AB 9988",
        "journey_date": "2026-10-26"
    })
    trip_id = trip_res.json()["id"]

    p_res = client.post(f"/api/trips/{trip_id}/passengers", json={
        "name": "Kavita Rao",
        "seat_number": "2A",
        "boarding_stop_name": "Borivali",
        "dropoff_stop_name": "Panaji"
    })
    p_id = p_res.json()["id"]

    # Sync batch with events
    sync_payload = {
        "trip_id": trip_id,
        "events": [
            {
                "passenger_id": p_id,
                "event_type": "arrival",
                "new_status": "arrived",
                "idempotency_key": "offline-sync-1"
            },
            {
                "passenger_id": p_id,
                "event_type": "boarding",
                "new_status": "onboard",
                "idempotency_key": "offline-sync-2"
            }
        ]
    }
    sync_res = client.post("/api/sync/batch", json=sync_payload)
    assert sync_res.status_code == 200
    res_data = sync_res.json()
    assert res_data["processed_count"] == 2
    assert res_data["dashboard_stats"]["boarded"] == 1

    # Idempotent retry: submitting same keys must not duplicate
    retry_res = client.post("/api/sync/batch", json=sync_payload)
    assert retry_res.status_code == 200
    assert retry_res.json()["synced_events"][0]["status"] == "duplicate"

def test_sample_manifest_pdf_generation_and_upload():
    # 1. Generate sample PDF
    pdf_path = "test_manifest.pdf"
    generate_sample_manifest_pdf(pdf_path)
    assert os.path.exists(pdf_path)

    # 2. Create a trip
    trip_res = client.post("/api/trips", json={
        "route_name": "Pune to Bangalore",
        "bus_number": "MH 12 QX 4521",
        "journey_date": "2026-10-25"
    })
    trip_id = trip_res.json()["id"]

    # 3. Upload PDF
    with open(pdf_path, "rb") as f:
        upload_res = client.post(
            f"/api/trips/{trip_id}/manifest/upload",
            files={"file": ("test_manifest.pdf", f, "application/pdf")}
        )
    assert upload_res.status_code == 200
    manifest = upload_res.json()
    assert manifest["total_extracted"] > 0
    assert len(manifest["passengers"]) > 0

    # 4. Confirm manifest
    confirm_payload = {
        "route_name": manifest["detected_route"],
        "bus_number": manifest["detected_bus_number"],
        "journey_date": manifest["detected_journey_date"],
        "passengers": [
            {
                "name": p["name"],
                "seat_number": p["seat_number"],
                "phone_number": p["phone_number"],
                "boarding_stop_name": p["boarding_point"],
                "dropoff_stop_name": p["dropoff_point"],
                "booking_reference": p["booking_reference"]
            }
            for p in manifest["passengers"]
        ]
    }
    confirm_res = client.post(f"/api/trips/{trip_id}/manifest/confirm", json=confirm_payload)
    assert confirm_res.status_code == 200
    confirmed_trip = confirm_res.json()
    assert confirmed_trip["stats"]["total_passengers"] == manifest["total_extracted"]

    # Cleanup
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
