import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {
  Settings,
  Server,
  Shield,
  Layers,
  Database,
  Info,
  CheckCircle,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { useApp } from '../state/AppContext';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';

export const SettingsScreen: React.FC = () => {
  const { loadTripData } = useApp();

  const [serverUrl, setServerUrl] = useState('');
  const [maskPhone, setMaskPhone] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    async function load() {
      const url = await getApiBaseUrl();
      setServerUrl(url);
    }
    load();
  }, []);

  const handleSaveUrl = async () => {
    if (!serverUrl.trim()) return;
    await setApiBaseUrl(serverUrl.trim());
    await loadTripData();
    Alert.alert('Settings Saved', 'API Server Base URL updated.');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch(`${serverUrl.trim()}/health`);
      if (res.ok) {
        Alert.alert('Connection Successful!', 'Connected to Bus Passenger Assistant API.');
      } else {
        Alert.alert('Connection Failed', `Server responded with status ${res.status}`);
      }
    } catch (err: any) {
      Alert.alert(
        'Connection Error',
        `Could not reach ${serverUrl}.\nNote: On an Android emulator use "http://10.0.2.2:8000".`
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Backend API Configuration */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Server size={18} color="#1E3A8A" />
            <Text style={styles.cardTitle}>BACKEND SERVER URL</Text>
          </View>

          <Text style={styles.descText}>
            Configure the FastAPI server endpoint for emulator, device, or production.
          </Text>

          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://10.0.2.2:8000"
            autoCapitalize="none"
          />

          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setServerUrl('http://10.0.2.2:8000')}
            >
              <Text style={styles.presetBtnText}>Android Emulator (10.0.2.2)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setServerUrl('http://127.0.0.1:8000')}
            >
              <Text style={styles.presetBtnText}>Localhost (127.0.0.1)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl}>
              <Text style={styles.saveBtnText}>Save URL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testing}
            >
              <Text style={styles.testBtnText}>
                {testing ? 'Testing...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Privacy & Security */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Shield size={18} color="#1E3A8A" />
            <Text style={styles.cardTitle}>PASSENGER DATA PRIVACY</Text>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Mask Passenger Phone Numbers</Text>
              <Text style={styles.switchSub}>
                Mask digits in cards for outdoor privacy (e.g. 98230*****).
              </Text>
            </View>
            <Switch value={maskPhone} onValueChange={setMaskPhone} />
          </View>
        </View>

        {/* Diagnostic Information */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Info size={18} color="#1E3A8A" />
            <Text style={styles.cardTitle}>SYSTEM DIAGNOSTICS</Text>
          </View>

          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>App Version:</Text>
            <Text style={styles.diagVal}>1.0.0 (Production Release)</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Android Package:</Text>
            <Text style={styles.diagVal}>com.busassistant.app</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Local SQLite:</Text>
            <Text style={styles.diagVal}>Active & Encrypted</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>PDF OCR Engine:</Text>
            <Text style={styles.diagVal}>Native Heuristic Parser</Text>
          </View>
        </View>
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
    letterSpacing: 0.8,
  },
  descText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    color: '#0F172A',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  testBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testBtnText: {
    color: '#1E3A8A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  diagLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  diagVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
});
