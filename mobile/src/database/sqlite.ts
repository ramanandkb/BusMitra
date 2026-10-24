import { Trip, Passenger, JourneyEvent } from '../types';

let dbInstance: any = null;

let isWebPlatform = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Platform } = require('react-native');
  isWebPlatform = Platform?.OS === 'web';
} catch {
  isWebPlatform = false;
}

// In-memory fallback for web, preview, or testing environments
const memoryStore = {
  trips: new Map<string, Trip>(),
  passengers: new Map<string, Passenger[]>(),
  offlineEvents: [] as JourneyEvent[],
  settings: new Map<string, string>(),
};

export async function initDatabase(): Promise<void> {
  if (isWebPlatform) {
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SQLite = require('expo-sqlite');
    if (SQLite && typeof SQLite.openDatabaseSync === 'function') {
      dbInstance = SQLite.openDatabaseSync('bus_assistant.db');
      dbInstance.execSync(`
        CREATE TABLE IF NOT EXISTS trips (
          id TEXT PRIMARY KEY,
          route_name TEXT,
          bus_number TEXT,
          journey_date TEXT,
          status TEXT,
          total_seats INTEGER,
          seat_layout_type TEXT,
          created_at TEXT,
          updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS passengers (
          id TEXT PRIMARY KEY,
          trip_id TEXT,
          booking_reference TEXT,
          name TEXT,
          seat_number TEXT,
          phone_number TEXT,
          boarding_stop_name TEXT,
          dropoff_stop_name TEXT,
          current_status TEXT,
          arrival_time TEXT,
          boarding_time TEXT,
          dropoff_time TEXT,
          updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS offline_events (
          id TEXT PRIMARY KEY,
          trip_id TEXT,
          passenger_id TEXT,
          event_type TEXT,
          new_status TEXT,
          idempotency_key TEXT UNIQUE,
          event_timestamp TEXT,
          sync_status TEXT
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
    }
  } catch (err) {
    console.warn('SQLite init warning (using memory fallback):', err);
  }
}

export async function saveLocalTrip(trip: Trip): Promise<void> {
  memoryStore.trips.set(trip.id, trip);
  if (!dbInstance) return;

  try {
    dbInstance.runSync(
      `INSERT OR REPLACE INTO trips (id, route_name, bus_number, journey_date, status, total_seats, seat_layout_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trip.id,
        trip.route_name,
        trip.bus_number,
        trip.journey_date,
        trip.status,
        trip.total_seats,
        trip.seat_layout_type,
        trip.created_at,
        trip.updated_at,
      ]
    );
  } catch (err) {
    console.warn('Failed to save trip to SQLite:', err);
  }
}

export async function saveLocalPassengers(passengers: Passenger[]): Promise<void> {
  if (passengers.length > 0) {
    memoryStore.passengers.set(passengers[0].trip_id, passengers);
  }
  if (!dbInstance) return;

  try {
    for (const p of passengers) {
      dbInstance.runSync(
        `INSERT OR REPLACE INTO passengers 
         (id, trip_id, booking_reference, name, seat_number, phone_number, boarding_stop_name, dropoff_stop_name, current_status, arrival_time, boarding_time, dropoff_time, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.trip_id,
          p.booking_reference || '',
          p.name,
          p.seat_number || '',
          p.phone_number || '',
          p.boarding_stop_name,
          p.dropoff_stop_name,
          p.current_status,
          p.arrival_time || '',
          p.boarding_time || '',
          p.dropoff_time || '',
          p.updated_at,
        ]
      );
    }
  } catch (err) {
    console.warn('Failed to save passengers to SQLite:', err);
  }
}

export async function getLocalPassengers(tripId: string): Promise<Passenger[]> {
  if (!dbInstance) {
    return memoryStore.passengers.get(tripId) || [];
  }

  try {
    const rows = dbInstance.getAllSync(
      `SELECT * FROM passengers WHERE trip_id = ? ORDER BY seat_number ASC`,
      [tripId]
    ) as any[];
    return rows.map((r) => ({
      id: r.id,
      trip_id: r.trip_id,
      booking_reference: r.booking_reference,
      name: r.name,
      seat_number: r.seat_number,
      phone_number: r.phone_number,
      boarding_stop_name: r.boarding_stop_name,
      dropoff_stop_name: r.dropoff_stop_name,
      current_status: r.current_status,
      arrival_time: r.arrival_time || undefined,
      boarding_time: r.boarding_time || undefined,
      dropoff_time: r.dropoff_time || undefined,
      created_at: r.updated_at,
      updated_at: r.updated_at,
    }));
  } catch {
    return memoryStore.passengers.get(tripId) || [];
  }
}

export async function queueOfflineEvent(event: JourneyEvent): Promise<void> {
  memoryStore.offlineEvents.push(event);
  if (!dbInstance) return;

  try {
    const eventId = event.id || Math.random().toString(36).substring(2);
    dbInstance.runSync(
      `INSERT OR REPLACE INTO offline_events 
       (id, trip_id, passenger_id, event_type, new_status, idempotency_key, event_timestamp, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        event.trip_id,
        event.passenger_id,
        event.event_type,
        event.new_status,
        event.idempotency_key,
        event.event_timestamp || new Date().toISOString(),
        'local_pending',
      ]
    );
  } catch (err) {
    console.warn('Failed to queue offline event in SQLite:', err);
  }
}

export async function getPendingOfflineEvents(): Promise<JourneyEvent[]> {
  if (!dbInstance) {
    return memoryStore.offlineEvents.filter((e) => e.sync_status === 'local_pending');
  }

  try {
    const rows = dbInstance.getAllSync(
      `SELECT * FROM offline_events WHERE sync_status = 'local_pending' ORDER BY event_timestamp ASC`
    ) as any[];
    return rows.map((r) => ({
      id: r.id,
      trip_id: r.trip_id,
      passenger_id: r.passenger_id,
      event_type: r.event_type,
      new_status: r.new_status,
      idempotency_key: r.idempotency_key,
      event_timestamp: r.event_timestamp,
      sync_status: r.sync_status,
    }));
  } catch {
    return memoryStore.offlineEvents.filter((e) => e.sync_status === 'local_pending');
  }
}

export async function markOfflineEventsSynced(keys: string[]): Promise<void> {
  memoryStore.offlineEvents = memoryStore.offlineEvents.filter(
    (e) => !keys.includes(e.idempotency_key)
  );
  if (!dbInstance) return;

  try {
    for (const k of keys) {
      dbInstance.runSync(`DELETE FROM offline_events WHERE idempotency_key = ?`, [k]);
    }
  } catch (err) {
    console.warn('Failed to delete synced offline events:', err);
  }
}

export async function getLocalSetting(key: string, defaultValue = ''): Promise<string> {
  if (!dbInstance) {
    return memoryStore.settings.get(key) ?? defaultValue;
  }

  try {
    const row = dbInstance.getFirstSync(`SELECT value FROM settings WHERE key = ?`, [key]) as any;
    return row ? row.value : defaultValue;
  } catch {
    return memoryStore.settings.get(key) ?? defaultValue;
  }
}

export async function setLocalSetting(key: string, value: string): Promise<void> {
  memoryStore.settings.set(key, value);
  if (!dbInstance) return;

  try {
    dbInstance.runSync(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value]);
  } catch (err) {
    console.warn('Failed to set setting in SQLite:', err);
  }
}
