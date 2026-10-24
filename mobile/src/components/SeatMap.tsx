import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Compass, User, AlertCircle } from 'lucide-react-native';
import { SeatMapResponse, SeatMapItem, Passenger } from '../types';
import { STATUS_CONFIG } from '../utils/helpers';

interface SeatMapProps {
  seatMapData: SeatMapResponse | null;
  onSelectPassenger: (passenger: Passenger) => void;
  onSelectUnassignedSeat?: (seatNumber: string) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seatMapData,
  onSelectPassenger,
  onSelectUnassignedSeat,
}) => {
  if (!seatMapData || !seatMapData.seats) {
    return (
      <View style={styles.emptyContainer}>
        <AlertCircle size={28} color="#94A3B8" />
        <Text style={styles.emptyText}>No seat layout loaded</Text>
      </View>
    );
  }

  // Group seats by row
  const rowsMap = new Map<number, SeatMapItem[]>();
  for (const s of seatMapData.seats) {
    if (!rowsMap.has(s.row)) rowsMap.set(s.row, []);
    rowsMap.get(s.row)!.push(s);
  }

  const sortedRows = Array.from(rowsMap.keys()).sort((a, b) => a - b);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]} />
          <Text style={styles.legendText}>Vacant</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]} />
          <Text style={styles.legendText}>Awaiting</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]} />
          <Text style={styles.legendText}>Arrived</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' }]} />
          <Text style={styles.legendText}>Onboard</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#EDE9FE', borderColor: '#C4B5FD' }]} />
          <Text style={styles.legendText}>Dropped</Text>
        </View>
      </View>

      {/* Bus Shell Container */}
      <View style={styles.busShell}>
        {/* Front Cabin Banner */}
        <View style={styles.frontCabin}>
          <View style={styles.driverSide}>
            <Compass size={16} color="#1E3A8A" />
            <Text style={styles.cabinText}>DRIVER CABIN</Text>
          </View>
          <View style={styles.doorSide}>
            <Text style={styles.doorText}>DOOR ▶</Text>
          </View>
        </View>

        {/* Rows of seats */}
        <View style={styles.seatingArea}>
          {sortedRows.map((rowNum) => {
            const seatsInRow = rowsMap.get(rowNum) || [];
            // Sort by column
            seatsInRow.sort((a, b) => a.column - b.column);

            return (
              <View key={`row-${rowNum}`} style={styles.seatRow}>
                {seatsInRow.map((seatItem, colIdx) => {
                  if (seatItem.is_aisle) {
                    return (
                      <View
                        key={`aisle-${rowNum}-${colIdx}`}
                        style={styles.aisleSpace}
                      >
                        <Text style={styles.aisleText}>{rowNum}</Text>
                      </View>
                    );
                  }

                  const statusKey = seatItem.status || 'unassigned';
                  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.unassigned;

                  return (
                    <TouchableOpacity
                      key={`seat-${seatItem.seat_number || colIdx}`}
                      style={[
                        styles.seatBox,
                        {
                          backgroundColor: cfg.bgColor,
                          borderColor: cfg.borderColor,
                        },
                      ]}
                      onPress={() => {
                        if (seatItem.passenger) {
                          onSelectPassenger(seatItem.passenger);
                        } else if (onSelectUnassignedSeat) {
                          onSelectUnassignedSeat(seatItem.seat_number);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.seatNumber, { color: cfg.color }]}>
                        {seatItem.seat_number}
                      </Text>
                      {seatItem.passenger ? (
                        <Text style={styles.passengerSnippet} numberOfLines={1}>
                          {seatItem.passenger.name.split(' ')[0]}
                        </Text>
                      ) : (
                        <User size={12} color="#94A3B8" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Rear of bus */}
        <View style={styles.rearBanner}>
          <Text style={styles.rearText}>REAR OF BUS</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 14,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  legendText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  busShell: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#1E3A8A',
    padding: 14,
    width: '100%',
    maxWidth: 380,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  frontCabin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  driverSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cabinText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  doorSide: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  doorText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  seatingArea: {
    gap: 8,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatBox: {
    width: 60,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  seatNumber: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  passengerSnippet: {
    fontSize: 9,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
  aisleSpace: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aisleText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: 'bold',
  },
  rearBanner: {
    marginTop: 16,
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rearText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1,
  },
});
