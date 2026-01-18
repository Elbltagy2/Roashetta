import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Activity,
  Image,
  File,
  X,
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
  PenTool
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleDrawingCanvas } from '@/components/ui/simple-drawing-canvas';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Attachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
}

type ActiveSection = 'medical-history' | 'medical-notes' | 'prescription' | 'lab' | null;

const NewVisitPage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const { t, language, direction } = useLanguage();
  const { getPatient, addVisit } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const labRequestRef = useRef<HTMLDivElement>(null);

  const patient = getPatient(patientId || '');
  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

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
  const [notesDrawing, setNotesDrawing] = useState<string>('');

  // Medical History drawings
  const [pastMedicalHistoryDrawing, setPastMedicalHistoryDrawing] = useState<string>('');
  const [hpiDrawing, setHpiDrawing] = useState<string>('');
  const [drugHistoryDrawing, setDrugHistoryDrawing] = useState<string>('');
  const [familyHistoryDrawing, setFamilyHistoryDrawing] = useState<string>('');
  const [currentMedicationDrawing, setCurrentMedicationDrawing] = useState<string>('');

  // Requested Lab drawing
  const [requestedLabDrawing, setRequestedLabDrawing] = useState<string>('');

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // File preview modal
  const [selectedFile, setSelectedFile] = useState<{ url: string; type: string } | null>(null);

  // Global pen size for all drawing canvases
  const [globalPenSize, setGlobalPenSize] = useState(2);

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

  const handlePrint = (ref: React.RefObject<HTMLDivElement>, title: string) => {
    if (!ref.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = ref.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${direction}">
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
            img {
              max-width: 100%;
              height: auto;
            }
            /* Template styles */
            .bg-white { background-color: white; }
            .rounded-xl { border-radius: 0.75rem; }
            .border { border-width: 1px; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-gray-200 { border-color: #e5e7eb; }
            .overflow-hidden { overflow: hidden; }
            .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .flex-1 { flex: 1 1 0%; }
            .flex-shrink-0 { flex-shrink: 0; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .justify-between { justify-content: space-between; }
            .gap-1 { gap: 0.25rem; }
            .border-b { border-bottom-width: 1px; }
            .border-t { border-top-width: 1px; }
            .p-2 { padding: 0.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .pb-3 { padding-bottom: 0.75rem; }
            .pt-3 { padding-top: 0.75rem; }
            .ps-20 { padding-inline-start: 5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-auto { margin-top: auto; }
            .text-start { text-align: start; }
            .text-end { text-align: end; }
            .text-base { font-size: 1rem; line-height: 1.5rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .text-6xl { font-size: 3.75rem; line-height: 1; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .font-serif { font-family: 'Times New Roman', serif; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-400 { color: #9ca3af; }
            .bg-gray-50 { background-color: #f9fafb; }
            .leading-relaxed { line-height: 1.625; }
            .relative { position: relative; }
            .absolute { position: absolute; }
            .top-6 { top: 1.5rem; }
            .start-6 { inset-inline-start: 1.5rem; }
            .select-none { user-select: none; }
            .pointer-events-none { pointer-events: none; }
            .w-full { width: 100%; }
            .h-full { height: 100%; }
            .rounded-lg { border-radius: 0.5rem; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chiefComplaintDrawing && !diagnosisDrawing && !notesDrawing) {
      toast({
        title: language === 'ar' ? 'يرجى رسم الشكوى أو التشخيص أو الروشتة' : 'Please draw complaint, diagnosis, or prescription',
        variant: 'destructive',
      });
      return;
    }

    try {
      const visit = await addVisit({
        patientId: patientId!,
        date: new Date(),
        chiefComplaint: '',
        chiefComplaintDrawing: chiefComplaintDrawing || null,
        diagnosis: '',
        diagnosisDrawing: diagnosisDrawing || null,
        notes: '',
        notesDrawing: notesDrawing || null,
        pastMedicalHistoryDrawing: pastMedicalHistoryDrawing || null,
        hpiDrawing: hpiDrawing || null,
        drugHistoryDrawing: drugHistoryDrawing || null,
        familyHistoryDrawing: familyHistoryDrawing || null,
        currentMedicationDrawing: currentMedicationDrawing || null,
        requestedLabDrawing: requestedLabDrawing || null,
        vitals: {
          bloodPressure: formData.bloodPressure || '120/80',
          temperature: parseFloat(formData.temperature) || 37,
          weight: parseFloat(formData.weight) || 70,
        },
      });

      toast({
        title: language === 'ar' ? 'تم حفظ الزيارة بنجاح' : 'Visit saved successfully',
      });

      navigate(`/patients/${patientId}/visit/${visit.id}`);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  // Prescription Template Component
  const PrescriptionTemplate = ({
    onSave,
    placeholder,
    placeholderAr,
    initialData,
  }: {
    onSave: (data: string) => void;
    placeholder: string;
    placeholderAr: string;
    initialData?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col" style={{ minHeight: '700px' }}>
      {/* Header */}
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
  );

  // Collapsible Section Header
  const SectionHeader = ({
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
  );

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">{t('common.noData')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(`/patients/${patientId}`)} className="gap-2 mb-4">
          <BackIcon className="w-4 h-4" />
          {t('common.back')}
        </Button>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-foreground">{t('visits.newVisit')}</h1>
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
              {patient.records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-xl overflow-hidden border border-border bg-muted/30"
                >
                  {isImageFile(record.type) ? (
                    <img
                      src={record.dataUrl}
                      alt={record.name}
                      className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedFile({ url: record.dataUrl, type: 'image' })}
                    />
                  ) : (
                    <div
                      className="w-full h-24 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => setSelectedFile({ url: record.dataUrl, type: 'pdf' })}
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
              ))}
            </div>
          </motion.div>
        )}

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-6">
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

          {/* SECTION 3: Prescription */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'الروشتة' : 'Prescription'}
              icon={<FileText className="w-5 h-5" />}
              isOpen={activeSection === 'prescription'}
              onClick={() => toggleSection('prescription')}
              extra={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint(prescriptionRef, language === 'ar' ? 'الروشتة' : 'Prescription');
                  }}
                  className="gap-1 h-8"
                >
                  <Printer className="w-4 h-4" />
                </Button>
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
                    <PrescriptionTemplate
                      onSave={setNotesDrawing}
                      placeholder="Write prescription here..."
                      placeholderAr="اكتب الروشتة هنا..."
                      initialData={notesDrawing}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 4: Requested Lab */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'التحاليل المطلوبة' : 'Requested Lab'}
              icon={<FlaskConical className="w-5 h-5" />}
              isOpen={activeSection === 'lab'}
              onClick={() => toggleSection('lab')}
              extra={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint(labRequestRef, language === 'ar' ? 'التحاليل المطلوبة' : 'Requested Lab');
                  }}
                  className="gap-1 h-8"
                >
                  <Printer className="w-4 h-4" />
                </Button>
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
                    <PrescriptionTemplate
                      onSave={setRequestedLabDrawing}
                      placeholder="Write requested lab tests here..."
                      placeholderAr="اكتب التحاليل المطلوبة هنا..."
                      initialData={requestedLabDrawing}
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
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative rounded-xl overflow-hidden border border-border bg-muted/30 group"
                  >
                    {isImageFile(attachment.type) ? (
                      <img
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedFile({ url: attachment.dataUrl, type: 'image' })}
                      />
                    ) : (
                      <div
                        className="w-full h-24 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => setSelectedFile({ url: attachment.dataUrl, type: 'pdf' })}
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
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">{t('common.save')}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/patients/${patientId}`)} className="flex-1">{t('common.cancel')}</Button>
          </div>
        </motion.form>

        {/* File Preview Modal */}
        {selectedFile && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedFile(null)}
          >
            <button
              className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-6 h-6" />
            </button>
            {selectedFile.type === 'image' ? (
              <img
                src={selectedFile.url}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <iframe
                src={selectedFile.url}
                className="w-full max-w-4xl h-[90vh] rounded-lg bg-white"
                onClick={(e) => e.stopPropagation()}
                title="PDF Preview"
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewVisitPage;
