import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle,
  Filter,
  Users,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { PassengerCard } from '../components/PassengerCard';
import { PassengerDetailModal } from '../components/PassengerDetailModal';
import { useApp } from '../state/AppContext';
import { Passenger } from '../types';

export const BoardingScreen: React.FC = () => {
  const {
    boardingGroups,
    isLoading,
    loadTripData,
    markArrived,
    markBoarded,
    selectedPassenger,
    setSelectedPassenger,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting' | 'arrived' | 'boarded'>('all');
  const [collapsedStops, setCollapsedStops] = useState<Record<string, boolean>>({});

  const toggleCollapse = (stopName: string) => {
    setCollapsedStops((prev) => ({
      ...prev,
      [stopName]: !prev[stopName],
    }));
  };

  // Filter passengers within groups dynamically
  const filteredGroups = useMemo(() => {
    return boardingGroups.map((group) => {
      const filteredPassengers = group.passengers.filter((p) => {
        // Status filter
        if (statusFilter === 'awaiting' && p.current_status !== 'awaiting_boarding') return false;
        if (statusFilter === 'arrived' && p.current_status !== 'arrived') return false;
        if (statusFilter === 'boarded' && p.current_status !== 'onboard') return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSeat = p.seat_number?.toLowerCase().includes(q);
          const matchPhone = p.phone_number?.toLowerCase().includes(q);
          const matchPnr = p.booking_reference?.toLowerCase().includes(q);
          if (!matchName && !matchSeat && !matchPhone && !matchPnr) return false;
        }

        return true;
      });

      return {
        ...group,
        passengers: filteredPassengers,
      };
    });
  }, [boardingGroups, searchQuery, statusFilter]);

  return (
    <View style={styles.container}>
      <Header onRefresh={() => loadTripData()} />

      {/* Search and Filters Header */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search passenger, seat, phone, PNR..."
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

        {/* Status Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterPillsScroll}
          contentContainerStyle={styles.filterPillsContainer}
        >
          <TouchableOpacity
            style={[styles.filterPill, statusFilter === 'all' && styles.filterPillActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.filterPillText, statusFilter === 'all' && styles.filterPillTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, statusFilter === 'awaiting' && styles.filterPillActive]}
            onPress={() => setStatusFilter('awaiting')}
          >
            <Text style={[styles.filterPillText, statusFilter === 'awaiting' && styles.filterPillTextActive]}>
              Awaiting Arrival
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, statusFilter === 'arrived' && styles.filterPillActive]}
            onPress={() => setStatusFilter('arrived')}
          >
            <Text style={[styles.filterPillText, statusFilter === 'arrived' && styles.filterPillTextActive]}>
              Arrived
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, statusFilter === 'boarded' && styles.filterPillActive]}
            onPress={() => setStatusFilter('boarded')}
          >
            <Text style={[styles.filterPillText, statusFilter === 'boarded' && styles.filterPillTextActive]}>
              Boarded
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Dynamic Boarding Points List */}
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
            <Text style={styles.emptyText}>No boarding points found for current filter</Text>
          </View>
        ) : (
          filteredGroups.map((group) => {
            const isCollapsed = collapsedStops[group.boarding_stop_name];
            const pct =
              group.total_expected > 0
                ? Math.round((group.boarded / group.total_expected) * 100)
                : 0;

            return (
              <View key={group.boarding_stop_name} style={styles.stopCard}>
                {/* Stop Card Header (Tap to toggle collapse) */}
                <TouchableOpacity
                  style={styles.stopCardHeader}
                  onPress={() => toggleCollapse(group.boarding_stop_name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.stopTitleRow}>
                    <MapPin size={20} color="#1E3A8A" />
                    <Text style={styles.stopName} numberOfLines={1}>
                      {group.boarding_stop_name}
                    </Text>
                  </View>

                  {/* Summary Counters */}
                  <View style={styles.counterRow}>
                    <View style={styles.counterBadge}>
                      <Text style={styles.counterNum}>{group.pending}</Text>
                      <Text style={styles.counterLabel}>Pending</Text>
                    </View>
                    <View style={[styles.counterBadge, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={[styles.counterNum, { color: '#2563EB' }]}>
                        {group.arrived}
                      </Text>
                      <Text style={[styles.counterLabel, { color: '#2563EB' }]}>Arrived</Text>
                    </View>
                    <View style={[styles.counterBadge, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={[styles.counterNum, { color: '#059669' }]}>
                        {group.boarded}
                      </Text>
                      <Text style={[styles.counterLabel, { color: '#059669' }]}>Boarded</Text>
                    </View>
                    {isCollapsed ? (
                      <ChevronDown size={20} color="#64748B" />
                    ) : (
                      <ChevronUp size={20} color="#64748B" />
                    )}
                  </View>

                  {/* Stop Progress Bar */}
                  <View style={styles.stopProgressBarTrack}>
                    <View
                      style={[
                        styles.stopProgressBarFill,
                        { width: `${pct}%`, backgroundColor: pct === 100 ? '#059669' : '#3B82F6' },
                      ]}
                    />
                  </View>
                </TouchableOpacity>

                {/* Passenger Cards inside expanded section */}
                {!isCollapsed && (
                  <View style={styles.passengersList}>
                    {group.passengers.length === 0 ? (
                      <Text style={styles.noPassengersText}>
                        No passengers matching current criteria.
                      </Text>
                    ) : (
                      group.passengers.map((passenger) => (
                        <PassengerCard
                          key={passenger.id}
                          passenger={passenger}
                          mode="boarding"
                          onPress={() => setSelectedPassenger(passenger)}
                          onToggleArrived={() => markArrived(passenger.id)}
                          onMarkBoarded={() => markBoarded(passenger.id)}
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

      {/* Detailed Inspection Modal */}
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
    paddingBottom: 8,
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
  filterPillsScroll: {
    marginTop: 10,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
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
  stopCard: {
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
  stopCardHeader: {
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  stopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  counterBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  counterNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D97706',
  },
  counterLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  stopProgressBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  stopProgressBarFill: {
    height: '100%',
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
