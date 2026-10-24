from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

# --- Trip Schemas ---
class TripBase(BaseModel):
    route_name: str = Field(..., description="Route name e.g. Pune to Bangalore")
    bus_number: str = Field(..., description="Bus plate number e.g. MH 12 QX 4521")
    journey_date: str = Field(..., description="Date of journey e.g. 2026-10-25")
    total_seats: int = Field(default=40, description="Total seating capacity")
    seat_layout_type: str = Field(default="2x2_seater", description="Layout format")

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    route_name: Optional[str] = None
    bus_number: Optional[str] = None
    journey_date: Optional[str] = None
    status: Optional[str] = None
    total_seats: Optional[int] = None
    seat_layout_type: Optional[str] = None

class DashboardStats(BaseModel):
    total_passengers: int = 0
    arrived: int = 0
    boarded: int = 0
    onboard: int = 0
    dropped_off: int = 0
    awaiting_boarding: int = 0
    boarding_progress_pct: float = 0.0
    dropping_progress_pct: float = 0.0

class TripResponse(TripBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    stats: Optional[DashboardStats] = None

# --- Stop Schemas ---
class StopBase(BaseModel):
    stop_type: str  # boarding, dropping
    name: str
    sequence_order: int = 0
    scheduled_time: Optional[str] = None

class StopCreate(StopBase):
    pass

class StopResponse(StopBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trip_id: str
    created_at: datetime

# --- Passenger Schemas ---
class PassengerBase(BaseModel):
    name: str
    seat_number: Optional[str] = None
    phone_number: Optional[str] = None
    boarding_stop_name: str
    dropoff_stop_name: str
    booking_reference: Optional[str] = None

class PassengerCreate(PassengerBase):
    boarding_stop_id: Optional[str] = None
    dropoff_stop_id: Optional[str] = None
    current_status: Optional[str] = "awaiting_boarding"

class PassengerUpdate(BaseModel):
    name: Optional[str] = None
    seat_number: Optional[str] = None
    phone_number: Optional[str] = None
    boarding_stop_name: Optional[str] = None
    dropoff_stop_name: Optional[str] = None
    current_status: Optional[str] = None
    booking_reference: Optional[str] = None

class PassengerResponse(PassengerBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trip_id: str
    boarding_stop_id: Optional[str] = None
    dropoff_stop_id: Optional[str] = None
    current_status: str
    arrival_time: Optional[datetime] = None
    boarding_time: Optional[datetime] = None
    dropoff_time: Optional[datetime] = None
    validation_warnings: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# --- Grouped Responses for Boarding and Dropping ---
class BoardingGroupResponse(BaseModel):
    boarding_stop_name: str
    total_expected: int
    arrived: int
    boarded: int
    pending: int
    passengers: List[PassengerResponse]

class DroppingGroupResponse(BaseModel):
    dropoff_stop_name: str
    total_expected: int
    currently_onboard: int
    dropped_off: int
    awaiting_dropoff: int
    passengers: List[PassengerResponse]

# --- Seat Map Schemas ---
class SeatMapItem(BaseModel):
    seat_number: str
    row: int
    column: int
    tier: Optional[str] = "lower"  # lower / upper for sleeper
    is_aisle: bool = False
    is_driver: bool = False
    is_door: bool = False
    status: str = "unassigned"  # unassigned, awaiting_boarding, arrived, onboard, dropped_off
    passenger: Optional[PassengerResponse] = None

class SeatMapResponse(BaseModel):
    trip_id: str
    layout_type: str
    total_seats: int
    rows: int
    columns: int
    seats: List[SeatMapItem]

# --- Journey Event Schemas ---
class JourneyEventCreate(BaseModel):
    passenger_id: str
    event_type: str  # arrival, boarding, dropoff, status_correction
    new_status: str
    notes: Optional[str] = None
    performed_by: Optional[str] = "conductor"
    idempotency_key: Optional[str] = None
    event_timestamp: Optional[datetime] = None

class JourneyEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trip_id: str
    passenger_id: str
    event_type: str
    previous_status: Optional[str] = None
    new_status: str
    event_timestamp: datetime
    performed_by: str
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None
    sync_status: str

# --- Offline Batch Sync Schemas ---
class BatchSyncRequest(BaseModel):
    trip_id: str
    events: List[JourneyEventCreate]

class BatchSyncResultItem(BaseModel):
    idempotency_key: Optional[str]
    status: str  # success, duplicate, rejected
    message: Optional[str] = None
    passenger_id: str
    current_status: str

class BatchSyncResponse(BaseModel):
    processed_count: int
    synced_events: List[BatchSyncResultItem]
    dashboard_stats: DashboardStats

# --- Manifest Upload & Confirmation Schemas ---
class ExtractedPassenger(BaseModel):
    name: str
    seat_number: Optional[str] = None
    phone_number: Optional[str] = None
    boarding_point: str
    dropoff_point: str
    booking_reference: Optional[str] = None
    confidence_score: float = 1.0
    validation_status: str = "valid"  # valid, warning, duplicate, missing_field
    warnings: List[str] = []

class ManifestExtractResponse(BaseModel):
    filename: str
    detected_route: Optional[str] = None
    detected_bus_number: Optional[str] = None
    detected_journey_date: Optional[str] = None
    total_extracted: int
    valid_count: int
    warning_count: int
    duplicate_count: int
    passengers: List[ExtractedPassenger]

class ManifestConfirmRequest(BaseModel):
    route_name: Optional[str] = None
    bus_number: Optional[str] = None
    journey_date: Optional[str] = None
    passengers: List[PassengerBase]
