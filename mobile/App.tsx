// MUST be first import — installs global error handler before other modules load
import { getInitErrors } from './services/errorHandler';
import React, { useState, useEffect, Component } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ScrollView, AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import { initDB } from './services/db';
import { loadServerUrl } from './services/api';
import { registerBackgroundSync, unregisterBackgroundSync } from './services/backgroundSync';
import { runSyncIfDue } from './services/syncService';
import LoginScreen from './screens/LoginScreen';
import PatientsScreen from './screens/PatientsScreen';
import PatientDetailScreen from './screens/PatientDetailScreen';
import VisitDetailScreen from './screens/VisitDetailScreen';
import SettingsScreen from './screens/SettingsScreen';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: any) { return { error: e?.message ?? String(e) }; }
  render() {
    const initErrs = getInitErrors();
    if (this.state.error || initErrs.length > 0) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#1a1a1a' }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
          <Text style={{ color: '#ff4444', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Crash Report</Text>
          {this.state.error && <Text style={{ color: '#fff', fontSize: 13, marginBottom: 16 }}>{this.state.error}</Text>}
          {initErrs.map((e, i) => <Text key={i} style={{ color: '#ffcc00', fontSize: 11, marginBottom: 8 }}>{e}</Text>)}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

type Screen =
  | { name: 'login' }
  | { name: 'patients' }
  | { name: 'patient'; id: string }
  | { name: 'visit'; id: string }
  | { name: 'settings' };

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'login' });
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await loadServerUrl();
        initDB();
        const saved = await SecureStore.getItemAsync('token');
        if (saved) {
          setToken(saved);
          setScreen({ name: 'patients' });
          registerBackgroundSync();
        }
        setReady(true);
      } catch (e: any) {
        setInitError(e?.message ?? String(e));
        setReady(true);
      }
    })();
  }, []);

  // Automatic sync while the app is alive. Background fetch alone can be
  // deferred well past its interval by Doze / BGTaskScheduler, so also sync
  // when the doctor brings the app forward and when the phone rejoins a
  // network. runSyncIfDue no-ops when the local copy is still fresh.
  useEffect(() => {
    if (!token) return;

    const syncQuietly = () => {
      runSyncIfDue(token).catch(() => { /* offline or server down — next trigger retries */ });
    };

    syncQuietly();

    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') syncQuietly();
    });

    let networkSub: { remove: () => void } | undefined;
    try {
      networkSub = Network.addNetworkStateListener(state => {
        if (state.isConnected) syncQuietly();
      });
    } catch { /* listener unsupported on this platform build */ }

    return () => {
      appStateSub.remove();
      networkSub?.remove();
    };
  }, [token]);

  if (initError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a1a', padding: 20, paddingTop: 60 }}>
        <Text style={{ color: '#ff4444', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Init Error</Text>
        <Text style={{ color: '#fff', fontSize: 13 }}>{initError}</Text>
      </View>
    );
  }

  function handleLogin(t: string) {
    setToken(t);
    setScreen({ name: 'patients' });
    registerBackgroundSync();
  }

  async function handleLogout() {
    await SecureStore.deleteItemAsync('token');
    await unregisterBackgroundSync();
    setToken(null);
    setScreen({ name: 'login' });
  }

  if (!ready) return null;

  return (
    <ErrorBoundary>
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen.name === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}
      {screen.name === 'patients' && token && (
        <PatientsScreen
          token={token}
          onSelectPatient={id => setScreen({ name: 'patient', id })}
          onSettings={() => setScreen({ name: 'settings' })}
          onLogout={handleLogout}
        />
      )}
      {screen.name === 'settings' && (
        <SettingsScreen
          onBack={() => setScreen({ name: 'patients' })}
          onLogout={handleLogout}
        />
      )}
      {screen.name === 'patient' && (
        <PatientDetailScreen
          patientId={(screen as any).id}
          onSelectVisit={id => setScreen({ name: 'visit', id })}
          onBack={() => setScreen({ name: 'patients' })}
        />
      )}
      {screen.name === 'visit' && (
        <VisitDetailScreen
          visitId={(screen as any).id}
          onBack={() => {
            // Go back to the patient that owns this visit
            const visitId = (screen as any).id;
            import('./services/db').then(db => {
              const v = db.getVisit(visitId);
              if (v) setScreen({ name: 'patient', id: v.patientId });
              else setScreen({ name: 'patients' });
            });
          }}
        />
      )}
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
