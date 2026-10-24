import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.trip import Trip, Stop, Passenger, JourneyEvent
from backend.app.schemas.trip import (
    TripCreate, TripUpdate, TripResponse, DashboardStats,
    StopCreate, StopResponse,
    PassengerCreate, PassengerUpdate, PassengerResponse,
    BoardingGroupResponse, DroppingGroupResponse,
    SeatMapResponse,
    JourneyEventCreate, JourneyEventResponse,
    BatchSyncRequest, BatchSyncResponse, BatchSyncResultItem,
    ManifestExtractResponse, ManifestConfirmRequest
)
from backend.app.services.pdf_extractor import PDFManifestExtractor
from backend.app.services.seat_layout import SeatLayoutService
from backend.app.services.pdf_generator import generate_sample_manifest_pdf

router = APIRouter()

def compute_trip_stats(trip: Trip, db: Session) -> DashboardStats:
    passengers = db.query(Passenger).filter(Passenger.trip_id == trip.id).all()
    total = len(passengers)
    arrived = sum(1 for p in passengers if p.current_status == "arrived")
    boarded = sum(1 for p in passengers if p.current_status == "onboard")
    dropped_off = sum(1 for p in passengers if p.current_status == "dropped_off")
    awaiting = sum(1 for p in passengers if p.current_status == "awaiting_boarding")

    boarding_progress = (boarded / total * 100.0) if total > 0 else 0.0
    dropping_progress = (dropped_off / total * 100.0) if total > 0 else 0.0

    return DashboardStats(
        total_passengers=total,
        arrived=arrived,
        boarded=boarded,
        onboard=boarded,  # currently onboard
        dropped_off=dropped_off,
        awaiting_boarding=awaiting,
        boarding_progress_pct=round(boarding_progress, 1),
        dropping_progress_pct=round(dropping_progress, 1)
    )

# --- Trip Endpoints ---

