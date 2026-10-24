from datetime import datetime
import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Trip(Base):
    __tablename__ = "trips"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    route_name = Column(String(255), nullable=False)
    bus_number = Column(String(50), nullable=False)
    journey_date = Column(String(20), nullable=False)
    status = Column(String(20), default="active", nullable=False)  # draft, active, completed, archived
    total_seats = Column(Integer, default=40, nullable=False)
    seat_layout_type = Column(String(50), default="2x2_seater", nullable=False)  # 2x2_seater, 2x1_sleeper
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    passengers = relationship("Passenger", back_populates="trip", cascade="all, delete-orphan")
    stops = relationship("Stop", back_populates="trip", cascade="all, delete-orphan", order_by="Stop.sequence_order")
    events = relationship("JourneyEvent", back_populates="trip", cascade="all, delete-orphan")


class Stop(Base):
    __tablename__ = "stops"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False)
    stop_type = Column(String(20), nullable=False)  # boarding, dropping
    name = Column(String(255), nullable=False)
    sequence_order = Column(Integer, default=0, nullable=False)
    scheduled_time = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    trip = relationship("Trip", back_populates="stops")


class Passenger(Base):
    __tablename__ = "passengers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False)
    booking_reference = Column(String(50), nullable=True)  # PNR
    name = Column(String(255), nullable=False)
    seat_number = Column(String(20), nullable=True)
    phone_number = Column(String(30), nullable=True)
    boarding_stop_id = Column(String(36), ForeignKey("stops.id"), nullable=True)
    boarding_stop_name = Column(String(255), nullable=False)
    dropoff_stop_id = Column(String(36), ForeignKey("stops.id"), nullable=True)
    dropoff_stop_name = Column(String(255), nullable=False)
    current_status = Column(String(30), default="awaiting_boarding", nullable=False)
    # awaiting_boarding -> arrived -> onboard -> dropped_off
    arrival_time = Column(DateTime, nullable=True)
    boarding_time = Column(DateTime, nullable=True)
    dropoff_time = Column(DateTime, nullable=True)
    validation_warnings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    trip = relationship("Trip", back_populates="passengers")
    events = relationship("JourneyEvent", back_populates="passenger", cascade="all, delete-orphan")


class JourneyEvent(Base):
    __tablename__ = "journey_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False)
    passenger_id = Column(String(36), ForeignKey("passengers.id"), nullable=False)
    event_type = Column(String(30), nullable=False)  # arrival, boarding, dropoff, status_correction
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    event_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    performed_by = Column(String(100), default="conductor", nullable=False)
    notes = Column(Text, nullable=True)
    idempotency_key = Column(String(100), unique=True, nullable=True)
    sync_status = Column(String(20), default="synced", nullable=False)  # synced, local_pending, failed

    trip = relationship("Trip", back_populates="events")
    passenger = relationship("Passenger", back_populates="events")
