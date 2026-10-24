import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react-native';
import { useApp } from '../state/AppContext';

interface HeaderProps {
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
  const { activeTrip, isOnline, offlineQueueCount, syncNow, isLoading } = useApp();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Text style={styles.appName}>BUS PASSENGER ASSISTANT</Text>
          <Text style={styles.tripRoute} numberOfLines={1}>
            {activeTrip ? activeTrip.route_name : 'No Active Trip'}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isOnline ? '#D1FAE5' : '#FEE2E2' },
            ]}
          >
            {isOnline ? (
              <Wifi size={14} color="#059669" />
            ) : (
              <WifiOff size={14} color="#DC2626" />
            )}
            <Text
              style={[
                styles.statusText,
                { color: isOnline ? '#059669' : '#DC2626' },
              ]}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          {/* Sync Queue or Refresh Button */}
          {offlineQueueCount > 0 ? (
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={syncNow}
              disabled={isLoading}
            >
              <RefreshCw size={14} color="#FFFFFF" />
              <Text style={styles.syncBtnText}>{offlineQueueCount} Sync</Text>
            </TouchableOpacity>
          ) : (
            onRefresh && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {activeTrip && (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Bus: {activeTrip.bus_number}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>Date: {activeTrip.journey_date}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{activeTrip.status.toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E3A8A', // Deep navy
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flex: 1,
    marginRight: 10,
  },
  appName: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tripRoute: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 7,
    borderRadius: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '500',
  },
  metaDot: {
    color: '#60A5FA',
    marginHorizontal: 6,
    fontSize: 10,
  },
});
