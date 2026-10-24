import React from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { Header } from '../components/Header';
import { SeatMap } from '../components/SeatMap';
import { PassengerDetailModal } from '../components/PassengerDetailModal';
import { useApp } from '../state/AppContext';

export const SeatDashboardScreen: React.FC = () => {
  const {
    seatMap,
    isLoading,
    loadTripData,
    selectedPassenger,
    setSelectedPassenger,
  } = useApp();

  return (
    <View style={styles.container}>
      <Header onRefresh={() => loadTripData()} />

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>BUS SEAT DASHBOARD</Text>
          <Text style={styles.subtitle}>
            Tap any occupied seat to view passenger details and manage status.
          </Text>
        </View>

        <SeatMap
          seatMapData={seatMap}
          onSelectPassenger={(p) => setSelectedPassenger(p)}
        />
      </View>

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
  content: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
