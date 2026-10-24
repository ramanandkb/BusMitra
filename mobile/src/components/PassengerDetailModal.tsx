import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  Phone,
  CheckCircle,
  MapPin,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react-native';
import { Passenger } from '../types';
import { STATUS_CONFIG, formatTime } from '../utils/helpers';
import { initiatePassengerCall } from '../utils/dialer';
import { useApp } from '../state/AppContext';

interface PassengerDetailModalProps {
  passenger: Passenger | null;
  onClose: () => void;
}

export const PassengerDetailModal: React.FC<PassengerDetailModalProps> = ({
  passenger,
  onClose,
}) => {
  const { markArrived, markBoarded, markDroppedOff, correctStatus } = useApp();

  if (!passenger) return null;

  const statusCfg = STATUS_CONFIG[passenger.current_status] || STATUS_CONFIG.awaiting_boarding;

  return (
    <Modal
      visible={!!passenger}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleArea}>
              <View style={styles.seatBadge}>
                <Text style={styles.seatText}>{passenger.seat_number || 'N/A'}</Text>
              </View>
              <View>
                <Text style={styles.passengerName}>{passenger.name}</Text>
                <Text style={styles.pnrText}>
                  PNR: {passenger.booking_reference || 'N/A'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Status Pill */}
            <View
              style={[
                styles.statusBanner,
                { backgroundColor: statusCfg.bgColor, borderColor: statusCfg.borderColor },
              ]}
            >
              <Text style={[styles.statusBannerText, { color: statusCfg.color }]}>
                Current Status: {statusCfg.label.toUpperCase()}
              </Text>
            </View>

            {/* Warnings if any */}
            {passenger.validation_warnings ? (
              <View style={styles.warningBox}>
                <AlertTriangle size={16} color="#B45309" />
                <Text style={styles.warningText}>{passenger.validation_warnings}</Text>
              </View>
            ) : null}

            {/* Contact Details */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>CONTACT</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoVal}>{passenger.phone_number || 'Not provided'}</Text>
              </View>
              <TouchableOpacity
                style={styles.callActionButton}
                onPress={() => initiatePassengerCall(passenger.name, passenger.phone_number)}
              >
                <Phone size={16} color="#FFFFFF" />
                <Text style={styles.callActionText}>Call Passenger</Text>
              </TouchableOpacity>
            </View>

            {/* Journey Stops & Timestamps */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>JOURNEY DETAILS</Text>

              <View style={styles.journeyItem}>
                <MapPin size={16} color="#2563EB" />
                <View style={styles.journeyTextContainer}>
                  <Text style={styles.stopName}>Boarding: {passenger.boarding_stop_name}</Text>
                  <View style={styles.timeRow}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.timeText}>
                      Arrived at: {formatTime(passenger.arrival_time)}
                    </Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.timeText}>
                      Boarded at: {formatTime(passenger.boarding_time)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.journeyItem, { marginTop: 12 }]}>
                <MapPin size={16} color="#7C3AED" />
                <View style={styles.journeyTextContainer}>
                  <Text style={styles.stopName}>Drop-off: {passenger.dropoff_stop_name}</Text>
                  <View style={styles.timeRow}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.timeText}>
                      Dropped off: {formatTime(passenger.dropoff_time)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Contextual Actions */}
            <View style={styles.actionsCard}>
              <Text style={styles.sectionTitle}>STATUS ACTIONS</Text>

              {passenger.current_status === 'awaiting_boarding' && (
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
                    onPress={() => markArrived(passenger.id)}
                  >
                    <CheckCircle size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Mark Arrived</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                    onPress={() => markBoarded(passenger.id)}
                  >
                    <CheckCircle size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Mark Boarded</Text>
                  </TouchableOpacity>
                </View>
              )}

              {passenger.current_status === 'arrived' && (
                <TouchableOpacity
                  style={[styles.actionBtnFull, { backgroundColor: '#059669' }]}
                  onPress={() => markBoarded(passenger.id)}
                >
                  <CheckCircle size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Confirm Boarded</Text>
                </TouchableOpacity>
              )}

              {passenger.current_status === 'onboard' && (
                <TouchableOpacity
                  style={[styles.actionBtnFull, { backgroundColor: '#7C3AED' }]}
                  onPress={() => markDroppedOff(passenger.id)}
                >
                  <CheckCircle size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Confirm Dropped Off</Text>
                </TouchableOpacity>
              )}

              {/* Status Correction Menu */}
              <View style={styles.correctionSection}>
                <Text style={styles.correctionTitle}>Authorized Corrections:</Text>
                <View style={styles.correctionButtons}>
                  <TouchableOpacity
                    style={styles.correctionBtn}
                    onPress={() => correctStatus(passenger.id, 'awaiting_boarding')}
                  >
                    <RotateCcw size={12} color="#475569" />
                    <Text style={styles.correctionBtnText}>Reset to Awaiting</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.correctionBtn}
                    onPress={() => correctStatus(passenger.id, 'onboard')}
                  >
                    <RotateCcw size={12} color="#475569" />
                    <Text style={styles.correctionBtnText}>Force Onboard</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatBadge: {
    backgroundColor: '#1E3A8A',
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  seatText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  passengerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  pnrText: {
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  body: {
    padding: 16,
  },
  statusBanner: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 14,
  },
  statusBannerText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
    alignItems: 'center',
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    width: 70,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  callActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  callActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  journeyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  journeyTextContainer: {
    flex: 1,
  },
  stopName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  correctionSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  correctionTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  correctionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  correctionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  correctionBtnText: {
    fontSize: 11,
    color: '#475569',
  },
});
