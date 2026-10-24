import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  AlertTriangle,
  LogOut,
  Users,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { PassengerCard } from '../components/PassengerCard';
import { PassengerDetailModal } from '../components/PassengerDetailModal';
import { useApp } from '../state/AppContext';

export const DroppingScreen: React.FC = () => {
  const {
    droppingGroups,
    isLoading,
    loadTripData,
    markDroppedOff,
    selectedPassenger,
    setSelectedPassenger,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'onboard' | 'dropped'>('all');
  const [collapsedDestinations, setCollapsedDestinations] = useState<Record<string, boolean>>({});

  const toggleCollapse = (destName: string) => {
    setCollapsedDestinations((prev) => ({
      ...prev,
      [destName]: !prev[destName],
    }));
  };

  const handleConfirmDropoff = (passengerId: string, passengerName: string, isOnboard: boolean) => {
    if (!isOnboard) {
      Alert.alert(
        'Confirm Premature Drop-off',
        `Passenger "${passengerName}" is not currently marked as onboard. Are you sure you want to mark them dropped off?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm Drop-off', onPress: () => markDroppedOff(passengerId) },
        ]
      );
      return;
    }
    markDroppedOff(passengerId);
  };

  const filteredGroups = useMemo(() => {
    return droppingGroups.map((group) => {
      const filtered = group.passengers.filter((p) => {
        if (filterMode === 'onboard' && p.current_status !== 'onboard') return false;
        if (filterMode === 'dropped' && p.current_status !== 'dropped_off') return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSeat = p.seat_number?.toLowerCase().includes(q);
          const matchPhone = p.phone_number?.toLowerCase().includes(q);
          if (!matchName && !matchSeat && !matchPhone) return false;
        }
        return true;
      });

      return {
        ...group,
        passengers: filtered,
      };
    });
  }, [droppingGroups, searchQuery, filterMode]);

  return (
    <View style={styles.container}>
      <Header onRefresh={() => loadTripData()} />

      {/* Search and Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination passengers..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterPillsContainer}>
          <TouchableOpacity
            style={[styles.filterPill, filterMode === 'all' && styles.filterPillActive]}
            onPress={() => setFilterMode('all')}
          >
            <Text style={[styles.filterPillText, filterMode === 'all' && styles.filterPillTextActive]}>
              All Destinations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterMode === 'onboard' && styles.filterPillActive]}
            onPress={() => setFilterMode('onboard')}
          >
            <Text style={[styles.filterPillText, filterMode === 'onboard' && styles.filterPillTextActive]}>
              Pending Drop-off (Onboard)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterMode === 'dropped' && styles.filterPillActive]}
            onPress={() => setFilterMode('dropped')}
          >
            <Text style={[styles.filterPillText, filterMode === 'dropped' && styles.filterPillTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Destination Sections */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => loadTripData()} />
        }
      >
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={36} color="#94A3B8" />
            <Text style={styles.emptyText}>No destination points match your search</Text>
          </View>
        ) : (
          filteredGroups.map((group) => {
            const isCollapsed = collapsedDestinations[group.dropoff_stop_name];
            const hasPending = group.currently_onboard > 0;

            return (
              <View key={group.dropoff_stop_name} style={styles.destCard}>
                <TouchableOpacity
                  style={styles.destHeader}
                  onPress={() => toggleCollapse(group.dropoff_stop_name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.destTitleRow}>
                    <MapPin size={20} color="#7C3AED" />
                    <Text style={styles.destName} numberOfLines={1}>
                      {group.dropoff_stop_name}
                    </Text>
                  </View>

                  {/* Warning banner if onboard passengers awaiting dropoff */}
                  {hasPending && (
                    <View style={styles.warningAlert}>
                      <AlertTriangle size={14} color="#D97706" />
                      <Text style={styles.warningAlertText}>
                        {group.currently_onboard} passengers still onboard for this stop!
                      </Text>
                    </View>
                  )}

                  <View style={styles.counterRow}>
                    <View style={styles.counterBadge}>
                      <Text style={styles.counterNum}>{group.total_expected}</Text>
                      <Text style={styles.counterLabel}>Expected</Text>
                    </View>
                    <View style={[styles.counterBadge, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={[styles.counterNum, { color: '#059669' }]}>
                        {group.currently_onboard}
                      </Text>
                      <Text style={[styles.counterLabel, { color: '#059669' }]}>Onboard</Text>
                    </View>
                    <View style={[styles.counterBadge, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={[styles.counterNum, { color: '#7C3AED' }]}>
                        {group.dropped_off}
                      </Text>
                      <Text style={[styles.counterLabel, { color: '#7C3AED' }]}>Dropped</Text>
                    </View>

                    {isCollapsed ? (
                      <ChevronDown size={20} color="#64748B" />
                    ) : (
                      <ChevronUp size={20} color="#64748B" />
                    )}
                  </View>
                </TouchableOpacity>

                {!isCollapsed && (
                  <View style={styles.passengersList}>
                    {group.passengers.length === 0 ? (
                      <Text style={styles.noPassengersText}>
                        No passengers for this destination under current filter.
                      </Text>
                    ) : (
                      group.passengers.map((passenger) => (
                        <PassengerCard
                          key={passenger.id}
                          passenger={passenger}
                          mode="dropping"
                          onPress={() => setSelectedPassenger(passenger)}
                          onConfirmDropoff={() =>
                            handleConfirmDropoff(
                              passenger.id,
                              passenger.name,
                              passenger.current_status === 'onboard'
                            )
                          }
                        />
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Passenger Detail Modal */}
      <PassengerDetailModal
        passenger={selectedPassenger}
        onClose={() => setSelectedPassenger(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  clearSearch: {
    fontSize: 16,
    color: '#94A3B8',
    paddingHorizontal: 6,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  destCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  destHeader: {
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  destTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  destName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
  },
  warningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  warningAlertText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  counterBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  counterNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  counterLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  passengersList: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  noPassengersText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
