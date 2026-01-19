import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Calendar, ClipboardList, Stethoscope, FileText, Activity, Download, History, Pill, Users, FlaskConical, ChevronDown, Paperclip, Upload, File, Trash2, Loader2, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData, VisitAttachment } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import html2pdf from 'html2pdf.js';

type SectionName = 'medical-history' | 'medical-notes' | 'prescription' | 'lab' | 'attachments' | 'previous-visits';

const VisitDetailPage: React.FC = () => {
  const { id: patientId, visitId } = useParams<{ id: string; visitId: string }>();
  const { t, language, direction } = useLanguage();
  const { isAssistant } = useAuth();
  const { getPatient, visits, loadPatientVisits, loadVisitAttachments, uploadVisitAttachment, deleteVisitAttachment, getVisitAttachments } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patient = getPatient(patientId || '');
  const visit = visits.find((v) => v.id === visitId);
  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;
  const dateLocale = language === 'ar' ? ar : enUS;

  // Get previous visits for this patient (excluding current visit), sorted by date descending
  const previousVisits = visits
    .filter((v) => v.patientId === patientId && v.id !== visitId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Track which accordion sections are open (multiple can be open)
  const [openSections, setOpenSections] = useState<Set<SectionName>>(new Set(['medical-history']));
  const [attachments, setAttachments] = useState<VisitAttachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const toggleSection = (section: SectionName) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const isSectionOpen = (section: SectionName) => openSections.has(section);

  // Load visits from API if not already loaded
  useEffect(() => {
    if (patientId && !visit) {
      loadPatientVisits(patientId);
    }
  }, [patientId, visit, loadPatientVisits]);

  // Load attachments when visit is loaded
  useEffect(() => {
    if (visitId) {
      setIsLoadingAttachments(true);
      loadVisitAttachments(visitId)
        .then(setAttachments)
        .catch(console.error)
        .finally(() => setIsLoadingAttachments(false));
    }
  }, [visitId, loadVisitAttachments]);

  // Update local attachments when context changes
  useEffect(() => {
    if (visitId) {
      setAttachments(getVisitAttachments(visitId));
    }
  }, [visitId, getVisitAttachments]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !visitId) return;

    setIsUploading(true);
    try {
      // Process all files with proper async handling
      const uploadPromises = Array.from(files).map(file => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const dataUrl = event.target?.result as string;
              await uploadVisitAttachment(visitId, {
                name: file.name,
                type: file.type,
                dataUrl,
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      });

      await Promise.all(uploadPromises);

      // Refresh attachments after all uploads complete
      const updated = await loadVisitAttachments(visitId);
      setAttachments(updated);
    } catch (error) {
      console.error('Failed to upload attachment:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!visitId) return;
    try {
      await deleteVisitAttachment(attachmentId);
      const updated = await loadVisitAttachments(visitId);
      setAttachments(updated);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const isImageFile = (type: string) => type.startsWith('image/');

  // Open file in new tab - converts data URL to blob for better browser support
  const openFile = (dataUrl: string, type: string) => {
    try {
      // Convert base64 data URL to blob
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeType = type || dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      // Open in new tab
      const newWindow = window.open(blobUrl, '_blank');

      // Clean up blob URL after a delay
      if (newWindow) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      // Fallback: try opening data URL directly
      window.open(dataUrl, '_blank');
    }
  };

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

  const handleDownloadPrescriptionPDF = () => {
    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; background: white; width: 148mm; min-height: 210mm; display: flex; flex-direction: column;">
        <div style="border-bottom: 1px solid #d1d5db; padding: 16px; padding-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="text-align: left;">
              <p style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0;">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
            </div>
            <div style="text-align: right; direction: rtl; line-height: 1.6;">
              <p style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0;">دكتـــور</p>
              <p style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0;">شــريف علي رضــا</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">زميـــل الكلية الملكيـــة البـــريطانيـــة</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">لطب الباطنـــة والكـــلى</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">دكتوراه الأمـــراض الباطنيـــة</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">استشارى أمراض الباطنـــة العامة والكلى</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">وعضو الجمعية المصرية والأوربيـــة</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">لأمـــراض الكـــلى</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">بمستشفيات جـــامعـــة عين شمـــس</p>
            </div>
          </div>
          <div style="margin-top: 16px; padding-top: 12px; font-size: 12px; color: #374151; text-align: left; line-height: 1.6;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>الإســـم :</span>
              <span style="font-weight: 500;">${patient.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>التـــاريخ :</span>
              <span style="font-weight: 500;">${format(visit.date, 'dd/MM/yyyy')}</span>
            </div>
          </div>
        </div>
        <div style="position: relative; flex: 1; padding: 16px; padding-left: 70px;">
          <div style="position: absolute; top: 20px; left: 20px; font-size: 40px; color: #9ca3af; font-family: 'Times New Roman', serif;">℞/</div>
          <img src="${visit.notesDrawing}" style="width: 100%; margin-top: 10px;" />
        </div>
        <div style="border-top: 1px solid #d1d5db; padding: 12px; background: #f9fafb; margin-top: auto;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 10px; color: #4b5563;">
            <div style="text-align: left;">
              <p style="font-weight: 600; margin: 0;">مستشفى تبارك/النسائم</p>
              <p style="margin: 0;">16552 - 15452</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0;">١٨ عمارات خلف العبور - مصر الجديدة</p>
              <p style="margin: 0;">ت: 01554343147 - 0222602733</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `prescription-${patient.name}-${format(visit.date, 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a5' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(container).save();
  };

  const handleDownloadLabPDF = () => {
    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; background: white; width: 148mm; min-height: 210mm; display: flex; flex-direction: column;">
        <div style="border-bottom: 1px solid #d1d5db; padding: 16px; padding-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="text-align: left;">
              <p style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0;">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
            </div>
            <div style="text-align: right; direction: rtl; line-height: 1.6;">
              <p style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0;">دكتـــور</p>
              <p style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0;">شــريف علي رضــا</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">زميـــل الكلية الملكيـــة البـــريطانيـــة</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">لطب الباطنـــة والكـــلى</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">دكتوراه الأمـــراض الباطنيـــة</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">استشارى أمراض الباطنـــة العامة والكلى</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">وعضو الجمعية المصرية والأوربيـــة</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">لأمـــراض الكـــلى</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">بمستشفيات جـــامعـــة عين شمـــس</p>
            </div>
          </div>
          <div style="margin-top: 16px; padding-top: 12px; font-size: 12px; color: #374151; text-align: left; line-height: 1.6;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>الإســـم :</span>
              <span style="font-weight: 500;">${patient.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>التـــاريخ :</span>
              <span style="font-weight: 500;">${format(visit.date, 'dd/MM/yyyy')}</span>
            </div>
          </div>
        </div>
        <div style="position: relative; flex: 1; padding: 16px; padding-left: 70px;">
          <div style="position: absolute; top: 20px; left: 20px; font-size: 40px; color: #9ca3af; font-family: 'Times New Roman', serif;">℞/</div>
          <img src="${visit.requestedLabDrawing}" style="width: 100%; margin-top: 10px;" />
        </div>
        <div style="border-top: 1px solid #d1d5db; padding: 12px; background: #f9fafb; margin-top: auto;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 10px; color: #4b5563;">
            <div style="text-align: left;">
              <p style="font-weight: 600; margin: 0;">مستشفى تبارك/النسائم</p>
              <p style="margin: 0;">16552 - 15452</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0;">١٨ عمارات خلف العبور - مصر الجديدة</p>
              <p style="margin: 0;">ت: 01554343147 - 0222602733</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `lab-request-${patient.name}-${format(visit.date, 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a5' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(container).save();
  };

  if (!patient || !visit) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button onClick={() => navigate('/patients')} className="mt-4">{t('common.back')}</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="print:hidden">
          <Button variant="ghost" onClick={() => navigate(`/patients/${patientId}`)} className="gap-2 mb-4">
            <BackIcon className="w-4 h-4" />
            {t('common.back')}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{patient.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {format(visit.date, 'PPP', { locale: dateLocale })}
              </p>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className="bg-card rounded-2xl card-shadow p-6 print:shadow-none print:border print:border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary print:text-gray-600" />
            {t('visits.vitals')}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('visits.bloodPressure')}</p>
              <p className="font-semibold">{visit.vitals.bloodPressure || '-'} mmHg</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('visits.temperature')}</p>
              <p className="font-semibold">{visit.vitals.temperature || '-'}°C</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('visits.weight')}</p>
              <p className="font-semibold">{visit.vitals.weight || '-'} kg</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: Medical History (Collapsible) - Hidden for assistants */}
        {!isAssistant && (
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'التاريخ الطبي' : 'Medical History'}
              icon={<History className="w-5 h-5" />}
              isOpen={isSectionOpen('medical-history')}
              onClick={() => toggleSection('medical-history')}
            />
          <AnimatePresence initial={false}>
            {isSectionOpen('medical-history') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-2 space-y-4 border-t border-border">
                  {/* Past Medical History */}
                  {visit.pastMedicalHistoryDrawing && (
                    <div className="border rounded-xl p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        {language === 'ar' ? 'التاريخ المرضي السابق' : 'Past Medical History'}
                      </h3>
                      <div className="bg-white rounded-lg border border-gray-200 p-2">
                        <img src={visit.pastMedicalHistoryDrawing} alt="Past Medical History" className="w-full rounded" />
                      </div>
                    </div>
                  )}

                  {/* HPI */}
                  {visit.hpiDrawing && (
                    <div className="border rounded-xl p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        {language === 'ar' ? 'تاريخ المرض الحالي' : 'HPI (History of Present Illness)'}
                      </h3>
                      <div className="bg-white rounded-lg border border-gray-200 p-2">
                        <img src={visit.hpiDrawing} alt="HPI" className="w-full rounded" />
                      </div>
                    </div>
                  )}

                  {/* Drug History */}
                  {visit.drugHistoryDrawing && (
                    <div className="border rounded-xl p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        {language === 'ar' ? 'تاريخ الأدوية' : 'Drug History'}
                      </h3>
                      <div className="bg-white rounded-lg border border-gray-200 p-2">
                        <img src={visit.drugHistoryDrawing} alt="Drug History" className="w-full rounded" />
                      </div>
                    </div>
                  )}

                  {/* Family History */}
                  {visit.familyHistoryDrawing && (
                    <div className="border rounded-xl p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {language === 'ar' ? 'التاريخ العائلي' : 'Family History'}
                      </h3>
                      <div className="bg-white rounded-lg border border-gray-200 p-2">
                        <img src={visit.familyHistoryDrawing} alt="Family History" className="w-full rounded" />
                      </div>
                    </div>
                  )}

                  {/* Show message if no medical history data */}
                  {!visit.pastMedicalHistoryDrawing && !visit.hpiDrawing && !visit.drugHistoryDrawing && !visit.familyHistoryDrawing && (
                    <p className="text-muted-foreground text-center py-4">
                      {language === 'ar' ? 'لا يوجد تاريخ طبي مسجل' : 'No medical history recorded'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        )}

        {/* SECTION 2: Medical Notes (Collapsible) - Hidden for assistants */}
        {!isAssistant && (
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'ملاحظات طبية' : 'Medical Notes'}
              icon={<ClipboardList className="w-5 h-5" />}
              isOpen={isSectionOpen('medical-notes')}
              onClick={() => toggleSection('medical-notes')}
            />
          <AnimatePresence initial={false}>
            {isSectionOpen('medical-notes') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-2 space-y-4 border-t border-border">
                  {/* Chief Complaint */}
                  {visit.chiefComplaintDrawing && (
                    <div className="border rounded-xl p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        {language === 'ar' ? 'الشكوى الرئيسية' : 'Chief Complaint'}
                      </h3>
                      <div className="bg-white rounded-lg border border-gray-200 p-2">
                        <img src={visit.chiefComplaintDrawing} alt="Chief Complaint" className="w-full rounded" />
                      </div>
                    </div>
                  )}

                  {/* Diagnosis */}
                  {visit.diagnosisDrawing && (
                    <div className="border rounded-xl p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        {language === 'ar' ? 'التشخيص' : 'Diagnosis'}
                      </h3>
                      <div className="bg-white rounded-lg border border-gray-200 p-2">
                        <img src={visit.diagnosisDrawing} alt="Diagnosis" className="w-full rounded" />
                      </div>
                    </div>
                  )}

                  {/* Current Medication */}
                  {visit.currentMedicationDrawing && (
                    <div className="border rounded-xl p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        {language === 'ar' ? 'الأدوية الحالية' : 'Current Medication'}
                      </h3>
                      <div className="bg-white rounded-lg border border-gray-200 p-2">
                        <img src={visit.currentMedicationDrawing} alt="Current Medication" className="w-full rounded" />
                      </div>
                    </div>
                  )}

                  {/* Text notes fallback */}
                  {(visit.chiefComplaint || visit.diagnosis || visit.notes) && (
                    <div className="border rounded-xl p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {language === 'ar' ? 'ملاحظات نصية' : 'Text Notes'}
                      </h3>
                      {visit.chiefComplaint && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground">{t('visits.chiefComplaint')}</p>
                          <p className="text-foreground">{visit.chiefComplaint}</p>
                        </div>
                      )}
                      {visit.diagnosis && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground">{t('visits.diagnosis')}</p>
                          <p className="text-foreground">{visit.diagnosis}</p>
                        </div>
                      )}
                      {visit.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground">{t('visits.notes')}</p>
                          <p className="text-foreground">{visit.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show message if no medical notes data */}
                  {!visit.chiefComplaintDrawing && !visit.diagnosisDrawing && !visit.currentMedicationDrawing && !visit.chiefComplaint && !visit.diagnosis && !visit.notes && (
                    <p className="text-muted-foreground text-center py-4">
                      {language === 'ar' ? 'لا توجد ملاحظات طبية مسجلة' : 'No medical notes recorded'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        )}

        {/* SECTION 3: Prescription (Collapsible) */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <SectionHeader
            title={language === 'ar' ? 'الروشتة' : 'Prescription'}
            icon={<FileText className="w-5 h-5" />}
            isOpen={isSectionOpen('prescription')}
            onClick={() => toggleSection('prescription')}
            extra={
              visit.notesDrawing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPrescriptionPDF();
                  }}
                  className="gap-1 h-8"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )
            }
          />
          <AnimatePresence initial={false}>
            {isSectionOpen('prescription') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-2 border-t border-border">
                  {visit.notesDrawing ? (
                    <div>
                      <div className="flex items-center justify-end mb-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadPrescriptionPDF} className="gap-1 h-7 text-xs">
                          <Download className="w-3 h-3" />
                          PDF
                        </Button>
                      </div>
                      <div>
                        <div className="prescription-container bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col" style={{ minHeight: '600px' }}>
                          <div className="prescription-header border-b border-gray-300 p-4 pb-3 flex-shrink-0">
                            <div className="header-content flex justify-between items-start">
                              <div className="header-left text-start">
                                <p className="doctor-name text-base font-bold text-gray-800">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
                              </div>
                              <div className="header-right text-end leading-relaxed" dir="rtl">
                                <p className="doctor-name text-base font-bold text-gray-800">دكتـــور</p>
                                <p className="doctor-name text-base font-bold text-gray-800">شــريف علي رضــا</p>
                                <p className="credentials text-xs text-gray-600">زميـــل الكلية الملكيـــة البـــريطانيـــة</p>
                                <p className="credentials text-xs text-gray-600">لطب الباطنـــة والكـــلى</p>
                                <p className="credentials text-xs text-gray-600">دكتوراه الأمـــراض الباطنيـــة</p>
                                <p className="credentials text-xs text-gray-600">استشارى أمراض الباطنـــة العامة والكلى</p>
                                <p className="credentials text-xs text-gray-600">وعضو الجمعية المصرية والأوربيـــة</p>
                                <p className="credentials text-xs text-gray-600">لأمـــراض الكـــلى</p>
                                <p className="credentials text-xs text-gray-600">بمستشفيات جـــامعـــة عين شمـــس</p>
                              </div>
                            </div>
                            <div className="patient-info mt-4 pt-3 text-start text-sm text-gray-700 leading-relaxed">
                              <div className="flex items-center gap-1">
                                <span>الإســـم :</span>
                                <span className="font-medium">{patient.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>التـــاريخ :</span>
                                <span className="font-medium" dir="ltr">{format(visit.date, 'dd/MM/yyyy')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="prescription-body relative flex-1">
                            <div className="rx-symbol absolute top-6 start-6 text-gray-400 text-6xl font-serif select-none pointer-events-none" style={{ fontFamily: 'Times New Roman, serif' }}>
                              ℞/
                            </div>
                            <div className="p-4 ps-20">
                              <img src={visit.notesDrawing} alt={language === 'ar' ? 'الروشتة' : 'Prescription'} className="w-full" />
                            </div>
                          </div>
                          <div className="prescription-footer border-t border-gray-300 p-3 bg-gray-50 flex-shrink-0 mt-auto">
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
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      {language === 'ar' ? 'لا توجد روشتة مسجلة' : 'No prescription recorded'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 4: Requested Lab (Collapsible) */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <SectionHeader
            title={language === 'ar' ? 'التحاليل المطلوبة' : 'Requested Lab'}
            icon={<FlaskConical className="w-5 h-5" />}
            isOpen={isSectionOpen('lab')}
            onClick={() => toggleSection('lab')}
            extra={
              visit.requestedLabDrawing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadLabPDF();
                  }}
                  className="gap-1 h-8"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )
            }
          />
          <AnimatePresence initial={false}>
            {isSectionOpen('lab') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-2 border-t border-border">
                  {visit.requestedLabDrawing ? (
                    <div>
                      <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col" style={{ minHeight: '600px' }}>
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
                              <span className="font-medium">{patient.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>التـــاريخ :</span>
                              <span className="font-medium" dir="ltr">{format(visit.date, 'dd/MM/yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="relative flex-1">
                          <div className="absolute top-6 start-6 text-gray-400 text-6xl font-serif select-none pointer-events-none" style={{ fontFamily: 'Times New Roman, serif' }}>
                            ℞/
                          </div>
                          <div className="p-4 ps-20">
                            <img src={visit.requestedLabDrawing} alt={language === 'ar' ? 'التحاليل المطلوبة' : 'Requested Lab'} className="w-full" />
                          </div>
                        </div>
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
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      {language === 'ar' ? 'لا توجد تحاليل مطلوبة مسجلة' : 'No lab requests recorded'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 5: Attachments (Collapsible) */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <SectionHeader
            title={language === 'ar' ? 'المرفقات' : 'Attachments'}
            icon={<Paperclip className="w-5 h-5" />}
            isOpen={isSectionOpen('attachments')}
            onClick={() => toggleSection('attachments')}
            extra={
              <span className="text-sm text-muted-foreground">
                ({attachments.length})
              </span>
            }
          />
          <AnimatePresence initial={false}>
            {isSectionOpen('attachments') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-2 border-t border-border">
                  {/* Upload Button */}
                  <div className="mb-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="gap-2"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {language === 'ar' ? 'رفع مرفق' : 'Upload Attachment'}
                    </Button>
                  </div>

                  {/* Attachments List */}
                  {isLoadingAttachments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : attachments.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="group relative rounded-xl overflow-hidden border border-border bg-muted/30"
                        >
                          {isImageFile(attachment.type) ? (
                            <button
                              type="button"
                              onClick={() => openFile(attachment.dataUrl, attachment.type)}
                              className="w-full"
                            >
                              <img
                                src={attachment.dataUrl}
                                alt={attachment.name}
                                className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openFile(attachment.dataUrl, attachment.type)}
                              className="w-full h-24 flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                            >
                              <File className="w-8 h-8 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">PDF</span>
                            </button>
                          )}
                          <div className="p-2 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate flex-1">{attachment.name}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      {language === 'ar' ? 'لا توجد مرفقات' : 'No attachments'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 6: Previous Visits (Collapsible) */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <SectionHeader
            title={language === 'ar' ? 'الزيارات السابقة' : 'Previous Visits'}
            icon={<Clock className="w-5 h-5" />}
            isOpen={isSectionOpen('previous-visits')}
            onClick={() => toggleSection('previous-visits')}
            extra={
              <span className="text-sm text-muted-foreground">
                ({previousVisits.length})
              </span>
            }
          />
          <AnimatePresence initial={false}>
            {isSectionOpen('previous-visits') && (
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
                        <button
                          key={prevVisit.id}
                          type="button"
                          onClick={() => navigate(`/patients/${patientId}/visit/${prevVisit.id}`)}
                          className="w-full text-start p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-primary">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">
                                {format(prevVisit.date, 'PPP', { locale: dateLocale })}
                              </span>
                            </div>
                            <BackIcon className="w-4 h-4 text-muted-foreground rotate-180" />
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
                        </button>
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

      </div>
    </DashboardLayout>
  );
};

export default VisitDetailPage;
