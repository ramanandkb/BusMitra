import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Trip,
  Passenger,
  BoardingGroup,
  DroppingGroup,
  SeatMapResponse,
  JourneyStatus,
  JourneyEvent,
} from '../types';
import * as api from '../services/api';
import {
  initDatabase,
  saveLocalTrip,
  saveLocalPassengers,
  getLocalPassengers,
  queueOfflineEvent,
  getPendingOfflineEvents,
} from '../database/sqlite';
import { synchronizePendingEvents } from '../services/sync';

interface AppContextType {
  activeTrip: Trip | null;
  passengers: Passenger[];
  boardingGroups: BoardingGroup[];
  droppingGroups: DroppingGroup[];
  seatMap: SeatMapResponse | null;
  offlineQueueCount: number;
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  selectedPassenger: Passenger | null;
  setSelectedPassenger: (p: Passenger | null) => void;
  loadTripData: (tripId?: string) => Promise<void>;
  markArrived: (passengerId: string) => Promise<void>;
  markBoarded: (passengerId: string) => Promise<void>;
  markDroppedOff: (passengerId: string) => Promise<void>;
  correctStatus: (passengerId: string, newStatus: JourneyStatus) => Promise<void>;
  syncNow: () => Promise<void>;
  setActiveTrip: (trip: Trip | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [boardingGroups, setBoardingGroups] = useState<BoardingGroup[]>([]);
  const [droppingGroups, setDroppingGroups] = useState<DroppingGroup[]>([]);
  const [seatMap, setSeatMap] = useState<SeatMapResponse | null>(null);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);

  // Initialize SQLite and load initial data
  useEffect(() => {
    async function init() {
      await initDatabase();
      await updateOfflineQueueCount();
      await loadTripData();
    }
    init();
  }, []);

  const updateOfflineQueueCount = async () => {
    try {
      const pending = await getPendingOfflineEvents();
      setOfflineQueueCount(pending.length);
    } catch {}
  };

