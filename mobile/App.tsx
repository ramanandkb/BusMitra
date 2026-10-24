import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Grid,
  FileUp,
  Settings as SettingsIcon,
  Briefcase,
  TrendingUp,
} from 'lucide-react-native';
import { AppProvider } from './src/state/AppContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { BoardingScreen } from './src/screens/BoardingScreen';
import { DroppingScreen } from './src/screens/DroppingScreen';
import { SeatDashboardScreen } from './src/screens/SeatDashboardScreen';
import { ManifestUploadScreen } from './src/screens/ManifestUploadScreen';
import { TripManagementScreen } from './src/screens/TripManagementScreen';
import { OfflineSyncScreen } from './src/screens/OfflineSyncScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentScreen} />;
      case 'boarding':
        return <BoardingScreen />;
      case 'dropping':
        return <DroppingScreen />;
      case 'seatmap':
        return <SeatDashboardScreen />;
      case 'upload':
        return <ManifestUploadScreen onSuccessNavigate={() => setCurrentScreen('boarding')} />;
      case 'trips':
        return <TripManagementScreen />;
      case 'sync':
        return <OfflineSyncScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <AppProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

        {/* Screen View */}
        <View style={styles.mainContent}>{renderScreen()}</View>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('home')}
            activeOpacity={0.7}
          >
            <LayoutDashboard
              size={22}
              color={currentScreen === 'home' ? '#1E3A8A' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                currentScreen === 'home' && styles.navLabelActive,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('boarding')}
            activeOpacity={0.7}
          >
            <Users
              size={22}
              color={currentScreen === 'boarding' ? '#1E3A8A' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                currentScreen === 'boarding' && styles.navLabelActive,
              ]}
            >
              Boarding
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('dropping')}
            activeOpacity={0.7}
          >
            <MapPin
              size={22}
              color={currentScreen === 'dropping' ? '#1E3A8A' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                currentScreen === 'dropping' && styles.navLabelActive,
              ]}
            >
              Dropping
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('seatmap')}
            activeOpacity={0.7}
          >
            <Grid
              size={22}
              color={currentScreen === 'seatmap' ? '#1E3A8A' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                currentScreen === 'seatmap' && styles.navLabelActive,
              ]}
            >
              Seats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('upload')}
            activeOpacity={0.7}
          >
            <FileUp
              size={22}
              color={currentScreen === 'upload' ? '#1E3A8A' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                currentScreen === 'upload' && styles.navLabelActive,
              ]}
            >
              Upload
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('settings')}
            activeOpacity={0.7}
          >
            <SettingsIcon
              size={22}
              color={currentScreen === 'settings' ? '#1E3A8A' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                currentScreen === 'settings' && styles.navLabelActive,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A', // Top status bar background
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#1E3A8A',
    fontWeight: 'bold',
  },
});
