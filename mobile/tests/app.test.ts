import { describe, it } from 'node:test';
import assert from 'node:assert';
import { STATUS_CONFIG, cleanPhoneNumber, formatTime } from '../src/utils/helpers';
import {
  initDatabase,
  saveLocalTrip,
  saveLocalPassengers,
  getLocalPassengers,
  queueOfflineEvent,
  getPendingOfflineEvents,
  markOfflineEventsSynced,
} from '../src/database/sqlite';
import { Trip, Passenger, JourneyEvent } from '../src/types';

describe('Bus Passenger Assistant - Utility Tests', () => {
  it('should clean phone numbers correctly removing formatting characters', () => {
    assert.strictEqual(cleanPhoneNumber('+91 98230-12345'), '+919823012345');
    assert.strictEqual(cleanPhoneNumber('(982) 301-2345'), '9823012345');
    assert.strictEqual(cleanPhoneNumber(''), '');
    assert.strictEqual(cleanPhoneNumber(undefined), '');
  });

  it('should have distinct status configuration for all journey states', () => {
    assert.ok(STATUS_CONFIG.awaiting_boarding.color);
    assert.ok(STATUS_CONFIG.arrived.color);
    assert.ok(STATUS_CONFIG.onboard.color);
    assert.ok(STATUS_CONFIG.dropped_off.color);
    assert.ok(STATUS_CONFIG.unassigned.color);

    // Verify distinct colors
    assert.notStrictEqual(STATUS_CONFIG.awaiting_boarding.color, STATUS_CONFIG.onboard.color);
    assert.notStrictEqual(STATUS_CONFIG.arrived.color, STATUS_CONFIG.onboard.color);
    assert.notStrictEqual(STATUS_CONFIG.onboard.color, STATUS_CONFIG.dropped_off.color);
  });

  it('should format ISO timestamps properly', () => {
    const formatted = formatTime('2026-10-25T20:30:00Z');
    assert.ok(formatted !== '--:--');
    assert.strictEqual(formatTime(undefined), '--:--');
  });
});

describe('Bus Passenger Assistant - Offline SQLite Persistence Tests', () => {
  const dummyTrip: Trip = {
    id: 'test-trip-001',
    route_name: 'Pune to Bangalore',
    bus_number: 'MH 12 QX 4521',
    journey_date: '2026-10-25',
    status: 'active',
    total_seats: 40,
    seat_layout_type: '2x2_seater',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const dummyPassengers: Passenger[] = [
    {
      id: 'p-1',
      trip_id: 'test-trip-001',
      name: 'Rajesh Sharma',
      seat_number: '1A',
      phone_number: '9823012345',
      boarding_stop_name: 'Pune - Swargate',
      dropoff_stop_name: 'Bangalore - Majestic',
      current_status: 'awaiting_boarding',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'p-2',
      trip_id: 'test-trip-001',
      name: 'Amit Patil',
      seat_number: '1B',
      phone_number: '9822198765',
      boarding_stop_name: 'Pune - Wakad',
      dropoff_stop_name: 'Hubli',
      current_status: 'arrived',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('should initialize database and save trip', async () => {
    await initDatabase();
    await saveLocalTrip(dummyTrip);
  });

  it('should save and retrieve passengers locally', async () => {
    await saveLocalPassengers(dummyPassengers);
    const retrieved = await getLocalPassengers('test-trip-001');
    assert.strictEqual(retrieved.length, 2);
    assert.strictEqual(retrieved[0].name, 'Rajesh Sharma');
    assert.strictEqual(retrieved[1].seat_number, '1B');
  });

  it('should queue offline events with idempotency keys and retrieve them', async () => {
    const event1: JourneyEvent = {
      trip_id: 'test-trip-001',
      passenger_id: 'p-1',
      event_type: 'arrival',
      new_status: 'arrived',
      idempotency_key: 'test_key_001',
      sync_status: 'local_pending',
    };

    const event2: JourneyEvent = {
      trip_id: 'test-trip-001',
      passenger_id: 'p-1',
      event_type: 'boarding',
      new_status: 'onboard',
      idempotency_key: 'test_key_002',
      sync_status: 'local_pending',
    };

    await queueOfflineEvent(event1);
    await queueOfflineEvent(event2);

    const pending = await getPendingOfflineEvents();
    assert.ok(pending.length >= 2);
    assert.ok(pending.some((e) => e.idempotency_key === 'test_key_001'));
    assert.ok(pending.some((e) => e.idempotency_key === 'test_key_002'));
  });

  it('should safely mark offline events synced and remove from pending queue', async () => {
    await markOfflineEventsSynced(['test_key_001']);
    const pending = await getPendingOfflineEvents();
    assert.ok(!pending.some((e) => e.idempotency_key === 'test_key_001'));
    assert.ok(pending.some((e) => e.idempotency_key === 'test_key_002'));
  });
});
