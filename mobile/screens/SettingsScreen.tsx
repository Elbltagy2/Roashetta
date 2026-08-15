import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { saveServerUrl, API_URL } from '../services/api';
import { getPatientCount, getSyncMeta } from '../services/db';
import { C } from '../constants/theme';

interface Props {
  onBack: () => void;
  onLogout: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

export default function SettingsScreen({ onBack, onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const [serverInput, setServerInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [patientCount, setPatientCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    setServerInput(API_URL.replace(/\/api$/, ''));
    setPatientCount(getPatientCount());
    setLastSync(getSyncMeta('lastSyncAt'));
  }, []);

  async function handleSaveServer() {
    if (!serverInput.trim()) { Alert.alert('Error', 'Enter a server URL'); return; }
    setSaving(true);
    try {
      await saveServerUrl(serverInput.trim());
      Alert.alert('Saved', 'Server URL updated. Used on next sync or login.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function confirmLogout() {
    Alert.alert(
      'Logout',
      'You will be logged out. Synced data stays on device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Status</Text>
          <Row label="Patients stored" value={String(patientCount)} />
          <Row label="Last sync" value={formatDate(lastSync)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinic Server</Text>
          <Text style={styles.hint}>Change if the clinic server IP changes. Must include port.</Text>
          <TextInput
            style={styles.input}
            value={serverInput}
            onChangeText={setServerInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.1.24:3000"
            placeholderTextColor={C.mutedFg}
          />
          <TouchableOpacity
            style={[styles.btn, saving && styles.btnDisabled]}
            onPress={handleSaveServer}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Save Server URL</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Roashetta Mobile · Read-only viewer</Text>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  header:       { backgroundColor: C.primary, paddingBottom: 16, paddingHorizontal: 16 },
  backBtn:      { marginBottom: 8 },
  backText:     { color: 'rgba(255,255,255,0.75)', fontSize: 15 },
  title:        { fontSize: 22, fontWeight: '800', color: '#fff' },
  body:         { padding: 16, gap: 8 },
  section:      { backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 8, elevation: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.mutedFg, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  hint:         { fontSize: 13, color: C.mutedFg, marginBottom: 10, lineHeight: 18 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.muted },
  rowLabel:     { fontSize: 14, color: C.fgSub },
  rowValue:     { fontSize: 14, color: C.fg, fontWeight: '500' },
  input:        { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 15, color: C.fg, backgroundColor: C.bg, marginBottom: 12 },
  btn:          { backgroundColor: C.primary, borderRadius: 10, padding: 13, alignItems: 'center' },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutBtn:    { backgroundColor: C.errorLight, borderRadius: 10, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  logoutText:   { color: C.error, fontSize: 15, fontWeight: '700' },
  version:      { textAlign: 'center', color: C.border, fontSize: 12, marginTop: 8 },
});
