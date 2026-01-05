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
  X,
  FlaskConical,
  Edit2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData, LabResult } from '@/contexts/DataContext';

type LabCategory = 'cbc' | 'sugar' | 'liver' | 'kidney' | 'lipids' | 'thyroid' | 'urine';

const LAB_CATEGORIES: { key: LabCategory; ar: string; en: string }[] = [
  { key: 'cbc', ar: 'صورة دم كاملة', en: 'CBC' },
  { key: 'sugar', ar: 'تحليل السكر', en: 'Sugar' },
  { key: 'liver', ar: 'وظائف الكبد', en: 'Liver' },
  { key: 'kidney', ar: 'وظائف الكلى', en: 'Kidney' },
  { key: 'lipids', ar: 'دهون الدم', en: 'Lipids' },
  { key: 'thyroid', ar: 'الغدة الدرقية', en: 'Thyroid' },
  { key: 'urine', ar: 'تحليل البول', en: 'Urine' },
];

interface LabResultFormData {
  category: LabCategory;
  testName: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  testDate: string;
  notes: string;
}

const initialLabFormData: LabResultFormData = {
  category: 'cbc',
  testName: '',
  resultValue: '',
  unit: '',
  referenceRange: '',
  isAbnormal: false,
  testDate: new Date().toISOString().split('T')[0],
  notes: '',
};

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language, direction } = useLanguage();
  const {
    getPatient,
    getPatientVisits,
    loadPatientVisits,
    addPatientRecord,
    deletePatientRecord,
    loadLabResults,
    addLabResult,
    updateLabResult,
    deleteLabResult,
    getPatientLabResults,
  } = useData();
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{ url: string; type: string } | null>(null);

  // Lab Results state
  const [labDialogOpen, setLabDialogOpen] = useState(false);
  const [labFormData, setLabFormData] = useState<LabResultFormData>(initialLabFormData);
  const [editingLabResult, setEditingLabResult] = useState<LabResult | null>(null);
  const [labCategoryFilter, setLabCategoryFilter] = useState<LabCategory | 'all'>('all');
  const [labLoading, setLabLoading] = useState(false);

  const patient = getPatient(id || '');
  const visits = getPatientVisits(id || '');
  const labResults = getPatientLabResults(id || '');

  // Load visits from API when patient ID changes
  useEffect(() => {
    if (id) {
      loadPatientVisits(id);
    }
  }, [id, loadPatientVisits]);

  // Load lab results when patient ID changes
  useEffect(() => {
    if (id) {
      setLabLoading(true);
      loadLabResults(id).finally(() => setLabLoading(false));
    }
  }, [id, loadLabResults]);

  // Get category label
  const getCategoryLabel = (key: LabCategory) => {
    const cat = LAB_CATEGORIES.find((c) => c.key === key);
    return cat ? (language === 'ar' ? cat.ar : cat.en) : key;
  };

  // Filter lab results
  const filteredLabResults = labCategoryFilter === 'all'
    ? labResults
    : labResults.filter((r) => r.category === labCategoryFilter);

  // Open dialog for adding
  const handleAddLabResult = () => {
    setEditingLabResult(null);
    setLabFormData(initialLabFormData);
    setLabDialogOpen(true);
  };

  // Open dialog for editing
  const handleEditLabResult = (result: LabResult) => {
    setEditingLabResult(result);
    setLabFormData({
      category: result.category as LabCategory,
      testName: result.testName,
      resultValue: result.resultValue,
      unit: result.unit || '',
      referenceRange: result.referenceRange || '',
      isAbnormal: result.isAbnormal,
      testDate: result.testDate instanceof Date
        ? result.testDate.toISOString().split('T')[0]
        : new Date(result.testDate).toISOString().split('T')[0],
      notes: result.notes || '',
    });
    setLabDialogOpen(true);
  };

  // Save lab result
  const handleSaveLabResult = async () => {
    if (!patient || !labFormData.testName || !labFormData.resultValue) return;

    setLabLoading(true);
    try {
      const testDateObj = new Date(labFormData.testDate);
      if (editingLabResult) {
        await updateLabResult(editingLabResult.id, {
          category: labFormData.category,
          testName: labFormData.testName,
          resultValue: labFormData.resultValue,
          unit: labFormData.unit || null,
          referenceRange: labFormData.referenceRange || null,
          isAbnormal: labFormData.isAbnormal,
          testDate: testDateObj,
          notes: labFormData.notes || null,
        });
      } else {
        await addLabResult({
          patientId: patient.id,
          category: labFormData.category,
          testName: labFormData.testName,
          resultValue: labFormData.resultValue,
          unit: labFormData.unit || null,
          referenceRange: labFormData.referenceRange || null,
          isAbnormal: labFormData.isAbnormal,
          testDate: testDateObj,
          notes: labFormData.notes || null,
        });
      }
      setLabDialogOpen(false);
      setLabFormData(initialLabFormData);
      setEditingLabResult(null);
    } catch (error) {
      console.error('Error saving lab result:', error);
    } finally {
      setLabLoading(false);
    }
  };

  // Delete lab result
  const handleDeleteLabResult = async (resultId: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;

    setLabLoading(true);
    try {
      await deleteLabResult(resultId);
    } catch (error) {
      console.error('Error deleting lab result:', error);
    } finally {
      setLabLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !patient) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        addPatientRecord(patient.id, {
          name: file.name,
          type: file.type,
          dataUrl,
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
    if (patient) {
      deletePatientRecord(patient.id, recordId);
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

            <Button
              onClick={() => navigate(`/patients/${patient.id}/visit/new`)}
              className="gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('visits.newVisit')}
            </Button>
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
                <span className="text-muted-foreground">{t('patients.nationalId')}</span>
                <span className="font-medium text-foreground" dir="ltr">
                  {patient.nationalId || '-'}
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
              {patient.records.map((record) => (
                <div
                  key={record.id}
                  className="relative group rounded-xl overflow-hidden border border-border bg-muted/30"
                >
                  {isImageFile(record.type) ? (
                    <img
                      src={record.dataUrl}
                      alt={record.name}
                      className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedFile({ url: record.dataUrl, type: 'image' })}
                    />
                  ) : (
                    <div
                      className="w-full h-32 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => setSelectedFile({ url: record.dataUrl, type: 'pdf' })}
                    >
                      <File className="w-10 h-10 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
                        {record.name}
                      </span>
                    </div>
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

        {/* Lab Results Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="bg-card rounded-2xl card-shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'نتائج التحاليل' : 'Lab Results'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLabResult}
              className="gap-2"
              disabled={labLoading}
            >
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'إضافة تحليل' : 'Add Result'}
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={labCategoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLabCategoryFilter('all')}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </Button>
            {LAB_CATEGORIES.map((cat) => (
              <Button
                key={cat.key}
                variant={labCategoryFilter === cat.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLabCategoryFilter(cat.key)}
              >
                {language === 'ar' ? cat.ar : cat.en}
              </Button>
            ))}
          </div>

          {/* Lab Results List */}
          {filteredLabResults.length > 0 ? (
            <div className="space-y-3">
              {filteredLabResults
                .sort((a, b) => b.testDate.getTime() - a.testDate.getTime())
                .map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(result.category as LabCategory)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(result.testDate, 'PP', { locale: dateLocale })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{result.testName}</span>
                        <span className={`font-bold ${result.isAbnormal ? 'text-destructive' : 'text-foreground'}`}>
                          {result.resultValue}
                          {result.unit && <span className="text-muted-foreground font-normal ms-1">{result.unit}</span>}
                        </span>
                        {result.isAbnormal && (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      {result.referenceRange && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'ar' ? 'المعدل الطبيعي: ' : 'Reference: '}{result.referenceRange}
                        </p>
                      )}
                      {result.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{result.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditLabResult(result)}
                        disabled={labLoading}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLabResult(result.id)}
                        disabled={labLoading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{language === 'ar' ? 'لا توجد تحاليل - اضغط إضافة لإدخال نتائج' : 'No lab results - Click add to enter results'}</p>
            </div>
          )}
        </motion.div>

        {/* Lab Result Dialog */}
        <Dialog open={labDialogOpen} onOpenChange={setLabDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLabResult
                  ? (language === 'ar' ? 'تعديل نتيجة تحليل' : 'Edit Lab Result')
                  : (language === 'ar' ? 'إضافة نتيجة تحليل' : 'Add Lab Result')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Category */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                <Select
                  value={labFormData.category}
                  onValueChange={(value: LabCategory) => setLabFormData({ ...labFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAB_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {language === 'ar' ? cat.ar : cat.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Test Name */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'اسم التحليل' : 'Test Name'}</Label>
                <Input
                  value={labFormData.testName}
                  onChange={(e) => setLabFormData({ ...labFormData, testName: e.target.value })}
                  placeholder={language === 'ar' ? 'مثال: Hemoglobin' : 'e.g., Hemoglobin'}
                />
              </div>

              {/* Result Value and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'النتيجة' : 'Result'}</Label>
                  <Input
                    value={labFormData.resultValue}
                    onChange={(e) => setLabFormData({ ...labFormData, resultValue: e.target.value })}
                    placeholder={language === 'ar' ? 'مثال: 12.5' : 'e.g., 12.5'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الوحدة' : 'Unit'}</Label>
                  <Input
                    value={labFormData.unit}
                    onChange={(e) => setLabFormData({ ...labFormData, unit: e.target.value })}
                    placeholder={language === 'ar' ? 'مثال: g/dL' : 'e.g., g/dL'}
                  />
                </div>
              </div>

              {/* Reference Range */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المعدل الطبيعي' : 'Reference Range'}</Label>
                <Input
                  value={labFormData.referenceRange}
                  onChange={(e) => setLabFormData({ ...labFormData, referenceRange: e.target.value })}
                  placeholder={language === 'ar' ? 'مثال: 12-16 g/dL' : 'e.g., 12-16 g/dL'}
                />
              </div>

              {/* Test Date */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'تاريخ التحليل' : 'Test Date'}</Label>
                <Input
                  type="date"
                  value={labFormData.testDate}
                  onChange={(e) => setLabFormData({ ...labFormData, testDate: e.target.value })}
                />
              </div>

              {/* Is Abnormal */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isAbnormal"
                  checked={labFormData.isAbnormal}
                  onCheckedChange={(checked) => setLabFormData({ ...labFormData, isAbnormal: !!checked })}
                />
                <Label htmlFor="isAbnormal" className="cursor-pointer">
                  {language === 'ar' ? 'نتيجة غير طبيعية' : 'Abnormal Result'}
                </Label>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                <Input
                  value={labFormData.notes}
                  onChange={(e) => setLabFormData({ ...labFormData, notes: e.target.value })}
                  placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLabDialogOpen(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSaveLabResult}
                disabled={labLoading || !labFormData.testName || !labFormData.resultValue}
              >
                {labLoading
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                  : (language === 'ar' ? 'حفظ' : 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                    className="bg-card rounded-2xl card-shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
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
                      {(visit.chiefComplaintDrawing || visit.diagnosisDrawing || visit.notesDrawing) && (
                        <Badge variant="secondary">
                          <FileText className="w-3 h-3 me-1" />
                          {language === 'ar' ? 'ملاحظات' : 'Notes'}
                        </Badge>
                      )}
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
              <Button
                onClick={() => navigate(`/patients/${patient.id}/visit/new`)}
                className="mt-4"
              >
                {t('visits.newVisit')}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDetailPage;
