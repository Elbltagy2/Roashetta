import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  User,
  Phone,
  Calendar,
  CreditCard,
  AlertTriangle,
  FileText,
  Plus,
  ArrowRight,
  ArrowLeft,
  Activity,
  Thermometer,
  Scale,
  Stethoscope,
  Upload,
  Trash2,
  Image,
  File,
  Printer,
  Pencil,
  Trash,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData, Patient } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { printImage } from '@/lib/download-pdf';
import { FileViewerModal, ViewerFile } from '@/components/ui/file-viewer-modal';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language, direction } = useLanguage();
  const { toast } = useToast();
  const { isAssistant, isDoctor, hasPermission } = useAuth();
  const {
    getPatientVisits,
    loadPatientVisits,
    loadPatientRecords,
    addPatientRecord,
    deletePatientRecord,
    loadPreviousInvestigations,
    addPreviousInvestigation,
    deletePreviousInvestigation,
    getPreviousInvestigations,
    deletePatient,
    deleteVisit,
  } = useData();
  const canEditPatient = isDoctor || hasPermission('canEditPatients');
  const canDeletePatient = isDoctor || hasPermission('canDeletePatients');
  const canDeleteVisit = isDoctor || hasPermission('canDeleteVisits');
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const investigationFileInputRef = React.useRef<HTMLInputElement>(null);

  // Shared file-viewer state: which list and which index inside it.
  const [viewerFiles, setViewerFiles] = useState<ViewerFile[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerOpen = viewerFiles.length > 0;

  const [patient, setLocalPatient] = useState<Patient | null>(null);
  const visits = getPatientVisits(id || '');
  const previousInvestigations = getPreviousInvestigations(id || '');

  const openViewer = (files: ViewerFile[], index: number) => {
    setViewerFiles(files);
    setViewerIndex(index);
  };

  const handleCloseFile = () => {
    setViewerFiles([]);
    setViewerIndex(0);
  };

  // Build the list of viewable files for each section.
  const recordViewerFiles: ViewerFile[] = (patient?.records || []).map((r) => ({
    url: r.dataUrl,
    type: r.type.startsWith('image/') ? 'image' : 'pdf',
    name: r.name,
    mimeType: r.type,
  }));

  const investigationViewerFiles: ViewerFile[] = (previousInvestigations || []).map((i) => ({
    url: i.dataUrl,
    type: i.type.startsWith('image/') ? 'image' : 'pdf',
    name: i.name,
    mimeType: i.type,
  }));

  // Fetch patient from API when ID changes
  useEffect(() => {
    if (!id) return;
    setLocalPatient(null);
    api.getPatient(id).then(p => {
      setLocalPatient({
        id: p.id,
        fileNumber: p.fileNumber || '',
        name: p.name,
        phone: p.phone,
        age: p.age,
        gender: p.gender,
        medicalHistory: p.medicalHistory || '',
        allergies: p.allergies || [],
        records: [],
        createdAt: new Date(p.createdAt),
      });
    }).catch(() => setLocalPatient(null));
  }, [id]);

  // Load visits, records, and investigations from API when patient ID changes
  useEffect(() => {
    if (id) {
      loadPatientVisits(id);
      loadPatientRecords(id).then(records => {
        setLocalPatient(prev => prev ? { ...prev, records } : null);
      });
      loadPreviousInvestigations(id);
    }
  }, [id, loadPatientVisits, loadPatientRecords, loadPreviousInvestigations]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !patient) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string;
          const newRecord = await addPatientRecord(patient.id, {
            name: file.name,
            type: file.type,
            dataUrl,
          });
          setLocalPatient(prev => prev ? { ...prev, records: [...prev.records, newRecord] } : null);
        } catch (error) {
          console.error('Failed to upload record:', error);
          toast({
            title: language === 'ar' ? 'فشل رفع الملف' : 'Upload failed',
            description: language === 'ar' ? `تعذر حفظ "${file.name}"` : `Could not save "${file.name}"`,
            variant: 'destructive',
          });
        }
      };
      reader.onerror = () => {
        toast({
          title: language === 'ar' ? 'فشل قراءة الملف' : 'Could not read file',
          description: file.name,
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!patient) return;
    deletePatientRecord(patient.id, recordId);
    setLocalPatient(prev => prev ? { ...prev, records: prev.records.filter(r => r.id !== recordId) } : null);
  };

  const handleInvestigationFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !patient) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string;
          await addPreviousInvestigation(patient.id, {
            name: file.name,
            type: file.type,
            dataUrl,
          });
        } catch (error) {
          console.error('Failed to upload investigation:', error);
          toast({
            title: language === 'ar' ? 'فشل رفع الملف' : 'Upload failed',
            description: language === 'ar' ? `تعذر حفظ "${file.name}"` : `Could not save "${file.name}"`,
            variant: 'destructive',
          });
        }
      };
      reader.onerror = () => {
        toast({
          title: language === 'ar' ? 'فشل قراءة الملف' : 'Could not read file',
          description: file.name,
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (investigationFileInputRef.current) {
      investigationFileInputRef.current.value = '';
    }
  };

  const handleDeleteInvestigation = (investigationId: string) => {
    deletePreviousInvestigation(investigationId);
  };

  const handleDeletePatient = async () => {
    if (!patient) return;
    const confirmMsg = language === 'ar'
      ? `هل أنت متأكد من حذف المريض "${patient.name}"؟ سيتم حذف جميع الزيارات والسجلات نهائياً.`
      : `Delete patient "${patient.name}"? This will permanently delete all their visits and records.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await deletePatient(patient.id);
      navigate('/patients');
    } catch (err) {
      window.alert(language === 'ar' ? 'فشل الحذف' : 'Failed to delete');
      console.error(err);
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!patient) return;
    const confirmMsg = language === 'ar'
      ? 'هل أنت متأكد من حذف هذه الزيارة؟ لا يمكن التراجع عن هذا الإجراء.'
      : 'Delete this visit? This cannot be undone.';
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteVisit(visitId);
    } catch (err) {
      window.alert(language === 'ar' ? 'فشل حذف الزيارة' : 'Failed to delete visit');
      console.error(err);
    }
  };

  const isImageFile = (type: string) => type.startsWith('image/');

  const dateLocale = language === 'ar' ? ar : enUS;
  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button onClick={() => navigate('/patients')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/patients')}
            className="gap-2 mb-4"
          >
            <BackIcon className="w-4 h-4" />
            {t('common.back')}
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{patient.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {patient.age} {t('patients.years')} • {t(`patients.${patient.gender}`)}
                </p>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">{patient.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canEditPatient && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/patients/${patient.id}/edit`)}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
              )}
              {canDeletePatient && (
                <Button
                  variant="outline"
                  onClick={handleDeletePatient}
                  className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  <Trash className="w-4 h-4" />
                  {language === 'ar' ? 'حذف المريض' : 'Delete'}
                </Button>
              )}
              {!isAssistant && (
                <Button
                  onClick={() => navigate(`/patients/${patient.id}/visit/new`)}
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {t('visits.newVisit')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Patient Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl card-shadow p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'البيانات الشخصية' : 'Personal Data'}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('patients.fileNumber')}</span>
                <span className="font-medium text-foreground" dir="ltr">
                  {patient.fileNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('patients.age')}</span>
                <span className="font-medium text-foreground">
                  {patient.age} {t('patients.years')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('patients.gender')}</span>
                <span className="font-medium text-foreground">
                  {t(`patients.${patient.gender}`)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'تاريخ التسجيل' : 'Registered'}
                </span>
                <span className="font-medium text-foreground">
                  {format(patient.createdAt, 'PPP', { locale: dateLocale })}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Medical Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl card-shadow p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('patients.medicalHistory')}
            </h2>
            <p className="text-foreground">
              {patient.medicalHistory || (language === 'ar' ? 'لا يوجد' : 'None')}
            </p>

            {/* Allergies */}
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                {t('patients.allergies')}
              </h3>
              {patient.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, i) => (
                    <Badge key={i} variant="destructive">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('patients.noAllergies')}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Patient Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl card-shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'سجلات المريض' : 'Patient Records'}
            </h2>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {language === 'ar' ? 'رفع ملف' : 'Upload'}
              </Button>
            </div>
          </div>

          {patient.records && patient.records.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {patient.records.map((record, recordIdx) => (
                <div
                  key={record.id}
                  className="relative group rounded-xl overflow-hidden border border-border bg-muted/30"
                >
                  {isImageFile(record.type) ? (
                    <img
                      src={record.dataUrl}
                      alt={record.name}
                      className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openViewer(recordViewerFiles, recordIdx)}
                    />
                  ) : (
                    <div
                      className="w-full h-32 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => openViewer(recordViewerFiles, recordIdx)}
                    >
                      <File className="w-10 h-10 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
                        {record.name}
                      </span>
                    </div>
                  )}
                  {isImageFile(record.type) && (
                    <button
                      onClick={() =>
                        printImage({
                          dataUrl: record.dataUrl,
                          title: record.name,
                          patientName: patient.name,
                          date: new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
                          language,
                        })
                      }
                      className="absolute top-2 start-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title={language === 'ar' ? 'طباعة' : 'Print'}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="absolute top-2 end-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground truncate">{record.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{language === 'ar' ? 'لا توجد سجلات - اضغط رفع لإضافة ملفات' : 'No records - Click upload to add files'}</p>
            </div>
          )}
        </motion.div>

        {/* Previous Investigations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="bg-card rounded-2xl card-shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <File className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'الفحوصات السابقة' : 'Previous Investigations'}
            </h2>
            <div>
              <input
                ref={investigationFileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleInvestigationFileUpload}
                className="hidden"
                id="investigation-file-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => investigationFileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {language === 'ar' ? 'رفع ملف' : 'Upload'}
              </Button>
            </div>
          </div>

          {previousInvestigations && previousInvestigations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previousInvestigations.map((investigation, invIdx) => (
                <div
                  key={investigation.id}
                  className="relative group rounded-xl overflow-hidden border border-border bg-muted/30"
                >
                  {isImageFile(investigation.type) ? (
                    <img
                      src={investigation.dataUrl}
                      alt={investigation.name}
                      className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openViewer(investigationViewerFiles, invIdx)}
                    />
                  ) : (
                    <div
                      className="w-full h-32 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => openViewer(investigationViewerFiles, invIdx)}
                    >
                      <File className="w-10 h-10 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
                        {investigation.name}
                      </span>
                    </div>
                  )}
                  {isImageFile(investigation.type) && (
                    <button
                      onClick={() =>
                        printImage({
                          dataUrl: investigation.dataUrl,
                          title: investigation.name,
                          patientName: patient.name,
                          date: new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
                          language,
                        })
                      }
                      className="absolute top-2 start-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title={language === 'ar' ? 'طباعة' : 'Print'}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteInvestigation(investigation.id)}
                    className="absolute top-2 end-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground truncate">{investigation.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{language === 'ar' ? 'لا توجد فحوصات سابقة - اضغط رفع لإضافة ملفات' : 'No previous investigations - Click upload to add files'}</p>
            </div>
          )}
        </motion.div>

        {/* Slider-style file viewer (shared component) */}
        {viewerOpen && (
          <FileViewerModal
            files={viewerFiles}
            initialIndex={viewerIndex}
            onClose={handleCloseFile}
          />
        )}

        {/* Visits History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            {t('patients.previousVisits')}
          </h2>

          {visits.length > 0 ? (
            <div className="space-y-4">
              {visits
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((visit) => (
                  <div
                    key={visit.id}
                    className="bg-card rounded-2xl card-shadow p-6 hover:shadow-lg transition-shadow cursor-pointer group relative"
                    onClick={() => navigate(`/patients/${patient.id}/visit/${visit.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 inline me-1" />
                          {format(visit.date, 'PPP', { locale: dateLocale })}
                        </p>
                        <p className="font-semibold text-foreground mt-1">
                          {visit.chiefComplaint}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(visit.chiefComplaintDrawing || visit.diagnosisDrawing || visit.notesDrawing) && (
                          <Badge variant="secondary">
                            <FileText className="w-3 h-3 me-1" />
                            {language === 'ar' ? 'ملاحظات' : 'Notes'}
                          </Badge>
                        )}
                        {canDeleteVisit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVisit(visit.id);
                            }}
                            title={language === 'ar' ? 'حذف الزيارة' : 'Delete visit'}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-sm font-medium text-foreground">
                        {t('visits.diagnosis')}: {visit.diagnosis}
                      </p>
                    </div>

                    {/* Vitals */}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Activity className="w-4 h-4" />
                        <span>{visit.vitals.bloodPressure}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Thermometer className="w-4 h-4" />
                        <span>{visit.vitals.temperature}°C</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Scale className="w-4 h-4" />
                        <span>{visit.vitals.weight} kg</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-2xl card-shadow">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد زيارات سابقة' : 'No previous visits'}
              </p>
              {!isAssistant && (
                <Button
                  onClick={() => navigate(`/patients/${patient.id}/visit/new`)}
                  className="mt-4"
                >
                  {t('visits.newVisit')}
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDetailPage;
