import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { runSync, SyncProgress } from '../services/syncService';
import * as db from '../services/db';
import { C } from '../constants/theme';

interface Props {
  token: string;
  onSelectPatient: (id: string) => void;
  onSettings: () => void;
  onLogout: () => void;
}

function formatLastSync(iso: string | null): string {
  if (!iso) return 'Never synced';
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 60) return `Synced ${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Synced ${diffH}h ago`;
  return `Synced ${Math.round(diffH / 24)}d ago`;
}

export default function PatientsScreen({ token, onSelectPatient, onSettings }: Props) {
  const insets = useSafeAreaInsets();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [patientCount, setPatientCount] = useState(0);

  const loadPatients = useCallback((q = search) => {
    setPatients(db.getPatients(q).map(p => ({
      ...p,
      allergies: (() => { try { return JSON.parse(p.allergies); } catch { return []; } })(),
    })));
    setLastSync(db.getSyncMeta('lastSyncAt'));
    setPatientCount(db.getPatientCount());
  }, [search]);

  useEffect(() => {
    loadPatients();
    // auto-sync on every app open; silent fail (no alert) if server unreachable
    setIsSyncing(true);
    setSyncProgress(null);
    runSync(token, setSyncProgress)
      .then(() => loadPatients())
      .catch(() => { /* not on WiFi — ignore */ })
      .finally(() => { setIsSyncing(false); setSyncProgress(null); });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadPatients(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  async function handleSync() {
    setIsSyncing(true);
    setSyncProgress(null);
    try {
      const count = await runSync(token, setSyncProgress);
      loadPatients(search);
      Alert.alert('Sync Complete', `${count} patients synced`);
    } catch (err: any) {
      Alert.alert('Sync Failed', err?.message || 'Could not reach server. Make sure you are on clinic WiFi.');
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }

  const renderPatient = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => onSelectPatient(item.id)} activeOpacity={0.75}>
      <View style={styles.cardRow}>
        <View style={[styles.avatar, { backgroundColor: item.gender === 'female' ? C.accentLight : C.primaryLight }]}>
          <Text style={[styles.avatarText, { color: item.gender === 'female' ? C.accent : C.primary }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardMeta}>
            {item.fileNumber ? `#${item.fileNumber} · ` : ''}
            {item.age}y · {item.gender === 'male' ? '♂ Male' : '♀ Female'}
          </Text>
          {item.phone ? <Text style={styles.cardPhone}>{item.phone}</Text> : null}
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Patients</Text>
            <Text style={styles.meta}>{patientCount} patients · {formatLastSync(lastSync)}</Text>
          </View>
          <TouchableOpacity onPress={onSettings} style={styles.settingsBtn}>
            <Text style={styles.settingsBtnText}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Search inside header */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, file number, phone…"
            placeholderTextColor="rgba(255,255,255,0.55)"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Sync bar */}
      <View style={styles.syncBar}>
        {isSyncing ? (
          <View style={styles.syncRow}>
            <ActivityIndicator size="small" color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.syncText}>{syncProgress?.message ?? 'Syncing…'}</Text>
              {syncProgress?.phase === 'drawings' && (
                <Text style={styles.syncSubText}>Phase 2/2 — drawings (may take a while)</Text>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.syncBtn} onPress={handleSync} activeOpacity={0.7}>
            <Text style={styles.syncBtnText}>⟳  Sync from server</Text>
          </TouchableOpacity>
        )}
      </View>

      {patients.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>
            {patientCount === 0 ? 'No data synced yet' : 'No results'}
          </Text>
          <Text style={styles.emptyText}>
            {patientCount === 0
              ? 'Connect to clinic WiFi and tap "Sync from server"'
              : 'Try a different search'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={i => i.id}
          renderItem={renderPatient}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  header:         { backgroundColor: C.primary, paddingHorizontal: 16, paddingBottom: 16 },
  headerTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title:          { fontSize: 22, fontWeight: '800', color: '#fff' },
  meta:           { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  settingsBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  settingsBtnText:{ fontSize: 18 },
  searchWrap:     {},
  searchInput:    { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  syncBar:        { backgroundColor: C.primaryLight, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  syncRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  syncText:       { color: C.primaryDark, fontSize: 13, fontWeight: '500' },
  syncSubText:    { color: C.mutedFg, fontSize: 11, marginTop: 1 },
  syncBtn:        { alignSelf: 'flex-start' },
  syncBtnText:    { color: C.primary, fontSize: 14, fontWeight: '700' },
  list:           { padding: 12, gap: 8 },
  card:           { backgroundColor: C.card, borderRadius: 12, padding: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  cardRow:        { flexDirection: 'row', alignItems: 'center' },
  avatar:         { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText:     { fontSize: 19, fontWeight: '700' },
  cardInfo:       { flex: 1 },
  cardName:       { fontSize: 16, fontWeight: '600', color: C.fg },
  cardMeta:       { fontSize: 13, color: C.mutedFg, marginTop: 2 },
  cardPhone:      { fontSize: 12, color: C.mutedFg, marginTop: 1 },
  chevron:        { fontSize: 22, color: C.border, marginLeft: 8 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyTitle:     { fontSize: 18, fontWeight: '600', color: C.fgSub, marginBottom: 8 },
  emptyText:      { fontSize: 14, color: C.mutedFg, textAlign: 'center', lineHeight: 20 },
});
