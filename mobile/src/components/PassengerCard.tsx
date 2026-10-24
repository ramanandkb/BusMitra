import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Phone, CheckCircle, CheckSquare, Square, LogOut } from 'lucide-react-native';
import { Passenger } from '../types';
import { STATUS_CONFIG } from '../utils/helpers';
import { initiatePassengerCall } from '../utils/dialer';

interface PassengerCardProps {
  passenger: Passenger;
  mode?: 'boarding' | 'dropping' | 'general';
  onPress?: () => void;
  onToggleArrived?: () => void;
  onMarkBoarded?: () => void;
  onConfirmDropoff?: () => void;
}

export const PassengerCard: React.FC<PassengerCardProps> = ({
  passenger,
  mode = 'boarding',
  onPress,
  onToggleArrived,
  onMarkBoarded,
  onConfirmDropoff,
}) => {
  const statusCfg = STATUS_CONFIG[passenger.current_status] || STATUS_CONFIG.awaiting_boarding;
  const isArrived = ['arrived', 'onboard', 'dropped_off'].includes(passenger.current_status);
  const isOnboard = passenger.current_status === 'onboard';
  const isDroppedOff = passenger.current_status === 'dropped_off';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.headerRow}>
        <View style={styles.seatBadge}>
          <Text style={styles.seatText}>{passenger.seat_number || 'N/A'}</Text>
        </View>

        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {passenger.name}
          </Text>
          <Text style={styles.subText}>
            {passenger.phone_number || 'No phone'} {passenger.booking_reference ? `• PNR: ${passenger.booking_reference}` : ''}
          </Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor, borderColor: statusCfg.borderColor }]}>
          <Text style={[styles.statusLabel, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      {/* Stop locations */}
      <View style={styles.routeRow}>
        <Text style={styles.routeLabel} numberOfLines={1}>
          Pickup: <Text style={styles.routeVal}>{passenger.boarding_stop_name}</Text>
        </Text>
        <Text style={styles.routeLabel} numberOfLines={1}>
          Drop: <Text style={styles.routeVal}>{passenger.dropoff_stop_name}</Text>
        </Text>
      </View>

      {/* Interactive Action Bar */}
      <View style={styles.actionsBar}>
        {/* Call Action */}
        <TouchableOpacity
          style={styles.actionBtnCall}
          onPress={() => initiatePassengerCall(passenger.name, passenger.phone_number)}
        >
          <Phone size={16} color="#1E3A8A" />
          <Text style={styles.actionBtnCallText}>Call</Text>
        </TouchableOpacity>

        {mode === 'boarding' && (
          <View style={styles.boardingActions}>
            {/* Independent Arrival Checkbox */}
            <TouchableOpacity
              style={[
                styles.arrivalToggle,
                isArrived && styles.arrivalToggleChecked,
              ]}
              onPress={onToggleArrived}
            >
              {isArrived ? (
                <CheckSquare size={16} color="#059669" />
              ) : (
                <Square size={16} color="#64748B" />
              )}
              <Text
                style={[
                  styles.arrivalToggleText,
                  isArrived && { color: '#059669', fontWeight: 'bold' },
                ]}
              >
                Arrived
              </Text>
            </TouchableOpacity>

            {/* Independent Boarding Button */}
            {!isOnboard && !isDroppedOff && (
              <TouchableOpacity
                style={styles.boardBtn}
                onPress={onMarkBoarded}
              >
                <CheckCircle size={15} color="#FFFFFF" />
                <Text style={styles.boardBtnText}>Mark Boarded</Text>
              </TouchableOpacity>
            )}

            {isOnboard && (
              <View style={styles.boardedTag}>
                <CheckCircle size={15} color="#059669" />
                <Text style={styles.boardedTagText}>Onboard</Text>
              </View>
            )}
          </View>
        )}

        {mode === 'dropping' && (
          <View style={styles.dropoffActions}>
            {!isDroppedOff ? (
              <TouchableOpacity
                style={[
                  styles.dropBtn,
                  !isOnboard && styles.dropBtnPending,
                ]}
                onPress={onConfirmDropoff}
              >
                <LogOut size={15} color="#FFFFFF" />
                <Text style={styles.dropBtnText}>Confirm Dropped Off</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.droppedTag}>
                <CheckCircle size={15} color="#7C3AED" />
                <Text style={styles.droppedTagText}>Dropped Off</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatBadge: {
    backgroundColor: '#1E3A8A',
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  seatText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  routeRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeLabel: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  routeVal: {
    fontWeight: '600',
    color: '#334155',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  actionBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  actionBtnCallText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  boardingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrivalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  arrivalToggleChecked: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  arrivalToggleText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  boardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  boardBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  boardedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  boardedTagText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropoffActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  dropBtnPending: {
    backgroundColor: '#9333EA',
  },
  dropBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  droppedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  droppedTagText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
