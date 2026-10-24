import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import {
  FileUp,
  FileCheck,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Check,
  Compass,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Header } from '../components/Header';
import { useApp } from '../state/AppContext';
import * as api from '../services/api';
import { ExtractedPassenger, ManifestExtractResponse } from '../types';

interface ManifestUploadScreenProps {
  onSuccessNavigate?: () => void;
}

export const ManifestUploadScreen: React.FC<ManifestUploadScreenProps> = ({
  onSuccessNavigate,
}) => {
  const { activeTrip, loadTripData } = useApp();

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    uri: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractResult, setExtractResult] = useState<ManifestExtractResponse | null>(null);
  const [editablePassengers, setEditablePassengers] = useState<ExtractedPassenger[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Pick PDF file from Android device storage
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setSelectedFile({
          name: file.name,
          uri: file.uri,
        });
        await processUploadedFile(file.uri, file.name);
      }
    } catch (err: any) {
      Alert.alert('Selection Error', err.message || 'Could not pick file');
    }
  };

  // Quick action: Load sample manifest from backend or synthetic demo
  const handleLoadDemoManifest = async () => {
    setIsUploading(true);
    try {
      let tripId = activeTrip?.id;
      if (!tripId) {
        const newTrip = await api.createTrip({
          route_name: 'Pune to Bangalore',
          bus_number: 'MH 12 QX 4521',
          journey_date: '2026-10-25',
        });
        tripId = newTrip.id;
      }

      // 16 realistic passengers across 5 pickup and 5 drop-off stops
      const demoPassengers: ExtractedPassenger[] = [
        {
          seat_number: '1A',
          name: 'Rajesh Sharma',
          phone_number: '9823012345',
          boarding_point: 'Pune - Swargate',
          dropoff_point: 'Bangalore - Majestic',
          booking_reference: 'VRL901234',
          confidence_score: 0.98,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '1B',
          name: 'Pooja Sharma',
          phone_number: '9823012346',
          boarding_point: 'Pune - Swargate',
          dropoff_point: 'Bangalore - Majestic',
          booking_reference: 'VRL901234',
          confidence_score: 0.98,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '1C',
          name: 'Amit Patil',
          phone_number: '9822198765',
          boarding_point: 'Pune - Wakad',
          dropoff_point: 'Hubli - Old Bus Stand',
          booking_reference: 'VRL901235',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '1D',
          name: 'Suresh Deshmukh',
          phone_number: '9422011223',
          boarding_point: 'Pune - Wakad',
          dropoff_point: 'Bangalore - Majestic',
          booking_reference: 'VRL901236',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '2A',
          name: 'Sneha Kulkarni',
          phone_number: '9970144556',
          boarding_point: 'Pune - Katraj',
          dropoff_point: 'Belgaum - Bypass',
          booking_reference: 'VRL901237',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '2B',
          name: 'Rohan Joshi',
          phone_number: '9881233445',
          boarding_point: 'Pune - Katraj',
          dropoff_point: 'Bangalore - Majestic',
          booking_reference: 'VRL901238',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '2C',
          name: 'Vikram Rathore',
          phone_number: '9766554433',
          boarding_point: 'Satara - Highway',
          dropoff_point: 'Davanagere - ByPass',
          booking_reference: 'VRL901239',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '2D',
          name: 'Ananya Verma',
          phone_number: '9890112233',
          boarding_point: 'Satara - Highway',
          dropoff_point: 'Bangalore - Majestic',
          booking_reference: 'VRL901240',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '3A',
          name: 'Deepak Chawla',
          phone_number: '9850123987',
          boarding_point: 'Kolhapur - Bus Stand',
          dropoff_point: 'Tumkur',
          booking_reference: 'VRL901241',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '3B',
          name: 'Meena Chawla',
          phone_number: '9850123988',
          boarding_point: 'Kolhapur - Bus Stand',
          dropoff_point: 'Tumkur',
          booking_reference: 'VRL901241',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '3C',
          name: 'Gaurav More',
          phone_number: '9822998877',
          boarding_point: 'Pune - Swargate',
          dropoff_point: 'Bangalore - Majestic',
          booking_reference: 'VRL901242',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '3D',
          name: 'Priyanka Shinde',
          phone_number: '9923445566',
          boarding_point: 'Pune - Swargate',
          dropoff_point: 'Hubli - Old Bus Stand',
          booking_reference: 'VRL901243',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '4A',
          name: 'Karan Malhotra',
          phone_number: '9820011224',
          boarding_point: 'Pune - Wakad',
          dropoff_point: 'Bangalore - Majestic',
          booking_reference: 'VRL901244',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '4B',
          name: 'Sunita Nair',
          phone_number: '9845012345',
          boarding_point: 'Pune - Wakad',
          dropoff_point: 'Bangalore - Majestic',
          booking_reference: 'VRL901245',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '4C',
          name: 'Manoj Kumar',
          phone_number: '9731234567',
          boarding_point: 'Kolhapur - Bus Stand',
          dropoff_point: 'Bangalore - Majestic',
          booking_reference: 'VRL901246',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
        {
          seat_number: '4D',
          name: 'Neha Gupta',
          phone_number: '9654321098',
          boarding_point: 'Pune - Katraj',
          dropoff_point: 'Bangalore - Majestic',
          booking_reference: 'VRL901247',
          confidence_score: 0.95,
          validation_status: 'valid',
          warnings: [],
        },
      ];

      setExtractResult({
        filename: 'royal_express_manifest.pdf',
        detected_route: 'Pune to Bangalore',
        detected_bus_number: 'MH 12 QX 4521',
        detected_journey_date: '2026-10-25',
        total_extracted: demoPassengers.length,
        valid_count: demoPassengers.length,
        warning_count: 0,
        duplicate_count: 0,
        passengers: demoPassengers,
      });
      setEditablePassengers(demoPassengers);
    } catch (err: any) {
      Alert.alert('Demo Error', err.message || 'Could not load demo manifest');
    } finally {
      setIsUploading(false);
    }
  };

  const processUploadedFile = async (uri: string, name: string) => {
    setIsUploading(true);
    try {
      let tripId = activeTrip?.id;
      if (!tripId) {
        // Create trip automatically if none active
        const newTrip = await api.createTrip({
          route_name: 'Pune to Bangalore',
          bus_number: 'MH 12 QX 4521',
          journey_date: '2026-10-25',
        });
        tripId = newTrip.id;
      }

      const res = await api.uploadManifestFile(tripId, uri, name);
      setExtractResult(res);
      setEditablePassengers(res.passengers);
    } catch (err: any) {
      Alert.alert('Upload & Extraction Error', err.message || 'Failed to parse PDF');
    } finally {
      setIsUploading(false);
    }
  };

  // Add missing passenger row manually
  const handleAddPassenger = () => {
    const newPassenger: ExtractedPassenger = {
      seat_number: `${editablePassengers.length + 1}A`,
      name: 'New Passenger',
      phone_number: '',
      boarding_point: 'Pune - Swargate',
      dropoff_point: 'Bangalore - Majestic',
      booking_reference: `MANUAL${Date.now().toString().slice(-4)}`,
      confidence_score: 1.0,
      validation_status: 'valid',
      warnings: [],
    };
    setEditablePassengers([...editablePassengers, newPassenger]);
    setEditingIndex(editablePassengers.length);
  };

  // Delete passenger row
  const handleDeletePassenger = (index: number) => {
    Alert.alert('Delete Passenger', 'Are you sure you want to remove this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = [...editablePassengers];
          updated.splice(index, 1);
          setEditablePassengers(updated);
        },
      },
    ]);
  };

  // Update field value
  const handleFieldChange = (index: number, field: keyof ExtractedPassenger, val: string) => {
    const updated = [...editablePassengers];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setEditablePassengers(updated);
  };

  // Confirm manifest and save to backend
  const handleConfirmManifest = async () => {
    if (!editablePassengers || editablePassengers.length === 0) {
      Alert.alert('Empty Manifest', 'No passengers to confirm.');
      return;
    }

    setIsUploading(true);
    try {
      let tripId = activeTrip?.id;
      if (!tripId) {
        const created = await api.createTrip({
          route_name: extractResult?.detected_route || 'Pune to Bangalore',
          bus_number: extractResult?.detected_bus_number || 'MH 12 QX 4521',
          journey_date: extractResult?.detected_journey_date || '2026-10-25',
        });
        tripId = created.id;
      }

      await api.confirmManifest(tripId, {
        route_name: extractResult?.detected_route,
        bus_number: extractResult?.detected_bus_number,
        journey_date: extractResult?.detected_journey_date,
        passengers: editablePassengers.map((p) => ({
          name: p.name,
          seat_number: p.seat_number,
          phone_number: p.phone_number,
          boarding_stop_name: p.boarding_point,
          dropoff_stop_name: p.dropoff_point,
          booking_reference: p.booking_reference,
        })),
      });

      await loadTripData(tripId);
      Alert.alert(
        'Manifest Confirmed!',
        `Successfully loaded and activated ${editablePassengers.length} passengers for trip.`,
        [
          {
            text: 'Go to Boarding',
            onPress: () => onSuccessNavigate && onSuccessNavigate(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Confirmation Error', err.message || 'Could not save manifest');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header onRefresh={() => loadTripData()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Upload Action Area */}
        <View style={styles.uploadCard}>
          <FileUp size={36} color="#1E3A8A" />
          <Text style={styles.uploadTitle}>Upload Passenger Manifest PDF</Text>
          <Text style={styles.uploadSub}>
            Select an intercity passenger manifest PDF (e.g. RedBus, AbhiBus, SRS, VRL).
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={handlePickDocument}
              disabled={isUploading}
            >
              <FileUp size={16} color="#FFFFFF" />
              <Text style={styles.pickBtnText}>Select PDF File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={handleLoadDemoManifest}
              disabled={isUploading}
            >
              <Compass size={16} color="#1E3A8A" />
              <Text style={styles.demoBtnText}>Load Sample Manifest</Text>
            </TouchableOpacity>
          </View>

          {selectedFile && (
            <View style={styles.fileSelectedBox}>
              <FileCheck size={16} color="#059669" />
              <Text style={styles.fileNameText} numberOfLines={1}>
                {selectedFile.name}
              </Text>
            </View>
          )}

          {isUploading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#1E3A8A" />
              <Text style={styles.loadingText}>Processing manifest and extracting passengers...</Text>
            </View>
          )}
        </View>

        {/* Extracted Passengers Review Section */}
        {extractResult && (
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeader}>
              <View>
                <Text style={styles.reviewTitle}>MANIFEST REVIEW</Text>
                <Text style={styles.reviewSub}>
                  {editablePassengers.length} passengers extracted • Review & verify
                </Text>
              </View>

              <TouchableOpacity style={styles.addBtn} onPress={handleAddPassenger}>
                <Plus size={15} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Missing</Text>
              </TouchableOpacity>
            </View>

            {/* Editable Passenger Rows */}
            {editablePassengers.map((p, idx) => {
              const isEditing = editingIndex === idx;

              return (
                <View
                  key={`extracted-${idx}`}
                  style={[
                    styles.passengerRowCard,
                    p.validation_status === 'duplicate' && styles.rowDuplicate,
                    p.validation_status === 'warning' && styles.rowWarning,
                  ]}
                >
                  <View style={styles.rowTop}>
                    {isEditing ? (
                      <TextInput
                        style={styles.inputSeat}
                        value={p.seat_number}
                        onChangeText={(v) => handleFieldChange(idx, 'seat_number', v)}
                        placeholder="Seat"
                      />
                    ) : (
                      <View style={styles.seatBadge}>
                        <Text style={styles.seatBadgeText}>{p.seat_number || '?'}</Text>
                      </View>
                    )}

                    <View style={styles.rowMain}>
                      {isEditing ? (
                        <>
                          <TextInput
                            style={styles.inputName}
                            value={p.name}
                            onChangeText={(v) => handleFieldChange(idx, 'name', v)}
                            placeholder="Passenger Name"
                          />
                          <TextInput
                            style={styles.inputPhone}
                            value={p.phone_number}
                            onChangeText={(v) => handleFieldChange(idx, 'phone_number', v)}
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                          />
                        </>
                      ) : (
                        <>
                          <Text style={styles.rowName}>{p.name}</Text>
                          <Text style={styles.rowPhone}>
                            {p.phone_number || 'No phone'} {p.booking_reference ? `• ${p.booking_reference}` : ''}
                          </Text>
                        </>
                      )}
                    </View>

                    {/* Actions: Edit toggle / Delete */}
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        style={styles.iconAction}
                        onPress={() => setEditingIndex(isEditing ? null : idx)}
                      >
                        {isEditing ? (
                          <Check size={16} color="#059669" />
                        ) : (
                          <Edit2 size={16} color="#2563EB" />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconAction}
                        onPress={() => handleDeletePassenger(idx)}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Route information */}
                  <View style={styles.rowRoute}>
                    {isEditing ? (
                      <View style={{ flex: 1, gap: 4 }}>
                        <TextInput
                          style={styles.inputRoute}
                          value={p.boarding_point}
                          onChangeText={(v) => handleFieldChange(idx, 'boarding_point', v)}
                          placeholder="Pickup Point"
                        />
                        <TextInput
                          style={styles.inputRoute}
                          value={p.dropoff_point}
                          onChangeText={(v) => handleFieldChange(idx, 'dropoff_point', v)}
                          placeholder="Drop-off Point"
                        />
                      </View>
                    ) : (
                      <Text style={styles.routeText} numberOfLines={1}>
                        From <Text style={{ fontWeight: 'bold' }}>{p.boarding_point}</Text> to{' '}
                        <Text style={{ fontWeight: 'bold' }}>{p.dropoff_point}</Text>
                      </Text>
                    )}
                  </View>

                  {/* Warnings if any */}
                  {p.warnings && p.warnings.length > 0 && (
                    <View style={styles.warningsRow}>
                      <AlertCircle size={12} color="#B45309" />
                      <Text style={styles.warningLine}>{p.warnings.join(', ')}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Confirm Manifest Button */}
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmManifest}
              disabled={isUploading}
            >
              <FileCheck size={20} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>
                Confirm Manifest & Activate Trip ({editablePassengers.length} Passengers)
              </Text>
            </TouchableOpacity>
          </View>
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
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 10,
  },
  uploadSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  pickBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  demoBtnText: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  fileSelectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    width: '100%',
    gap: 8,
  },
  fileNameText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  reviewSection: {
    marginTop: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  reviewSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  passengerRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowDuplicate: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  rowWarning: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatBadge: {
    backgroundColor: '#1E3A8A',
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  seatBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputSeat: {
    width: 48,
    height: 38,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontWeight: 'bold',
    marginRight: 10,
    fontSize: 14,
  },
  rowMain: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  rowPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  inputName: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    marginBottom: 4,
  },
  inputPhone: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconAction: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  rowRoute: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  routeText: {
    fontSize: 12,
    color: '#475569',
  },
  inputRoute: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  warningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  warningLine: {
    fontSize: 11,
    color: '#B45309',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    elevation: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
