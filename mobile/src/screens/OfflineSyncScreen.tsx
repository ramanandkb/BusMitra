import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { useApp } from '../state/AppContext';
import { getPendingOfflineEvents } from '../database/sqlite';
import { JourneyEvent } from '../types';
import { formatTime } from '../utils/helpers';

export const OfflineSyncScreen: React.FC = () => {
  const { isOnline, offlineQueueCount, syncNow, isLoading, activeTrip } = useApp();

  const [pendingEvents, setPendingEvents] = useState<JourneyEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    fetchPending();
  }, [offlineQueueCount]);

  const fetchPending = async () => {
    setLoadingEvents(true);
    try {
      const list = await getPendingOfflineEvents();
      setPendingEvents(list);
    } catch {}
    setLoadingEvents(false);
  };

  const handleSyncPress = async () => {
    try {
      await syncNow();
      await fetchPending();
      Alert.alert('Sync Completed', 'All pending offline events have been synchronized with the server.');
    } catch (err: any) {
      Alert.alert('Sync Failed', err.message || 'Could not sync events with backend.');
    }
  };

  return (
    <View style={styles.container}>
      <Header onRefresh={fetchPending} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            {isOnline ? (
              <Wifi size={24} color="#059669" />
            ) : (
              <WifiOff size={24} color="#DC2626" />
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusTitle}>
                {isOnline ? 'Online • Connected to Server' : 'Offline Mode Active'}
              </Text>
              <Text style={styles.statusSub}>
                {isOnline
                  ? 'All changes synchronize immediately.'
                  : 'Changes are safely stored locally in SQLite.'}
              </Text>
            </View>
          </View>

          {/* Sync CTA Button */}
          <TouchableOpacity
            style={[
              styles.syncNowBtn,
              (!isOnline || pendingEvents.length === 0) && styles.syncNowBtnDisabled,
            ]}
            onPress={handleSyncPress}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <RefreshCw size={16} color="#FFFFFF" />
                <Text style={styles.syncNowBtnText}>
                  Synchronize Now ({pendingEvents.length} Pending)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* SQLite Health Info */}
        <View style={styles.infoBox}>
          <Database size={18} color="#1E3A8A" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.infoTitle}>Local Expo SQLite Storage</Text>
            <Text style={styles.infoSub}>
              Active Trip: {activeTrip?.route_name || 'None'} • ACID Transacted
            </Text>
          </View>
        </View>

        {/* Pending Events Queue */}
        <Text style={styles.sectionHeading}>PENDING EVENT QUEUE</Text>
        {loadingEvents && <ActivityIndicator size="small" color="#1E3A8A" style={{ margin: 10 }} />}

        {pendingEvents.length === 0 && !loadingEvents ? (
          <View style={styles.emptyBox}>
            <CheckCircle2 size={32} color="#059669" />
            <Text style={styles.emptyTitle}>Queue is Clear!</Text>
            <Text style={styles.emptySub}>
              All passenger arrivals, boardings, and drop-offs are synchronized.
            </Text>
          </View>
        ) : (
          pendingEvents.map((evt, idx) => (
            <View key={evt.idempotency_key || idx} style={styles.eventCard}>
              <View style={styles.eventTop}>
                <Clock size={16} color="#D97706" />
                <Text style={styles.eventType}>
                  {evt.event_type.replace('_', ' ').toUpperCase()} ➔ {evt.new_status.toUpperCase()}
                </Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>QUEUED</Text>
                </View>
              </View>
              <Text style={styles.eventMeta}>
                Time: {formatTime(evt.event_timestamp)} • Key: {evt.idempotency_key}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statusSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  syncNowBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  syncNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  infoSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventType: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
  },
  eventMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
});
