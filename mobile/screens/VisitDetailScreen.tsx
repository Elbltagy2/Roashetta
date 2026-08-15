import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import * as db from '../services/db';
import { ensureLocalFile } from '../services/fileCache';
import { getVisitCanvases } from '../services/canvasService';
import { C } from '../constants/theme';
import { groupLabTests } from '../constants/labData';
import { groupRadiologyTests } from '../constants/radiologyData';

const SW = Dimensions.get('window').width;
const IMG_W = SW - 32;
const IMG_H = IMG_W * 1.414; // A4 ratio

type Tab = 'info' | 'history' | 'checklists' | 'requests' | 'attachments';

const TABS: { key: Tab; label: string }[] = [
  { key: 'info',        label: 'Visit Info' },
  { key: 'history',     label: 'History' },
  { key: 'checklists',  label: 'Checklists' },
  { key: 'requests',    label: 'Requests' },
  { key: 'attachments', label: 'Attachments' },
];

interface Props { visitId: string; onBack: () => void; }

function formatDate(iso: string): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return iso; }
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BodyText({ text }: { text: string }) {
  return <Text style={s.bodyText}>{text}</Text>;
}

function Drawing({ uri, label, text }: { uri: string; label: string; text?: string }) {
  return (
    <View style={s.drawing}>
      {label ? <Text style={s.drawingLabel}>{label}</Text> : null}
      {text
        ? <Text style={s.drawingText}>{text}</Text>
        : <Image source={{ uri }} style={{ width: IMG_W, height: IMG_H }} resizeMode="contain" />}
    </View>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

// Channel markers the desktop app puts in the attachment filename on upload.
const PRESCRIPTION_PREFIX = '[Prescription]';
const RADIOLOGY_PREFIX = '[Radiology]';

function stripChannelPrefix(name: string): string {
  return (name || '').replace(/^\[(Prescription|Radiology)\]\s*/, '');
}

function AttachmentRow({ att }: { att: any }) {
  const isImage = att.fileType?.startsWith('image/');
  const [localPath, setLocalPath] = useState<string>(att.localPath || '');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Files download on first open, so opening one needs the server (or a copy
  // cached from a previous open).
  async function fetchFile(): Promise<string | null> {
    setLoading(true);
    setFailed(false);
    try {
      const path = await ensureLocalFile('visit_attachments', att);
      if (path) { setLocalPath(path); return path; }
      setFailed(true);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function open() {
    const path = localPath || (await fetchFile());
    if (path) Sharing.shareAsync(path).catch(() => { /* dismissed */ });
  }

  return (
    <View style={s.attRow}>
      {isImage && localPath
        ? <Image source={{ uri: localPath }} style={s.attThumb} resizeMode="cover" />
        : <View style={s.attIconBox}><Text style={s.attIcon}>{isImage ? '🖼' : '📄'}</Text></View>}
      <View style={s.attInfo}>
        <Text style={s.attName} numberOfLines={2}>{stripChannelPrefix(att.name) || 'Untitled'}</Text>
        <Text style={s.attMeta}>
          {failed
            ? 'Unavailable offline — connect and retry'
            : localPath ? (att.fileType || 'file') : `${att.fileType || 'file'} · tap to download`}
        </Text>
      </View>
      <TouchableOpacity style={s.attOpenBtn} onPress={open} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={s.attOpenTxt}>{localPath ? 'Open' : 'Get'}</Text>}
      </TouchableOpacity>
    </View>
  );
}

function AttachmentList({ items }: { items: any[] }) {
  return <>{items.map(att => <AttachmentRow key={att.id} att={att} />)}</>;
}

export default function VisitDetailScreen({ visitId, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [visit, setVisit] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [canvasMap, setCanvasMap] = useState<Record<string, string>>({});
  const [canvasText, setCanvasText] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>('info');
  const [sharing, setSharing] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    setAttachments(db.getAttachmentsByVisit(visitId));
    const v = db.getVisit(visitId);
    if (!v) return;
    if (v.vitals && typeof v.vitals === 'string') {
      try { v.vitals = JSON.parse(v.vitals); } catch { v.vitals = null; }
    }
    if (v.prescriptionMedicines && typeof v.prescriptionMedicines === 'string') {
      try { v.prescriptionMedicines = JSON.parse(v.prescriptionMedicines); } catch { v.prescriptionMedicines = null; }
    }
    setVisit(v);
    const p = db.getPatient(v.patientId);
    if (p) setPatient(p);
    getVisitCanvases(visitId).then(list => {
      const map: Record<string, string> = {};
      const txt: Record<string, string> = {};
      list.forEach(c => {
        map[c.key] = c.uri;
        if (c.text) txt[c.key] = c.text;
      });
      setCanvasMap(map);
      setCanvasText(txt);
    });
  }, [visitId]);

  if (!visit) return <View style={s.center}><Text style={s.notFound}>Visit not found</Text></View>;

  const ESC = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const patName = patient?.name ?? '';
  const visitDateStr = visit?.visitDate ? new Date(visit.visitDate).toLocaleDateString('en-GB') : '';

  async function toBase64(uri: string, mimeType = 'image/png'): Promise<string> {
    try {
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return `data:${mimeType};base64,${b64}`;
    } catch { return ''; }
  }

  async function doShare(html: string) {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 595,   // A4 at 72dpi — keeps file small
      height: 842,
    });
    try {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch { /* user dismissed share sheet — not an error */ }
  }

  async function run(fn: () => Promise<void>) {
    setSharing(true);
    try { await fn(); }
    catch (e: any) { Alert.alert('Share failed', e?.message || 'Could not generate PDF'); }
    finally { setSharing(false); }
  }

  // ── Lab request HTML (matches web design) ──────────────────────────────────
  function buildLabHtml(): string {
    const rows = labGroups.map(g => `
      <div class="category">
        <div class="category-header">${ESC(g.cat)}</div>
        ${g.tests.map(t => `<div class="test-item"><span class="checkbox">&#9745;</span><span class="test-name">${ESC(t)}</span></div>`).join('')}
      </div>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important}
      @page{size:A4;margin:15mm}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.4}
      .container{max-width:210mm;margin:0 auto}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2px solid #1e40af;margin-bottom:15px}
      .header-left{text-align:left}.header-right{text-align:right;direction:rtl}
      .doctor-name{font-size:14px;font-weight:bold;color:#1e40af}
      .credentials{font-size:10px;color:#374151}
      .patient-info{display:flex;gap:40px;margin-bottom:20px;font-size:13px}
      .patient-info span{font-weight:bold}
      .title{text-align:center;font-size:18px;font-weight:bold;color:#1e40af;margin-bottom:20px;padding:10px;border:2px solid #1e40af;border-radius:8px}
      .tests-container{display:grid;grid-template-columns:repeat(2,1fr);gap:15px}
      .category{margin-bottom:10px;break-inside:avoid}
      .category-header{background:#1e40af;color:white;padding:6px 10px;font-size:12px;font-weight:bold;margin-bottom:5px;border-radius:4px}
      .test-item{display:flex;align-items:center;gap:8px;padding:4px 10px;font-size:12px}
      .test-item:nth-child(even){background:#f3f4f6}
      .checkbox{font-size:14px;color:#16a34a}.test-name{flex:1}
      .footer{margin-top:30px;padding-top:12px;border-top:1px solid #d1d5db;display:flex;justify-content:space-between;font-size:10px;color:#6b7280}
    </style></head><body><div class="container">
      <div class="header">
        <div class="header-left"><p class="doctor-name">Dr/ Sherif Ali . MD, MRCP (UK)</p><p class="credentials">Consultant Internal Medicine &amp; Nephrology</p></div>
        <div class="header-right"><p class="doctor-name">د/ شريف علي رضا</p><p class="credentials">استشاري الباطنة العامة والكلى</p></div>
      </div>
      <div class="patient-info"><div>Name / الاسم: <span>${ESC(patName)}</span></div><div>Date / التاريخ: <span>${visitDateStr}</span></div></div>
      <div class="title">Lab Test Request / طلب تحاليل معملية</div>
      <div class="tests-container">${rows}</div>
      ${labNotes ? `<div style="margin-top:15px;padding:8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px">${ESC(labNotes)}</div>` : ''}
      <div class="footer"><div>مستشفى تبارك/النسائم - 16552 - 15452</div><div>١٨ عمارات خلف العبور - مصر الجديدة - ت: 01554343147</div></div>
    </div></body></html>`;
  }

  // ── Radiology request HTML (matches web design) ─────────────────────────────
  function buildRadiologyHtml(): string {
    const rows = radGroups.map(g => `
      <div class="category">
        <div class="category-header">${ESC(g.cat)}</div>
        ${g.tests.map(t => `<div class="test-item"><span class="checkbox">&#9745;</span><span class="test-name">${ESC(t)}</span></div>`).join('')}
      </div>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important}
      @page{size:A4;margin:15mm}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.4}
      .container{max-width:210mm;margin:0 auto}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2px solid #7c3aed;margin-bottom:15px}
      .header-left{text-align:left}.header-right{text-align:right;direction:rtl}
      .doctor-name{font-size:14px;font-weight:bold;color:#7c3aed}
      .credentials{font-size:10px;color:#374151}
      .patient-info{display:flex;gap:40px;margin-bottom:20px;font-size:13px}
      .patient-info span{font-weight:bold}
      .title{text-align:center;font-size:18px;font-weight:bold;color:#7c3aed;margin-bottom:20px;padding:10px;border:2px solid #7c3aed;border-radius:8px}
      .tests-container{display:grid;grid-template-columns:repeat(2,1fr);gap:15px}
      .category{margin-bottom:10px;break-inside:avoid}
      .category-header{background:#7c3aed;color:white;padding:6px 10px;font-size:12px;font-weight:bold;margin-bottom:5px;border-radius:4px}
      .test-item{display:flex;align-items:center;gap:8px;padding:4px 10px;font-size:12px}
      .test-item:nth-child(even){background:#f3f4f6}
      .checkbox{font-size:14px;color:#16a34a}.test-name{flex:1}
      .footer{margin-top:30px;padding-top:12px;border-top:1px solid #d1d5db;display:flex;justify-content:space-between;font-size:10px;color:#6b7280}
    </style></head><body><div class="container">
      <div class="header">
        <div class="header-left"><p class="doctor-name">Dr/ Sherif Ali . MD, MRCP (UK)</p><p class="credentials">Consultant Internal Medicine &amp; Nephrology</p></div>
        <div class="header-right"><p class="doctor-name">د/ شريف علي رضا</p><p class="credentials">استشاري الباطنة العامة والكلى</p></div>
      </div>
      <div class="patient-info"><div>Name / الاسم: <span>${ESC(patName)}</span></div><div>Date / التاريخ: <span>${visitDateStr}</span></div></div>
      <div class="title">Radiology Request / طلب أشعة</div>
      <div class="tests-container">${rows}</div>
      ${radNotes ? `<div style="margin-top:15px;padding:8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px">${ESC(radNotes)}</div>` : ''}
      <div class="footer"><div>مستشفى تبارك/النسائم - 16552 - 15452</div><div>١٨ عمارات خلف العبور - مصر الجديدة - ت: 01554343147</div></div>
    </div></body></html>`;
  }

  // ── Prescription HTML (matches web design: pad + table) ─────────────────────
  async function buildPrescriptionHtml(): Promise<string> {
    const medRows = medicines.map((m, i) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center">${i + 1}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb"><div style="font-weight:600">${ESC(m.name || m.genericName || '')}</div>${m.genericName && m.name !== m.genericName ? `<div style="font-size:10px;color:#6b7280">${ESC(m.genericName)}</div>` : ''}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb">${ESC(m.dosage || '')}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb">${ESC(m.frequency || '')}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb">${ESC(m.duration || '')}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb">${ESC(m.instructions || '')}</td>
      </tr>`).join('');

    const prescImgs = await Promise.all(
      [canvasMap.notesDrawing, canvasMap.notesDrawing2, canvasMap.notesDrawing3]
        .filter(Boolean)
        .map(async (uri, i) => {
          const src = await toBase64(uri!);
          return src ? `<div style="margin-top:16px"><p style="font-size:11px;color:#6b7280;margin-bottom:4px">Prescription Page ${i + 1}</p><img src="${src}" style="width:100%;max-width:400px"/></div>` : '';
        })
    );

    // Photos/scans attached in the prescription section print with the
    // prescription, matching the desktop output. Non-images (PDFs) can't be
    // inlined here, so they're named instead of silently dropped.
    const prescAttachImgs = await Promise.all(
      prescriptionFiles.map(async (att) => {
        const label = ESC(stripChannelPrefix(att.name));
        if (!att.localPath) return '';
        if (!att.fileType?.startsWith('image/')) {
          return `<div style="margin-top:12px;font-size:11px;color:#6b7280">📄 Attached file: ${label}</div>`;
        }
        const src = await toBase64(att.localPath, att.fileType);
        return src
          ? `<div style="margin-top:16px"><p style="font-size:11px;color:#6b7280;margin-bottom:4px">${label}</p><img src="${src}" style="width:100%;max-width:400px"/></div>`
          : '';
      })
    );

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important}
      @page{size:A5;margin:10mm}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.4}
      .prescription-container{width:148mm;min-height:210mm;display:flex;flex-direction:column;background:white}
      .header{border-bottom:1px solid #d1d5db;padding:16px 16px 12px}
      .header-content{display:flex;direction:ltr;justify-content:space-between;align-items:flex-start}
      .header-left{text-align:left;direction:ltr}
      .header-right{text-align:right;direction:rtl;line-height:1.6}
      .doctor-name{font-size:14px;font-weight:bold;color:#1f2937}
      .credentials{font-size:10px;color:#4b5563}
      .patient-info{margin-top:10px;font-size:12px;color:#374151;direction:ltr}
      .body{position:relative;flex:1;padding:16px 16px 16px 70px}
      .rx-symbol{position:absolute;top:20px;left:20px;font-size:40px;color:#9ca3af;font-family:'Times New Roman',serif}
      .footer{border-top:1px solid #d1d5db;padding:12px;background:#f9fafb;margin-top:auto}
      .footer-content{display:flex;direction:ltr;justify-content:space-between;font-size:10px;color:#4b5563}
      .footer-left{text-align:right;direction:rtl}.footer-right{text-align:right;direction:rtl}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
      th{padding:6px 8px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:left}
    </style></head><body>
      <div class="prescription-container">
        <div class="header">
          <div class="header-content">
            <div class="header-left"><p class="doctor-name">Dr/ Sherif Ali . MD,MRCP (Uk)</p></div>
            <div class="header-right">
              <p class="doctor-name">دكتـــور</p>
              <p class="doctor-name">شــريف علي رضــا</p>
              <p class="credentials">زميـــل الكلية الملكيـــة البـــريطانيـــة</p>
              <p class="credentials">لطب الباطنـــة والكـــلى</p>
              <p class="credentials">دكتوراه الأمـــراض الباطنيـــة</p>
              <p class="credentials">استشارى أمراض الباطنـــة العامة والكلى</p>
            </div>
          </div>
          <div class="patient-info">
            <div>Name : <strong>${ESC(patName)}</strong> &nbsp;&nbsp; Date : <strong>${visitDateStr}</strong></div>
          </div>
        </div>
        <div class="body">
          <div class="rx-symbol">℞/</div>
          ${medicines.length ? `
            <table>
              <thead><tr>
                <th style="width:30px">#</th>
                <th>الدواء / Medicine</th>
                <th>الجرعة / Dose</th>
                <th>التكرار / Frequency</th>
                <th>المدة / Duration</th>
                <th>التعليمات / Instructions</th>
              </tr></thead>
              <tbody>${medRows}</tbody>
            </table>` : ''}
          ${prescImgs.filter(Boolean).join('')}
          ${prescAttachImgs.filter(Boolean).join('')}
        </div>
        <div class="footer">
          <div class="footer-content">
            <div class="footer-left"><p style="font-weight:600">مستشفى تبارك/النسائم</p><p>16552 - 15452</p></div>
            <div class="footer-right"><p>١٨ عمارات خلف العبور - مصر الجديدة</p><p>ت: 01554343147 - 0222602733</p></div>
          </div>
        </div>
      </div>
    </body></html>`;
  }

  // ── Full visit HTML (single document, all sections) ────────────────────────
  async function buildFullVisitHtml(): Promise<string> {
    const [
      chiefSrc, diagSrc,
      notesSrc, notesSrc2, notesSrc3,
      histSrc, hpiSrc, drugSrc, famSrc, curMedSrc,
      radSrc, radSrc2, radSrc3,
    ] = await Promise.all([
      canvasMap.chiefComplaintDrawing      ? toBase64(canvasMap.chiefComplaintDrawing)      : Promise.resolve(''),
      canvasMap.diagnosisDrawing           ? toBase64(canvasMap.diagnosisDrawing)           : Promise.resolve(''),
      canvasMap.notesDrawing               ? toBase64(canvasMap.notesDrawing)               : Promise.resolve(''),
      canvasMap.notesDrawing2              ? toBase64(canvasMap.notesDrawing2)              : Promise.resolve(''),
      canvasMap.notesDrawing3              ? toBase64(canvasMap.notesDrawing3)              : Promise.resolve(''),
      canvasMap.pastMedicalHistoryDrawing  ? toBase64(canvasMap.pastMedicalHistoryDrawing)  : Promise.resolve(''),
      canvasMap.hpiDrawing                 ? toBase64(canvasMap.hpiDrawing)                 : Promise.resolve(''),
      canvasMap.drugHistoryDrawing         ? toBase64(canvasMap.drugHistoryDrawing)         : Promise.resolve(''),
      canvasMap.familyHistoryDrawing       ? toBase64(canvasMap.familyHistoryDrawing)       : Promise.resolve(''),
      canvasMap.currentMedicationDrawing   ? toBase64(canvasMap.currentMedicationDrawing)   : Promise.resolve(''),
      canvasMap.radiologyDrawing           ? toBase64(canvasMap.radiologyDrawing)           : Promise.resolve(''),
      canvasMap.radiologyDrawing2          ? toBase64(canvasMap.radiologyDrawing2)          : Promise.resolve(''),
      canvasMap.radiologyDrawing3          ? toBase64(canvasMap.radiologyDrawing3)          : Promise.resolve(''),
    ]);

    const img = (src: string, label = '') => src
      ? `<div class="canvas-block">${label ? `<p class="canvas-label">${label}</p>` : ''}<img src="${src}" class="canvas-img"/></div>`
      : '';

    const vitalsHtml = Object.keys(vitals).length ? `
      <div class="vitals-grid">
        ${vitals.bloodPressure    ? `<div class="vital"><span class="vl">BP</span><span class="vv">${vitals.bloodPressure}</span></div>` : ''}
        ${vitals.heartRate        ? `<div class="vital"><span class="vl">HR</span><span class="vv">${vitals.heartRate} bpm</span></div>` : ''}
        ${vitals.temperature      ? `<div class="vital"><span class="vl">Temp</span><span class="vv">${vitals.temperature}°C</span></div>` : ''}
        ${vitals.oxygenSaturation ? `<div class="vital"><span class="vl">SpO₂</span><span class="vv">${vitals.oxygenSaturation}%</span></div>` : ''}
        ${vitals.weight           ? `<div class="vital"><span class="vl">Weight</span><span class="vv">${vitals.weight} kg</span></div>` : ''}
        ${vitals.height           ? `<div class="vital"><span class="vl">Height</span><span class="vv">${vitals.height} cm</span></div>` : ''}
      </div>` : '';

    const medTableRows = medicines.map((m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${ESC(m.name || m.genericName || '')}</strong>${m.genericName && m.name !== m.genericName ? `<br/><small>${ESC(m.genericName)}</small>` : ''}</td>
        <td>${ESC(m.dosage || '')}</td>
        <td>${ESC(m.frequency || '')}</td>
        <td>${ESC(m.duration || '')}</td>
        <td>${ESC(m.instructions || '')}</td>
      </tr>`).join('');

    const labCatRows = labGroups.map(g => `
      <div class="req-cat">
        <div class="req-cat-hdr blue">${ESC(g.cat)}</div>
        ${g.tests.map(t => `<div class="req-item">&#9745; ${ESC(t)}</div>`).join('')}
      </div>`).join('');

    const radCatRows = radGroups.map(g => `
      <div class="req-cat">
        <div class="req-cat-hdr purple">${ESC(g.cat)}</div>
        ${g.tests.map(t => `<div class="req-item">&#9745; ${ESC(t)}</div>`).join('')}
      </div>`).join('');

    const clHtml = checklistSections.map(([name, section]: [string, any]) => {
      const items = Object.entries(section.items || {}).filter(([, v]) => v).map(([k]) => k as string);
      return `<div class="cl-section">
        <p class="cl-title">${ESC(name)}</p>
        <div class="cl-chips">${items.map(i => `<span class="chip">${ESC(i)}</span>`).join('')}</div>
        ${section.notes ? `<p class="cl-notes">${ESC(section.notes)}</p>` : ''}
      </div>`;
    }).join('');

    const HEADER = `
      <div class="doc-header">
        <div><p class="doc-name">Dr/ Sherif Ali . MD, MRCP (UK)</p><p class="doc-cred">Consultant Internal Medicine &amp; Nephrology</p></div>
        <div style="text-align:right;direction:rtl"><p class="doc-name">د/ شريف علي رضا</p><p class="doc-cred">استشاري الباطنة العامة والكلى</p></div>
      </div>
      <div class="pat-row"><div>Name: <strong>${ESC(patName)}</strong></div><div>Date: <strong>${visitDateStr}</strong></div><div>Type: <strong>${visit.visitType === 'new' ? 'New Visit' : 'Follow-up'}</strong>${visit.price ? ` · <strong>${visit.price} LE</strong>` : ''}</div></div>`;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important}
      @page{size:A4;margin:12mm}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1f2937;line-height:1.5}
      .doc-header{display:flex;justify-content:space-between;border-bottom:2px solid #2a9d90;padding-bottom:10px;margin-bottom:10px}
      .doc-name{font-size:13px;font-weight:bold;color:#2a9d90}
      .doc-cred{font-size:10px;color:#4b5563}
      .pat-row{display:flex;gap:24px;font-size:12px;margin-bottom:14px;padding:6px 10px;background:#f0fafa;border-radius:6px}
      .section{margin-bottom:18px}
      .section-title{font-size:13px;font-weight:700;color:#2a9d90;border-bottom:1px solid #d1faf6;padding-bottom:4px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.4px}
      .page-break{page-break-before:always;padding-top:8px}
      .vitals-grid{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:8px}
      .vital{background:#f0fafa;border:1px solid #d1faf6;border-radius:6px;padding:6px 10px;min-width:80px;text-align:center}
      .vl{display:block;font-size:10px;color:#6b7280}.vv{display:block;font-size:13px;font-weight:700;color:#1f2937}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px}
      th,td{padding:5px 7px;border:1px solid #e5e7eb;text-align:left}
      th{background:#f3f4f6;font-weight:600}
      .canvas-block{margin-bottom:10px}
      .canvas-label{font-size:10px;color:#6b7280;margin-bottom:3px}
      .canvas-img{width:100%;max-width:560px;border:1px solid #e5e7eb;border-radius:4px;image-rendering:auto}
      .req-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
      .req-cat{break-inside:avoid}
      .req-cat-hdr{color:white;padding:4px 8px;font-size:11px;font-weight:bold;border-radius:4px;margin-bottom:4px}
      .req-cat-hdr.blue{background:#1e40af}.req-cat-hdr.purple{background:#7c3aed}
      .req-item{padding:3px 8px;font-size:11px}
      .req-item:nth-child(even){background:#f3f4f6}
      .req-notes{margin-top:6px;font-size:11px;color:#6b7280;font-style:italic;padding:5px;border:1px solid #e5e7eb;border-radius:4px}
      .req-title{text-align:center;font-size:15px;font-weight:bold;padding:8px;border:2px solid;border-radius:6px;margin-bottom:12px}
      .req-title.blue{color:#1e40af;border-color:#1e40af}.req-title.purple{color:#7c3aed;border-color:#7c3aed}
      .cl-section{margin-bottom:10px}
      .cl-title{font-size:11px;font-weight:700;color:#4b5563;text-transform:uppercase;margin-bottom:5px}
      .cl-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px}
      .chip{background:#e6f4f3;color:#2a9d90;padding:2px 8px;border-radius:10px;font-size:11px;border:1px solid #b2e0db}
      .cl-notes{font-size:11px;color:#6b7280;font-style:italic}
      .footer{margin-top:20px;padding-top:8px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#6b7280}
    </style></head><body>

      ${HEADER}

      <!-- Visit Info -->
      ${visit.chiefComplaint || chiefSrc ? `<div class="section">
        <p class="section-title">Chief Complaint</p>
        ${visit.chiefComplaint ? `<p style="margin-bottom:6px">${ESC(visit.chiefComplaint)}</p>` : ''}
        ${img(chiefSrc)}
      </div>` : ''}

      ${visit.diagnosis || diagSrc ? `<div class="section">
        <p class="section-title">Diagnosis</p>
        ${visit.diagnosis ? `<p style="margin-bottom:6px">${ESC(visit.diagnosis)}</p>` : ''}
        ${img(diagSrc)}
      </div>` : ''}

      ${vitalsHtml ? `<div class="section"><p class="section-title">Vitals</p>${vitalsHtml}</div>` : ''}

      ${visit.notes || notesSrc ? `<div class="section">
        <p class="section-title">Notes</p>
        ${visit.notes ? `<p style="margin-bottom:6px">${ESC(visit.notes)}</p>` : ''}
        ${img(notesSrc, 'Page 1')}${img(notesSrc2, 'Page 2')}${img(notesSrc3, 'Page 3')}
      </div>` : ''}

      <!-- Prescription -->
      ${medicines.length || notesSrc ? `<div class="section page-break">
        <p class="section-title">Prescription ℞</p>
        ${medicines.length ? `<table><thead><tr><th>#</th><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>${medTableRows}</tbody></table>` : ''}
        ${img(notesSrc, 'Rx Page 1')}${img(notesSrc2, 'Rx Page 2')}${img(notesSrc3, 'Rx Page 3')}
      </div>` : ''}

      <!-- Lab Request -->
      ${labTotal > 0 || labNotes ? `<div class="section page-break">
        <p class="req-title blue">Lab Test Request / طلب تحاليل معملية</p>
        <div class="req-grid">${labCatRows}</div>
        ${labNotes ? `<p class="req-notes">${ESC(labNotes)}</p>` : ''}
      </div>` : ''}

      <!-- Radiology Request -->
      ${radTotal > 0 || radNotes || radSrc ? `<div class="section page-break">
        <p class="req-title purple">Radiology Request / طلب أشعة</p>
        <div class="req-grid">${radCatRows}</div>
        ${radNotes ? `<p class="req-notes">${ESC(radNotes)}</p>` : ''}
        ${img(radSrc, 'Radiology Page 1')}${img(radSrc2, 'Radiology Page 2')}${img(radSrc3, 'Radiology Page 3')}
      </div>` : ''}

      <!-- Medical History -->
      ${histSrc || hpiSrc || drugSrc || famSrc || curMedSrc ? `<div class="section page-break">
        <p class="section-title">Medical History</p>
        ${img(histSrc, 'Past Medical History')}${img(hpiSrc, 'HPI')}${img(drugSrc, 'Drug History')}${img(famSrc, 'Family History')}${img(curMedSrc, 'Current Medications')}
      </div>` : ''}

      <!-- Checklists -->
      ${clHtml ? `<div class="section"><p class="section-title">Checklists</p>${clHtml}</div>` : ''}

      <div class="footer">
        <div>مستشفى تبارك/النسائم - 16552 - 15452</div>
        <div>١٨ عمارات خلف العبور - مصر الجديدة - ت: 01554343147</div>
      </div>
    </body></html>`;
  }

  // ── Share handlers ──────────────────────────────────────────────────────────
  const handleShareVisit = () => run(async () => {
    await doShare(await buildFullVisitHtml());
  });

  const handleSharePrescription = () => run(async () => {
    await doShare(await buildPrescriptionHtml());
  });

  const handleShareLab = () => run(() => doShare(buildLabHtml()));
  const handleShareRadiology = () => run(() => doShare(buildRadiologyHtml()));

  const vitals = visit.vitals ?? {};
  const medicines: any[] = Array.isArray(visit.prescriptionMedicines) ? visit.prescriptionMedicines : [];

  // Attachments are filed by a name prefix, matching how the desktop app tags
  // them on upload ("[Prescription] scan.jpg"). Split them the same way so a
  // photo attached in the prescription section shows up with the prescription,
  // not buried in the generic attachments list.
  const prescriptionFiles = attachments.filter(a => a.name?.startsWith(PRESCRIPTION_PREFIX));
  const radiologyFiles = attachments.filter(a => a.name?.startsWith(RADIOLOGY_PREFIX));
  const generalFiles = attachments.filter(
    a => !a.name?.startsWith(PRESCRIPTION_PREFIX) && !a.name?.startsWith(RADIOLOGY_PREFIX)
  );

  // ─── parse lab / radiology ─────────────────────────────────────────────────
  let labGroups: { cat: string; tests: string[] }[] = [];
  let labNotes = '';
  try {
    const p = JSON.parse(visit.labTestRequest);
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      const testsObj = (p.tests && typeof p.tests === 'object') ? p.tests : p;
      labGroups = groupLabTests(testsObj);
      labNotes = p.notes || '';
    }
  } catch { /* empty */ }

  let radGroups: { cat: string; tests: string[] }[] = [];
  let radNotes = '';
  try {
    const p = JSON.parse(visit.radiologyRequest);
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      const testsObj = (p.tests && typeof p.tests === 'object') ? p.tests : p;
      radGroups = groupRadiologyTests(testsObj);
      radNotes = p.notes || '';
    }
  } catch { /* empty */ }

  let checklists: Record<string, any> = {};
  try { checklists = JSON.parse(visit.medicalChecklists) ?? {}; } catch { /* empty */ }
  const checklistSections = Object.entries(checklists).filter(([, v]) =>
    v && typeof v === 'object' &&
    (Object.values((v as any).items || {}).some(Boolean) || !!(v as any).notes)
  );

  const labTotal  = labGroups.reduce((n, g) => n + g.tests.length, 0);
  const radTotal  = radGroups.reduce((n, g) => n + g.tests.length, 0);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={onBack}><Text style={s.back}>‹ Back</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleShareVisit} disabled={sharing} style={s.shareBtn}>
            {sharing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="share-social" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
        <Text style={s.visitDate}>{formatDate(visit.visitDate)}</Text>
        {patient ? <Text style={s.patientName}>{patient.name}</Text> : null}
        <View style={s.badges}>
          <View style={[s.badge, { backgroundColor: visit.visitType === 'new' ? C.successLight : '#f3f0ff', borderColor: visit.visitType === 'new' ? C.success + '80' : '#8b5cf680' }]}>
            <Text style={[s.badgeText, { color: visit.visitType === 'new' ? C.success : '#7c3aed' }]}>
              {visit.visitType === 'new' ? 'New Visit' : 'Follow-up'}
            </Text>
          </View>
          {visit.price > 0 && (
            <View style={[s.badge, { backgroundColor: C.warningLight, borderColor: C.warning + '80' }]}>
              <Text style={[s.badgeText, { color: C.warning }]}>{visit.price} LE</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tab bar — horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.tabItem, tab === t.key && s.tabItemActive]} onPress={() => setTab(t.key)}>
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body}>

        {/* ══ VISIT INFO ══ */}
        {tab === 'info' && <>
          {visit.chiefComplaint || canvasMap.chiefComplaintDrawing ? (
            <SectionCard title="Chief Complaint">
              {visit.chiefComplaint ? <BodyText text={visit.chiefComplaint} /> : null}
              {canvasMap.chiefComplaintDrawing ? <Drawing uri={canvasMap.chiefComplaintDrawing} label="Drawing" text={canvasText.chiefComplaintDrawing} /> : null}
            </SectionCard>
          ) : null}

          {visit.diagnosis || canvasMap.diagnosisDrawing ? (
            <SectionCard title="Diagnosis">
              {visit.diagnosis ? <BodyText text={visit.diagnosis} /> : null}
              {canvasMap.diagnosisDrawing ? <Drawing uri={canvasMap.diagnosisDrawing} label="Drawing" text={canvasText.diagnosisDrawing} /> : null}
            </SectionCard>
          ) : null}

          {Object.keys(vitals).length > 0 ? (
            <SectionCard title="Vitals">
              <View style={s.vitalsGrid}>
                {vitals.bloodPressure     ? <VitalCell icon="🩸" label="BP"     value={vitals.bloodPressure} /> : null}
                {vitals.heartRate         ? <VitalCell icon="❤️"  label="HR"     value={`${vitals.heartRate} bpm`} /> : null}
                {vitals.temperature       ? <VitalCell icon="🌡"  label="Temp"   value={`${vitals.temperature}°C`} /> : null}
                {vitals.oxygenSaturation  ? <VitalCell icon="💨" label="SpO₂"   value={`${vitals.oxygenSaturation}%`} /> : null}
                {vitals.weight            ? <VitalCell icon="⚖️"  label="Weight" value={`${vitals.weight} kg`} /> : null}
                {vitals.height            ? <VitalCell icon="📏"  label="Height" value={`${vitals.height} cm`} /> : null}
                {vitals.respiratoryRate   ? <VitalCell icon="🫁"  label="RR"     value={`${vitals.respiratoryRate}/min`} /> : null}
              </View>
            </SectionCard>
          ) : null}

          {visit.notes ? (
            <SectionCard title="Notes">
              <BodyText text={visit.notes} />
            </SectionCard>
          ) : null}

          {medicines.length > 0 ? (
            <SectionCard title={`Prescription (${medicines.length} medicines)`}>
              <TouchableOpacity onPress={handleSharePrescription} disabled={sharing} style={[s.printBtn, { marginBottom: 10 }]}>
                {sharing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.printBtnText}>🖨 Print Prescription</Text>}
              </TouchableOpacity>
              {medicines.map((med, i) => (
                <View key={i} style={s.medCard}>
                  <Text style={s.medName}>{med.name || med.genericName || 'Unknown'}</Text>
                  {med.genericName && med.name !== med.genericName ? <Text style={s.medSub}>{med.genericName}</Text> : null}
                  <View style={s.medRow}>
                    {med.dosage    ? <Text style={s.medChip}>💊 {med.dosage}</Text> : null}
                    {med.frequency ? <Text style={s.medChip}>🕐 {med.frequency}</Text> : null}
                    {med.duration  ? <Text style={s.medChip}>📅 {med.duration}</Text> : null}
                  </View>
                  {med.instructions ? <Text style={s.medNote}>{med.instructions}</Text> : null}
                </View>
              ))}
            </SectionCard>
          ) : null}

          {canvasMap.notesDrawing || canvasMap.notesDrawing2 || canvasMap.notesDrawing3 ? (
            <SectionCard title="Prescription Drawing">
              {!medicines.length ? (
                <TouchableOpacity onPress={handleSharePrescription} disabled={sharing} style={[s.printBtn, { marginBottom: 10 }]}>
                  {sharing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.printBtnText}>🖨 Print Prescription</Text>}
                </TouchableOpacity>
              ) : null}
              {canvasMap.notesDrawing  ? <Drawing uri={canvasMap.notesDrawing}  label="Page 1" text={canvasText.notesDrawing} /> : null}
              {canvasMap.notesDrawing2 ? <Drawing uri={canvasMap.notesDrawing2} label="Page 2" text={canvasText.notesDrawing2} /> : null}
              {canvasMap.notesDrawing3 ? <Drawing uri={canvasMap.notesDrawing3} label="Page 3" text={canvasText.notesDrawing3} /> : null}
            </SectionCard>
          ) : null}

          {prescriptionFiles.length > 0 ? (
            <SectionCard title={`Prescription Attachments (${prescriptionFiles.length})`}>
              {!medicines.length && !canvasMap.notesDrawing ? (
                <TouchableOpacity onPress={handleSharePrescription} disabled={sharing} style={[s.printBtn, { marginBottom: 10 }]}>
                  {sharing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.printBtnText}>🖨 Print Prescription</Text>}
                </TouchableOpacity>
              ) : null}
              <AttachmentList items={prescriptionFiles} />
            </SectionCard>
          ) : null}

          {!visit.chiefComplaint && !visit.diagnosis && !Object.keys(vitals).length && !visit.notes && !canvasMap.chiefComplaintDrawing && !canvasMap.diagnosisDrawing && !medicines.length && !canvasMap.notesDrawing && !prescriptionFiles.length
            ? <Empty icon="📋" text="No visit info recorded" /> : null}
        </>}

        {/* ══ REQUESTS ══ */}
        {tab === 'requests' && <>
          {labTotal > 0 || labNotes ? (
            <SectionCard title={`Lab Tests (${labTotal})`}>
              {labGroups.map(g => (
                <View key={g.cat} style={s.reqGroup}>
                  <Text style={s.reqGroupTitle}>🧪 {g.cat}</Text>
                  {g.tests.map((t, i) => (
                    <View key={i} style={s.reqRow}>
                      <View style={[s.dot, { backgroundColor: C.info }]} />
                      <Text style={s.reqLabel}>{t}</Text>
                    </View>
                  ))}
                </View>
              ))}
              {labNotes ? <Text style={s.reqNotes}>{labNotes}</Text> : null}
              <TouchableOpacity onPress={handleShareLab} disabled={sharing} style={[s.printBtn, { backgroundColor: '#1e40af', marginTop: 12, marginBottom: 0 }]}>
                {sharing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.printBtnText}>🖨 Print Lab Request</Text>}
              </TouchableOpacity>
            </SectionCard>
          ) : null}

          {radTotal > 0 || radNotes || canvasMap.radiologyDrawing ? (
            <SectionCard title={`Radiology (${radTotal})`}>
              {radGroups.map(g => (
                <View key={g.cat} style={s.reqGroup}>
                  <Text style={s.reqGroupTitle}>🩻 {g.cat}</Text>
                  {g.tests.map((t, i) => (
                    <View key={i} style={s.reqRow}>
                      <View style={[s.dot, { backgroundColor: '#8b5cf6' }]} />
                      <Text style={s.reqLabel}>{t}</Text>
                    </View>
                  ))}
                </View>
              ))}
              {radNotes ? <Text style={s.reqNotes}>{radNotes}</Text> : null}
              {canvasMap.radiologyDrawing  ? <Drawing uri={canvasMap.radiologyDrawing}  label="Radiology Request Page 1" text={canvasText.radiologyDrawing} /> : null}
              {canvasMap.radiologyDrawing2 ? <Drawing uri={canvasMap.radiologyDrawing2} label="Radiology Request Page 2" text={canvasText.radiologyDrawing2} /> : null}
              {canvasMap.radiologyDrawing3 ? <Drawing uri={canvasMap.radiologyDrawing3} label="Radiology Request Page 3" text={canvasText.radiologyDrawing3} /> : null}
              <TouchableOpacity onPress={handleShareRadiology} disabled={sharing} style={[s.printBtn, { backgroundColor: '#7c3aed', marginTop: 12, marginBottom: 0 }]}>
                {sharing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.printBtnText}>🖨 Print Radiology Request</Text>}
              </TouchableOpacity>
            </SectionCard>
          ) : null}

          {radiologyFiles.length > 0 ? (
            <SectionCard title={`Radiology Attachments (${radiologyFiles.length})`}>
              <AttachmentList items={radiologyFiles} />
            </SectionCard>
          ) : null}

          {labTotal === 0 && !labNotes && radTotal === 0 && !radNotes && !canvasMap.radiologyDrawing
            && !radiologyFiles.length
            ? <Empty icon="🔬" text="No lab or radiology requests" /> : null}
        </>}

        {/* ══ HISTORY ══ */}
        {tab === 'history' && <>
          {canvasMap.pastMedicalHistoryDrawing ? (
            <SectionCard title="Past Medical History">
              <Drawing uri={canvasMap.pastMedicalHistoryDrawing} label="" text={canvasText.pastMedicalHistoryDrawing} />
            </SectionCard>
          ) : null}
          {canvasMap.hpiDrawing ? (
            <SectionCard title="History of Present Illness (HPI)">
              <Drawing uri={canvasMap.hpiDrawing} label="" text={canvasText.hpiDrawing} />
            </SectionCard>
          ) : null}
          {canvasMap.drugHistoryDrawing ? (
            <SectionCard title="Drug History">
              <Drawing uri={canvasMap.drugHistoryDrawing} label="" text={canvasText.drugHistoryDrawing} />
            </SectionCard>
          ) : null}
          {canvasMap.familyHistoryDrawing ? (
            <SectionCard title="Family History">
              <Drawing uri={canvasMap.familyHistoryDrawing} label="" text={canvasText.familyHistoryDrawing} />
            </SectionCard>
          ) : null}
          {canvasMap.currentMedicationDrawing ? (
            <SectionCard title="Current Medications">
              <Drawing uri={canvasMap.currentMedicationDrawing} label="" text={canvasText.currentMedicationDrawing} />
            </SectionCard>
          ) : null}
          {!canvasMap.pastMedicalHistoryDrawing && !canvasMap.hpiDrawing && !canvasMap.drugHistoryDrawing && !canvasMap.familyHistoryDrawing && !canvasMap.currentMedicationDrawing
            ? <Empty icon="📖" text="No medical history recorded" /> : null}
        </>}

        {/* ══ CHECKLISTS ══ */}
        {tab === 'checklists' && <>
          {checklistSections.length > 0 ? (
            <SectionCard title="Medical Checklists">
              {checklistSections.map(([name, section]: [string, any]) => (
                <View key={name} style={s.clSection}>
                  <Text style={s.clTitle}>{name}</Text>
                  {Object.entries(section.items || {}).map(([item, checked]: [string, any]) =>
                    checked ? <Text key={item} style={s.clItem}>✓ {item}</Text> : null
                  )}
                  {section.notes ? <Text style={s.clNotes}>{section.notes}</Text> : null}
                </View>
              ))}
            </SectionCard>
          ) : <Empty icon="☑️" text="No checklists filled" />}
        </>}

        {/* ══ ATTACHMENTS ══ */}
        {tab === 'attachments' && (
          attachments.length ? (
            <>
              {generalFiles.length > 0 ? (
                <SectionCard title={`Attachments (${generalFiles.length})`}>
                  <AttachmentList items={generalFiles} />
                </SectionCard>
              ) : null}
              {/* Prescription and radiology files render in their own sections;
                  list them here too so nothing looks missing from this tab. */}
              {prescriptionFiles.length > 0 ? (
                <SectionCard title={`Prescription (${prescriptionFiles.length}) — also in Visit Info`}>
                  <AttachmentList items={prescriptionFiles} />
                </SectionCard>
              ) : null}
              {radiologyFiles.length > 0 ? (
                <SectionCard title={`Radiology (${radiologyFiles.length}) — also in Requests`}>
                  <AttachmentList items={radiologyFiles} />
                </SectionCard>
              ) : null}
            </>
          ) : <Empty icon="📎" text="No attachments for this visit" />
        )}

      </ScrollView>
    </View>
  );
}

function VitalCell({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.vitalCell}>
      <Text style={s.vitalIcon}>{icon}</Text>
      <Text style={s.vitalVal}>{value}</Text>
      <Text style={s.vitalLbl}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound:     { color: C.mutedFg, fontSize: 16 },

  // Header
  header:       { backgroundColor: C.primary, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  back:         { color: 'rgba(255,255,255,0.75)', fontSize: 15 },
  shareBtn:     { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  shareText:    { color: '#fff', fontSize: 13, fontWeight: '600' },
  printBtn:     { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginBottom: 4, marginTop: 4 },
  printBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  visitDate:    { fontSize: 18, fontWeight: '700', color: '#fff' },
  patientName:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  badges:       { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge:        { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  badgeText:    { fontSize: 12, fontWeight: '600' },

  // Tab bar
  tabBar:           { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, flexGrow: 0 },
  tabBarContent:    { paddingHorizontal: 8 },
  tabItem:          { paddingHorizontal: 14, paddingVertical: 12, marginHorizontal: 2 },
  tabItemActive:    { borderBottomWidth: 2, borderBottomColor: C.primary },
  tabText:          { fontSize: 13, color: C.mutedFg, fontWeight: '500' },
  tabTextActive:    { color: C.primary, fontWeight: '700' },

  // Body
  body:         { padding: 12, paddingBottom: 32 },
  card:         { backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3 },
  cardTitle:    { fontSize: 11, fontWeight: '700', color: C.mutedFg, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  bodyText:     { fontSize: 14, color: C.fgSub, lineHeight: 22 },

  // Drawing
  drawing:      { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.muted },
  drawingLabel: { fontSize: 11, color: C.mutedFg, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  drawingText:  { fontSize: 14, color: C.fg, lineHeight: 22, padding: 8, backgroundColor: C.muted, borderRadius: 6 },

  // Vitals
  vitalsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vitalCell:    { width: '30%', backgroundColor: C.bg, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  vitalIcon:    { fontSize: 20, marginBottom: 4 },
  vitalVal:     { fontSize: 14, fontWeight: '600', color: C.fg },
  vitalLbl:     { fontSize: 11, color: C.mutedFg, marginTop: 2 },

  // Medicines
  medCard:      { backgroundColor: C.bg, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  medName:      { fontSize: 15, fontWeight: '600', color: C.fg },
  medSub:       { fontSize: 12, color: C.mutedFg, marginTop: 2 },
  medRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  medChip:      { fontSize: 13, color: C.fgSub },
  medNote:      { fontSize: 12, color: C.mutedFg, marginTop: 6, fontStyle: 'italic' },

  // Requests
  reqGroup:       { marginBottom: 10 },
  reqGroupTitle:  { fontSize: 12, fontWeight: '700', color: C.mutedFg, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2, marginTop: 6 },
  reqRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingLeft: 4, borderTopWidth: 1, borderTopColor: C.muted },
  dot:            { width: 7, height: 7, borderRadius: 4, marginRight: 10 },
  reqLabel:       { fontSize: 14, color: C.fg, flex: 1 },
  reqNotes:       { fontSize: 13, color: C.mutedFg, fontStyle: 'italic', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.muted },

  // Checklists
  clSection:    { marginBottom: 10 },
  clTitle:      { fontSize: 11, fontWeight: '700', color: C.mutedFg, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  clItem:       { fontSize: 13, color: C.success, paddingVertical: 2 },
  clNotes:      { fontSize: 13, color: C.mutedFg, fontStyle: 'italic', marginTop: 4 },

  // Empty
  empty:        { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon:    { fontSize: 40, marginBottom: 10 },
  emptyText:    { fontSize: 14, color: C.mutedFg, textAlign: 'center' },

  // Attachments
  attRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.muted },
  attThumb:     { width: 46, height: 46, borderRadius: 8, backgroundColor: C.muted },
  attIconBox:   { width: 46, height: 46, borderRadius: 8, backgroundColor: C.muted, alignItems: 'center', justifyContent: 'center' },
  attIcon:      { fontSize: 22 },
  attInfo:      { flex: 1, marginHorizontal: 12 },
  attName:      { fontSize: 14, color: C.fg, fontWeight: '600' },
  attMeta:      { fontSize: 12, color: C.mutedFg, marginTop: 2 },
  attOpenBtn:   { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  attOpenTxt:   { color: '#fff', fontSize: 13, fontWeight: '600' },
});