  const loadTripData = async (targetTripId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let trip: Trip | null = null;
      if (targetTripId) {
        const trips = await api.fetchTrips();
        trip = trips.find((t) => t.id === targetTripId) || null;
      } else {
        trip = await api.fetchActiveTrip();
      }

      if (trip) {
        setActiveTrip(trip);
        setIsOnline(true);
        await saveLocalTrip(trip);

        // Fetch passengers, boarding, dropping, and seat map in parallel
        const [passengersData, boardingData, droppingData, seatMapData] = await Promise.all([
          api.fetchPassengers(trip.id),
          api.fetchBoardingPoints(trip.id),
          api.fetchDroppingPoints(trip.id),
          api.fetchSeatMap(trip.id),
        ]);

        setPassengers(passengersData);
        setBoardingGroups(boardingData);
        setDroppingGroups(droppingData);
        setSeatMap(seatMapData);
        await saveLocalPassengers(passengersData);
      }
    } catch (err: any) {
      console.warn('Network load failed, checking local SQLite cache:', err.message);
      setIsOnline(false);
      setError(err.message || 'Could not connect to server');

      // Attempt to load from local cache if we already know a trip
      if (activeTrip?.id) {
        const localP = await getLocalPassengers(activeTrip.id);
        if (localP.length > 0) {
          setPassengers(localP);
          regenerateGroupsAndSeatMap(activeTrip, localP);
        }
      }
    } finally {
      setIsLoading(false);
      await updateOfflineQueueCount();
    }
  };

  // Helper to re-derive groups and seat map locally when offline
  const regenerateGroupsAndSeatMap = (trip: Trip, pList: Passenger[]) => {
    // Boarding points grouping
    const bMap = new Map<string, Passenger[]>();
    for (const p of pList) {
      const stop = p.boarding_stop_name || 'General Pickup';
      if (!bMap.has(stop)) bMap.set(stop, []);
      bMap.get(stop)!.push(p);
    }
    const bGroups: BoardingGroup[] = Array.from(bMap.entries()).map(([name, list]) => ({
      boarding_stop_name: name,
      total_expected: list.length,
      arrived: list.filter((p) => ['arrived', 'onboard', 'dropped_off'].includes(p.current_status)).length,
      boarded: list.filter((p) => ['onboard', 'dropped_off'].includes(p.current_status)).length,
      pending: list.filter((p) => p.current_status === 'awaiting_boarding').length,
      passengers: list,
    }));
    setBoardingGroups(bGroups);

    // Dropping points grouping
    const dMap = new Map<string, Passenger[]>();
    for (const p of pList) {
      const stop = p.dropoff_stop_name || 'General Destination';
      if (!dMap.has(stop)) dMap.set(stop, []);
      dMap.get(stop)!.push(p);
    }
    const dGroups: DroppingGroup[] = Array.from(dMap.entries()).map(([name, list]) => ({
      dropoff_stop_name: name,
      total_expected: list.length,
      currently_onboard: list.filter((p) => p.current_status === 'onboard').length,
      dropped_off: list.filter((p) => p.current_status === 'dropped_off').length,
      awaiting_dropoff: list.filter((p) => p.current_status !== 'dropped_off').length,
      passengers: list,
    }));
    setDroppingGroups(dGroups);
  };

  const handleStatusChange = async (
    passengerId: string,
    eventType: 'arrival' | 'boarding' | 'dropoff' | 'status_correction',
    newStatus: JourneyStatus
  ) => {
    if (!activeTrip) return;

    const passenger = passengers.find((p) => p.id === passengerId);
    if (!passenger) return;

    const prevStatus = passenger.current_status;
    const nowIso = new Date().toISOString();
    const idempotencyKey = `evt_${passengerId}_${eventType}_${Date.now()}`;

    // Optimistically update local passenger state
    const updatedPassenger: Passenger = {
      ...passenger,
      current_status: newStatus,
      arrival_time: newStatus === 'arrived' ? nowIso : passenger.arrival_time,
      boarding_time: newStatus === 'onboard' ? nowIso : passenger.boarding_time,
      dropoff_time: newStatus === 'dropped_off' ? nowIso : passenger.dropoff_time,
      updated_at: nowIso,
    };

    const newPassengers = passengers.map((p) => (p.id === passengerId ? updatedPassenger : p));
    setPassengers(newPassengers);
    regenerateGroupsAndSeatMap(activeTrip, newPassengers);

    if (selectedPassenger?.id === passengerId) {
      setSelectedPassenger(updatedPassenger);
    }

    // Update seat map item immediately
    if (seatMap) {
      const updatedSeats = seatMap.seats.map((s) => {
        if (s.passenger?.id === passengerId) {
          return {
            ...s,
            status: newStatus,
            passenger: updatedPassenger,
          };
        }
        return s;
      });
      setSeatMap({ ...seatMap, seats: updatedSeats });
    }

    // Persist to local SQLite
    await saveLocalPassengers(newPassengers);

    const eventPayload: JourneyEvent = {
      trip_id: activeTrip.id,
      passenger_id: passengerId,
      event_type: eventType,
      previous_status: prevStatus,
      new_status: newStatus,
      event_timestamp: nowIso,
      performed_by: 'conductor',
      idempotency_key: idempotencyKey,
      sync_status: 'local_pending',
    };

    // Try posting to backend
    try {
      await api.postJourneyEvent(activeTrip.id, eventPayload);
      setIsOnline(true);
    } catch {
      // Queue offline
      console.log('Queuing event offline in SQLite...');
      await queueOfflineEvent(eventPayload);
      setIsOnline(false);
    } finally {
      await updateOfflineQueueCount();
    }
  };

  const markArrived = async (passengerId: string) => {
    await handleStatusChange(passengerId, 'arrival', 'arrived');
  };

  const markBoarded = async (passengerId: string) => {
    await handleStatusChange(passengerId, 'boarding', 'onboard');
  };

  const markDroppedOff = async (passengerId: string) => {
    await handleStatusChange(passengerId, 'dropoff', 'dropped_off');
  };

  const correctStatus = async (passengerId: string, newStatus: JourneyStatus) => {
    await handleStatusChange(passengerId, 'status_correction', newStatus);
  };

  const syncNow = async () => {
    if (!activeTrip) return;
    setIsLoading(true);
    try {
      const result = await synchronizePendingEvents(activeTrip.id);
      setIsOnline(true);
      await loadTripData(activeTrip.id);
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setIsLoading(false);
      await updateOfflineQueueCount();
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTrip,
        passengers,
        boardingGroups,
        droppingGroups,
        seatMap,
        offlineQueueCount,
        isOnline,
        isLoading,
        error,
        selectedPassenger,
        setSelectedPassenger,
        loadTripData,
        markArrived,
        markBoarded,
        markDroppedOff,
        correctStatus,
        syncNow,
        setActiveTrip,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
