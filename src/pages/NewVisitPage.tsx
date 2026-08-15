import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Activity,
  Image,
  File,
  FileText,
  Upload,
  Trash2,
  History,
  Pill,
  Users,
  Stethoscope,
  FlaskConical,
  Paperclip,
  Printer,
  ChevronDown,
  ClipboardList,
  PenTool,
  Clock,
  Calendar,
  DollarSign,
  UserPlus,
  RefreshCw,
  Download,
  Save,
  AlertTriangle,
  Loader2,
  Eye,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleDrawingCanvas } from '@/components/ui/simple-drawing-canvas';
import LabTestRequestForm from '@/components/visit/LabTestRequestForm';
import RadiologyRequestForm from '@/components/visit/RadiologyRequestForm';
import CheckboxRequestForm, { ChecklistCategory } from '@/components/visit/CheckboxRequestForm';
import { LAB_TEST_CATEGORIES } from '@/data/labTests';
import { RADIOLOGY_TEST_CATEGORIES } from '@/data/radiologyTests';
import { CHIEF_COMPLAINT_CATEGORIES } from '@/data/chiefComplaintItems';
import { DIAGNOSIS_CATEGORIES } from '@/data/diagnosisItems';
import { PAST_MEDICAL_HISTORY_CATEGORIES } from '@/data/pastMedicalHistoryItems';
import { HPI_CATEGORIES } from '@/data/hpiItems';
import { DRUG_HISTORY_CATEGORIES } from '@/data/drugHistoryItems';
import { FAMILY_HISTORY_CATEGORIES } from '@/data/familyHistoryItems';
import { CURRENT_MEDICATION_CATEGORIES } from '@/data/currentMedicationItems';
import MedicineSelectForm from '@/components/visit/MedicineSelectForm';
import { PrescriptionMedicine } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData, Visit, Patient } from '@/contexts/DataContext';
import { FileViewerModal, ViewerFile } from '@/components/ui/file-viewer-modal';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getDisplayDataUrl } from '@/lib/drawing-utils';
import { downloadPdf } from '@/lib/download-pdf';
import api, { VisitType, Settings } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getDraftKey,
  loadDraft,
  clearDraft,
  VisitDraftEnvelope,
} from '@/lib/visit-draft';
import { useVisitDraftAutoSave } from '@/hooks/useVisitDraftAutoSave';

interface Attachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
}

type ActiveSection = 'medical-history' | 'medical-history-checklist' | 'medical-notes' | 'clinical-notes-checklist' | 'prescription' | 'lab' | 'lab-tests' | 'radiology-request' | null;

// Defined outside component to prevent remount on parent re-render
const PrescriptionTemplate = React.memo(({
  onSave,
  placeholder,
  placeholderAr,
  initialData,
  language,
  globalPenSize,
}: {
  onSave: (data: string) => void;
  placeholder: string;
  placeholderAr: string;
  initialData?: string;
  language: 'ar' | 'en';
  globalPenSize: number;
}) => (
  <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col" dir="ltr" style={{ minHeight: '700px' }}>
    {/* Header - Always LTR */}
    <div className="border-b border-gray-300 p-4 pb-3 flex-shrink-0">
      <div className="flex justify-between items-start">
        <div className="text-start">
          <p className="text-base font-bold text-gray-800">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
        </div>
        <div className="text-end leading-relaxed" dir="rtl">
          <p className="text-base font-bold text-gray-800">دكتـــور</p>
          <p className="text-base font-bold text-gray-800">شــريف علي رضــا</p>
          <p className="text-xs text-gray-600">زميـــل الكلية الملكيـــة البـــريطانيـــة</p>
          <p className="text-xs text-gray-600">لطب الباطنـــة والكـــلى</p>
          <p className="text-xs text-gray-600">دكتوراه الأمـــراض الباطنيـــة</p>
          <p className="text-xs text-gray-600">استشارى أمراض الباطنـــة العامة والكلى</p>
          <p className="text-xs text-gray-600">وعضو الجمعية المصرية والأوربيـــة</p>
          <p className="text-xs text-gray-600">لأمـــراض الكـــلى</p>
          <p className="text-xs text-gray-600">بمستشفيات جـــامعـــة عين شمـــس</p>
        </div>
      </div>
      <div className="mt-4 pt-3 text-start text-sm text-gray-700 leading-relaxed">
        <div className="flex items-center gap-1">
          <span>الإســـم :</span>
          <span className="border-b border-dotted border-gray-400 min-w-[150px] inline-block">&nbsp;</span>
        </div>
        <div className="flex items-center gap-1">
          <span>التـــاريخ :</span>
          <span className="mx-1">/</span>
          <span className="mx-1">/</span>
          <span>٢٠</span>
        </div>
      </div>
    </div>

    {/* Rx Symbol and Drawing Area */}
    <div className="relative flex-1">
      <div className="absolute top-6 start-6 text-gray-400 text-6xl font-serif select-none pointer-events-none" style={{ fontFamily: 'Times New Roman, serif' }}>
        ℞/
      </div>
      <div className="p-4 ps-20 h-full">
        <SimpleDrawingCanvas
          language={language}
          minHeight={350}
          maxHeight={600}
          placeholder={language === 'ar' ? placeholderAr : placeholder}
          onSave={onSave}
          penSize={globalPenSize}
          initialData={initialData}
        />
      </div>
    </div>

    {/* Footer */}
    <div className="border-t border-gray-300 p-3 bg-gray-50 flex-shrink-0 mt-auto">
      <div className="flex justify-between items-start text-xs text-gray-600">
        <div className="text-start">
          <p className="font-semibold">مستشفى تبارك/النسائم</p>
          <p>16552 - 15452</p>
        </div>
        <div className="text-end">
          <p>١٨ عمارات خلف العبور - مصر الجديدة</p>
          <p>ت: 01554343147 - 0222602733</p>
        </div>
      </div>
    </div>
  </div>
));

// Defined outside component to prevent remount on parent re-render
const SectionHeader = React.memo(({
  title,
  icon,
  isOpen,
  onClick,
  extra,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
  extra?: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full flex items-center justify-between p-4 text-start transition-colors rounded-t-2xl',
      'hover:bg-muted/50',
      isOpen ? 'bg-muted/30' : 'rounded-b-2xl'
    )}
  >
    <div className="flex items-center gap-3">
      <span className="text-primary">{icon}</span>
      <span className="font-semibold text-lg text-foreground">{title}</span>
    </div>
    <div className="flex items-center gap-2">
      {extra}
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </motion.div>
    </div>
  </button>
));

