import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Briefcase,
  Plus,
  CheckCircle,
  FileSpreadsheet,
  Calendar,
  Truck,
  RotateCw,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { useApp } from '../state/AppContext';
import * as api from '../services/api';
import { Trip } from '../types';

export const TripManagementScreen: React.FC = () => {
  const { activeTrip, loadTripData } = useApp();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New trip form state
  const [routeName, setRouteName] = useState('Pune to Bangalore');
  const [busNumber, setBusNumber] = useState('MH 12 QX 4521');
  const [journeyDate, setJourneyDate] = useState('2026-10-25');
  const [totalSeats, setTotalSeats] = useState('40');
  const [layoutType, setLayoutType] = useState('2x2_seater');

  useEffect(() => {
    fetchTripsList();
  }, []);

  const fetchTripsList = async () => {
    setLoading(true);
    try {
      const list = await api.fetchTrips();
      setTrips(list);
    } catch (err: any) {
      console.warn('Could not fetch trips list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!routeName.trim() || !busNumber.trim() || !journeyDate.trim()) {
      Alert.alert('Missing Fields', 'Please enter route, bus number, and journey date.');
      return;
    }

    setLoading(true);
    try {
      const created = await api.createTrip({
        route_name: routeName,
        bus_number: busNumber,
        journey_date: journeyDate,
        total_seats: parseInt(totalSeats, 10) || 40,
        seat_layout_type: layoutType,
      });

      setShowCreateForm(false);
      await fetchTripsList();
      await loadTripData(created.id);
      Alert.alert('Trip Created', `Trip "${created.route_name}" is now created and active.`);
    } catch (err: any) {
      Alert.alert('Create Error', err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTrip = async (trip: Trip) => {
    Alert.alert(
      'Switch Active Trip',
      `Set "${trip.route_name}" (${trip.bus_number}) as the active trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            setLoading(true);
            try {
              await api.activateTrip(trip.id);
              await fetchTripsList();
              await loadTripData(trip.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not activate trip');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteTrip = async () => {
    if (!activeTrip) return;
    Alert.alert(
      'Complete Trip',
      `Are you sure you want to mark trip "${activeTrip.route_name}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Trip',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.completeTrip(activeTrip.id);
              await fetchTripsList();
              await loadTripData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not complete trip');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header onRefresh={fetchTripsList} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Actions Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.newTripBtn}
            onPress={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.newTripBtnText}>
              {showCreateForm ? 'Cancel Creation' : 'Create New Trip'}
            </Text>
          </TouchableOpacity>

          {activeTrip && activeTrip.status === 'active' && (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={handleCompleteTrip}
            >
              <CheckCircle size={16} color="#DC2626" />
              <Text style={styles.completeBtnText}>Complete Active Trip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Create Trip Form */}
        {showCreateForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>NEW INTERCITY TRIP</Text>

            <Text style={styles.inputLabel}>Route Name</Text>
            <TextInput
              style={styles.input}
              value={routeName}
              onChangeText={setRouteName}
              placeholder="e.g. Pune to Bangalore"
            />

            <Text style={styles.inputLabel}>Bus Registration Number</Text>
            <TextInput
              style={styles.input}
              value={busNumber}
              onChangeText={setBusNumber}
              placeholder="e.g. MH 12 QX 4521"
            />

            <Text style={styles.inputLabel}>Journey Date</Text>
            <TextInput
              style={styles.input}
              value={journeyDate}
              onChangeText={setJourneyDate}
              placeholder="e.g. 2026-10-25"
            />

            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Total Seats</Text>
                <TextInput
                  style={styles.input}
                  value={totalSeats}
                  onChangeText={setTotalSeats}
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Layout</Text>
                <View style={styles.layoutToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.layoutToggle,
                      layoutType === '2x2_seater' && styles.layoutToggleActive,
                    ]}
                    onPress={() => setLayoutType('2x2_seater')}
                  >
                    <Text
                      style={[
                        styles.layoutToggleText,
                        layoutType === '2x2_seater' && styles.layoutToggleTextActive,
                      ]}
                    >
                      2+2 Seater
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.layoutToggle,
                      layoutType === '2x1_sleeper' && styles.layoutToggleActive,
                    ]}
                    onPress={() => setLayoutType('2x1_sleeper')}
                  >
                    <Text
                      style={[
                        styles.layoutToggleText,
                        layoutType === '2x1_sleeper' && styles.layoutToggleTextActive,
                      ]}
                    >
                      2+1 Sleeper
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateTrip}>
              <Text style={styles.saveBtnText}>Save and Activate Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Existing Trips List */}
        <Text style={styles.sectionHeading}>SAVED TRIPS</Text>
        {loading && <ActivityIndicator size="small" color="#1E3A8A" style={{ margin: 10 }} />}

        {trips.length === 0 && !loading && (
          <View style={styles.emptyTrips}>
            <Briefcase size={32} color="#94A3B8" />
            <Text style={styles.emptyTripsText}>No trips recorded yet.</Text>
          </View>
        )}

        {trips.map((t) => {
          const isActive = activeTrip?.id === t.id;

          return (
            <View
              key={t.id}
              style={[styles.tripCard, isActive && styles.tripCardActive]}
            >
              <View style={styles.tripCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tripRoute}>{t.route_name}</Text>
                  <View style={styles.tripMetaRow}>
                    <Truck size={14} color="#64748B" />
                    <Text style={styles.tripMeta}>{t.bus_number}</Text>
                    <Calendar size={14} color="#64748B" style={{ marginLeft: 8 }} />
                    <Text style={styles.tripMeta}>{t.journey_date}</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        t.status === 'active'
                          ? '#D1FAE5'
                          : t.status === 'completed'
                          ? '#F1F5F9'
                          : '#FEF3C7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          t.status === 'active'
                            ? '#059669'
                            : t.status === 'completed'
                            ? '#64748B'
                            : '#D97706',
                      },
                    ]}
                  >
                    {t.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Stats if available */}
              {t.stats && (
                <View style={styles.tripStatsRow}>
                  <Text style={styles.tripStatsText}>
                    Total: {t.stats.total_passengers} • Boarded: {t.stats.boarded} • Dropped: {t.stats.dropped_off}
                  </Text>
                </View>
              )}

              {/* Action */}
              {!isActive && (
                <TouchableOpacity
                  style={styles.activateBtn}
                  onPress={() => handleActivateTrip(t)}
                >
                  <RotateCw size={14} color="#1E3A8A" />
                  <Text style={styles.activateBtnText}>Switch to this Trip</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  newTripBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  newTripBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 6,
  },
  completeBtnText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
    color: '#0F172A',
  },
  formRow: {
    flexDirection: 'row',
  },
  layoutToggleRow: {
    flexDirection: 'row',
    gap: 4,
  },
  layoutToggle: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  layoutToggleActive: {
    backgroundColor: '#1E3A8A',
  },
  layoutToggleText: {
    fontSize: 11,
    color: '#475569',
  },
  layoutToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyTrips: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTripsText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 8,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tripCardActive: {
    borderColor: '#1E3A8A',
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  tripCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tripMeta: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tripStatsRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tripStatsText: {
    fontSize: 12,
    color: '#475569',
  },
  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  activateBtnText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
