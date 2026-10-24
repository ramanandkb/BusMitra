import {
  getPendingOfflineEvents,
  markOfflineEventsSynced,
  saveLocalPassengers,
} from '../database/sqlite';
import { postBatchSync, fetchPassengers, fetchActiveTrip } from './api';
import { JourneyEvent } from '../types';

export interface SyncResult {
  syncedCount: number;
  duplicateCount: number;
  failedCount: number;
  error?: string;
}

export async function synchronizePendingEvents(tripId: string): Promise<SyncResult> {
  const pending = await getPendingOfflineEvents();
  if (!pending || pending.length === 0) {
    return { syncedCount: 0, duplicateCount: 0, failedCount: 0 };
  }

  const tripEvents = pending.filter((e) => e.trip_id === tripId);
  if (tripEvents.length === 0) {
    return { syncedCount: 0, duplicateCount: 0, failedCount: 0 };
  }

  try {
    const res = await postBatchSync(tripId, tripEvents);

    const successfulKeys: string[] = [];
    let synced = 0;
    let duplicates = 0;
    let failed = 0;

    for (const item of res.synced_events || []) {
      if (item.status === 'success') {
        synced++;
        if (item.idempotency_key) successfulKeys.push(item.idempotency_key);
      } else if (item.status === 'duplicate') {
        duplicates++;
        if (item.idempotency_key) successfulKeys.push(item.idempotency_key);
      } else {
        failed++;
      }
    }

    if (successfulKeys.length > 0) {
      await markOfflineEventsSynced(successfulKeys);
    }

    // Refresh and persist latest passenger states
    try {
      const freshPassengers = await fetchPassengers(tripId);
      await saveLocalPassengers(freshPassengers);
    } catch {}

    return {
      syncedCount: synced,
      duplicateCount: duplicates,
      failedCount: failed,
    };
  } catch (err: any) {
    return {
      syncedCount: 0,
      duplicateCount: 0,
      failedCount: tripEvents.length,
      error: err.message || 'Synchronization failed',
    };
  }
}
