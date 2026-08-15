import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
  Modal, FlatList, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as db from '../services/db';
import { C } from '../constants/theme';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;

interface Props {
  patientId: string;
  onSelectVisit: (visitId: string) => void;
  onBack: () => void;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

export default function PatientDetailScreen({ patientId, onSelectVisit, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [tab, setTab] = useState<'info' | 'visits' | 'labs' | 'records'>('info');
  const [viewerItems, setViewerItems] = useState<any[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const flatRef = useRef<FlatList>(null);

  function openViewer(items: any[], index: number) {
    setViewerItems(items);
    setViewerIndex(index);
    setViewerVisible(true);
  }

  useEffect(() => {
    const p = db.getPatient(patientId);
    if (p) {
      try { p.allergies = JSON.parse(p.allergies); } catch { p.allergies = []; }
      setPatient(p);
    }
    setVisits(db.getVisitsByPatient(patientId));
    setLabResults(db.getLabResultsByPatient(patientId));
    setInvestigations(db.getInvestigationsByPatient(patientId));
    setRecords(db.getRecordsByPatient(patientId));
  }, [patientId]);

  if (!patient) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const visitTypeLabel = (t: string) => t === 'new' ? 'New Visit' : 'Follow-up';
  const visitTypeColor = (t: string) => t === 'new' ? C.success : '#8b5cf6';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{patient.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.name}>{patient.name}</Text>
            <Text style={styles.meta}>
              {patient.fileNumber ? `#${patient.fileNumber} · ` : ''}
              {patient.age}y · {patient.gender === 'male' ? '♂ Male' : '♀ Female'}
              {patient.phone ? ` · ${patient.phone}` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['info', 'visits', 'labs', 'records'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'info' ? 'Info'
                : t === 'visits' ? `Visits (${visits.length})`
                : t === 'labs' ? `Labs (${labResults.length + investigations.length})`
                : `Records (${records.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>

        {/* Info */}
        {tab === 'info' && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Info</Text>
              <InfoRow label="Name" value={patient.name} />
              <InfoRow label="Age" value={`${patient.age} years`} />
              <InfoRow label="Gender" value={patient.gender === 'male' ? '♂ Male' : '♀ Female'} />
              {patient.phone ? <InfoRow label="Phone" value={patient.phone} /> : null}
              {patient.fileNumber ? <InfoRow label="File #" value={patient.fileNumber} /> : null}
              {patient.createdAt ? <InfoRow label="Registered" value={formatDate(patient.createdAt)} /> : null}
            </View>

            {patient.medicalHistory ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medical History</Text>
                <Text style={styles.bodyText}>{patient.medicalHistory}</Text>
              </View>
            ) : null}

            {patient.allergies?.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Allergies</Text>
                <View style={styles.tagRow}>
                  {patient.allergies.map((a: string, i: number) => (
                    <View key={i} style={styles.allergyTag}>
                      <Text style={styles.allergyText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Visits */}
        {tab === 'visits' && (
          visits.length === 0
            ? <Text style={styles.empty}>No visits recorded</Text>
            : visits.map(v => (
              <TouchableOpacity key={v.id} style={styles.card} onPress={() => onSelectVisit(v.id)} activeOpacity={0.75}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{formatDate(v.visitDate)}</Text>
                  <Badge text={visitTypeLabel(v.visitType)} color={visitTypeColor(v.visitType)} />
                  {v.price > 0 && <Badge text={`${v.price} LE`} color={C.warning} />}
                </View>
                {v.chiefComplaint ? <Text style={styles.cardField} numberOfLines={1}>CC: {v.chiefComplaint}</Text> : null}
                {v.diagnosis ? <Text style={styles.cardField} numberOfLines={1}>Dx: {v.diagnosis}</Text> : null}
                <Text style={styles.cardLink}>View details ›</Text>
              </TouchableOpacity>
            ))
        )}

        {/* Labs */}
        {tab === 'labs' && (
          labResults.length === 0 && investigations.length === 0
            ? <Text style={styles.empty}>No lab results or investigations recorded</Text>
            : (() => {
              const grouped: Record<string, any[]> = {};
              for (const r of labResults) {
                const key = r.category || 'Other';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(r);
              }
              return (
                <View>
                  {Object.entries(grouped).map(([cat, results]) => (
                    <View key={cat} style={styles.section}>
                      <Text style={styles.sectionTitle}>{cat}</Text>
                      {results.map(r => (
                        <View key={r.id} style={[styles.labRow, r.isAbnormal ? styles.labRowAbnormal : null]}>
                          <View style={styles.labLeft}>
                            <Text style={styles.labName}>{r.testName}</Text>
                            {r.testDate ? <Text style={styles.labDate}>{formatDate(r.testDate)}</Text> : null}
                          </View>
                          <View style={styles.labRight}>
                            <Text style={[styles.labValue, r.isAbnormal && styles.labValueAbnormal]}>
                              {r.resultValue} {r.unit || ''}
                            </Text>
                            {r.referenceRange ? <Text style={styles.labRef}>Ref: {r.referenceRange}</Text> : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}
                  {investigations.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Previous Investigations</Text>
                      <View style={styles.invGrid}>
                        {investigations.map((inv, idx) => {
                          const isImage = inv.fileType?.startsWith('image/');
                          return (
                            <TouchableOpacity key={inv.id} style={styles.invCard} activeOpacity={0.8} onPress={() => openViewer(investigations, idx)}>
                              {isImage && inv.localPath
                                ? <Image source={{ uri: inv.localPath }} style={styles.invThumb} resizeMode="cover" />
                                : <View style={styles.invFilePlaceholder}><Text style={styles.invFileIcon}>📄</Text></View>}
                              <Text style={styles.invName} numberOfLines={2}>{inv.name}</Text>
                              {inv.uploadedAt ? <Text style={styles.invDate}>{formatDate(inv.uploadedAt)}</Text> : null}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })()
        )}

        {/* Records */}
        {tab === 'records' && (
          records.length === 0
            ? <Text style={styles.empty}>No patient records uploaded</Text>
            : (
              <View style={styles.invGrid}>
                {records.map((rec, idx) => {
                  const isImage = rec.fileType?.startsWith('image/');
                  return (
                    <TouchableOpacity key={rec.id} style={styles.invCard} activeOpacity={0.8} onPress={() => openViewer(records, idx)}>
                      {isImage && rec.localPath
                        ? <Image source={{ uri: rec.localPath }} style={styles.invThumb} resizeMode="cover" />
                        : <View style={styles.invFilePlaceholder}><Text style={styles.invFileIcon}>📄</Text></View>}
                      <Text style={styles.invName} numberOfLines={2}>{rec.name}</Text>
                      {rec.uploadedAt ? <Text style={styles.invDate}>{formatDate(rec.uploadedAt)}</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
        )}
      </ScrollView>

      {/* Full-screen file viewer */}
      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={vStyles.overlay}>
          <View style={[vStyles.header, { paddingTop: insets.top + 8 }]}>
            <Text style={vStyles.counter}>{viewerIndex + 1} / {viewerItems.length}</Text>
            <Text style={vStyles.itemName} numberOfLines={1}>{viewerItems[viewerIndex]?.name}</Text>
            <TouchableOpacity onPress={() => setViewerVisible(false)} style={vStyles.closeBtn}>
              <Text style={vStyles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatRef}
            data={viewerItems}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex}
            getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
            onScrollToIndexFailed={info => {
              setTimeout(() => flatRef.current?.scrollToIndex({ index: info.index, animated: false }), 100);
            }}
            onMomentumScrollEnd={e => {
              setViewerIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
            }}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const isImage = item.fileType?.startsWith('image/');
              return (
                <View style={vStyles.page}>
                  {isImage && item.localPath
                    ? <Image source={{ uri: item.localPath }} style={vStyles.fullImg} resizeMode="contain" />
                    : (
                      <View style={vStyles.pdfBox}>
                        <Text style={vStyles.pdfIcon}>📄</Text>
                        <Text style={vStyles.pdfName}>{item.name}</Text>
                        <TouchableOpacity
                          style={vStyles.openBtn}
                          onPress={() => item.localPath && Sharing.shareAsync(item.localPath)}
                        >
                          <Text style={vStyles.openBtnTxt}>Open File</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                </View>
              );
            }}
          />

          {/* Prev / Next */}
          {viewerIndex > 0 && (
            <TouchableOpacity
              style={[vStyles.arrow, vStyles.arrowLeft]}
              onPress={() => {
                const next = viewerIndex - 1;
                flatRef.current?.scrollToIndex({ index: next, animated: true });
                setViewerIndex(next);
              }}
            >
              <Text style={vStyles.arrowTxt}>‹</Text>
            </TouchableOpacity>
          )}
          {viewerIndex < viewerItems.length - 1 && (
            <TouchableOpacity
              style={[vStyles.arrow, vStyles.arrowRight]}
              onPress={() => {
                const next = viewerIndex + 1;
                flatRef.current?.scrollToIndex({ index: next, animated: true });
                setViewerIndex(next);
              }}
            >
              <Text style={vStyles.arrowTxt}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: C.bg },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:             { backgroundColor: C.primary, paddingBottom: 18, paddingHorizontal: 16 },
  backBtn:            { marginBottom: 12 },
  backText:           { color: 'rgba(255,255,255,0.75)', fontSize: 15 },
  headerAvatarRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:             { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  avatarText:         { fontSize: 22, fontWeight: '700', color: '#fff' },
  name:               { fontSize: 21, fontWeight: '700', color: '#fff' },
  meta:               { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  tabs:               { flexDirection: 'row', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  tab:                { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive:          { borderBottomWidth: 2, borderBottomColor: C.primary },
  tabText:            { fontSize: 13, color: C.mutedFg, fontWeight: '500' },
  tabTextActive:      { color: C.primary, fontWeight: '700' },
  body:               { flex: 1 },
  bodyContent:        { padding: 12, gap: 8 },
  empty:              { textAlign: 'center', color: C.mutedFg, marginTop: 40, fontSize: 15 },
  card:               { backgroundColor: C.card, borderRadius: 12, padding: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  cardHeader:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  cardDate:           { fontSize: 14, fontWeight: '600', color: C.fg, flex: 1 },
  cardField:          { fontSize: 13, color: C.fgSub, marginTop: 2 },
  cardLink:           { fontSize: 12, color: C.primary, marginTop: 8, fontWeight: '600' },
  badge:              { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
  badgeText:          { fontSize: 11, fontWeight: '600' },
  section:            { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  sectionTitle:       { fontSize: 11, fontWeight: '700', color: C.mutedFg, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  labRow:             { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.muted },
  labRowAbnormal:     { backgroundColor: C.errorLight, marginHorizontal: -14, paddingHorizontal: 14 },
  labLeft:            { flex: 1 },
  labRight:           { alignItems: 'flex-end' },
  labName:            { fontSize: 14, color: C.fgSub, fontWeight: '500' },
  labDate:            { fontSize: 11, color: C.mutedFg, marginTop: 2 },
  labValue:           { fontSize: 14, fontWeight: '600', color: C.fg },
  labValueAbnormal:   { color: C.error },
  labRef:             { fontSize: 11, color: C.mutedFg, marginTop: 1 },
  infoRow:            { flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.muted },
  infoLabel:          { width: 90, fontSize: 13, color: C.mutedFg, fontWeight: '500' },
  infoValue:          { flex: 1, fontSize: 13, color: C.fg },
  bodyText:           { fontSize: 14, color: C.fgSub, lineHeight: 20 },
  tagRow:             { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergyTag:         { backgroundColor: C.errorLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#fecaca' },
  allergyText:        { color: C.error, fontSize: 13 },
  warning:            { color: C.warning },
  invGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  invCard:            { width: '47%', backgroundColor: C.muted, borderRadius: 10, overflow: 'hidden' },
  invThumb:           { width: '100%', height: 90 },
  invFilePlaceholder: { width: '100%', height: 90, alignItems: 'center', justifyContent: 'center', backgroundColor: C.border },
  invFileIcon:        { fontSize: 32 },
  invName:            { fontSize: 11, color: C.fg, padding: 6, paddingBottom: 2 },
  invDate:            { fontSize: 10, color: C.mutedFg, paddingHorizontal: 6, paddingBottom: 6 },
});

const vStyles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: '#000' },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  counter:    { color: 'rgba(255,255,255,0.6)', fontSize: 13, minWidth: 40 },
  itemName:   { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500' },
  closeBtn:   { padding: 8 },
  closeTxt:   { color: '#fff', fontSize: 20, lineHeight: 22 },
  page:       { width: SCREEN_W, flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullImg:    { width: SCREEN_W, height: SCREEN_H * 0.75 },
  pdfBox:     { alignItems: 'center', gap: 16, paddingHorizontal: 32 },
  pdfIcon:    { fontSize: 72 },
  pdfName:    { color: '#fff', fontSize: 16, textAlign: 'center' },
  openBtn:    { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  openBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  arrow:      { position: 'absolute', top: '50%', padding: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 32 },
  arrowLeft:  { left: 8 },
  arrowRight: { right: 8 },
  arrowTxt:   { color: '#fff', fontSize: 32, lineHeight: 36 },
});
