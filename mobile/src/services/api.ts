import { Platform } from 'react-native';
import {
  Trip,
  Passenger,
  BoardingGroup,
  DroppingGroup,
  SeatMapResponse,
  JourneyEvent,
  ManifestExtractResponse,
  ExtractedPassenger,
} from '../types';
import { getLocalSetting, setLocalSetting } from '../database/sqlite';

// Default endpoint: 10.0.2.2 for Android emulator, localhost for web/desktop
const DEFAULT_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

let cachedBaseUrl = DEFAULT_URL;

export async function getApiBaseUrl(): Promise<string> {
  try {
    const saved = await getLocalSetting('api_base_url');
    if (saved) {
      cachedBaseUrl = saved;
      return saved;
    }
  } catch {}
  return cachedBaseUrl;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  cachedBaseUrl = url.replace(/\/+$/, '');
  await setLocalSetting('api_base_url', cachedBaseUrl);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      let errorDetail = `Server Error (${res.status})`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.detail) errorDetail = parsed.detail;
      } catch {}
      throw new Error(errorDetail);
    }

    if (res.status === 204) {
      return null as T;
    }

    return await res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Network request timed out. Please check server URL and connection.');
    }
    throw error;
  }
}

// --- Trip API ---

export async function fetchActiveTrip(): Promise<Trip> {
  return request<Trip>('/api/trips/active');
}

export async function fetchTrips(statusFilter?: string): Promise<Trip[]> {
  const query = statusFilter ? `?status_filter=${statusFilter}` : '';
  return request<Trip[]>(`/api/trips${query}`);
}

export async function createTrip(data: {
  route_name: string;
  bus_number: string;
  journey_date: string;
  total_seats?: number;
  seat_layout_type?: string;
}): Promise<Trip> {
  return request<Trip>('/api/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function activateTrip(tripId: string): Promise<Trip> {
  return request<Trip>(`/api/trips/${tripId}/activate`, {
    method: 'PUT',
  });
}

export async function completeTrip(tripId: string): Promise<Trip> {
  return request<Trip>(`/api/trips/${tripId}/complete`, {
    method: 'PUT',
  });
}

// --- Passenger API ---

export async function fetchPassengers(
  tripId: string,
  params: { search?: string; status?: string } = {}
): Promise<Passenger[]> {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.status && params.status !== 'all') queryParams.append('status', params.status);
  const q = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return request<Passenger[]>(`/api/trips/${tripId}/passengers${q}`);
}

export async function addPassenger(
  tripId: string,
  passenger: Partial<Passenger>
): Promise<Passenger> {
  return request<Passenger>(`/api/trips/${tripId}/passengers`, {
    method: 'POST',
    body: JSON.stringify(passenger),
  });
}

export async function updatePassenger(
  tripId: string,
  passengerId: string,
  data: Partial<Passenger>
): Promise<Passenger> {
  return request<Passenger>(`/api/trips/${tripId}/passengers/${passengerId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// --- Boarding & Dropping Points ---

export async function fetchBoardingPoints(tripId: string): Promise<BoardingGroup[]> {
  return request<BoardingGroup[]>(`/api/trips/${tripId}/boarding-points`);
}

export async function fetchDroppingPoints(tripId: string): Promise<DroppingGroup[]> {
  return request<DroppingGroup[]>(`/api/trips/${tripId}/dropping-points`);
}

// --- Seat Map API ---

export async function fetchSeatMap(tripId: string): Promise<SeatMapResponse> {
  return request<SeatMapResponse>(`/api/trips/${tripId}/seat-map`);
}

// --- Events & Offline Batch Sync ---

export async function postJourneyEvent(
  tripId: string,
  event: JourneyEvent
): Promise<JourneyEvent> {
  return request<JourneyEvent>(`/api/trips/${tripId}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function postBatchSync(
  tripId: string,
  events: JourneyEvent[]
): Promise<any> {
  return request('/api/sync/batch', {
    method: 'POST',
    body: JSON.stringify({
      trip_id: tripId,
      events,
    }),
  });
}

// --- PDF Manifest Upload & Confirmation ---

export async function uploadManifestFile(
  tripId: string,
  fileUri: string,
  fileName: string
): Promise<ManifestExtractResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/trips/${tripId}/manifest/upload`;

  const formData = new FormData();
  // React Native FormData format
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: 'application/pdf',
  } as any);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let msg = `Upload failed (${res.status})`;
    try {
      const p = JSON.parse(errorText);
      if (p.detail) msg = p.detail;
    } catch {}
    throw new Error(msg);
  }

  return await res.json();
}

export async function confirmManifest(
  tripId: string,
  payload: {
    route_name?: string;
    bus_number?: string;
    journey_date?: string;
    passengers: {
      name: string;
      seat_number?: string;
      phone_number?: string;
      boarding_stop_name: string;
      dropoff_stop_name: string;
      booking_reference?: string;
    }[];
  }
): Promise<Trip> {
  return request<Trip>(`/api/trips/${tripId}/manifest/confirm`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