const NewVisitPage: React.FC = () => {
  const { id: patientId, visitId } = useParams<{ id: string; visitId?: string }>();
  const { t, language, direction } = useLanguage();
  const { addVisit, updateVisit, uploadVisitAttachment, getVisitAttachments, visits, loadPatientVisits, loadFullVisit } = useData();
  const isEditMode = !!visitId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prescriptionFileInputRef = useRef<HTMLInputElement>(null);
  const radiologyFileInputRef = useRef<HTMLInputElement>(null);
  const prescriptionRef = useRef<HTMLDivElement>(null);
  // Tracks local attachment ids already persisted to the server so a
  // re-submit (or edit-then-save) does not upload the same file twice.
  const persistedAttachmentIds = useRef<Set<string>>(new Set());
  const labRequestRef = useRef<HTMLDivElement>(null);
  // Drawings as they were when this visit was opened for editing, so an
  // unchanged page can be left out of the save request.
  const loadedDrawingsRef = useRef<Record<string, string>>({});
  // True while a save is uploading — used to warn before the page is closed.
  const savingRef = useRef(false);

  const [patient, setLocalPatient] = useState<Patient | null>(null);
  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  useEffect(() => {
    if (!patientId) return;
    api.getPatient(patientId).then(p => {
      setLocalPatient({
        id: p.id, fileNumber: p.fileNumber || '', name: p.name, phone: p.phone,
        age: p.age, gender: p.gender, medicalHistory: p.medicalHistory || '',
        allergies: p.allergies || [], records: [], createdAt: new Date(p.createdAt),
      });
    }).catch(() => {});
  }, [patientId]);
  const dateLocale = language === 'ar' ? ar : enUS;

  // Get previous visits for this patient, sorted by date descending
  const previousVisits = visits
    .filter((v) => v.patientId === patientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Load patient visits on mount
  useEffect(() => {
    if (patientId) {
      loadPatientVisits(patientId);
    }
  }, [patientId, loadPatientVisits]);

  // In edit mode, fetch the FULL visit (visit list now returns meta only).
  // Once the full visit lands in DataContext.visits, the edit-mode useEffect
  // below re-fires with the rich data and populates all the drawings.
  useEffect(() => {
    if (isEditMode && visitId) {
      loadFullVisit(visitId).catch((err) =>
        console.error('Failed to load full visit for editing:', err)
      );
    }
  }, [isEditMode, visitId, loadFullVisit]);

  // Load visit data when in edit mode
  useEffect(() => {
    if (isEditMode && visitId && visits.length > 0) {
      const visitToEdit = visits.find(v => v.id === visitId);
      if (visitToEdit) {
        // Populate form with existing data
        setVisitType(visitToEdit.visitType);
        setPrice(visitToEdit.price.toString());
        setFormData({
          bloodPressure: visitToEdit.vitals.bloodPressure || '',
          temperature: visitToEdit.vitals.temperature?.toString() || '',
          weight: visitToEdit.vitals.weight?.toString() || '',
        });
        setChiefComplaintDrawing(visitToEdit.chiefComplaintDrawing || '');
        setDiagnosisDrawing(visitToEdit.diagnosisDrawing || '');
        setPrescriptionPage1(visitToEdit.notesDrawing || '');
        setPrescriptionPage2(visitToEdit.notesDrawing2 || '');
        setPrescriptionPage3(visitToEdit.notesDrawing3 || '');
        setPastMedicalHistoryDrawing(visitToEdit.pastMedicalHistoryDrawing || '');
        setHpiDrawing(visitToEdit.hpiDrawing || '');
        setDrugHistoryDrawing(visitToEdit.drugHistoryDrawing || '');
        setFamilyHistoryDrawing(visitToEdit.familyHistoryDrawing || '');
        setCurrentMedicationDrawing(visitToEdit.currentMedicationDrawing || '');
        setRadiologyPage1(visitToEdit.radiologyDrawing || '');
        setRadiologyPage2(visitToEdit.radiologyDrawing2 || '');
        setRadiologyPage3(visitToEdit.radiologyDrawing3 || '');

        // Remember what the drawings looked like when loaded. On save, the ones
        // that still match are left out of the request entirely — the server
        // skips absent fields, so untouched pages keep their stored image
        // instead of being re-uploaded. A visit with 13 canvases was sending
        // ~4 MB on every save, which is what aborted mid-upload.
        loadedDrawingsRef.current = {
          chiefComplaintDrawing: visitToEdit.chiefComplaintDrawing || '',
          diagnosisDrawing: visitToEdit.diagnosisDrawing || '',
          notesDrawing: visitToEdit.notesDrawing || '',
          notesDrawing2: visitToEdit.notesDrawing2 || '',
          notesDrawing3: visitToEdit.notesDrawing3 || '',
          pastMedicalHistoryDrawing: visitToEdit.pastMedicalHistoryDrawing || '',
          hpiDrawing: visitToEdit.hpiDrawing || '',
          drugHistoryDrawing: visitToEdit.drugHistoryDrawing || '',
          familyHistoryDrawing: visitToEdit.familyHistoryDrawing || '',
          currentMedicationDrawing: visitToEdit.currentMedicationDrawing || '',
          radiologyDrawing: visitToEdit.radiologyDrawing || '',
          radiologyDrawing2: visitToEdit.radiologyDrawing2 || '',
          radiologyDrawing3: visitToEdit.radiologyDrawing3 || '',
        };

        // Load lab test request
        if (visitToEdit.labTestRequest) {
          try {
            const labData = JSON.parse(visitToEdit.labTestRequest);
            setSelectedLabTests(labData.tests || {});
            setLabTestOtherNotes(labData.notes || '');
          } catch (e) {
            console.error('Failed to parse lab test request:', e);
          }
        }

        // Load prescription medicines (structured Rx lines)
        if (visitToEdit.prescriptionMedicines) {
          try {
            const meds = JSON.parse(visitToEdit.prescriptionMedicines);
            if (Array.isArray(meds)) setPrescriptionMedicines(meds);
          } catch (e) {
            console.error('Failed to parse prescription medicines:', e);
          }
        }

        // Load radiology request
        if (visitToEdit.radiologyRequest) {
          try {
            const radData = JSON.parse(visitToEdit.radiologyRequest);
            setSelectedRadiologyTests(radData.tests || {});
            setRadiologyTestOtherNotes(radData.notes || '');
          } catch (e) {
            console.error('Failed to parse radiology request:', e);
          }
        }

        // Load medical checklists
        if (visitToEdit.medicalChecklists) {
          try {
            const mc = JSON.parse(visitToEdit.medicalChecklists);
            if (mc.chiefComplaint) { setCcChecklist(mc.chiefComplaint.items || {}); setCcNotes(mc.chiefComplaint.notes || ''); }
            if (mc.diagnosis) { setDxChecklist(mc.diagnosis.items || {}); setDxNotes(mc.diagnosis.notes || ''); }
            if (mc.pastMedicalHistory) { setPmhChecklist(mc.pastMedicalHistory.items || {}); setPmhNotes(mc.pastMedicalHistory.notes || ''); }
            if (mc.hpi) { setHpiChecklist(mc.hpi.items || {}); setHpiNotes(mc.hpi.notes || ''); }
            if (mc.drugHistory) { setDhChecklist(mc.drugHistory.items || {}); setDhNotes(mc.drugHistory.notes || ''); }
            if (mc.familyHistory) { setFhChecklist(mc.familyHistory.items || {}); setFhNotes(mc.familyHistory.notes || ''); }
            if (mc.currentMedication) { setCmChecklist(mc.currentMedication.items || {}); setCmNotes(mc.currentMedication.notes || ''); }
          } catch (e) {
            console.error('Failed to parse medical checklists:', e);
          }
        }
      }
    }
  }, [isEditMode, visitId, visits]);

  // Track if previous visits section is open
  const [isPreviousVisitsOpen, setIsPreviousVisitsOpen] = useState(false);

  // Visit type and price
  const [visitType, setVisitType] = useState<VisitType>('new');
  const [price, setPrice] = useState<string>('');
  const [settings, setSettings] = useState<Settings | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
        // Set initial price based on default visit type (new)
        setPrice(data.newVisitPrice.toString());
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Update price when visit type changes
  useEffect(() => {
    if (settings) {
      const defaultPrice = visitType === 'new' ? settings.newVisitPrice : settings.followupVisitPrice;
      setPrice(defaultPrice.toString());
    }
  }, [visitType, settings]);

  const [formData, setFormData] = useState({
    bloodPressure: '',
    temperature: '',
    weight: '',
  });

  // Active accordion section
  const [activeSection, setActiveSection] = useState<ActiveSection>('medical-history');

  // Drawing data for each field
  const [chiefComplaintDrawing, setChiefComplaintDrawing] = useState<string>('');
  const [diagnosisDrawing, setDiagnosisDrawing] = useState<string>('');

  // Prescription pages (3 pages)
  const [prescriptionPage1, setPrescriptionPage1] = useState<string>('');
  const [prescriptionPage2, setPrescriptionPage2] = useState<string>('');
  const [prescriptionPage3, setPrescriptionPage3] = useState<string>('');
  // Prescription section tab: the medicine picker or one of the 3 canvas pages
  const [activePrescriptionTab, setActivePrescriptionTab] = useState<'medicines' | 1 | 2 | 3>('medicines');

  // Prescription medicines (structured Rx lines from the drug picker)
  const [prescriptionMedicines, setPrescriptionMedicines] = useState<PrescriptionMedicine[]>([]);

  // Medical History drawings
  const [pastMedicalHistoryDrawing, setPastMedicalHistoryDrawing] = useState<string>('');
  const [hpiDrawing, setHpiDrawing] = useState<string>('');
  const [drugHistoryDrawing, setDrugHistoryDrawing] = useState<string>('');
  const [familyHistoryDrawing, setFamilyHistoryDrawing] = useState<string>('');
  const [currentMedicationDrawing, setCurrentMedicationDrawing] = useState<string>('');

  // Radiology pages (3 pages)
  const [radiologyPage1, setRadiologyPage1] = useState<string>('');
  const [radiologyPage2, setRadiologyPage2] = useState<string>('');
  const [radiologyPage3, setRadiologyPage3] = useState<string>('');
  const [activeRadiologyPage, setActiveRadiologyPage] = useState<1 | 2 | 3>(1);

  // Radiology attachments (uploaded files in radiology section)
  const [radiologyAttachments, setRadiologyAttachments] = useState<Attachment[]>([]);

  // Lab Test Request
  const [selectedLabTests, setSelectedLabTests] = useState<Record<string, boolean>>({});
  const [labTestOtherNotes, setLabTestOtherNotes] = useState<string>('');

  // Radiology Request
  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState<Record<string, boolean>>({});
  const [radiologyTestOtherNotes, setRadiologyTestOtherNotes] = useState<string>('');

  // Medical Checklists (7 forms)
  type MedHistoryTab = 'pmh' | 'hpi' | 'drugHistory' | 'familyHistory';
  type ClinicalNotesTab = 'chiefComplaint' | 'diagnosis' | 'currentMedication';
  const [activeMedHistoryTab, setActiveMedHistoryTab] = useState<MedHistoryTab>('pmh');
  const [activeClinicalNotesTab, setActiveClinicalNotesTab] = useState<ClinicalNotesTab>('chiefComplaint');

  const [ccChecklist, setCcChecklist] = useState<Record<string, boolean>>({});
  const [ccNotes, setCcNotes] = useState('');
  const [dxChecklist, setDxChecklist] = useState<Record<string, boolean>>({});
  const [dxNotes, setDxNotes] = useState('');
  const [pmhChecklist, setPmhChecklist] = useState<Record<string, boolean>>({});
  const [pmhNotes, setPmhNotes] = useState('');
  const [hpiChecklist, setHpiChecklist] = useState<Record<string, boolean>>({});
  const [hpiNotes, setHpiNotes] = useState('');
  const [dhChecklist, setDhChecklist] = useState<Record<string, boolean>>({});
  const [dhNotes, setDhNotes] = useState('');
  const [fhChecklist, setFhChecklist] = useState<Record<string, boolean>>({});
  const [fhNotes, setFhNotes] = useState('');
  const [cmChecklist, setCmChecklist] = useState<Record<string, boolean>>({});
  const [cmNotes, setCmNotes] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Prescription attachments (uploaded files in prescription section)
  const [prescriptionAttachments, setPrescriptionAttachments] = useState<Attachment[]>([]);

  // Slider-style file viewer state (shared FileViewerModal)
  const [viewerFiles, setViewerFiles] = useState<ViewerFile[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerOpen = viewerFiles.length > 0;

  const openViewer = (files: ViewerFile[], index: number) => {
    setViewerFiles(files);
    setViewerIndex(index);
  };
  const closeViewer = () => {
    setViewerFiles([]);
    setViewerIndex(0);
  };

  // Render one visit as a full PDF-style HTML report (patient header,
  // vitals, chief complaint, diagnosis, then every drawing stacked).
  const visitToReportHtml = (v: Visit): string => {
    const dateStr = format(v.date, 'PPP', { locale: dateLocale });
    const patientName = patient?.name || '';
    const fileNumber = patient?.fileNumber || '';
    const isArabic = language === 'ar';
    const t2 = {
      patient: isArabic ? 'المريض' : 'Patient',
      fileNumber: isArabic ? 'رقم الملف' : 'File #',
      date: isArabic ? 'التاريخ' : 'Date',
      visitType: isArabic ? 'نوع الكشف' : 'Visit Type',
      vitals: isArabic ? 'العلامات الحيوية' : 'Vitals',
      bp: isArabic ? 'ضغط الدم' : 'BP',
      temp: isArabic ? 'الحرارة' : 'Temp',
      weight: isArabic ? 'الوزن' : 'Weight',
      chiefComplaint: isArabic ? 'الشكوى الرئيسية' : 'Chief Complaint',
      diagnosis: isArabic ? 'التشخيص' : 'Diagnosis',
      pmh: isArabic ? 'التاريخ المرضي السابق' : 'Past Medical History',
      hpi: isArabic ? 'تاريخ المرض الحالي' : 'History of Present Illness',
      drugHistory: isArabic ? 'تاريخ الأدوية' : 'Drug History',
      familyHistory: isArabic ? 'التاريخ العائلي' : 'Family History',
      currentMed: isArabic ? 'الأدوية الحالية' : 'Current Medication',
      prescription: isArabic ? 'الروشتة' : 'Prescription',
      radiology: isArabic ? 'الأشعة' : 'Radiology',
      medicines: isArabic ? 'الأدوية' : 'Medicines',
      dose: isArabic ? 'الجرعة' : 'Dose',
      frequency: isArabic ? 'التكرار' : 'Frequency',
      duration: isArabic ? 'المدة' : 'Duration',
      instructions: isArabic ? 'التعليمات' : 'Instructions',
    };

    const esc = (s: string) =>
      String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Render the structured Rx lines (from the drug picker) as a numbered table.
    const medicinesSection = (json: string | null | undefined) => {
      if (!json) return '';
      let meds: { name?: string; scientific?: string; dose?: string; frequency?: string; duration?: string; instructions?: string }[] = [];
      try { meds = JSON.parse(json); } catch { return ''; }
      if (!Array.isArray(meds) || meds.length === 0) return '';
      const rows = meds.map((m, i) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center;">${i + 1}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">
            <div style="font-weight:600;">${esc(m.name || '')}</div>
            ${m.scientific ? `<div style="font-size:11px;color:#6b7280;">${esc(m.scientific)}</div>` : ''}
          </td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${esc(m.dose || '')}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${esc(m.frequency || '')}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${esc(m.duration || '')}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${esc(m.instructions || '')}</td>
        </tr>`).join('');
      return `<div style="margin-top:16px;">
        <h3 style="font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">${t2.prescription} — ${t2.medicines}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:6px 8px;border:1px solid #e5e7eb;width:32px;">#</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:start;">${t2.medicines}</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:start;">${t2.dose}</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:start;">${t2.frequency}</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:start;">${t2.duration}</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:start;">${t2.instructions}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    };

    const drawingSection = (label: string, urls: (string | null | undefined)[]) => {
      const imgs = urls
        .filter((u): u is string => !!u)
        .map((u) => `<img src="${u}" style="width:100%;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:8px;" />`)
        .join('');
      if (!imgs) return '';
      return `<div style="margin-top:16px;">
        <h3 style="font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">${label}</h3>
        ${imgs}
      </div>`;
    };

    const dir = isArabic ? 'rtl' : 'ltr';
    return `<div dir="${dir}" style="font-family:'Cairo','Segoe UI',Tahoma,sans-serif;color:#111;font-size:13px;">
      <div style="border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:14px;">
        <h2 style="font-size:18px;font-weight:700;margin:0 0 6px;">${dateStr}</h2>
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:12px;color:#555;">
          <span><strong>${t2.patient}:</strong> ${patientName}</span>
          ${fileNumber ? `<span><strong>${t2.fileNumber}:</strong> ${fileNumber}</span>` : ''}
          <span><strong>${t2.visitType}:</strong> ${v.visitType === 'new' ? (isArabic ? 'كشف جديد' : 'New') : (isArabic ? 'إعادة كشف' : 'Follow-up')}</span>
        </div>
      </div>

      <div style="background:#f9fafb;border-radius:8px;padding:10px 12px;margin-bottom:14px;">
        <h3 style="font-size:14px;font-weight:600;margin:0 0 6px;">${t2.vitals}</h3>
        <div style="display:flex;gap:16px;font-size:12px;color:#374151;flex-wrap:wrap;">
          <span><strong>${t2.bp}:</strong> ${v.vitals?.bloodPressure || '-'}</span>
          <span><strong>${t2.temp}:</strong> ${v.vitals?.temperature ?? '-'}°C</span>
          <span><strong>${t2.weight}:</strong> ${v.vitals?.weight ?? '-'} kg</span>
        </div>
      </div>

      ${v.chiefComplaint ? `<div style="margin-bottom:12px;"><h3 style="font-size:14px;font-weight:600;margin:0 0 4px;">${t2.chiefComplaint}</h3><p style="margin:0;font-size:13px;color:#374151;">${v.chiefComplaint}</p></div>` : ''}
      ${v.diagnosis ? `<div style="margin-bottom:12px;"><h3 style="font-size:14px;font-weight:600;margin:0 0 4px;">${t2.diagnosis}</h3><p style="margin:0;font-size:13px;color:#374151;">${v.diagnosis}</p></div>` : ''}

      ${drawingSection(t2.chiefComplaint, [v.chiefComplaintDrawing])}
      ${drawingSection(t2.diagnosis, [v.diagnosisDrawing])}
      ${drawingSection(t2.pmh, [v.pastMedicalHistoryDrawing])}
      ${drawingSection(t2.hpi, [v.hpiDrawing])}
      ${drawingSection(t2.drugHistory, [v.drugHistoryDrawing])}
      ${drawingSection(t2.familyHistory, [v.familyHistoryDrawing])}
      ${drawingSection(t2.currentMed, [v.currentMedicationDrawing])}
      ${medicinesSection(v.prescriptionMedicines)}
      ${drawingSection(t2.prescription, [v.notesDrawing, v.notesDrawing2, v.notesDrawing3])}
      ${drawingSection(t2.radiology, [v.radiologyDrawing, v.radiologyDrawing2, v.radiologyDrawing3])}
    </div>`;
  };

  // Open previous visits as a slider. Each visit is rendered as a full
  // PDF-style report (patient info, vitals, chief complaint, diagnosis,
  // and all drawings) inside a scrollable container. Prev/Next swipes
  // between visits.
  //
  // The visit list endpoint returns meta only (no drawings), so we
  // hydrate every previous visit to its full form before building the
  // HTML. The first time this is clicked, all previous visits are
  // fetched in parallel; subsequent clicks reuse the cached versions.
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const openPreviousVisitAsPdf = async (startVisitId: string) => {
    if (previousVisits.length === 0) {
      toast({
        title: language === 'ar' ? 'لا توجد زيارات سابقة' : 'No previous visits',
      });
      return;
    }

    setIsPreparingPdf(true);
    try {
      const fullVisits = await Promise.all(
        previousVisits.map(async (v) => {
          // Already hydrated (any drawing field is non-null) -> use as-is.
          const hasAnyDrawing =
            !!v.chiefComplaintDrawing || !!v.diagnosisDrawing ||
            !!v.notesDrawing || !!v.notesDrawing2 || !!v.notesDrawing3 ||
            !!v.pastMedicalHistoryDrawing || !!v.hpiDrawing ||
            !!v.drugHistoryDrawing || !!v.familyHistoryDrawing ||
            !!v.currentMedicationDrawing ||
            !!v.radiologyDrawing || !!v.radiologyDrawing2 || !!v.radiologyDrawing3;
          if (hasAnyDrawing) return v;
          try {
            return await loadFullVisit(v.id);
          } catch {
            return v;
          }
        })
      );

      const files: ViewerFile[] = fullVisits.map((v) => ({
        type: 'html' as const,
        name: format(v.date, 'PPP', { locale: dateLocale }),
        html: visitToReportHtml(v),
      }));

      const startIndex = Math.max(
        0,
        fullVisits.findIndex((v) => v.id === startVisitId)
      );
      openViewer(files, startIndex);
    } finally {
      setIsPreparingPdf(false);
    }
  };

  // Global pen size for all drawing canvases
  const [globalPenSize, setGlobalPenSize] = useState(2);

  // ──────────────────────────────────────────────────────────────────────
  // Auto-save draft to localStorage so the doctor can resume after a crash
  // ──────────────────────────────────────────────────────────────────────
  const draftKey = useMemo(
    () => getDraftKey(patientId || 'unknown', visitId),
    [patientId, visitId]
  );

  // Tracks the draft that was auto-restored on mount, so we can show
  // a "you're working from a restored draft" banner until the doctor
  // either saves the visit or explicitly discards it.
  const [restoredDraft, setRestoredDraft] = useState<VisitDraftEnvelope | null>(null);
  // Auto-save is suspended for one tick while we hydrate from the draft
  // on mount; otherwise we'd immediately overwrite the draft with empty state.
  const [autoSaveReady, setAutoSaveReady] = useState(false);

  // Build a memoized snapshot of all form fields. Reference identity changes
  // only when one of the underlying fields changes, which gates the auto-save.
  const draftSnapshot = useMemo(
    () => ({
      visitType,
      price,
      formData,
      chiefComplaintDrawing,
      diagnosisDrawing,
      prescriptionPage1,
      prescriptionPage2,
      prescriptionPage3,
      prescriptionMedicines,
      pastMedicalHistoryDrawing,
      hpiDrawing,
      drugHistoryDrawing,
      familyHistoryDrawing,
      currentMedicationDrawing,
      radiologyPage1,
      radiologyPage2,
      radiologyPage3,
      selectedLabTests,
      labTestOtherNotes,
      selectedRadiologyTests,
      radiologyTestOtherNotes,
      ccChecklist,
      ccNotes,
      dxChecklist,
      dxNotes,
      pmhChecklist,
      pmhNotes,
      hpiChecklist,
      hpiNotes,
      dhChecklist,
      dhNotes,
      fhChecklist,
      fhNotes,
      cmChecklist,
      cmNotes,
    }),
    [
      visitType, price, formData,
      chiefComplaintDrawing, diagnosisDrawing,
      prescriptionPage1, prescriptionPage2, prescriptionPage3, prescriptionMedicines,
      pastMedicalHistoryDrawing, hpiDrawing, drugHistoryDrawing,
      familyHistoryDrawing, currentMedicationDrawing,
      radiologyPage1, radiologyPage2, radiologyPage3,
      selectedLabTests, labTestOtherNotes,
      selectedRadiologyTests, radiologyTestOtherNotes,
      ccChecklist, ccNotes, dxChecklist, dxNotes,
      pmhChecklist, pmhNotes, hpiChecklist, hpiNotes,
      dhChecklist, dhNotes, fhChecklist, fhNotes,
      cmChecklist, cmNotes,
    ]
  );

  const { status: draftStatus, lastSavedAt, errorMessage: draftError } =
    useVisitDraftAutoSave({
      enabled: !!patientId && autoSaveReady,
      key: draftKey,
      snapshot: draftSnapshot,
    });

  // Auto-restore any existing draft on mount. The doctor doesn't have to
  // choose to resume — they're just dropped back where they left off.
  useEffect(() => {
    if (!patientId) return;
    const existing = loadDraft(draftKey);
    if (existing) {
      applyDraft(existing);
      setRestoredDraft(existing);
    }
    // Allow auto-save on the next tick so the apply doesn't immediately
    // rewrite the draft we just loaded.
    setAutoSaveReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, patientId]);

  const applyDraft = (draft: VisitDraftEnvelope) => {
    const d = draft.data as Record<string, unknown>;
    if (typeof d.visitType === 'string') setVisitType(d.visitType as VisitType);
    if (typeof d.price === 'string') setPrice(d.price);
    if (d.formData && typeof d.formData === 'object') {
      setFormData(d.formData as { bloodPressure: string; temperature: string; weight: string });
    }
    if (typeof d.chiefComplaintDrawing === 'string') setChiefComplaintDrawing(d.chiefComplaintDrawing);
    if (typeof d.diagnosisDrawing === 'string') setDiagnosisDrawing(d.diagnosisDrawing);
    if (typeof d.prescriptionPage1 === 'string') setPrescriptionPage1(d.prescriptionPage1);
    if (typeof d.prescriptionPage2 === 'string') setPrescriptionPage2(d.prescriptionPage2);
    if (typeof d.prescriptionPage3 === 'string') setPrescriptionPage3(d.prescriptionPage3);
    if (Array.isArray(d.prescriptionMedicines)) setPrescriptionMedicines(d.prescriptionMedicines as PrescriptionMedicine[]);
    if (typeof d.pastMedicalHistoryDrawing === 'string') setPastMedicalHistoryDrawing(d.pastMedicalHistoryDrawing);
    if (typeof d.hpiDrawing === 'string') setHpiDrawing(d.hpiDrawing);
    if (typeof d.drugHistoryDrawing === 'string') setDrugHistoryDrawing(d.drugHistoryDrawing);
    if (typeof d.familyHistoryDrawing === 'string') setFamilyHistoryDrawing(d.familyHistoryDrawing);
    if (typeof d.currentMedicationDrawing === 'string') setCurrentMedicationDrawing(d.currentMedicationDrawing);
    if (typeof d.radiologyPage1 === 'string') setRadiologyPage1(d.radiologyPage1);
    if (typeof d.radiologyPage2 === 'string') setRadiologyPage2(d.radiologyPage2);
    if (typeof d.radiologyPage3 === 'string') setRadiologyPage3(d.radiologyPage3);
    if (d.selectedLabTests && typeof d.selectedLabTests === 'object') {
      setSelectedLabTests(d.selectedLabTests as Record<string, boolean>);
    }
    if (typeof d.labTestOtherNotes === 'string') setLabTestOtherNotes(d.labTestOtherNotes);
    if (d.selectedRadiologyTests && typeof d.selectedRadiologyTests === 'object') {
      setSelectedRadiologyTests(d.selectedRadiologyTests as Record<string, boolean>);
    }
    if (typeof d.radiologyTestOtherNotes === 'string') setRadiologyTestOtherNotes(d.radiologyTestOtherNotes);
    if (d.ccChecklist && typeof d.ccChecklist === 'object') setCcChecklist(d.ccChecklist as Record<string, boolean>);
    if (typeof d.ccNotes === 'string') setCcNotes(d.ccNotes);
    if (d.dxChecklist && typeof d.dxChecklist === 'object') setDxChecklist(d.dxChecklist as Record<string, boolean>);
    if (typeof d.dxNotes === 'string') setDxNotes(d.dxNotes);
    if (d.pmhChecklist && typeof d.pmhChecklist === 'object') setPmhChecklist(d.pmhChecklist as Record<string, boolean>);
    if (typeof d.pmhNotes === 'string') setPmhNotes(d.pmhNotes);
    if (d.hpiChecklist && typeof d.hpiChecklist === 'object') setHpiChecklist(d.hpiChecklist as Record<string, boolean>);
    if (typeof d.hpiNotes === 'string') setHpiNotes(d.hpiNotes);
    if (d.dhChecklist && typeof d.dhChecklist === 'object') setDhChecklist(d.dhChecklist as Record<string, boolean>);
    if (typeof d.dhNotes === 'string') setDhNotes(d.dhNotes);
    if (d.fhChecklist && typeof d.fhChecklist === 'object') setFhChecklist(d.fhChecklist as Record<string, boolean>);
    if (typeof d.fhNotes === 'string') setFhNotes(d.fhNotes);
    if (d.cmChecklist && typeof d.cmChecklist === 'object') setCmChecklist(d.cmChecklist as Record<string, boolean>);
    if (typeof d.cmNotes === 'string') setCmNotes(d.cmNotes);
  };

  const handleDiscardDraft = () => {
    if (!window.confirm(
      language === 'ar'
        ? 'سيتم حذف المسودة المحفوظة وتفريغ النموذج. هل تريد المتابعة؟'
        : 'This will delete the saved draft and clear the form. Continue?'
    )) return;
    clearDraft(draftKey);
    setRestoredDraft(null);
    // Reset all form fields to defaults
    setVisitType('new');
    setPrice(settings ? settings.newVisitPrice.toString() : '');
    setFormData({ bloodPressure: '', temperature: '', weight: '' });
    setChiefComplaintDrawing('');
    setDiagnosisDrawing('');
    setPrescriptionPage1(''); setPrescriptionPage2(''); setPrescriptionPage3('');
    setPastMedicalHistoryDrawing(''); setHpiDrawing('');
    setDrugHistoryDrawing(''); setFamilyHistoryDrawing('');
    setCurrentMedicationDrawing('');
    setRadiologyPage1(''); setRadiologyPage2(''); setRadiologyPage3('');
    setSelectedLabTests({}); setLabTestOtherNotes('');
    setSelectedRadiologyTests({}); setRadiologyTestOtherNotes('');
    setCcChecklist({}); setCcNotes('');
    setDxChecklist({}); setDxNotes('');
    setPmhChecklist({}); setPmhNotes('');
    setHpiChecklist({}); setHpiNotes('');
    setDhChecklist({}); setDhNotes('');
    setFhChecklist({}); setFhNotes('');
    setCmChecklist({}); setCmNotes('');
  };

  const isImageFile = (type: string) => type.startsWith('image/');

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: ActiveSection) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: language === 'ar' ? 'نوع الملف غير مدعوم' : 'Unsupported file type',
          description: language === 'ar' ? 'يرجى اختيار صورة أو PDF' : 'Please select an image or PDF',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachments(prev => [...prev, {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          dataUrl,
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handlePrescriptionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: language === 'ar' ? 'نوع الملف غير مدعوم' : 'Unsupported file type',
          description: language === 'ar' ? 'يرجى اختيار صورة أو PDF' : 'Please select an image or PDF',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPrescriptionAttachments(prev => [...prev, {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          dataUrl,
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (prescriptionFileInputRef.current) {
      prescriptionFileInputRef.current.value = '';
    }
  };

  const removePrescriptionAttachment = (id: string) => {
    setPrescriptionAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleRadiologyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: language === 'ar' ? 'نوع الملف غير مدعوم' : 'Unsupported file type',
          description: language === 'ar' ? 'يرجى اختيار صورة أو PDF' : 'Please select an image or PDF',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setRadiologyAttachments(prev => [...prev, {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          dataUrl,
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (radiologyFileInputRef.current) {
      radiologyFileInputRef.current.value = '';
    }
  };

  const removeRadiologyAttachment = (id: string) => {
    setRadiologyAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleLabTestToggle = (testId: string) => {
    setSelectedLabTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  const handleRadiologyTestToggle = (testId: string) => {
    setSelectedRadiologyTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  // Medical checklist toggle handlers
  const toggleChecklist = (setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>) => (itemId: string) => {
    setter(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getLabRequestHtml = () => {
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    // Filter categories that have at least one selected test
    const categoriesWithSelectedTests = LAB_TEST_CATEGORIES.filter(category => {
      if (category.id === 'others') return labTestOtherNotes;
      return category.tests.some(test => selectedLabTests[test.id]);
    });

    // Generate HTML for categories with selected tests only
    const generateCategoryHtml = (category: typeof LAB_TEST_CATEGORIES[0]) => {
      if (category.id === 'others') {
        return `
          <div class="category">
            <div class="category-header">${category.name} <span class="ar">${category.nameAr}</span></div>
            <div class="others-box">${labTestOtherNotes || ''}</div>
          </div>
        `;
      }
      const selectedTests = category.tests.filter(test => selectedLabTests[test.id]);
      return `
        <div class="category">
          <div class="category-header">${category.name} <span class="ar">${category.nameAr}</span></div>
          ${selectedTests.map(test => `
            <div class="test-item">
              <span class="checkbox">&#9745;</span>
              <span class="test-name">${test.name}</span>
            </div>
          `).join('')}
        </div>
      `;
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab Test Request</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            .container {
              max-width: 210mm;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 12px;
              border-bottom: 2px solid #1e40af;
              margin-bottom: 15px;
            }
            .header-left {
              text-align: left;
            }
            .header-right {
              text-align: right;
              direction: rtl;
            }
            .doctor-name {
              font-size: 14px;
              font-weight: bold;
              color: #1e40af;
            }
            .credentials {
              font-size: 10px;
              color: #374151;
            }
            .patient-info {
              display: flex;
              gap: 40px;
              margin-bottom: 20px;
              font-size: 13px;
            }
            .patient-info span {
              font-weight: bold;
            }
            .title {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 20px;
              padding: 10px;
              border: 2px solid #1e40af;
              border-radius: 8px;
            }
            .tests-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .category {
              margin-bottom: 10px;
              break-inside: avoid;
            }
            .category-header {
              background: #1e40af;
              color: white;
              padding: 6px 10px;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 5px;
              border-radius: 4px;
            }
            .category-header .ar {
              float: right;
              font-weight: normal;
            }
            .test-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 4px 10px;
              font-size: 12px;
            }
            .test-item:nth-child(even) {
              background: #f3f4f6;
            }
            .checkbox {
              font-size: 14px;
              color: #16a34a;
            }
            .test-name {
              flex: 1;
            }
            .others-box {
              border: 1px solid #d1d5db;
              min-height: 50px;
              padding: 8px;
              font-size: 12px;
              border-radius: 4px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 12px;
              border-top: 1px solid #d1d5db;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-left">
                <p class="doctor-name">Dr/ Sherif Ali . MD, MRCP (UK)</p>
                <p class="credentials">Consultant Internal Medicine & Nephrology</p>
              </div>
              <div class="header-right">
                <p class="doctor-name">د/ شريف علي رضا</p>
                <p class="credentials">استشاري الباطنة العامة والكلى</p>
              </div>
            </div>
            <div class="patient-info">
              <div>Name / الاسم: <span>${patient?.name || '________________'}</span></div>
              <div>Date / التاريخ: <span>${dateStr}</span></div>
            </div>
            <div class="title">Lab Test Request / طلب تحاليل معملية</div>
            <div class="tests-container">
              ${categoriesWithSelectedTests.map(generateCategoryHtml).join('')}
            </div>
            <div class="footer">
              <div>مستشفى تبارك/النسائم - 16552 - 15452</div>
              <div>١٨ عمارات خلف العبور - مصر الجديدة - ت: 01554343147</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintLabRequest = () => {
    const html = getLabRequestHtml();
    if (!html) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadLabRequest = () => {
    const html = getLabRequestHtml();
    if (!html) return;
    const today = new Date().toISOString().split('T')[0];
    downloadPdf(html, `lab-request-${today}`, 'a4');
  };

  const getRadiologyRequestHtml = () => {
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    const categoriesWithSelectedTests = RADIOLOGY_TEST_CATEGORIES.filter(category => {
      if (category.id === 'others') return radiologyTestOtherNotes;
      return category.tests.some(test => selectedRadiologyTests[test.id]);
    });

    const generateCategoryHtml = (category: typeof RADIOLOGY_TEST_CATEGORIES[0]) => {
      if (category.id === 'others') {
        return `
          <div class="category">
            <div class="category-header">${category.name} <span class="ar">${category.nameAr}</span></div>
            <div class="others-box">${radiologyTestOtherNotes || ''}</div>
          </div>
        `;
      }
      const selected = category.tests.filter(test => selectedRadiologyTests[test.id]);
      return `
        <div class="category">
          <div class="category-header">${category.name} <span class="ar">${category.nameAr}</span></div>
          ${selected.map(test => `
            <div class="test-item">
              <span class="checkbox">&#9745;</span>
              <span class="test-name">${test.name}</span>
            </div>
          `).join('')}
        </div>
      `;
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Radiology Request</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 12px; line-height: 1.4; }
            .container { max-width: 210mm; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #7c3aed; margin-bottom: 15px; }
            .header-left { text-align: left; }
            .header-right { text-align: right; direction: rtl; }
            .doctor-name { font-size: 14px; font-weight: bold; color: #7c3aed; }
            .credentials { font-size: 10px; color: #374151; }
            .patient-info { display: flex; gap: 40px; margin-bottom: 20px; font-size: 13px; }
            .patient-info span { font-weight: bold; }
            .title { text-align: center; font-size: 18px; font-weight: bold; color: #7c3aed; margin-bottom: 20px; padding: 10px; border: 2px solid #7c3aed; border-radius: 8px; }
            .tests-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .category { margin-bottom: 10px; break-inside: avoid; }
            .category-header { background: #7c3aed; color: white; padding: 6px 10px; font-size: 12px; font-weight: bold; margin-bottom: 5px; border-radius: 4px; }
            .category-header .ar { float: right; font-weight: normal; }
            .test-item { display: flex; align-items: center; gap: 8px; padding: 4px 10px; font-size: 12px; }
            .test-item:nth-child(even) { background: #f3f4f6; }
            .checkbox { font-size: 14px; color: #16a34a; }
            .test-name { flex: 1; }
            .others-box { border: 1px solid #d1d5db; min-height: 50px; padding: 8px; font-size: 12px; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-left">
                <p class="doctor-name">Dr/ Sherif Ali . MD, MRCP (UK)</p>
                <p class="credentials">Consultant Internal Medicine & Nephrology</p>
              </div>
              <div class="header-right">
                <p class="doctor-name">د/ شريف علي رضا</p>
                <p class="credentials">استشاري الباطنة العامة والكلى</p>
              </div>
            </div>
            <div class="patient-info">
              <div>Name / الاسم: <span>${patient?.name || '________________'}</span></div>
              <div>Date / التاريخ: <span>${dateStr}</span></div>
            </div>
            <div class="title">Radiology Request / طلب أشعة</div>
            <div class="tests-container">
              ${categoriesWithSelectedTests.map(generateCategoryHtml).join('')}
            </div>
            <div class="footer">
              <div>مستشفى تبارك/النسائم - 16552 - 15452</div>
              <div>١٨ عمارات خلف العبور - مصر الجديدة - ت: 01554343147</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintRadiologyRequest = () => {
    const html = getRadiologyRequestHtml();
    if (!html) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadRadiologyRequest = () => {
    const html = getRadiologyRequestHtml();
    if (!html) return;
    const today = new Date().toISOString().split('T')[0];
    downloadPdf(html, `radiology-request-${today}`, 'a4');
  };

  // Generic checklist HTML generator for print/download
  const getChecklistHtml = (
    title: string,
    titleAr: string,
    color: string,
    categories: ChecklistCategory[],
    selectedItems: Record<string, boolean>,
    otherNotes: string,
  ) => {
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    const categoriesWithSelected = categories.filter(category => {
      if (category.id === 'others') return otherNotes;
      return category.tests.some(test => selectedItems[test.id]);
    });

    const generateCategoryHtml = (category: ChecklistCategory) => {
      if (category.id === 'others') {
        return `<div class="category"><div class="category-header">${category.name} <span class="ar">${category.nameAr}</span></div><div class="others-box">${otherNotes || ''}</div></div>`;
      }
      const selected = category.tests.filter(test => selectedItems[test.id]);
      return `<div class="category"><div class="category-header">${category.name} <span class="ar">${category.nameAr}</span></div>${selected.map(test => `<div class="test-item"><span class="checkbox">&#9745;</span><span class="test-name">${test.name}</span></div>`).join('')}</div>`;
    };

    return `<!DOCTYPE html><html><head><title>${title}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @page { size: A4; margin: 15mm; }
      body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 12px; line-height: 1.4; }
      .container { max-width: 210mm; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid ${color}; margin-bottom: 15px; }
      .header-left { text-align: left; } .header-right { text-align: right; direction: rtl; }
      .doctor-name { font-size: 14px; font-weight: bold; color: ${color}; }
      .credentials { font-size: 10px; color: #374151; }
      .patient-info { display: flex; gap: 40px; margin-bottom: 20px; font-size: 13px; }
      .patient-info span { font-weight: bold; }
      .title { text-align: center; font-size: 18px; font-weight: bold; color: ${color}; margin-bottom: 20px; padding: 10px; border: 2px solid ${color}; border-radius: 8px; }
      .tests-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
      .category { margin-bottom: 10px; break-inside: avoid; }
      .category-header { background: ${color}; color: white; padding: 6px 10px; font-size: 12px; font-weight: bold; margin-bottom: 5px; border-radius: 4px; }
      .category-header .ar { float: right; font-weight: normal; }
      .test-item { display: flex; align-items: center; gap: 8px; padding: 4px 10px; font-size: 12px; }
      .test-item:nth-child(even) { background: #f3f4f6; }
      .checkbox { font-size: 14px; color: #16a34a; } .test-name { flex: 1; }
      .others-box { border: 1px solid #d1d5db; min-height: 50px; padding: 8px; font-size: 12px; border-radius: 4px; }
      .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; }
    </style></head><body><div class="container">
      <div class="header"><div class="header-left"><p class="doctor-name">Dr/ Sherif Ali . MD, MRCP (UK)</p><p class="credentials">Consultant Internal Medicine & Nephrology</p></div><div class="header-right"><p class="doctor-name">د/ شريف علي رضا</p><p class="credentials">استشاري الباطنة العامة والكلى</p></div></div>
      <div class="patient-info"><div>Name / الاسم: <span>${patient?.name || '________________'}</span></div><div>Date / التاريخ: <span>${dateStr}</span></div></div>
      <div class="title">${title} / ${titleAr}</div>
      <div class="tests-container">${categoriesWithSelected.map(generateCategoryHtml).join('')}</div>
      <div class="footer"><div>مستشفى تبارك/النسائم - 16552 - 15452</div><div>١٨ عمارات خلف العبور - مصر الجديدة - ت: 01554343147</div></div>
    </div></body></html>`;
  };

  // Checklist config map for print/download
  const checklistConfigs = {
    pmh: { title: 'Past Medical History', titleAr: 'التاريخ المرضي السابق', color: '#16a34a', categories: PAST_MEDICAL_HISTORY_CATEGORIES, items: pmhChecklist, notes: pmhNotes },
    hpi: { title: 'HPI', titleAr: 'تاريخ المرض الحالي', color: '#ea580c', categories: HPI_CATEGORIES, items: hpiChecklist, notes: hpiNotes },
    drugHistory: { title: 'Drug History', titleAr: 'تاريخ الأدوية', color: '#e11d48', categories: DRUG_HISTORY_CATEGORIES, items: dhChecklist, notes: dhNotes },
    familyHistory: { title: 'Family History', titleAr: 'التاريخ العائلي', color: '#d97706', categories: FAMILY_HISTORY_CATEGORIES, items: fhChecklist, notes: fhNotes },
    chiefComplaint: { title: 'Chief Complaint', titleAr: 'الشكوى الرئيسية', color: '#0d9488', categories: CHIEF_COMPLAINT_CATEGORIES, items: ccChecklist, notes: ccNotes },
    diagnosis: { title: 'Diagnosis', titleAr: 'التشخيص', color: '#4f46e5', categories: DIAGNOSIS_CATEGORIES, items: dxChecklist, notes: dxNotes },
    currentMedication: { title: 'Current Medication', titleAr: 'الأدوية الحالية', color: '#0891b2', categories: CURRENT_MEDICATION_CATEGORIES, items: cmChecklist, notes: cmNotes },
  };

  const handlePrintChecklist = (key: keyof typeof checklistConfigs) => {
    const cfg = checklistConfigs[key];
    const html = getChecklistHtml(cfg.title, cfg.titleAr, cfg.color, cfg.categories, cfg.items, cfg.notes);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const handleDownloadChecklist = (key: keyof typeof checklistConfigs) => {
    const cfg = checklistConfigs[key];
    const html = getChecklistHtml(cfg.title, cfg.titleAr, cfg.color, cfg.categories, cfg.items, cfg.notes);
    const today = new Date().toISOString().split('T')[0];
    downloadPdf(html, `${cfg.title.toLowerCase().replace(/\s+/g, '-')}-${today}`, 'a4');
  };

  const getDrawingHtml = (drawingData: string, title: string) => {
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    return `
      <!DOCTYPE html>
      <html dir="ltr">
        <head>
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A5;
              margin: 0;
            }
            body {
              font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
              background: white;
            }
            .prescription-container {
              background: white;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            .header {
              border-bottom: 1px solid #d1d5db;
              padding: 16px;
              padding-bottom: 12px;
            }
            .header-content {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .header-left {
              text-align: left;
            }
            .header-right {
              text-align: right;
              direction: rtl;
              line-height: 1.6;
            }
            .doctor-name {
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
            }
            .credentials {
              font-size: 11px;
              color: #4b5563;
            }
            .patient-info {
              margin-top: 16px;
              padding-top: 12px;
              font-size: 14px;
              color: #374151;
              text-align: left;
              line-height: 1.6;
            }
            .patient-info-row {
              display: flex;
              align-items: center;
              gap: 4px;
            }
            .body-section {
              position: relative;
              flex: 1;
              padding: 16px;
              padding-left: 80px;
            }
            .rx-symbol {
              position: absolute;
              top: 24px;
              left: 24px;
              font-size: 48px;
              color: #9ca3af;
              font-family: 'Times New Roman', serif;
            }
            .drawing-image {
              width: 100%;
              height: auto;
            }
            .footer {
              border-top: 1px solid #d1d5db;
              padding: 12px;
              background: #f9fafb;
              font-size: 11px;
              color: #4b5563;
              margin-top: auto;
            }
            .footer-content {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .footer-left {
              text-align: left;
            }
            .footer-right {
              text-align: right;
            }
            .font-semibold {
              font-weight: 600;
            }
            .font-medium {
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="prescription-container">
            <div class="header">
              <div class="header-content">
                <div class="header-left">
                  <p class="doctor-name">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
                </div>
                <div class="header-right">
                  <p class="doctor-name">دكتـــور</p>
                  <p class="doctor-name">شــريف علي رضــا</p>
                  <p class="credentials">زميـــل الكلية الملكيـــة البـــريطانيـــة</p>
                  <p class="credentials">لطب الباطنـــة والكـــلى</p>
                  <p class="credentials">دكتوراه الأمـــراض الباطنيـــة</p>
                  <p class="credentials">استشارى أمراض الباطنـــة العامة والكلى</p>
                  <p class="credentials">وعضو الجمعية المصرية والأوربيـــة</p>
                  <p class="credentials">لأمـــراض الكـــلى</p>
                  <p class="credentials">بمستشفيات جـــامعـــة عين شمـــس</p>
                </div>
              </div>
              <div class="patient-info">
                <div class="patient-info-row">
                  <span>Name :</span>
                  <span class="font-medium">${patient?.name || ''}</span>
                </div>
                <div class="patient-info-row">
                  <span>Date :</span>
                  <span class="font-medium">${dateStr}</span>
                </div>
              </div>
            </div>
            <div class="body-section">
              <div class="rx-symbol">℞/</div>
              <img src="${getDisplayDataUrl(drawingData) || ''}" alt="${title}" class="drawing-image" />
            </div>
            <div class="footer">
              <div class="footer-content">
                <div class="footer-left">
                  <p class="font-semibold">مستشفى تبارك/النسائم</p>
                  <p>16552 - 15452</p>
                </div>
                <div class="footer-right">
                  <p>١٨ عمارات خلف العبور - مصر الجديدة</p>
                  <p>ت: 01554343147 - 0222602733</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = (drawingData: string | null, title: string) => {
    if (!drawingData) return;
    const html = getDrawingHtml(drawingData, title);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadDrawing = (drawingData: string | null, title: string) => {
    if (!drawingData) return;
    const today = new Date().toISOString().split('T')[0];
    downloadPdf(getDrawingHtml(drawingData, title), `${title}-${today}`, 'a5');
  };

  // Build a printable A4 prescription from the structured medicine rows
  // (clinic letterhead + numbered Rx table). Mirrors getChecklistHtml.
  const getMedicinesHtml = () => {
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const color = '#0d9488';
    const esc = (s: string) =>
      String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const rows = prescriptionMedicines.map((m, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td><div class="med-name">${esc(m.name)}</div>${m.scientific ? `<div class="med-sci">${esc(m.scientific)}</div>` : ''}</td>
        <td>${esc(m.dose)}</td>
        <td>${esc(m.frequency)}</td>
        <td>${esc(m.duration)}</td>
        <td>${esc(m.instructions)}</td>
      </tr>`).join('');

    return `<!DOCTYPE html><html><head><title>Prescription</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @page { size: A4; margin: 15mm; }
      body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 12px; line-height: 1.4; }
      .container { max-width: 210mm; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid ${color}; margin-bottom: 15px; }
      .header-left { text-align: left; } .header-right { text-align: right; direction: rtl; }
      .doctor-name { font-size: 14px; font-weight: bold; color: ${color}; }
      .credentials { font-size: 10px; color: #374151; }
      .patient-info { display: flex; gap: 40px; margin-bottom: 16px; font-size: 13px; }
      .patient-info span { font-weight: bold; }
      .rx { font-size: 26px; font-weight: bold; color: ${color}; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: ${color}; color: white; padding: 7px 8px; text-align: left; }
      td { padding: 7px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
      tr:nth-child(even) td { background: #f3f4f6; }
      .num { text-align: center; width: 32px; }
      .med-name { font-weight: bold; } .med-sci { font-size: 10px; color: #6b7280; }
      .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; }
    </style></head><body><div class="container">
      <div class="header"><div class="header-left"><p class="doctor-name">Dr/ Sherif Ali . MD, MRCP (UK)</p><p class="credentials">Consultant Internal Medicine & Nephrology</p></div><div class="header-right"><p class="doctor-name">د/ شريف علي رضا</p><p class="credentials">استشاري الباطنة العامة والكلى</p></div></div>
      <div class="patient-info"><div>Name: <span>${patient?.name || '________________'}</span></div><div>Date: <span>${dateStr}</span></div></div>
      <div class="rx">℞</div>
      <table>
        <thead><tr>
          <th class="num">#</th>
          <th>Medicine / الدواء</th>
          <th>Dose / الجرعة</th>
          <th>Frequency / التكرار</th>
          <th>Duration / المدة</th>
          <th>Instructions / التعليمات</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer"><div>مستشفى تبارك/النسائم - 16552 - 15452</div><div>١٨ عمارات خلف العبور - مصر الجديدة - ت: 01554343147</div></div>
    </div></body></html>`;
  };

  const handlePrintMedicines = () => {
    if (prescriptionMedicines.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(getMedicinesHtml());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const handleDownloadMedicines = () => {
    if (prescriptionMedicines.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    downloadPdf(getMedicinesHtml(), `prescription-medicines-${today}`, 'a4');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    savingRef.current = true;
    try {
      const visitData = {
        visitType: visitType,
        price: parseFloat(price) || 0,
        chiefComplaint: '',
        chiefComplaintDrawing: chiefComplaintDrawing || null,
        diagnosis: '',
        diagnosisDrawing: diagnosisDrawing || null,
        notes: '',
        notesDrawing: prescriptionPage1 || null,
        notesDrawing2: prescriptionPage2 || null,
        notesDrawing3: prescriptionPage3 || null,
        pastMedicalHistoryDrawing: pastMedicalHistoryDrawing || null,
        hpiDrawing: hpiDrawing || null,
        drugHistoryDrawing: drugHistoryDrawing || null,
        familyHistoryDrawing: familyHistoryDrawing || null,
        currentMedicationDrawing: currentMedicationDrawing || null,
        radiologyDrawing: radiologyPage1 || null,
        radiologyDrawing2: radiologyPage2 || null,
        radiologyDrawing3: radiologyPage3 || null,
        labTestRequest: Object.keys(selectedLabTests).some(k => selectedLabTests[k]) || labTestOtherNotes
          ? JSON.stringify({ tests: selectedLabTests, notes: labTestOtherNotes })
          : null,
        radiologyRequest: Object.keys(selectedRadiologyTests).some(k => selectedRadiologyTests[k]) || radiologyTestOtherNotes
          ? JSON.stringify({ tests: selectedRadiologyTests, notes: radiologyTestOtherNotes })
          : null,
        medicalChecklists: (() => {
          const mc = {
            chiefComplaint: { items: ccChecklist, notes: ccNotes },
            diagnosis: { items: dxChecklist, notes: dxNotes },
            pastMedicalHistory: { items: pmhChecklist, notes: pmhNotes },
            hpi: { items: hpiChecklist, notes: hpiNotes },
            drugHistory: { items: dhChecklist, notes: dhNotes },
            familyHistory: { items: fhChecklist, notes: fhNotes },
            currentMedication: { items: cmChecklist, notes: cmNotes },
          };
          const hasAny = Object.values(mc).some(form =>
            Object.values(form.items).some(v => v) || form.notes
          );
          return hasAny ? JSON.stringify(mc) : null;
        })(),
        prescriptionMedicines: prescriptionMedicines.length
          ? JSON.stringify(prescriptionMedicines)
          : null,
        vitals: {
          bloodPressure: formData.bloodPressure || '120/80',
          temperature: parseFloat(formData.temperature) || 37,
          weight: parseFloat(formData.weight) || 70,
        },
      };

      let savedVisitId: string;

      if (isEditMode && visitId) {
        // Drop drawings that are byte-identical to what was loaded. The server
        // only writes fields present in the request, so an omitted page keeps
        // its stored image — this turns a ~4 MB save into a few KB when the
        // doctor edited text or a single canvas. Sending null would erase them,
        // so the key must be absent, not empty.
        const loaded = loadedDrawingsRef.current;
        const trimmed: Record<string, unknown> = { ...visitData };
        let skipped = 0;
        for (const [key, wasValue] of Object.entries(loaded)) {
          if (trimmed[key] === wasValue || (!trimmed[key] && !wasValue)) {
            delete trimmed[key];
            skipped++;
          }
        }
        if (skipped) {
          console.debug(`[visit save] ${skipped} unchanged drawing(s) left out of the request`);
        }

        const updatedVisit = await updateVisit(visitId, trimmed as typeof visitData);
        savedVisitId = updatedVisit.id;
      } else {
        // Create new visit
        const visit = await addVisit({
          patientId: patientId!,
          date: new Date(),
          ...visitData,
        });
        savedVisitId = visit.id;
      }

      // Upload attachments for BOTH new and edited visits. Dedup twice:
      //  1. skip local attachments already persisted this session (re-submit)
      //  2. skip ones already saved on the server for this visit (name+type)
      const existingAttachments = getVisitAttachments(savedVisitId);
      const alreadyOnServer = (name: string, type: string) =>
        existingAttachments.some(a => a.name === name && a.type === type);

      const pendingUploads = [
        ...attachments.map(att => ({ att, prefix: '' })),
        ...prescriptionAttachments.map(att => ({ att, prefix: '[Prescription]' })),
        ...radiologyAttachments.map(att => ({ att, prefix: '[Radiology]' })),
      ].filter(({ att }) => !persistedAttachmentIds.current.has(att.id));

      // allSettled (not Promise.all) so one oversized/failed image doesn't
      // reject the whole batch and mask that the visit itself already saved.
      const results = await Promise.allSettled(
        pendingUploads.map(async ({ att, prefix }) => {
          const name = prefix ? `${prefix} ${att.name}` : att.name;
          if (!alreadyOnServer(name, att.type)) {
            await uploadVisitAttachment(savedVisitId, {
              name,
              type: att.type,
              dataUrl: att.dataUrl,
            });
          }
          persistedAttachmentIds.current.add(att.id);
        })
      );
      const failedUploads = results.filter(r => r.status === 'rejected').length;
      if (failedUploads > 0) {
        toast({
          title: language === 'ar'
            ? `تعذّر رفع ${failedUploads} من ${pendingUploads.length} مرفق`
            : `${failedUploads} of ${pendingUploads.length} attachments failed to upload`,
          variant: 'destructive',
        });
      }

      // Visit was saved to the server — drop the local draft
      clearDraft(draftKey);

      toast({
        title: isEditMode
          ? (language === 'ar' ? 'تم تحديث الزيارة بنجاح' : 'Visit updated successfully')
          : (language === 'ar' ? 'تم حفظ الزيارة بنجاح' : 'Visit saved successfully'),
      });

      navigate(`/patients/${patientId}/visit/${savedVisitId}`);
    } catch (error) {
      // The draft is still on disk (clearDraft only runs after the server
      // confirms), so say so — a failed save looks like lost work otherwise.
      const message = error instanceof Error ? error.message : '';
      const isNetwork = !message || /network|failed to fetch|load failed/i.test(message);
      toast({
        title: language === 'ar' ? 'لم يتم حفظ الزيارة' : 'Visit was not saved',
        description: isNetwork
          ? (language === 'ar'
              ? 'تعذّر الاتصال بالخادم. عملك محفوظ هنا — تحقق من الشبكة ثم اضغط حفظ مرة أخرى.'
              : 'Could not reach the server. Your work is still here — check the network and press save again.')
          : message,
        variant: 'destructive',
      });
    } finally {
      savingRef.current = false;
    }
  };

  // A reload or tab close during upload aborts the request and the visit is
  // lost server-side. Warn while a save is in flight, or while a draft holds
  // work that has not reached the server.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasUnsaved = savingRef.current || draftStatus === 'saving' || !!restoredDraft;
      if (!hasUnsaved) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [draftStatus, restoredDraft]);


  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">{t('common.noData')}</p>
        </div>
      </DashboardLayout>
    );
  }

  // Small helper for the auto-save status pill
  const renderDraftStatus = () => {
    if (draftStatus === 'saving') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          {language === 'ar' ? 'جاري الحفظ...' : 'Saving…'}
        </span>
      );
    }
    if (draftStatus === 'saved' && lastSavedAt) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
          <Save className="w-3 h-3" />
          {language === 'ar' ? 'تم الحفظ' : 'Draft saved'}
          <span className="text-muted-foreground">
            {format(new Date(lastSavedAt), 'HH:mm:ss')}
          </span>
        </span>
      );
    }
    if (draftStatus === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
          <AlertTriangle className="w-3 h-3" />
          {draftError ?? (language === 'ar' ? 'فشل الحفظ' : 'Draft save failed')}
        </span>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {restoredDraft && (
          <div className="mb-4 p-4 rounded-xl border border-amber-300 bg-amber-50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-amber-900">
                {language === 'ar' ? 'تمت استعادة مسودة محفوظة' : 'Restored from saved draft'}
              </div>
              <div className="text-sm text-amber-800 mt-1">
                {language === 'ar'
                  ? `تم استرجاع عملك السابق من ${format(new Date(restoredDraft.savedAt), 'PPpp', { locale: ar })}. اضغط حفظ الزيارة للتأكيد، أو تجاهل المسودة لبدء من جديد.`
                  : `Continuing your work from ${format(new Date(restoredDraft.savedAt), 'PPpp', { locale: enUS })}. Save the visit to finalize, or discard to start fresh.`}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscardDraft}
              className="shrink-0"
            >
              {language === 'ar' ? 'تجاهل المسودة' : 'Discard draft'}
            </Button>
          </div>
        )}

        <Button variant="ghost" onClick={() => navigate(`/patients/${patientId}`)} className="gap-2 mb-4">
          <BackIcon className="w-4 h-4" />
          {t('common.back')}
        </Button>

        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-foreground">
              {isEditMode
                ? (language === 'ar' ? 'تعديل الزيارة' : 'Edit Visit')
                : t('visits.newVisit')}
            </h1>
            {renderDraftStatus()}
          </div>
          {/* Global Pen Size Control */}
          <div className="flex items-center gap-2 bg-card rounded-xl px-3 py-2 card-shadow">
            <PenTool className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{language === 'ar' ? 'حجم القلم' : 'Pen Size'}</span>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {[1, 2, 4].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setGlobalPenSize(size)}
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                    globalPenSize === size ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/10'
                  )}
                >
                  <div
                    className="rounded-full bg-current"
                    style={{ width: size * 3, height: size * 3 }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-muted-foreground mb-8">{patient.name}</p>

        {/* Patient Records (Read-only) */}
        {patient.records && patient.records.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl card-shadow p-6 space-y-4 mb-8"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'سجلات المريض' : 'Patient Records'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {patient.records.map((record, recIdx) => {
                const recordList: ViewerFile[] = patient.records.map((r) => ({
                  url: r.dataUrl,
                  type: isImageFile(r.type) ? 'image' : 'pdf',
                  name: r.name,
                  mimeType: r.type,
                }));
                return (
                <div
                  key={record.id}
                  className="rounded-xl overflow-hidden border border-border bg-muted/30"
                >
                  {isImageFile(record.type) ? (
                    <img
                      src={record.dataUrl}
                      alt={record.name}
                      className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openViewer(recordList, recIdx)}
                    />
                  ) : (
                    <div
                      className="w-full h-24 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => openViewer(recordList, recIdx)}
                    >
                      <File className="w-8 h-8 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
                        {record.name}
                      </span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground truncate">{record.name}</p>
                  </div>
                </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-6">
          {/* Visit Type & Price Section */}
          <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'نوع الكشف والسعر' : 'Visit Type & Price'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'نوع الكشف' : 'Visit Type'}</Label>
                <Select value={visitType} onValueChange={(value: VisitType) => setVisitType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-green-600" />
                        {language === 'ar' ? 'كشف جديد' : 'New Visit'}
                      </div>
                    </SelectItem>
                    <SelectItem value="followup">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                        {language === 'ar' ? 'متابعة' : 'Follow-up'}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'السعر (EGP)' : 'Price (EGP)'}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Vitals Section (Always visible) */}
          <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              {t('visits.vitals')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('visits.bloodPressure')}</Label>
                <Input value={formData.bloodPressure} onChange={(e) => handleChange('bloodPressure', e.target.value)} placeholder="120/80" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{t('visits.temperature')}</Label>
                <Input type="number" step="0.1" value={formData.temperature} onChange={(e) => handleChange('temperature', e.target.value)} placeholder="37.0" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{t('visits.weight')}</Label>
                <Input type="number" value={formData.weight} onChange={(e) => handleChange('weight', e.target.value)} placeholder="70" dir="ltr" />
              </div>
            </div>
          </div>
          {/* Previous Visits Section (Collapsible) */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'الزيارات السابقة' : 'Previous Visits'}
              icon={<Clock className="w-5 h-5" />}
              isOpen={isPreviousVisitsOpen}
              onClick={() => setIsPreviousVisitsOpen(!isPreviousVisitsOpen)}
              extra={
                <span className="text-sm text-muted-foreground">
                  ({previousVisits.length})
                </span>
              }
            />
            <AnimatePresence initial={false}>
              {isPreviousVisitsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 border-t border-border">
                    {previousVisits.length > 0 ? (
                      <div className="space-y-3">
                        {previousVisits.map((prevVisit) => (
                          <div
                            key={prevVisit.id}
                            className="w-full p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/patients/${patientId}/visit/${prevVisit.id}`)}
                                className="flex items-center gap-2 text-primary hover:underline"
                              >
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">
                                  {format(prevVisit.date, 'PPP', { locale: dateLocale })}
                                </span>
                              </button>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openPreviousVisitAsPdf(prevVisit.id)}
                                  disabled={isPreparingPdf}
                                  className="h-8 gap-1"
                                  title={language === 'ar' ? 'عرض كملف PDF' : 'View as PDF'}
                                >
                                  {isPreparingPdf ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                  <span className="text-xs">PDF</span>
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                              <div>
                                <span className="text-xs">{t('visits.bloodPressure')}: </span>
                                <span className="text-foreground">{prevVisit.vitals.bloodPressure || '-'}</span>
                              </div>
                              <div>
                                <span className="text-xs">{t('visits.temperature')}: </span>
                                <span className="text-foreground">{prevVisit.vitals.temperature || '-'}°C</span>
                              </div>
                              <div>
                                <span className="text-xs">{t('visits.weight')}: </span>
                                <span className="text-foreground">{prevVisit.vitals.weight || '-'} kg</span>
                              </div>
                            </div>
                            {prevVisit.chiefComplaint && (
                              <p className="mt-2 text-sm text-muted-foreground truncate">
                                <span className="text-xs">{t('visits.chiefComplaint')}: </span>
                                {prevVisit.chiefComplaint}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        {language === 'ar' ? 'لا توجد زيارات سابقة' : 'No previous visits'}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* SECTION 1: Medical History */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'التاريخ الطبي' : 'Medical History'}
              icon={<History className="w-5 h-5" />}
              isOpen={activeSection === 'medical-history'}
              onClick={() => toggleSection('medical-history')}
            />
            <AnimatePresence initial={false}>
              {activeSection === 'medical-history' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 space-y-6 border-t border-border">
                    {/* Past Medical History */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        {language === 'ar' ? 'التاريخ المرضي السابق' : 'Past Medical History'}
                      </Label>
                      <SimpleDrawingCanvas
                        language={language}
                        minHeight={100}
                        maxHeight={250}
                        placeholder={language === 'ar' ? 'اكتب التاريخ المرضي السابق...' : 'Write past medical history...'}
                        onSave={setPastMedicalHistoryDrawing}
                        penSize={globalPenSize}
                        initialData={pastMedicalHistoryDrawing}
                      />
                    </div>

                    {/* HPI */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        {language === 'ar' ? 'تاريخ المرض الحالي' : 'HPI'}
                      </Label>
                      <SimpleDrawingCanvas
                        language={language}
                        minHeight={100}
                        maxHeight={250}
                        placeholder={language === 'ar' ? 'اكتب تاريخ المرض الحالي...' : 'Write HPI...'}
                        onSave={setHpiDrawing}
                        penSize={globalPenSize}
                        initialData={hpiDrawing}
                      />
                    </div>

                    {/* Drug History */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        {language === 'ar' ? 'تاريخ الأدوية' : 'Drug History'}
                      </Label>
                      <SimpleDrawingCanvas
                        language={language}
                        minHeight={100}
                        maxHeight={250}
                        placeholder={language === 'ar' ? 'اكتب تاريخ الأدوية...' : 'Write drug history...'}
                        onSave={setDrugHistoryDrawing}
                        penSize={globalPenSize}
                        initialData={drugHistoryDrawing}
                      />
                    </div>

                    {/* Family History */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {language === 'ar' ? 'التاريخ العائلي' : 'Family History'}
                      </Label>
                      <SimpleDrawingCanvas
                        language={language}
                        minHeight={100}
                        maxHeight={250}
                        placeholder={language === 'ar' ? 'اكتب التاريخ العائلي...' : 'Write family history...'}
                        onSave={setFamilyHistoryDrawing}
                        penSize={globalPenSize}
                        initialData={familyHistoryDrawing}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 1B: Medical History Checklist */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'قائمة التاريخ الطبي' : 'Medical History Checklist'}
              icon={<ClipboardList className="w-5 h-5" />}
              isOpen={activeSection === 'medical-history-checklist'}
              onClick={() => toggleSection('medical-history-checklist')}
              extra={
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handlePrintChecklist(activeMedHistoryTab); }} className="gap-1 h-8">
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDownloadChecklist(activeMedHistoryTab); }} className="gap-1 h-8">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              }
            />
            <AnimatePresence initial={false}>
              {activeSection === 'medical-history-checklist' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 border-t border-border">
                    {/* Tab Bar */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap" dir="ltr">
                      {([
                        { key: 'pmh' as MedHistoryTab, label: 'PMH', labelAr: 'تاريخ مرضي', color: 'bg-green-600' },
                        { key: 'hpi' as MedHistoryTab, label: 'HPI', labelAr: 'مرض حالي', color: 'bg-orange-600' },
                        { key: 'drugHistory' as MedHistoryTab, label: 'Drug Hx', labelAr: 'أدوية', color: 'bg-rose-600' },
                        { key: 'familyHistory' as MedHistoryTab, label: 'Family Hx', labelAr: 'عائلي', color: 'bg-amber-600' },
                      ]).map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveMedHistoryTab(tab.key)}
                          className={cn(
                            'px-4 py-2 rounded-lg font-medium transition-colors text-sm',
                            activeMedHistoryTab === tab.key
                              ? `${tab.color} text-white`
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          )}
                        >
                          {language === 'ar' ? tab.labelAr : tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    {activeMedHistoryTab === 'pmh' && (
                      <CheckboxRequestForm
                        categories={PAST_MEDICAL_HISTORY_CATEGORIES}
                        selectedItems={pmhChecklist}
                        onItemToggle={toggleChecklist(setPmhChecklist)}
                        otherText={pmhNotes}
                        onOtherTextChange={setPmhNotes}
                        accentColor="green"
                      />
                    )}
                    {activeMedHistoryTab === 'hpi' && (
                      <CheckboxRequestForm
                        categories={HPI_CATEGORIES}
                        selectedItems={hpiChecklist}
                        onItemToggle={toggleChecklist(setHpiChecklist)}
                        otherText={hpiNotes}
                        onOtherTextChange={setHpiNotes}
                        accentColor="orange"
                      />
                    )}
                    {activeMedHistoryTab === 'drugHistory' && (
                      <CheckboxRequestForm
                        categories={DRUG_HISTORY_CATEGORIES}
                        selectedItems={dhChecklist}
                        onItemToggle={toggleChecklist(setDhChecklist)}
                        otherText={dhNotes}
                        onOtherTextChange={setDhNotes}
                        accentColor="rose"
                      />
                    )}
                    {activeMedHistoryTab === 'familyHistory' && (
                      <CheckboxRequestForm
                        categories={FAMILY_HISTORY_CATEGORIES}
                        selectedItems={fhChecklist}
                        onItemToggle={toggleChecklist(setFhChecklist)}
                        otherText={fhNotes}
                        onOtherTextChange={setFhNotes}
                        accentColor="amber"
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 2: Medical Notes */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'ملاحظات طبية' : 'Medical Notes'}
              icon={<ClipboardList className="w-5 h-5" />}
              isOpen={activeSection === 'medical-notes'}
              onClick={() => toggleSection('medical-notes')}
            />
            <AnimatePresence initial={false}>
              {activeSection === 'medical-notes' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 space-y-6 border-t border-border">
                    {/* Chief Complaint */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        {language === 'ar' ? 'الشكوى الرئيسية' : 'Chief Complaint'}
                      </Label>
                      <SimpleDrawingCanvas
                        language={language}
                        minHeight={120}
                        maxHeight={300}
                        placeholder={language === 'ar' ? 'اكتب الشكوى الرئيسية...' : 'Write chief complaint...'}
                        onSave={setChiefComplaintDrawing}
                        penSize={globalPenSize}
                        initialData={chiefComplaintDrawing}
                      />
                    </div>

                    {/* Diagnosis */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        {language === 'ar' ? 'التشخيص' : 'Diagnosis'}
                      </Label>
                      <SimpleDrawingCanvas
                        language={language}
                        minHeight={120}
                        maxHeight={300}
                        placeholder={language === 'ar' ? 'اكتب التشخيص...' : 'Write diagnosis...'}
                        onSave={setDiagnosisDrawing}
                        penSize={globalPenSize}
                        initialData={diagnosisDrawing}
                      />
                    </div>

                    {/* Current Medication */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        {language === 'ar' ? 'الأدوية الحالية' : 'Current Medication'}
                      </Label>
                      <SimpleDrawingCanvas
                        language={language}
                        minHeight={100}
                        maxHeight={250}
                        placeholder={language === 'ar' ? 'اكتب الأدوية الحالية...' : 'Write current medication...'}
                        onSave={setCurrentMedicationDrawing}
                        penSize={globalPenSize}
                        initialData={currentMedicationDrawing}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 2B: Clinical Notes Checklist */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'قائمة الملاحظات السريرية' : 'Clinical Notes Checklist'}
              icon={<Stethoscope className="w-5 h-5" />}
              isOpen={activeSection === 'clinical-notes-checklist'}
              onClick={() => toggleSection('clinical-notes-checklist')}
              extra={
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handlePrintChecklist(activeClinicalNotesTab); }} className="gap-1 h-8">
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDownloadChecklist(activeClinicalNotesTab); }} className="gap-1 h-8">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              }
            />
            <AnimatePresence initial={false}>
              {activeSection === 'clinical-notes-checklist' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 border-t border-border">
                    {/* Tab Bar */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap" dir="ltr">
                      {([
                        { key: 'chiefComplaint' as ClinicalNotesTab, label: 'Chief Complaint', labelAr: 'شكوى رئيسية', color: 'bg-teal-600' },
                        { key: 'diagnosis' as ClinicalNotesTab, label: 'Diagnosis', labelAr: 'تشخيص', color: 'bg-indigo-600' },
                        { key: 'currentMedication' as ClinicalNotesTab, label: 'Current Med', labelAr: 'أدوية حالية', color: 'bg-cyan-600' },
                      ]).map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveClinicalNotesTab(tab.key)}
                          className={cn(
                            'px-4 py-2 rounded-lg font-medium transition-colors text-sm',
                            activeClinicalNotesTab === tab.key
                              ? `${tab.color} text-white`
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          )}
                        >
                          {language === 'ar' ? tab.labelAr : tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    {activeClinicalNotesTab === 'chiefComplaint' && (
                      <CheckboxRequestForm
                        categories={CHIEF_COMPLAINT_CATEGORIES}
                        selectedItems={ccChecklist}
                        onItemToggle={toggleChecklist(setCcChecklist)}
                        otherText={ccNotes}
                        onOtherTextChange={setCcNotes}
                        accentColor="teal"
                      />
                    )}
                    {activeClinicalNotesTab === 'diagnosis' && (
                      <CheckboxRequestForm
                        categories={DIAGNOSIS_CATEGORIES}
                        selectedItems={dxChecklist}
                        onItemToggle={toggleChecklist(setDxChecklist)}
                        otherText={dxNotes}
                        onOtherTextChange={setDxNotes}
                        accentColor="indigo"
                      />
                    )}
                    {activeClinicalNotesTab === 'currentMedication' && (
                      <CheckboxRequestForm
                        categories={CURRENT_MEDICATION_CATEGORIES}
                        selectedItems={cmChecklist}
                        onItemToggle={toggleChecklist(setCmChecklist)}
                        otherText={cmNotes}
                        onOtherTextChange={setCmNotes}
                        accentColor="cyan"
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 3: Prescription (3 Pages) */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'الروشتة' : 'Prescription'}
              icon={<FileText className="w-5 h-5" />}
              isOpen={activeSection === 'prescription'}
              onClick={() => toggleSection('prescription')}
              extra={
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activePrescriptionTab === 'medicines') {
                        handlePrintMedicines();
                        return;
                      }
                      const currentDrawing = activePrescriptionTab === 1 ? prescriptionPage1 : activePrescriptionTab === 2 ? prescriptionPage2 : prescriptionPage3;
                      handlePrint(currentDrawing, language === 'ar' ? `الروشتة - صفحة ${activePrescriptionTab}` : `Prescription - Page ${activePrescriptionTab}`);
                    }}
                    className="gap-1 h-8"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activePrescriptionTab === 'medicines') {
                        handleDownloadMedicines();
                        return;
                      }
                      const currentDrawing = activePrescriptionTab === 1 ? prescriptionPage1 : activePrescriptionTab === 2 ? prescriptionPage2 : prescriptionPage3;
                      handleDownloadDrawing(currentDrawing, language === 'ar' ? `الروشتة-صفحة-${activePrescriptionTab}` : `prescription-page-${activePrescriptionTab}`);
                    }}
                    className="gap-1 h-8"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              }
            />
            <AnimatePresence initial={false}>
              {activeSection === 'prescription' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 border-t border-border" ref={prescriptionRef}>
                    {/* Tabs: Medicines picker + 3 canvas pages */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap" dir="ltr">
                      <button
                        type="button"
                        onClick={() => setActivePrescriptionTab('medicines')}
                        className={cn(
                          'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5',
                          activePrescriptionTab === 'medicines'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        )}
                      >
                        <Pill className="w-4 h-4" />
                        {language === 'ar' ? 'الأدوية' : 'Medicines'}
                        {prescriptionMedicines.length > 0 && (
                          <span className="ms-1 text-xs bg-white/25 rounded-full px-1.5">{prescriptionMedicines.length}</span>
                        )}
                      </button>
                      {[1, 2, 3].map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setActivePrescriptionTab(page as 1 | 2 | 3)}
                          className={cn(
                            'px-4 py-2 rounded-lg font-medium transition-colors',
                            activePrescriptionTab === page
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          )}
                        >
                          Page {page}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    {activePrescriptionTab === 'medicines' && (
                      <MedicineSelectForm
                        value={prescriptionMedicines}
                        onChange={setPrescriptionMedicines}
                        language={language}
                      />
                    )}
                    {activePrescriptionTab === 1 && (
                      <PrescriptionTemplate
                        onSave={setPrescriptionPage1}
                        placeholder="Write prescription here (Page 1)..."
                        placeholderAr="اكتب الروشتة هنا (صفحة 1)..."
                        initialData={prescriptionPage1}
                        language={language}
                        globalPenSize={globalPenSize}
                      />
                    )}
                    {activePrescriptionTab === 2 && (
                      <PrescriptionTemplate
                        onSave={setPrescriptionPage2}
                        placeholder="Write prescription here (Page 2)..."
                        placeholderAr="اكتب الروشتة هنا (صفحة 2)..."
                        initialData={prescriptionPage2}
                        language={language}
                        globalPenSize={globalPenSize}
                      />
                    )}
                    {activePrescriptionTab === 3 && (
                      <PrescriptionTemplate
                        onSave={setPrescriptionPage3}
                        placeholder="Write prescription here (Page 3)..."
                        placeholderAr="اكتب الروشتة هنا (صفحة 3)..."
                        initialData={prescriptionPage3}
                        language={language}
                        globalPenSize={globalPenSize}
                      />
                    )}

                    {/* Prescription File Upload */}
                    <div className="mt-6 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Paperclip className="w-4 h-4" />
                          {language === 'ar' ? 'مرفقات الروشتة' : 'Prescription Attachments'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <input
                            ref={prescriptionFileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            onChange={handlePrescriptionFileUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => prescriptionFileInputRef.current?.click()}
                            className="gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            {language === 'ar' ? 'رفع ملف' : 'Upload'}
                          </Button>
                        </div>
                      </div>

                      {prescriptionAttachments.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {prescriptionAttachments.map((attachment, attIdx) => {
                            const list: ViewerFile[] = prescriptionAttachments.map((a) => ({
                              url: a.dataUrl,
                              type: isImageFile(a.type) ? 'image' : 'pdf',
                              name: a.name,
                              mimeType: a.type,
                            }));
                            return (
                            <div
                              key={attachment.id}
                              className="relative rounded-lg overflow-hidden border border-border bg-muted/30 group"
                            >
                              {isImageFile(attachment.type) ? (
                                <img
                                  src={attachment.dataUrl}
                                  alt={attachment.name}
                                  className="w-full h-20 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openViewer(list, attIdx)}
                                />
                              ) : (
                                <div
                                  className="w-full h-20 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                                  onClick={() => openViewer(list, attIdx)}
                                >
                                  <File className="w-6 h-6 text-muted-foreground mb-1" />
                                  <span className="text-xs text-muted-foreground">PDF</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removePrescriptionAttachment(attachment.id)}
                                className="absolute top-1 end-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                              <div className="p-1.5">
                                <p className="text-xs text-muted-foreground truncate">{attachment.name}</p>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          {language === 'ar' ? 'لا توجد مرفقات - يمكنك رفع صور أو PDF' : 'No attachments - you can upload images or PDFs'}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 4: Radiology (3 Pages) */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'الأشعة' : 'Radiology'}
              icon={<FlaskConical className="w-5 h-5" />}
              isOpen={activeSection === 'lab'}
              onClick={() => toggleSection('lab')}
              extra={
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentDrawing = activeRadiologyPage === 1 ? radiologyPage1 : activeRadiologyPage === 2 ? radiologyPage2 : radiologyPage3;
                      handlePrint(currentDrawing, language === 'ar' ? `الأشعة - صفحة ${activeRadiologyPage}` : `Radiology - Page ${activeRadiologyPage}`);
                    }}
                    className="gap-1 h-8"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentDrawing = activeRadiologyPage === 1 ? radiologyPage1 : activeRadiologyPage === 2 ? radiologyPage2 : radiologyPage3;
                      handleDownloadDrawing(currentDrawing, language === 'ar' ? `الأشعة-صفحة-${activeRadiologyPage}` : `radiology-page-${activeRadiologyPage}`);
                    }}
                    className="gap-1 h-8"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              }
            />
            <AnimatePresence initial={false}>
              {activeSection === 'lab' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 border-t border-border" ref={labRequestRef}>
                    {/* Page Tabs - Always in English */}
                    <div className="flex items-center gap-2 mb-4" dir="ltr">
                      {[1, 2, 3].map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setActiveRadiologyPage(page as 1 | 2 | 3)}
                          className={cn(
                            'px-4 py-2 rounded-lg font-medium transition-colors',
                            activeRadiologyPage === page
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          )}
                        >
                          Page {page}
                        </button>
                      ))}
                    </div>

                    {/* Page Content */}
                    {activeRadiologyPage === 1 && (
                      <PrescriptionTemplate
                        onSave={setRadiologyPage1}
                        placeholder="Write radiology requests here (Page 1)..."
                        placeholderAr="اكتب طلبات الأشعة هنا (صفحة 1)..."
                        initialData={radiologyPage1}
                        language={language}
                        globalPenSize={globalPenSize}
                      />
                    )}
                    {activeRadiologyPage === 2 && (
                      <PrescriptionTemplate
                        onSave={setRadiologyPage2}
                        placeholder="Write radiology requests here (Page 2)..."
                        placeholderAr="اكتب طلبات الأشعة هنا (صفحة 2)..."
                        initialData={radiologyPage2}
                        language={language}
                        globalPenSize={globalPenSize}
                      />
                    )}
                    {activeRadiologyPage === 3 && (
                      <PrescriptionTemplate
                        onSave={setRadiologyPage3}
                        placeholder="Write radiology requests here (Page 3)..."
                        placeholderAr="اكتب طلبات الأشعة هنا (صفحة 3)..."
                        initialData={radiologyPage3}
                        language={language}
                        globalPenSize={globalPenSize}
                      />
                    )}

                    {/* Radiology File Upload */}
                    <div className="mt-6 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Paperclip className="w-4 h-4" />
                          {language === 'ar' ? 'مرفقات الأشعة' : 'Radiology Attachments'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <input
                            ref={radiologyFileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            onChange={handleRadiologyFileUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => radiologyFileInputRef.current?.click()}
                            className="gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            {language === 'ar' ? 'رفع ملف' : 'Upload'}
                          </Button>
                        </div>
                      </div>

                      {radiologyAttachments.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {radiologyAttachments.map((attachment, attIdx) => {
                            const list: ViewerFile[] = radiologyAttachments.map((a) => ({
                              url: a.dataUrl,
                              type: isImageFile(a.type) ? 'image' : 'pdf',
                              name: a.name,
                              mimeType: a.type,
                            }));
                            return (
                            <div
                              key={attachment.id}
                              className="relative rounded-lg overflow-hidden border border-border bg-muted/30 group"
                            >
                              {isImageFile(attachment.type) ? (
                                <img
                                  src={attachment.dataUrl}
                                  alt={attachment.name}
                                  className="w-full h-20 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openViewer(list, attIdx)}
                                />
                              ) : (
                                <div
                                  className="w-full h-20 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                                  onClick={() => openViewer(list, attIdx)}
                                >
                                  <File className="w-6 h-6 text-muted-foreground mb-1" />
                                  <span className="text-xs text-muted-foreground">PDF</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeRadiologyAttachment(attachment.id)}
                                className="absolute top-1 end-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                              <div className="p-1.5">
                                <p className="text-xs text-muted-foreground truncate">{attachment.name}</p>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          {language === 'ar' ? 'لا توجد مرفقات - يمكنك رفع صور أو PDF' : 'No attachments - you can upload images or PDFs'}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 5: Lab Test Request */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'طلب تحاليل معملية' : 'Lab Test Request'}
              icon={<FlaskConical className="w-5 h-5" />}
              isOpen={activeSection === 'lab-tests'}
              onClick={() => toggleSection('lab-tests')}
              extra={
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintLabRequest();
                    }}
                    className="gap-1 h-8"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadLabRequest();
                    }}
                    className="gap-1 h-8"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              }
            />
            <AnimatePresence initial={false}>
              {activeSection === 'lab-tests' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 border-t border-border">
                    <LabTestRequestForm
                      selectedTests={selectedLabTests}
                      onTestToggle={handleLabTestToggle}
                      otherTests={labTestOtherNotes}
                      onOtherTestsChange={setLabTestOtherNotes}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 6: Radiology Request */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'طلب أشعة' : 'Radiology Request'}
              icon={<Activity className="w-5 h-5" />}
              isOpen={activeSection === 'radiology-request'}
              onClick={() => toggleSection('radiology-request')}
              extra={
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintRadiologyRequest();
                    }}
                    className="gap-1 h-8"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadRadiologyRequest();
                    }}
                    className="gap-1 h-8"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              }
            />
            <AnimatePresence initial={false}>
              {activeSection === 'radiology-request' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 border-t border-border">
                    <RadiologyRequestForm
                      selectedTests={selectedRadiologyTests}
                      onTestToggle={handleRadiologyTestToggle}
                      otherTests={radiologyTestOtherNotes}
                      onOtherTestsChange={setRadiologyTestOtherNotes}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Attachments Section (Always visible, not collapsible) */}
          <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'المرفقات' : 'Attachments'}
            </h2>

            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {language === 'ar' ? 'رفع ملف' : 'Upload File'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {language === 'ar' ? 'صور و PDF فقط' : 'Images & PDF only'}
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {attachments.map((attachment, attIdx) => {
                  const list: ViewerFile[] = attachments.map((a) => ({
                    url: a.dataUrl,
                    type: isImageFile(a.type) ? 'image' : 'pdf',
                    name: a.name,
                    mimeType: a.type,
                  }));
                  return (
                  <div
                    key={attachment.id}
                    className="relative rounded-xl overflow-hidden border border-border bg-muted/30 group"
                  >
                    {isImageFile(attachment.type) ? (
                      <img
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openViewer(list, attIdx)}
                      />
                    ) : (
                      <div
                        className="w-full h-24 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => openViewer(list, attIdx)}
                      >
                        <File className="w-8 h-8 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
                          PDF
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute top-1 end-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground truncate">{attachment.name}</p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              {isEditMode
                ? (language === 'ar' ? 'تحديث' : 'Update')
                : t('common.save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditMode ? `/patients/${patientId}/visit/${visitId}` : `/patients/${patientId}`)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </motion.form>

        {/* Slider-style file viewer (shared component) */}
        {viewerOpen && (
          <FileViewerModal
            files={viewerFiles}
            initialIndex={viewerIndex}
            onClose={closeViewer}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewVisitPage;
