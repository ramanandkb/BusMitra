export type JourneyStatus = 'awaiting_boarding' | 'arrived' | 'onboard' | 'dropped_off';

export interface DashboardStats {
  total_passengers: number;
  arrived: number;
  boarded: number;
  onboard: number;
  dropped_off: number;
  awaiting_boarding: number;
  boarding_progress_pct: number;
  dropping_progress_pct: number;
}

export interface Trip {
  id: string;
  route_name: string;
  bus_number: string;
  journey_date: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  total_seats: number;
  seat_layout_type: string;
  created_at: string;
  updated_at: string;
  stats?: DashboardStats;
}

export interface Passenger {
  id: string;
  trip_id: string;
  booking_reference?: string;
  name: string;
  seat_number?: string;
  phone_number?: string;
  boarding_stop_id?: string;
  boarding_stop_name: string;
  dropoff_stop_id?: string;
  dropoff_stop_name: string;
  current_status: JourneyStatus;
  arrival_time?: string;
  boarding_time?: string;
  dropoff_time?: string;
  validation_warnings?: string;
  created_at: string;
  updated_at: string;
}

export interface BoardingGroup {
  boarding_stop_name: string;
  total_expected: number;
  arrived: number;
  boarded: number;
  pending: number;
  passengers: Passenger[];
}

export interface DroppingGroup {
  dropoff_stop_name: string;
  total_expected: number;
  currently_onboard: number;
  dropped_off: number;
  awaiting_dropoff: number;
  passengers: Passenger[];
}

export interface SeatMapItem {
  seat_number: string;
  row: number;
  column: number;
  tier?: 'lower' | 'upper';
  is_aisle?: boolean;
  is_driver?: boolean;
  is_door?: boolean;
  status: 'unassigned' | JourneyStatus;
  passenger?: Passenger;
}

export interface SeatMapResponse {
  trip_id: string;
  layout_type: string;
  total_seats: number;
  rows: number;
  columns: number;
  seats: SeatMapItem[];
}

export interface JourneyEvent {
  id?: string;
  trip_id: string;
  passenger_id: string;
  event_type: 'arrival' | 'boarding' | 'dropoff' | 'status_correction';
  previous_status?: JourneyStatus;
  new_status: JourneyStatus;
  event_timestamp?: string;
  performed_by?: string;
  notes?: string;
  idempotency_key: string;
  sync_status?: 'local_pending' | 'synced' | 'failed';
}

export interface ExtractedPassenger {
  name: string;
  seat_number?: string;
  phone_number?: string;
  boarding_point: string;
  dropoff_point: string;
  booking_reference?: string;
  confidence_score: number;
  validation_status: 'valid' | 'warning' | 'duplicate' | 'missing_field';
  warnings: string[];
}

export interface ManifestExtractResponse {
  filename: string;
  detected_route?: string;
  detected_bus_number?: string;
  detected_journey_date?: string;
  total_extracted: number;
  valid_count: number;
  warning_count: number;
  duplicate_count: number;
  passengers: ExtractedPassenger[];
}
