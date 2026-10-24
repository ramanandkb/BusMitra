import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Users,
  MapPin,
  Grid,
  FileUp,
  Briefcase,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { useApp } from '../state/AppContext';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { activeTrip, passengers, isLoading, loadTripData } = useApp();

  const total = passengers.length;
  const arrived = passengers.filter((p) => p.current_status === 'arrived').length;
  const onboard = passengers.filter((p) => p.current_status === 'onboard').length;
  const droppedOff = passengers.filter((p) => p.current_status === 'dropped_off').length;
  const awaiting = passengers.filter((p) => p.current_status === 'awaiting_boarding').length;

  const boardingProgress = total > 0 ? Math.round(((onboard + droppedOff) / total) * 100) : 0;
  const dropoffProgress = total > 0 ? Math.round((droppedOff / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <Header onRefresh={() => loadTripData()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => loadTripData()} />
        }
      >
        {/* Empty State when no trip exists */}
        {!activeTrip && (
          <View style={styles.emptyCard}>
            <Briefcase size={36} color="#64748B" />
            <Text style={styles.emptyTitle}>No Active Trip Selected</Text>
            <Text style={styles.emptySub}>
              Upload a passenger manifest PDF or create a trip to start managing boarding.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => onNavigate('upload')}
            >
              <FileUp size={18} color="#FFFFFF" />
              <Text style={styles.emptyActionText}>Upload Passenger PDF</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTrip && (
          <>
            {/* Primary Action Cards (Prominent & Outdoor-readable) */}
            <View style={styles.primaryCardsSection}>
              {/* Boarding Points Card */}
              <TouchableOpacity
                style={[styles.primaryCard, { backgroundColor: '#1E3A8A' }]}
                onPress={() => onNavigate('boarding')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIconWrapper}>
                  <Users size={28} color="#FFFFFF" />
                </View>
                <View style={styles.primaryCardContent}>
                  <Text style={styles.primaryCardTitle}>Boarding Points</Text>
                  <Text style={styles.primaryCardSubtitle}>
                    View passengers by pickup location
                  </Text>
                  <View style={styles.cardBadgeRow}>
                    <Text style={styles.cardBadgeText}>
                      {awaiting} pending boarding
                    </Text>
                  </View>
                </View>
                <ChevronRight size={24} color="#93C5FD" />
              </TouchableOpacity>

              {/* Dropping Points Card */}
              <TouchableOpacity
                style={[styles.primaryCard, { backgroundColor: '#4C1D95' }]}
                onPress={() => onNavigate('dropping')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIconWrapper}>
                  <MapPin size={28} color="#FFFFFF" />
                </View>
                <View style={styles.primaryCardContent}>
                  <Text style={styles.primaryCardTitle}>Dropping Points</Text>
                  <Text style={styles.primaryCardSubtitle}>
                    View passengers by destination
                  </Text>
                  <View style={styles.cardBadgeRow}>
                    <Text style={styles.cardBadgeText}>
                      {onboard} currently onboard
                    </Text>
                  </View>
                </View>
                <ChevronRight size={24} color="#C4B5FD" />
              </TouchableOpacity>
            </View>

            {/* Dashboard Progress Bars */}
            <View style={styles.progressContainer}>
              <View style={styles.progressRow}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Boarding Progress</Text>
                  <Text style={styles.progressPct}>{boardingProgress}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${boardingProgress}%`, backgroundColor: '#059669' },
                    ]}
                  />
                </View>
              </View>

              <View style={[styles.progressRow, { marginTop: 12 }]}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Drop-off Progress</Text>
                  <Text style={styles.progressPct}>{dropoffProgress}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${dropoffProgress}%`, backgroundColor: '#7C3AED' },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Operational Counts Grid */}
            <Text style={styles.sectionHeading}>TRIP OVERVIEW</Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Total"
                value={total}
                color="#0F172A"
                bgColor="#F8FAFC"
              />
              <StatCard
                label="Awaiting"
                value={awaiting}
                color="#D97706"
                bgColor="#FEF3C7"
              />
              <StatCard
                label="Arrived"
                value={arrived}
                color="#2563EB"
                bgColor="#DBEAFE"
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                label="Onboard"
                value={onboard}
                color="#059669"
                bgColor="#D1FAE5"
              />
              <StatCard
                label="Dropped Off"
                value={droppedOff}
                color="#7C3AED"
                bgColor="#EDE9FE"
              />
              <StatCard
                label="Capacity"
                value={`${total}/${activeTrip.total_seats}`}
                color="#475569"
                bgColor="#F1F5F9"
              />
            </View>

            {/* Additional Quick Actions */}
            <Text style={[styles.sectionHeading, { marginTop: 18 }]}>QUICK TOOLS</Text>
            <View style={styles.toolsGrid}>
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => onNavigate('seatmap')}
              >
                <Grid size={22} color="#1E3A8A" />
                <Text style={styles.toolBtnText}>Seat Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => onNavigate('upload')}
              >
                <FileUp size={22} color="#1E3A8A" />
                <Text style={styles.toolBtnText}>Upload PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => onNavigate('trips')}
              >
                <Briefcase size={22} color="#1E3A8A" />
                <Text style={styles.toolBtnText}>Trips</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => onNavigate('sync')}
              >
                <TrendingUp size={22} color="#1E3A8A" />
                <Text style={styles.toolBtnText}>Offline Sync</Text>
              </TouchableOpacity>
            </View>
          </>
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  primaryCardsSection: {
    gap: 12,
    marginBottom: 16,
  },
  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardIconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
    marginRight: 14,
  },
  primaryCardContent: {
    flex: 1,
  },
  primaryCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  primaryCardSubtitle: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 2,
  },
  cardBadgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  cardBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  progressRow: {},
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  progressPct: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  toolBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
});