@router.post("/trips", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(trip_in: TripCreate, db: Session = Depends(get_db)):
    # Check if there is an active trip, if not set this one active
    active_count = db.query(Trip).filter(Trip.status == "active").count()
    status_val = "active" if active_count == 0 else "draft"

    trip = Trip(
        route_name=trip_in.route_name,
        bus_number=trip_in.bus_number,
        journey_date=trip_in.journey_date,
        total_seats=trip_in.total_seats,
        seat_layout_type=trip_in.seat_layout_type,
        status=status_val
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)

    trip_res = TripResponse.model_validate(trip)
    trip_res.stats = compute_trip_stats(trip, db)
    return trip_res

@router.get("/trips", response_model=List[TripResponse])
def list_trips(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Trip)
    if status_filter:
        query = query.filter(Trip.status == status_filter)
    trips = query.order_by(Trip.created_at.desc()).all()

    result = []
    for t in trips:
        res = TripResponse.model_validate(t)
        res.stats = compute_trip_stats(t, db)
        result.append(res)
    return result

@router.get("/trips/active", response_model=TripResponse)
def get_active_trip(db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.status == "active").order_by(Trip.updated_at.desc()).first()
    if not trip:
        # Fallback: get the most recently created trip
        trip = db.query(Trip).order_by(Trip.created_at.desc()).first()
    if not trip:
        raise HTTPException(status_code=404, detail="No active trip found. Please create or upload a trip manifest.")
    
    res = TripResponse.model_validate(trip)
    res.stats = compute_trip_stats(trip, db)
    return res

@router.get("/trips/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    res = TripResponse.model_validate(trip)
    res.stats = compute_trip_stats(trip, db)
    return res

@router.put("/trips/{trip_id}/activate", response_model=TripResponse)
def activate_trip(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Set all other active trips to completed/draft
    db.query(Trip).filter(Trip.status == "active").update({"status": "completed"})
    trip.status = "active"
    trip.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(trip)

    res = TripResponse.model_validate(trip)
    res.stats = compute_trip_stats(trip, db)
    return res

@router.put("/trips/{trip_id}/complete", response_model=TripResponse)
def complete_trip(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip.status = "completed"
    trip.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(trip)

    res = TripResponse.model_validate(trip)
    res.stats = compute_trip_stats(trip, db)
    return res

# --- Manifest Upload & Confirmation ---

@router.post("/trips/{trip_id}/manifest/upload", response_model=ManifestExtractResponse)
async def upload_manifest(trip_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_id = str(uuid.uuid4())
    save_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}_{file.filename}")
    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)

    extraction_result = PDFManifestExtractor.extract_from_pdf(save_path)
    return extraction_result

@router.post("/trips/{trip_id}/manifest/confirm", response_model=TripResponse)
def confirm_manifest(trip_id: str, payload: ManifestConfirmRequest, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if payload.route_name:
        trip.route_name = payload.route_name
    if payload.bus_number:
        trip.bus_number = payload.bus_number
    if payload.journey_date:
        trip.journey_date = payload.journey_date

    # Extract unique boarding and dropping stops dynamically
    boarding_stops = []
    dropping_stops = []
    seen_boarding = set()
    seen_dropping = set()

    for p in payload.passengers:
        b_name = p.boarding_stop_name.strip()
        if b_name and b_name not in seen_boarding:
            seen_boarding.add(b_name)
            boarding_stops.append(b_name)
        d_name = p.dropoff_stop_name.strip()
        if d_name and d_name not in seen_dropping:
            seen_dropping.add(d_name)
            dropping_stops.append(d_name)

    # Upsert stops
    stop_map = {}
    for idx, b_name in enumerate(boarding_stops):
        stop = db.query(Stop).filter(Stop.trip_id == trip.id, Stop.name == b_name, Stop.stop_type == "boarding").first()
        if not stop:
            stop = Stop(trip_id=trip.id, stop_type="boarding", name=b_name, sequence_order=idx + 1)
            db.add(stop)
            db.flush()
        stop_map[f"b_{b_name}"] = stop.id

    for idx, d_name in enumerate(dropping_stops):
        stop = db.query(Stop).filter(Stop.trip_id == trip.id, Stop.name == d_name, Stop.stop_type == "dropping").first()
        if not stop:
            stop = Stop(trip_id=trip.id, stop_type="dropping", name=d_name, sequence_order=idx + 1)
            db.add(stop)
            db.flush()
        stop_map[f"d_{d_name}"] = stop.id

    # Upsert passengers
    for p in payload.passengers:
        existing = None
        if p.seat_number:
            existing = db.query(Passenger).filter(
                Passenger.trip_id == trip.id,
                Passenger.seat_number == p.seat_number
            ).first()

        b_id = stop_map.get(f"b_{p.boarding_stop_name.strip()}")
        d_id = stop_map.get(f"d_{p.dropoff_stop_name.strip()}")

        if existing:
            existing.name = p.name
            existing.phone_number = p.phone_number
            existing.boarding_stop_id = b_id
            existing.boarding_stop_name = p.boarding_stop_name
            existing.dropoff_stop_id = d_id
            existing.dropoff_stop_name = p.dropoff_stop_name
            existing.booking_reference = p.booking_reference
        else:
            new_p = Passenger(
                trip_id=trip.id,
                booking_reference=p.booking_reference,
                name=p.name,
                seat_number=p.seat_number,
                phone_number=p.phone_number,
                boarding_stop_id=b_id,
                boarding_stop_name=p.boarding_stop_name,
                dropoff_stop_id=d_id,
                dropoff_stop_name=p.dropoff_stop_name,
                current_status="awaiting_boarding"
            )
            db.add(new_p)

    trip.status = "active"
    trip.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(trip)

    res = TripResponse.model_validate(trip)
    res.stats = compute_trip_stats(trip, db)
    return res

# --- Passenger Endpoints ---

@router.get("/trips/{trip_id}/passengers", response_model=List[PassengerResponse])
def get_passengers(
    trip_id: str,
    search: Optional[str] = None,
    status: Optional[str] = None,
    boarding_stop: Optional[str] = None,
    dropoff_stop: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Passenger).filter(Passenger.trip_id == trip_id)
    if status and status != "all":
        query = query.filter(Passenger.current_status == status)
    if boarding_stop:
        query = query.filter(Passenger.boarding_stop_name == boarding_stop)
    if dropoff_stop:
        query = query.filter(Passenger.dropoff_stop_name == dropoff_stop)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Passenger.name.ilike(search_term),
                Passenger.seat_number.ilike(search_term),
                Passenger.phone_number.ilike(search_term),
                Passenger.booking_reference.ilike(search_term)
            )
        )
    return query.order_by(Passenger.seat_number).all()

@router.post("/trips/{trip_id}/passengers", response_model=PassengerResponse, status_code=status.HTTP_201_CREATED)
def add_passenger(trip_id: str, p_in: PassengerCreate, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Check duplicate seat
    if p_in.seat_number:
        dup = db.query(Passenger).filter(
            Passenger.trip_id == trip.id,
            Passenger.seat_number == p_in.seat_number
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail=f"Seat {p_in.seat_number} is already assigned to {dup.name}")

    p = Passenger(
        trip_id=trip_id,
        booking_reference=p_in.booking_reference,
        name=p_in.name,
        seat_number=p_in.seat_number,
        phone_number=p_in.phone_number,
        boarding_stop_id=p_in.boarding_stop_id,
        boarding_stop_name=p_in.boarding_stop_name,
        dropoff_stop_id=p_in.dropoff_stop_id,
        dropoff_stop_name=p_in.dropoff_stop_name,
        current_status=p_in.current_status or "awaiting_boarding"
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@router.put("/trips/{trip_id}/passengers/{passenger_id}", response_model=PassengerResponse)
def update_passenger(trip_id: str, passenger_id: str, p_in: PassengerUpdate, db: Session = Depends(get_db)):
    p = db.query(Passenger).filter(Passenger.id == passenger_id, Passenger.trip_id == trip_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Passenger not found")

    for field, val in p_in.model_dump(exclude_unset=True).items():
        setattr(p, field, val)

    p.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(p)
    return p

@router.delete("/trips/{trip_id}/passengers/{passenger_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_passenger(trip_id: str, passenger_id: str, db: Session = Depends(get_db)):
    p = db.query(Passenger).filter(Passenger.id == passenger_id, Passenger.trip_id == trip_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Passenger not found")
    db.delete(p)
    db.commit()
    return None

# --- Dynamic Boarding & Dropping Points ---

@router.get("/trips/{trip_id}/boarding-points", response_model=List[BoardingGroupResponse])
def get_boarding_points(trip_id: str, db: Session = Depends(get_db)):
    passengers = db.query(Passenger).filter(Passenger.trip_id == trip_id).all()
    grouped = {}

    for p in passengers:
        stop_name = p.boarding_stop_name or "General Pickup"
        if stop_name not in grouped:
            grouped[stop_name] = []
        grouped[stop_name].append(p)

    results = []
    for stop_name, p_list in grouped.items():
        total = len(p_list)
        arrived = sum(1 for p in p_list if p.current_status in ["arrived", "onboard", "dropped_off"])
        boarded = sum(1 for p in p_list if p.current_status in ["onboard", "dropped_off"])
        pending = sum(1 for p in p_list if p.current_status == "awaiting_boarding")

        results.append(BoardingGroupResponse(
            boarding_stop_name=stop_name,
            total_expected=total,
            arrived=arrived,
            boarded=boarded,
            pending=pending,
            passengers=[PassengerResponse.model_validate(p) for p in p_list]
        ))
    return results

@router.get("/trips/{trip_id}/dropping-points", response_model=List[DroppingGroupResponse])
def get_dropping_points(trip_id: str, db: Session = Depends(get_db)):
    passengers = db.query(Passenger).filter(Passenger.trip_id == trip_id).all()
    grouped = {}

    for p in passengers:
        stop_name = p.dropoff_stop_name or "General Destination"
        if stop_name not in grouped:
            grouped[stop_name] = []
        grouped[stop_name].append(p)

    results = []
    for stop_name, p_list in grouped.items():
        total = len(p_list)
        onboard = sum(1 for p in p_list if p.current_status == "onboard")
        dropped_off = sum(1 for p in p_list if p.current_status == "dropped_off")
        awaiting = total - dropped_off

        results.append(DroppingGroupResponse(
            dropoff_stop_name=stop_name,
            total_expected=total,
            currently_onboard=onboard,
            dropped_off=dropped_off,
            awaiting_dropoff=awaiting,
            passengers=[PassengerResponse.model_validate(p) for p in p_list]
        ))
    return results

# --- Visual Bus Seat Map ---

@router.get("/trips/{trip_id}/seat-map", response_model=SeatMapResponse)
def get_seat_map(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    passengers = db.query(Passenger).filter(Passenger.trip_id == trip_id).all()
    p_responses = [PassengerResponse.model_validate(p) for p in passengers]

    return SeatLayoutService.generate_seat_map(
        trip_id=trip.id,
        layout_type=trip.seat_layout_type or "2x2_seater",
        passengers=p_responses
    )

# --- Journey Events & Offline Batch Sync ---

@router.post("/trips/{trip_id}/events", response_model=JourneyEventResponse)
def record_event(trip_id: str, event_in: JourneyEventCreate, db: Session = Depends(get_db)):
    # Check idempotency
    if event_in.idempotency_key:
        existing_event = db.query(JourneyEvent).filter(
            JourneyEvent.idempotency_key == event_in.idempotency_key
        ).first()
        if existing_event:
            return existing_event

    passenger = db.query(Passenger).filter(
        Passenger.id == event_in.passenger_id,
        Passenger.trip_id == trip_id
    ).first()
    if not passenger:
        raise HTTPException(status_code=404, detail="Passenger not found in active trip")

    prev_status = passenger.current_status
    passenger.current_status = event_in.new_status

    now = event_in.event_timestamp or datetime.utcnow()
    if event_in.new_status == "arrived":
        passenger.arrival_time = now
    elif event_in.new_status == "onboard":
        passenger.boarding_time = now
        if not passenger.arrival_time:
            passenger.arrival_time = now
    elif event_in.new_status == "dropped_off":
        passenger.dropoff_time = now

    passenger.updated_at = datetime.utcnow()

    event = JourneyEvent(
        trip_id=trip_id,
        passenger_id=passenger.id,
        event_type=event_in.event_type,
        previous_status=prev_status,
        new_status=event_in.new_status,
        event_timestamp=now,
        performed_by=event_in.performed_by or "conductor",
        notes=event_in.notes,
        idempotency_key=event_in.idempotency_key,
        sync_status="synced"
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.post("/sync/batch", response_model=BatchSyncResponse)
def batch_sync(payload: BatchSyncRequest, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == payload.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    synced_items = []
    for ev in payload.events:
        # Check idempotency
        if ev.idempotency_key:
            existing = db.query(JourneyEvent).filter(JourneyEvent.idempotency_key == ev.idempotency_key).first()
            if existing:
                p = db.query(Passenger).filter(Passenger.id == ev.passenger_id).first()
                synced_items.append(BatchSyncResultItem(
                    idempotency_key=ev.idempotency_key,
                    status="duplicate",
                    message="Already processed",
                    passenger_id=ev.passenger_id,
                    current_status=p.current_status if p else ev.new_status
                ))
                continue

        p = db.query(Passenger).filter(Passenger.id == ev.passenger_id, Passenger.trip_id == payload.trip_id).first()
        if not p:
            synced_items.append(BatchSyncResultItem(
                idempotency_key=ev.idempotency_key,
                status="rejected",
                message="Passenger not found",
                passenger_id=ev.passenger_id,
                current_status="unknown"
            ))
            continue

        prev_status = p.current_status
        p.current_status = ev.new_status
        now = ev.event_timestamp or datetime.utcnow()
        if ev.new_status == "arrived":
            p.arrival_time = now
        elif ev.new_status == "onboard":
            p.boarding_time = now
        elif ev.new_status == "dropped_off":
            p.dropoff_time = now

        p.updated_at = datetime.utcnow()

        event_rec = JourneyEvent(
            trip_id=payload.trip_id,
            passenger_id=p.id,
            event_type=ev.event_type,
            previous_status=prev_status,
            new_status=ev.new_status,
            event_timestamp=now,
            performed_by=ev.performed_by or "conductor",
            notes=ev.notes,
            idempotency_key=ev.idempotency_key,
            sync_status="synced"
        )
        db.add(event_rec)
        synced_items.append(BatchSyncResultItem(
            idempotency_key=ev.idempotency_key,
            status="success",
            passenger_id=p.id,
            current_status=p.current_status
        ))

    db.commit()
    stats = compute_trip_stats(trip, db)
    return BatchSyncResponse(
        processed_count=len(synced_items),
        synced_events=synced_items,
        dashboard_stats=stats
    )

# --- Sample Manifest & Reporting ---

@router.get("/sample-manifest")
def download_sample_manifest():
    pdf_path = os.path.join(settings.UPLOAD_DIR, "sample_passenger_manifest.pdf")
    generate_sample_manifest_pdf(pdf_path)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="sample_passenger_manifest.pdf"
    )

@router.get("/trips/{trip_id}/export-report")
def export_report(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    passengers = db.query(Passenger).filter(Passenger.trip_id == trip_id).all()
    stats = compute_trip_stats(trip, db)

    return {
        "trip_id": trip.id,
        "route": trip.route_name,
        "bus_number": trip.bus_number,
        "journey_date": trip.journey_date,
        "status": trip.status,
        "stats": stats.model_dump(),
        "passengers": [
            {
                "seat": p.seat_number,
                "name": p.name,
                "phone": p.phone_number,
                "boarding": p.boarding_stop_name,
                "dropoff": p.dropoff_stop_name,
                "status": p.current_status,
                "arrival_time": p.arrival_time.isoformat() if p.arrival_time else None,
                "boarding_time": p.boarding_time.isoformat() if p.boarding_time else None,
                "dropoff_time": p.dropoff_time.isoformat() if p.dropoff_time else None,
            }
            for p in passengers
        ]
    }
