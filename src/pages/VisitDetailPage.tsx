import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Calendar, ClipboardList, Stethoscope, FileText, Activity, Printer, History, Pill, Users, FlaskConical, ChevronDown, Paperclip, Upload, File, Trash2, Loader2, Clock, DollarSign, Check, X, Pencil, Download } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData, VisitAttachment } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDisplayDataUrl } from '@/lib/drawing-utils';
import { printHtml, downloadPdf, printImage } from '@/lib/download-pdf';
import { pdfToImages } from '@/lib/pdf-to-images';
import { LAB_TEST_CATEGORIES } from '@/data/labTests';
import { RADIOLOGY_TEST_CATEGORIES } from '@/data/radiologyTests';
import { FileViewerModal, ViewerFile } from '@/components/ui/file-viewer-modal';

type SectionName = 'medical-history' | 'medical-notes' | 'prescription' | 'lab' | 'lab-tests' | 'radiology-request' | 'attachments' | 'previous-visits';

const VisitDetailPage: React.FC = () => {
  const { id: patientId, visitId } = useParams<{ id: string; visitId: string }>();
  const { t, language, direction } = useLanguage();
  const { isAssistant, isDoctor, hasPermission } = useAuth();
  const { getPatient, visits, loadPatientVisits, loadVisitAttachments, uploadVisitAttachment, deleteVisitAttachment, getVisitAttachments, updateVisitPrice, updateVisit, deleteVisit } = useData();
  const canDeleteVisit = isDoctor || hasPermission('canDeleteVisits');
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

  // Slider-style file viewer state
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

  // Helper: open an attachment in the slider, finding its index inside
  // its own category (general / prescription / radiology).
  const isImage = (type: string) => type.startsWith('image/');
  const toViewerFile = (a: VisitAttachment): ViewerFile => ({
    url: a.dataUrl,
    type: isImage(a.type) ? 'image' : 'pdf',
    name: a.name.replace('[Prescription] ', '').replace('[Radiology] ', ''),
    mimeType: a.type,
  });

  const openAttachment = (attachment: VisitAttachment) => {
    const isPrescription = attachment.name.startsWith('[Prescription]');
    const isRadiology = attachment.name.startsWith('[Radiology]');
    const group = attachments.filter((a) => {
      const aIsPrescription = a.name.startsWith('[Prescription]');
      const aIsRadiology = a.name.startsWith('[Radiology]');
      if (isPrescription) return aIsPrescription;
      if (isRadiology) return aIsRadiology;
      return !aIsPrescription && !aIsRadiology;
    });
    const idx = group.findIndex((a) => a.id === attachment.id);
    openViewer(group.map(toViewerFile), Math.max(0, idx));
  };

  // Price editing state
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState<number>(0);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Visit type toggle state
  const [isSavingVisitType, setIsSavingVisitType] = useState(false);

  // Prescription page view state
  const [activePrescriptionPage, setActivePrescriptionPage] = useState<1 | 2 | 3>(1);

  // Radiology page view state
  const [activeRadiologyPage, setActiveRadiologyPage] = useState<1 | 2 | 3>(1);

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

  const handleDeleteVisit = async () => {
    if (!visitId || !patientId) return;
    const confirmMsg = language === 'ar'
      ? 'هل أنت متأكد من حذف هذه الزيارة؟ لا يمكن التراجع عن هذا الإجراء.'
      : 'Delete this visit? This cannot be undone.';
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteVisit(visitId);
      navigate(`/patients/${patientId}`);
    } catch (err) {
      window.alert(language === 'ar' ? 'فشل حذف الزيارة' : 'Failed to delete visit');
      console.error(err);
    }
  };

  const isImageFile = (type: string) => type.startsWith('image/');

  const handleEditPrice = () => {
    setEditedPrice(visit?.price || 0);
    setIsEditingPrice(true);
  };

  const handleCancelEditPrice = () => {
    setIsEditingPrice(false);
    setEditedPrice(visit?.price || 0);
  };

  const handleSavePrice = async () => {
    if (!visitId) return;
    setIsSavingPrice(true);
    try {
      await updateVisitPrice(visitId, editedPrice);
      setIsEditingPrice(false);
    } catch (error) {
      console.error('Failed to update price:', error);
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleChangeVisitType = async (newType: string) => {
    if (!visitId || !visit || newType === visit.visitType) return;
    setIsSavingVisitType(true);
    try {
      await updateVisit(visitId, { visitType: newType as 'new' | 'followup' });
    } catch (error) {
      console.error('Failed to update visit type:', error);
    } finally {
      setIsSavingVisitType(false);
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



  const getDrawingHtml = (drawingData: string, title: string) => {
    if (!patient) return '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A5; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: ltr; }
            .prescription-container { width: 148mm; min-height: 210mm; display: flex; flex-direction: column; background: white; }
            .header { border-bottom: 1px solid #d1d5db; padding: 16px; padding-bottom: 12px; }
            .header-content { display: flex; direction: ltr; justify-content: space-between; align-items: flex-start; }
            .header-left { text-align: left; direction: ltr; }
            .header-right { text-align: right; direction: rtl; line-height: 1.6; }
            .doctor-name { font-size: 14px; font-weight: bold; color: #1f2937; }
            .credentials { font-size: 10px; color: #4b5563; }
            .patient-info { margin-top: 16px; padding-top: 12px; font-size: 12px; color: #374151; direction: ltr; text-align: left; line-height: 1.6; }
            .patient-info span { font-weight: 500; }
            .body { position: relative; flex: 1; padding: 16px; padding-left: 70px; }
            .rx-symbol { position: absolute; top: 20px; left: 20px; font-size: 40px; color: #9ca3af; font-family: 'Times New Roman', serif; }
            .body img { width: 100%; margin-top: 10px; }
            .footer { border-top: 1px solid #d1d5db; padding: 12px; background: #f9fafb; margin-top: auto; }
            .footer-content { display: flex; direction: ltr; justify-content: space-between; align-items: flex-start; font-size: 10px; color: #4b5563; }
            .footer-left { text-align: left; direction: rtl; }
            .footer-right { text-align: right; direction: rtl; }
            .footer p { margin: 0; }
            .footer .hospital { font-weight: 600; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
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
                <div>Name : <span>${patient.name}</span></div>
                <div>Date : <span>${visit ? format(visit.date, 'dd/MM/yyyy') : ''}</span></div>
              </div>
            </div>
            <div class="body">
              <div class="rx-symbol">℞/</div>
              <img src="${getDisplayDataUrl(drawingData) || ''}" />
            </div>
            <div class="footer">
              <div class="footer-content">
                <div class="footer-left">
                  <p class="hospital">مستشفى تبارك/النسائم</p>
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
    if (!drawingData || !patient) return;
    printHtml(getDrawingHtml(drawingData, title));
  };

  const handleDownloadDrawing = (drawingData: string | null, title: string) => {
    if (!drawingData || !patient) return;
    const filename = `${title}-${visit ? format(visit.date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0]}`;
    downloadPdf(getDrawingHtml(drawingData, title), filename, 'a5');
  };

  const getReportHtml = async () => {
    if (!patient || !visit) return '';

    const visitDate = format(visit.date, 'dd/MM/yyyy');
    const visitDateFull = format(visit.date, 'PPP', { locale: dateLocale });

    // Collect all drawings
    const medicalHistoryDrawings = [
      { label: 'التاريخ المرضي السابق / Past Medical History', data: visit.pastMedicalHistoryDrawing },
      { label: 'تاريخ المرض الحالي / History of Present Illness', data: visit.hpiDrawing },
      { label: 'تاريخ الأدوية / Drug History', data: visit.drugHistoryDrawing },
      { label: 'التاريخ العائلي / Family History', data: visit.familyHistoryDrawing },
      { label: 'الأدوية الحالية / Current Medication', data: visit.currentMedicationDrawing },
    ].filter(d => d.data);

    const medicalNotesDrawings = [
      { label: 'الشكوى الرئيسية / Chief Complaint', data: visit.chiefComplaintDrawing },
      { label: 'التشخيص / Diagnosis', data: visit.diagnosisDrawing },
    ].filter(d => d.data);

    const prescriptionPages = [
      { label: 'الروشتة - صفحة 1 / Prescription - Page 1', data: visit.notesDrawing },
      { label: 'الروشتة - صفحة 2 / Prescription - Page 2', data: visit.notesDrawing2 },
      { label: 'الروشتة - صفحة 3 / Prescription - Page 3', data: visit.notesDrawing3 },
    ].filter(d => d.data);

    const radiologyPages = [
      { label: 'الأشعة - صفحة 1 / Radiology - Page 1', data: visit.radiologyDrawing },
      { label: 'الأشعة - صفحة 2 / Radiology - Page 2', data: visit.radiologyDrawing2 },
      { label: 'الأشعة - صفحة 3 / Radiology - Page 3', data: visit.radiologyDrawing3 },
    ].filter(d => d.data);

    // Filter attachments by type (excluding prescription and radiology specific ones for main attachments section)
    const generalAttachments = attachments.filter(a => !a.name.startsWith('[Prescription]') && !a.name.startsWith('[Radiology]'));
    const prescriptionAttachments = attachments.filter(a => a.name.startsWith('[Prescription]'));
    const radiologyAttachments = attachments.filter(a => a.name.startsWith('[Radiology]'));

    // Convert PDF attachments to images
    const pdfImageMap = new Map<string, string[]>();
    const pdfAttachments = attachments.filter(a => a.type === 'application/pdf');
    await Promise.all(
      pdfAttachments.map(async (a) => {
        try {
          const images = await pdfToImages(a.dataUrl);
          pdfImageMap.set(a.id, images);
        } catch (e) {
          console.error('Failed to convert PDF to images:', a.name, e);
        }
      })
    );

    const generateDrawingSection = (title: string, drawings: Array<{ label: string; data: string | null }>) => {
      if (drawings.length === 0) return '';
      return `
        <div class="section">
          <h2 class="section-title">${title}</h2>
          ${drawings.map(d => `
            <div class="drawing-item">
              <h3 class="drawing-label">${d.label}</h3>
              <div class="drawing-container">
                <img src="${getDisplayDataUrl(d.data) || ''}" alt="${d.label}" />
              </div>
            </div>
          `).join('')}
        </div>
      `;
    };

    const generateAttachmentsSection = (title: string, attachmentsList: typeof attachments) => {
      if (attachmentsList.length === 0) return '';

      const imageAttachments = attachmentsList.filter(a => a.type.startsWith('image/'));
      const pdfAttachmentsList = attachmentsList.filter(a => !a.type.startsWith('image/'));

      let html = '';

      // Image attachments in a grid
      if (imageAttachments.length > 0) {
        html += `
          <div class="section">
            <h2 class="section-title">${title}</h2>
            <div class="attachments-grid">
              ${imageAttachments.map(a => {
                const displayName = a.name.replace('[Prescription] ', '').replace('[Radiology] ', '');
                return `
                  <div class="attachment-item">
                    <img src="${a.dataUrl}" alt="${displayName}" />
                    <p class="attachment-name">${displayName}</p>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      // PDF attachments as full pages appended
      for (const a of pdfAttachmentsList) {
        const displayName = a.name.replace('[Prescription] ', '').replace('[Radiology] ', '');
        const pdfPages = pdfImageMap.get(a.id);
        if (pdfPages && pdfPages.length > 0) {
          html += pdfPages.map((pageImg, idx) => `
            <div class="pdf-full-page">
              <p class="pdf-page-label">${displayName}${pdfPages.length > 1 ? ` — صفحة / Page ${idx + 1}/${pdfPages.length}` : ''}</p>
              <img src="${pageImg}" alt="${displayName} - page ${idx + 1}" />
            </div>
          `).join('');
        }
      }

      return html;
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>تقرير الزيارة / Visit Report - ${patient.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 15mm; }
            body {
              font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
              background: white;
              color: #1f2937;
              line-height: 1.6;
              direction: ltr;
            }
            .report-container { max-width: 100%; direction: rtl; text-align: right; }

            /* Header */
            .report-header {
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header-top {
              display: flex;
              direction: ltr;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
            }
            .clinic-info-left { text-align: left; direction: ltr; }
            .clinic-info-right { text-align: right; direction: rtl; }
            .doctor-name { font-size: 16px; font-weight: bold; color: #1f2937; }
            .credentials { font-size: 11px; color: #4b5563; }

            .patient-header {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
              direction: rtl;
              text-align: right;
            }
            .patient-name { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 5px; }
            .visit-date { font-size: 14px; color: #6b7280; }

            /* Vitals */
            .vitals-section {
              background: #eff6ff;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 25px;
              direction: rtl;
              text-align: right;
            }
            .vitals-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #1e40af; }
            .vitals-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
            }
            .vital-item label { font-size: 12px; color: #6b7280; display: block; }
            .vital-item span { font-size: 14px; font-weight: 600; color: #1f2937; }

            /* Sections */
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
              border-bottom: 1px solid #d1d5db;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }

            /* Drawings */
            .drawing-item {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .drawing-label {
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 10px;
            }
            .drawing-container {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 10px;
              background: white;
            }
            .drawing-container img {
              max-width: 100%;
              height: auto;
            }

            /* Prescription/Radiology with header */
            .prescription-item {
              border: 1px solid #d1d5db;
              border-radius: 8px;
              overflow: hidden;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .prescription-header {
              background: white;
              padding: 12px;
              border-bottom: 1px solid #d1d5db;
            }
            .prescription-header-content {
              display: flex;
              direction: ltr;
              justify-content: space-between;
              align-items: flex-start;
            }
            .prescription-body {
              padding: 15px;
              position: relative;
              min-height: 200px;
            }
            .rx-symbol {
              position: absolute;
              top: 15px;
              left: 15px;
              font-size: 36px;
              color: #9ca3af;
              font-family: 'Times New Roman', serif;
            }
            .prescription-body img {
              max-width: 100%;
              margin-left: 50px;
            }
            .prescription-footer {
              background: #f9fafb;
              padding: 10px;
              border-top: 1px solid #d1d5db;
              font-size: 10px;
              color: #6b7280;
              display: flex;
              direction: ltr;
              justify-content: space-between;
            }

            /* Attachments */
            .attachments-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .pdf-full-page {
              page-break-before: always;
              text-align: center;
              padding: 0;
            }
            .pdf-full-page img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
            .pdf-full-page .pdf-page-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .attachment-item {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            .attachment-item img {
              width: 100%;
              height: 120px;
              object-fit: cover;
            }
            .attachment-name {
              padding: 8px;
              font-size: 11px;
              color: #6b7280;
              text-align: center;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .pdf-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 150px;
              background: #f3f4f6;
            }
            .pdf-icon {
              font-size: 24px;
              font-weight: bold;
              color: #dc2626;
              margin-bottom: 10px;
            }

            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .section { page-break-inside: avoid; }
              .prescription-item { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <!-- Header -->
            <div class="report-header">
              <div class="header-top">
                <div class="clinic-info-left">
                  <p class="doctor-name">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
                </div>
                <div class="clinic-info-right">
                  <p class="doctor-name">دكتـــور شــريف علي رضــا</p>
                  <p class="credentials">زميـــل الكلية الملكيـــة البـــريطانيـــة لطب الباطنـــة والكـــلى</p>
                  <p class="credentials">استشارى أمراض الباطنـــة العامة والكلى</p>
                </div>
              </div>
              <div class="patient-header">
                <p class="patient-name">${patient.name}</p>
                <p class="visit-date">تاريخ الزيارة / Visit Date: ${visitDateFull}</p>
              </div>
            </div>

            <!-- Vitals -->
            <div class="vitals-section">
              <h2 class="vitals-title">العلامات الحيوية / Vitals</h2>
              <div class="vitals-grid" style="grid-template-columns: repeat(3, 1fr);">
                <div class="vital-item">
                  <label>ضغط الدم / Blood Pressure</label>
                  <span>${visit.vitals.bloodPressure || '-'} mmHg</span>
                </div>
                <div class="vital-item">
                  <label>الحرارة / Temperature</label>
                  <span>${visit.vitals.temperature || '-'}°C</span>
                </div>
                <div class="vital-item">
                  <label>الوزن / Weight</label>
                  <span>${visit.vitals.weight || '-'} kg</span>
                </div>
              </div>
            </div>

            ${medicalHistoryDrawings.length > 0 ? generateDrawingSection('التاريخ الطبي / Medical History', medicalHistoryDrawings) : ''}

            ${medicalNotesDrawings.length > 0 ? generateDrawingSection('الملاحظات الطبية / Medical Notes', medicalNotesDrawings) : ''}

            ${prescriptionPages.length > 0 ? `
              <div class="section">
                <h2 class="section-title">الروشتة / Prescription</h2>
                ${prescriptionPages.map(p => `
                  <div class="prescription-item">
                    <div class="prescription-header">
                      <div class="prescription-header-content">
                        <div style="text-align: left;">
                          <p style="font-weight: bold; font-size: 12px;">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
                        </div>
                        <div style="text-align: right; direction: rtl; font-size: 11px;">
                          <p style="font-weight: bold;">دكتـــور شــريف علي رضــا</p>
                          <p style="font-size: 9px; color: #6b7280;">استشارى أمراض الباطنـــة العامة والكلى</p>
                        </div>
                      </div>
                      <div style="margin-top: 10px; font-size: 11px;">
                        <span>الإســـم / Name: ${patient.name}</span> |
                        <span>التـــاريخ / Date: ${visitDate}</span>
                      </div>
                    </div>
                    <div class="prescription-body">
                      <div class="rx-symbol">℞/</div>
                      <img src="${getDisplayDataUrl(p.data) || ''}" alt="${p.label}" />
                    </div>
                    <div class="prescription-footer">
                      <div>مستشفى تبارك/النسائم | 16552 - 15452</div>
                      <div>١٨ عمارات خلف العبور - مصر الجديدة | ت: 01554343147</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${prescriptionAttachments.length > 0 ? generateAttachmentsSection('مرفقات الروشتة / Prescription Attachments', prescriptionAttachments) : ''}

            ${radiologyPages.length > 0 ? `
              <div class="section">
                <h2 class="section-title">الأشعة / Radiology</h2>
                ${radiologyPages.map(p => `
                  <div class="prescription-item">
                    <div class="prescription-header">
                      <div class="prescription-header-content">
                        <div style="text-align: left;">
                          <p style="font-weight: bold; font-size: 12px;">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
                        </div>
                        <div style="text-align: right; direction: rtl; font-size: 11px;">
                          <p style="font-weight: bold;">دكتـــور شــريف علي رضــا</p>
                          <p style="font-size: 9px; color: #6b7280;">استشارى أمراض الباطنـــة العامة والكلى</p>
                        </div>
                      </div>
                      <div style="margin-top: 10px; font-size: 11px;">
                        <span>الإســـم / Name: ${patient.name}</span> |
                        <span>التـــاريخ / Date: ${visitDate}</span>
                      </div>
                    </div>
                    <div class="prescription-body">
                      <div class="rx-symbol">℞/</div>
                      <img src="${getDisplayDataUrl(p.data) || ''}" alt="${p.label}" />
                    </div>
                    <div class="prescription-footer">
                      <div>مستشفى تبارك/النسائم | 16552 - 15452</div>
                      <div>١٨ عمارات خلف العبور - مصر الجديدة | ت: 01554343147</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${radiologyAttachments.length > 0 ? generateAttachmentsSection('مرفقات الأشعة / Radiology Attachments', radiologyAttachments) : ''}

            ${generalAttachments.length > 0 ? generateAttachmentsSection('المرفقات / Attachments', generalAttachments) : ''}
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintReport = async () => {
    const html = await getReportHtml();
    if (!html) return;
    printHtml(html);
  };

  const handleDownloadReport = async () => {
    const html = await getReportHtml();
    if (!html) return;
    const filename = `visit-report-${visit ? format(visit.date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0]}`;
    downloadPdf(html, filename, 'a4');
  };

  const getLabRequestHtml = () => {
    if (!patient || !visit || !visit.labTestRequest) return '';

    const visitDate = format(visit.date, 'dd/MM/yyyy');

    // Parse the lab test request JSON
    let labData: { tests: Record<string, boolean>; notes: string } = { tests: {}, notes: '' };
    try {
      labData = JSON.parse(visit.labTestRequest);
    } catch (e) {
      console.error('Failed to parse lab test request:', e);
      return;
    }

    // Filter categories that have at least one selected test
    const categoriesWithSelectedTests = LAB_TEST_CATEGORIES.filter(category => {
      if (category.id === 'others') return labData.notes;
      return category.tests.some(test => labData.tests[test.id]);
    });

    // Generate HTML for categories with selected tests only
    const generateCategoryHtml = (category: typeof LAB_TEST_CATEGORIES[0]) => {
      if (category.id === 'others') {
        return `
          <div class="category">
            <div class="category-header">${category.name} <span class="ar">${category.nameAr}</span></div>
            <div class="others-box">${labData.notes || ''}</div>
          </div>
        `;
      }
      const selectedTests = category.tests.filter(test => labData.tests[test.id]);
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
              <div>Name / الاسم: <span>${patient.name}</span></div>
              <div>Date / التاريخ: <span>${visitDate}</span></div>
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
    printHtml(html);
  };

  const handleDownloadLabRequest = () => {
    const html = getLabRequestHtml();
    if (!html) return;
    const filename = `lab-request-${visit ? format(visit.date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0]}`;
    downloadPdf(html, filename, 'a4');
  };

  const getRadiologyRequestHtml = () => {
    if (!patient || !visit || !visit.radiologyRequest) return '';

    const visitDate = format(visit.date, 'dd/MM/yyyy');

    let radData: { tests: Record<string, boolean>; notes: string } = { tests: {}, notes: '' };
    try {
      radData = JSON.parse(visit.radiologyRequest);
    } catch (e) {
      console.error('Failed to parse radiology request:', e);
      return '';
    }

    const categoriesWithSelectedTests = RADIOLOGY_TEST_CATEGORIES.filter(category => {
      if (category.id === 'others') return radData.notes;
      return category.tests.some(test => radData.tests[test.id]);
    });

    const generateCategoryHtml = (category: typeof RADIOLOGY_TEST_CATEGORIES[0]) => {
      if (category.id === 'others') {
        return `
          <div class="category">
            <div class="category-header">${category.name} <span class="ar">${category.nameAr}</span></div>
            <div class="others-box">${radData.notes || ''}</div>
          </div>
        `;
      }
      const selectedTests = category.tests.filter(test => radData.tests[test.id]);
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
              <div>Name / الاسم: <span>${patient.name}</span></div>
              <div>Date / التاريخ: <span>${visitDate}</span></div>
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
    printHtml(html);
  };

  const handleDownloadRadiologyRequest = () => {
    const html = getRadiologyRequestHtml();
    if (!html) return;
    const filename = `radiology-request-${visit ? format(visit.date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0]}`;
    downloadPdf(html, filename, 'a4');
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/patients/${patientId}/visit/${visitId}/edit`)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </Button>
              <Button onClick={handlePrintReport} className="gap-2">
                <Printer className="w-4 h-4" />
                {language === 'ar' ? 'طباعة التقرير' : 'Print Report'}
              </Button>
              <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                {language === 'ar' ? 'تحميل التقرير' : 'Download Report'}
              </Button>
              {canDeleteVisit && (
                <Button
                  onClick={handleDeleteVisit}
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  <Trash2 className="w-4 h-4" />
                  {language === 'ar' ? 'حذف الزيارة' : 'Delete Visit'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Vitals & Price */}
        <div className="bg-card rounded-2xl card-shadow p-6 print:shadow-none print:border print:border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary print:text-gray-600" />
            {t('visits.vitals')}
          </h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr 2fr 2fr' }}>
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
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ClipboardList className="w-3 h-3" />
                {language === 'ar' ? 'نوع الزيارة' : 'Visit Type'}
              </p>
              <Select
                value={visit.visitType}
                onValueChange={handleChangeVisitType}
                disabled={isSavingVisitType}
              >
                <SelectTrigger className="h-8 w-fit text-sm font-semibold gap-1">
                  {isSavingVisitType ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    {language === 'ar' ? 'كشف جديد' : 'New Visit'}
                  </SelectItem>
                  <SelectItem value="followup">
                    {language === 'ar' ? 'متابعة' : 'Follow-up'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {language === 'ar' ? 'السعر' : 'Price'}
              </p>
              {isEditingPrice ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    step="1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSavePrice}
                    disabled={isSavingPrice}
                    className="h-7 w-7 p-0"
                  >
                    {isSavingPrice ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEditPrice}
                    disabled={isSavingPrice}
                    className="h-7 w-7 p-0"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{visit.price || 0} {language === 'ar' ? 'ج.م' : 'EGP'}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditPrice}
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>
              )}
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
                        <img src={getDisplayDataUrl(visit.pastMedicalHistoryDrawing) || ''} alt="Past Medical History" className="w-full rounded" />
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
                        <img src={getDisplayDataUrl(visit.hpiDrawing) || ''} alt="HPI" className="w-full rounded" />
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
                        <img src={getDisplayDataUrl(visit.drugHistoryDrawing) || ''} alt="Drug History" className="w-full rounded" />
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
                        <img src={getDisplayDataUrl(visit.familyHistoryDrawing) || ''} alt="Family History" className="w-full rounded" />
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
                        <img src={getDisplayDataUrl(visit.chiefComplaintDrawing) || ''} alt="Chief Complaint" className="w-full rounded" />
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
                        <img src={getDisplayDataUrl(visit.diagnosisDrawing) || ''} alt="Diagnosis" className="w-full rounded" />
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
                        <img src={getDisplayDataUrl(visit.currentMedicationDrawing) || ''} alt="Current Medication" className="w-full rounded" />
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

        {/* SECTION 3: Prescription (Collapsible) - 3 Pages */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <SectionHeader
            title={language === 'ar' ? 'الروشتة' : 'Prescription'}
            icon={<FileText className="w-5 h-5" />}
            isOpen={isSectionOpen('prescription')}
            onClick={() => toggleSection('prescription')}
            extra={
              (visit.notesDrawing || visit.notesDrawing2 || visit.notesDrawing3) && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentDrawing = activePrescriptionPage === 1 ? visit.notesDrawing : activePrescriptionPage === 2 ? visit.notesDrawing2 : visit.notesDrawing3;
                      handlePrint(currentDrawing, language === 'ar' ? `الروشتة - صفحة ${activePrescriptionPage}` : `Prescription - Page ${activePrescriptionPage}`);
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
                      const currentDrawing = activePrescriptionPage === 1 ? visit.notesDrawing : activePrescriptionPage === 2 ? visit.notesDrawing2 : visit.notesDrawing3;
                      handleDownloadDrawing(currentDrawing, language === 'ar' ? `الروشتة-صفحة-${activePrescriptionPage}` : `prescription-page-${activePrescriptionPage}`);
                    }}
                    className="gap-1 h-8"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
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
                  {(() => {
                    const hasPrescriptionDrawings = visit.notesDrawing || visit.notesDrawing2 || visit.notesDrawing3;
                    const prescriptionAttachmentsList = attachments.filter(a => a.name.startsWith('[Prescription]'));
                    const hasPrescriptionAttachments = prescriptionAttachmentsList.length > 0;

                    if (!hasPrescriptionDrawings && !hasPrescriptionAttachments) {
                      return (
                        <p className="text-muted-foreground text-center py-4">
                          {language === 'ar' ? 'لا توجد روشتة مسجلة' : 'No prescription recorded'}
                        </p>
                      );
                    }

                    return (
                      <div>
                        {hasPrescriptionDrawings && (
                          <>
                            {/* Page Tabs - Always in English */}
                            <div className="flex items-center gap-2 mb-4" dir="ltr">
                              {[1, 2, 3].map((page) => {
                                const hasContent = page === 1 ? visit.notesDrawing : page === 2 ? visit.notesDrawing2 : visit.notesDrawing3;
                                return (
                                  <button
                                    key={page}
                                    type="button"
                                    onClick={() => setActivePrescriptionPage(page as 1 | 2 | 3)}
                                    className={cn(
                                      'px-4 py-2 rounded-lg font-medium transition-colors',
                                      activePrescriptionPage === page
                                        ? 'bg-primary text-primary-foreground'
                                        : hasContent
                                          ? 'bg-muted hover:bg-muted/80 text-foreground'
                                          : 'bg-muted/50 text-muted-foreground'
                                    )}
                                  >
                                    Page {page}
                                    {hasContent && <span className="ms-1 text-xs">•</span>}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Page Content */}
                            {(() => {
                              const currentDrawing = activePrescriptionPage === 1 ? visit.notesDrawing : activePrescriptionPage === 2 ? visit.notesDrawing2 : visit.notesDrawing3;
                              if (!currentDrawing) {
                                return (
                                  <p className="text-muted-foreground text-center py-8">
                                    {language === 'ar' ? 'هذه الصفحة فارغة' : 'This page is empty'}
                                  </p>
                                );
                              }
                              return (
                                <div className="prescription-container bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col" dir="ltr" style={{ minHeight: '600px' }}>
                                  <div className="prescription-header border-b border-gray-300 p-4 pb-3 flex-shrink-0">
                                    <div className="header-content flex justify-between items-start">
                                      <div className="header-left text-left">
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
                                      <img src={getDisplayDataUrl(currentDrawing) || ''} alt={language === 'ar' ? `الروشتة - صفحة ${activePrescriptionPage}` : `Prescription - Page ${activePrescriptionPage}`} className="w-full" />
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
                              );
                            })()}
                          </>
                        )}

                        {/* Prescription Attachments */}
                        {hasPrescriptionAttachments && (
                          <div className={hasPrescriptionDrawings ? "mt-6 pt-4 border-t border-border" : ""}>
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                              <Paperclip className="w-4 h-4" />
                              {language === 'ar' ? 'مرفقات الروشتة' : 'Prescription Attachments'}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {prescriptionAttachmentsList.map((attachment) => {
                                const displayName = attachment.name.replace('[Prescription] ', '');
                                return (
                                  <div
                                    key={attachment.id}
                                    className="relative rounded-lg overflow-hidden border border-border bg-muted/30 group"
                                  >
                                    {isImageFile(attachment.type) ? (
                                      <img
                                        src={attachment.dataUrl}
                                        alt={displayName}
                                        className="w-full h-20 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => openAttachment(attachment)}
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        className="w-full h-20 flex flex-col items-center justify-center bg-muted/50 hover:bg-muted/70 transition-colors"
                                        onClick={() => openAttachment(attachment)}
                                      >
                                        <File className="w-6 h-6 text-muted-foreground mb-1" />
                                        <span className="text-xs text-muted-foreground">PDF</span>
                                      </button>
                                    )}
                                    {isImageFile(attachment.type) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          printImage({
                                            dataUrl: attachment.dataUrl,
                                            title: displayName,
                                            patientName: patient?.name,
                                            date: visit ? format(visit.date, 'dd/MM/yyyy') : '',
                                            language,
                                          });
                                        }}
                                        className="absolute top-1 end-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        title={language === 'ar' ? 'طباعة' : 'Print'}
                                      >
                                        <Printer className="w-3 h-3" />
                                      </button>
                                    )}
                                    <div className="p-1.5">
                                      <p className="text-xs text-muted-foreground truncate">{displayName}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 4: Radiology (Collapsible) - 3 Pages */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <SectionHeader
            title={language === 'ar' ? 'الأشعة' : 'Radiology'}
            icon={<FlaskConical className="w-5 h-5" />}
            isOpen={isSectionOpen('lab')}
            onClick={() => toggleSection('lab')}
            extra={
              (visit.radiologyDrawing || visit.radiologyDrawing2 || visit.radiologyDrawing3) && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentDrawing = activeRadiologyPage === 1 ? visit.radiologyDrawing : activeRadiologyPage === 2 ? visit.radiologyDrawing2 : visit.radiologyDrawing3;
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
                      const currentDrawing = activeRadiologyPage === 1 ? visit.radiologyDrawing : activeRadiologyPage === 2 ? visit.radiologyDrawing2 : visit.radiologyDrawing3;
                      handleDownloadDrawing(currentDrawing, language === 'ar' ? `الأشعة-صفحة-${activeRadiologyPage}` : `radiology-page-${activeRadiologyPage}`);
                    }}
                    className="gap-1 h-8"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
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
                  {(() => {
                    const hasRadiologyDrawings = visit.radiologyDrawing || visit.radiologyDrawing2 || visit.radiologyDrawing3;
                    const radiologyAttachmentsList = attachments.filter(a => a.name.startsWith('[Radiology]'));
                    const hasRadiologyAttachments = radiologyAttachmentsList.length > 0;

                    if (!hasRadiologyDrawings && !hasRadiologyAttachments) {
                      return (
                        <p className="text-muted-foreground text-center py-4">
                          {language === 'ar' ? 'لا توجد طلبات أشعة مسجلة' : 'No radiology requests recorded'}
                        </p>
                      );
                    }

                    return (
                      <div>
                        {hasRadiologyDrawings && (
                          <>
                            {/* Page Tabs - Always in English */}
                            <div className="flex items-center gap-2 mb-4" dir="ltr">
                              {[1, 2, 3].map((page) => {
                                const hasContent = page === 1 ? visit.radiologyDrawing : page === 2 ? visit.radiologyDrawing2 : visit.radiologyDrawing3;
                                return (
                                  <button
                                    key={page}
                                    type="button"
                                    onClick={() => setActiveRadiologyPage(page as 1 | 2 | 3)}
                                    className={cn(
                                      'px-4 py-2 rounded-lg font-medium transition-colors',
                                      activeRadiologyPage === page
                                        ? 'bg-primary text-primary-foreground'
                                        : hasContent
                                          ? 'bg-muted hover:bg-muted/80 text-foreground'
                                          : 'bg-muted/50 text-muted-foreground'
                                    )}
                                  >
                                    Page {page}
                                    {hasContent && <span className="ms-1 text-xs">•</span>}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Page Content */}
                            {(() => {
                              const currentDrawing = activeRadiologyPage === 1 ? visit.radiologyDrawing : activeRadiologyPage === 2 ? visit.radiologyDrawing2 : visit.radiologyDrawing3;
                              if (!currentDrawing) {
                                return (
                                  <p className="text-muted-foreground text-center py-8">
                                    {language === 'ar' ? 'هذه الصفحة فارغة' : 'This page is empty'}
                                  </p>
                                );
                              }
                              return (
                                <div className="radiology-container bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col" dir="ltr" style={{ minHeight: '600px' }}>
                                  <div className="radiology-header border-b border-gray-300 p-4 pb-3 flex-shrink-0">
                                    <div className="header-content flex justify-between items-start">
                                      <div className="header-left text-left">
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
                                  <div className="radiology-body relative flex-1">
                                    <div className="rx-symbol absolute top-6 start-6 text-gray-400 text-6xl font-serif select-none pointer-events-none" style={{ fontFamily: 'Times New Roman, serif' }}>
                                      ℞/
                                    </div>
                                    <div className="p-4 ps-20">
                                      <img src={getDisplayDataUrl(currentDrawing) || ''} alt={language === 'ar' ? `الأشعة - صفحة ${activeRadiologyPage}` : `Radiology - Page ${activeRadiologyPage}`} className="w-full" />
                                    </div>
                                  </div>
                                  <div className="radiology-footer border-t border-gray-300 p-3 bg-gray-50 flex-shrink-0 mt-auto">
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
                            })()}
                          </>
                        )}

                        {/* Radiology Attachments */}
                        {hasRadiologyAttachments && (
                          <div className={hasRadiologyDrawings ? "mt-6 pt-4 border-t border-border" : ""}>
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                              <Paperclip className="w-4 h-4" />
                              {language === 'ar' ? 'مرفقات الأشعة' : 'Radiology Attachments'}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {radiologyAttachmentsList.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="relative rounded-lg overflow-hidden border border-border bg-muted/30 group cursor-pointer"
                                  onClick={() => openAttachment(attachment)}
                                >
                                  {isImageFile(attachment.type) ? (
                                    <img
                                      src={attachment.dataUrl}
                                      alt={attachment.name.replace('[Radiology] ', '')}
                                      className="w-full h-20 object-cover hover:opacity-90 transition-opacity"
                                    />
                                  ) : (
                                    <div className="w-full h-20 flex flex-col items-center justify-center bg-muted/50 hover:bg-muted/70 transition-colors">
                                      <File className="w-6 h-6 text-muted-foreground mb-1" />
                                      <span className="text-xs text-muted-foreground">PDF</span>
                                    </div>
                                  )}
                                  <div className="p-1.5">
                                    <p className="text-xs text-muted-foreground truncate">{attachment.name.replace('[Radiology] ', '')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 5: Lab Test Request (Collapsible) */}
        {visit.labTestRequest && (
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'طلب تحاليل معملية' : 'Lab Test Request'}
              icon={<FlaskConical className="w-5 h-5" />}
              isOpen={isSectionOpen('lab-tests')}
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
              {isSectionOpen('lab-tests') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 border-t border-border">
                    {(() => {
                      let labData: { tests: Record<string, boolean>; notes: string } = { tests: {}, notes: '' };
                      try {
                        labData = JSON.parse(visit.labTestRequest || '{}');
                      } catch (e) {
                        return (
                          <p className="text-muted-foreground text-center py-4">
                            {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data'}
                          </p>
                        );
                      }

                      const selectedTests = Object.entries(labData.tests || {})
                        .filter(([, selected]) => selected)
                        .map(([testId]) => testId);

                      if (selectedTests.length === 0 && !labData.notes) {
                        return (
                          <p className="text-muted-foreground text-center py-4">
                            {language === 'ar' ? 'لا توجد تحاليل مطلوبة' : 'No lab tests requested'}
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {/* Display selected tests grouped by category */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {LAB_TEST_CATEGORIES.filter(category =>
                              category.tests.some(test => labData.tests[test.id])
                            ).map(category => (
                              <div key={category.id} className="border rounded-lg p-3">
                                <h4 className="text-sm font-semibold text-blue-700 mb-2 border-b border-blue-200 pb-1">
                                  {category.name}
                                  <span className="text-gray-500 text-xs mr-2 float-left">{category.nameAr}</span>
                                </h4>
                                <div className="space-y-1">
                                  {category.tests
                                    .filter(test => labData.tests[test.id])
                                    .map(test => (
                                      <div key={test.id} className="flex items-center gap-2 text-sm">
                                        <span className="text-green-600">✓</span>
                                        <span>{test.name}</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Display other notes if any */}
                          {labData.notes && (
                            <div className="border rounded-lg p-3">
                              <h4 className="text-sm font-semibold text-blue-700 mb-2 border-b border-blue-200 pb-1">
                                {language === 'ar' ? 'أخرى' : 'Others'}
                              </h4>
                              <p className="text-sm text-gray-700">{labData.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* SECTION 6: Radiology Request (Collapsible) */}
        {visit.radiologyRequest && (
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <SectionHeader
              title={language === 'ar' ? 'طلب أشعة' : 'Radiology Request'}
              icon={<Activity className="w-5 h-5" />}
              isOpen={isSectionOpen('radiology-request')}
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
              {isSectionOpen('radiology-request') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-2 border-t border-border">
                    {(() => {
                      let radData: { tests: Record<string, boolean>; notes: string } = { tests: {}, notes: '' };
                      try {
                        radData = JSON.parse(visit.radiologyRequest || '{}');
                      } catch (e) {
                        return (
                          <p className="text-muted-foreground text-center py-4">
                            {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data'}
                          </p>
                        );
                      }

                      const selectedTests = Object.entries(radData.tests || {})
                        .filter(([, selected]) => selected)
                        .map(([testId]) => testId);

                      if (selectedTests.length === 0 && !radData.notes) {
                        return (
                          <p className="text-muted-foreground text-center py-4">
                            {language === 'ar' ? 'لا توجد أشعة مطلوبة' : 'No radiology tests requested'}
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {RADIOLOGY_TEST_CATEGORIES.filter(category =>
                              category.tests.some(test => radData.tests[test.id])
                            ).map(category => (
                              <div key={category.id} className="border rounded-lg p-3">
                                <h4 className="text-sm font-semibold text-purple-700 mb-2 border-b border-purple-200 pb-1">
                                  {category.name}
                                  <span className="text-gray-500 text-xs mr-2 float-left">{category.nameAr}</span>
                                </h4>
                                <div className="space-y-1">
                                  {category.tests
                                    .filter(test => radData.tests[test.id])
                                    .map(test => (
                                      <div key={test.id} className="flex items-center gap-2 text-sm">
                                        <span className="text-green-600">✓</span>
                                        <span>{test.name}</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {radData.notes && (
                            <div className="border rounded-lg p-3">
                              <h4 className="text-sm font-semibold text-purple-700 mb-2 border-b border-purple-200 pb-1">
                                {language === 'ar' ? 'أخرى' : 'Others'}
                              </h4>
                              <p className="text-sm text-gray-700">{radData.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* SECTION 7: Attachments (Collapsible) */}
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
                  {/* Upload + Scan Buttons */}
                  <div className="mb-4 flex flex-wrap gap-2">
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
                      disabled={isUploading || isScanning}
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
                              onClick={() => openAttachment(attachment)}
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
                              onClick={() => openAttachment(attachment)}
                              className="w-full h-24 flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                            >
                              <File className="w-8 h-8 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">PDF</span>
                            </button>
                          )}
                          <div className="p-2 flex items-center justify-between gap-1">
                            <p className="text-xs text-muted-foreground truncate flex-1">{attachment.name}</p>
                            {isImageFile(attachment.type) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() =>
                                  printImage({
                                    dataUrl: attachment.dataUrl,
                                    title: attachment.name,
                                    patientName: patient?.name,
                                    date: visit ? format(visit.date, 'dd/MM/yyyy') : '',
                                    language,
                                  })
                                }
                                title={language === 'ar' ? 'طباعة' : 'Print'}
                              >
                                <Printer className="w-3 h-3 text-primary" />
                              </Button>
                            )}
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

        {/* SECTION 7: Previous Visits (Collapsible) */}
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

      {viewerOpen && (
        <FileViewerModal
          files={viewerFiles}
          initialIndex={viewerIndex}
          onClose={closeViewer}
        />
      )}
    </DashboardLayout>
  );
};

export default VisitDetailPage;
