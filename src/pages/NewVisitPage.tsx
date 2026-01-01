import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Activity, Image, File, X, Stethoscope, ClipboardList, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleDrawingCanvas } from '@/components/ui/simple-drawing-canvas';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';

const NewVisitPage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const { t, language, direction } = useLanguage();
  const { getPatient, addVisit } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const patient = getPatient(patientId || '');
  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  const [formData, setFormData] = useState({
    bloodPressure: '',
    temperature: '',
    weight: '',
  });

  // Drawing data for each field
  const [chiefComplaintDrawing, setChiefComplaintDrawing] = useState<string>('');
  const [diagnosisDrawing, setDiagnosisDrawing] = useState<string>('');
  const [notesDrawing, setNotesDrawing] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{ url: string; type: string } | null>(null);

  const isImageFile = (type: string) => type.startsWith('image/');

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // At least one of the drawings should have content
    if (!chiefComplaintDrawing && !diagnosisDrawing) {
      toast({
        title: language === 'ar' ? 'يرجى رسم الشكوى أو التشخيص' : 'Please draw complaint or diagnosis',
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

        <h1 className="text-3xl font-bold text-foreground mb-2">{t('visits.newVisit')}</h1>
        <p className="text-muted-foreground mb-8">{patient.name}</p>

        {/* Patient Records (Read-only) - Shown at top for reference */}
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
          {/* Vitals */}
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

          {/* Chief Complaint Drawing */}
          <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              {t('visits.chiefComplaint')}
            </h2>
            <SimpleDrawingCanvas
              language={language}
              minHeight={120}
              maxHeight={400}
              placeholder={language === 'ar' ? 'اكتب الشكوى هنا...' : 'Write complaint here...'}
              onSave={setChiefComplaintDrawing}
            />
          </div>

          {/* Diagnosis Drawing */}
          <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              {t('visits.diagnosis')}
            </h2>
            <SimpleDrawingCanvas
              language={language}
              minHeight={120}
              maxHeight={400}
              placeholder={language === 'ar' ? 'اكتب التشخيص هنا...' : 'Write diagnosis here...'}
              onSave={setDiagnosisDrawing}
            />
          </div>

          {/* Notes / Prescription Drawing */}
          <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'الروشتة' : 'Prescription'}
            </h2>

            {/* Prescription Pad - Egyptian Style */}
            <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col" style={{ minHeight: '700px' }}>
              {/* Header */}
              <div className="border-b border-gray-300 p-4 pb-3 flex-shrink-0">
                <div className="flex justify-between items-start">
                  {/* Left side - English */}
                  <div className="text-start">
                    <p className="text-base font-bold text-gray-800">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
                  </div>
                  {/* Right side - Arabic */}
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

                {/* Patient Info - Under Dr/ Sherif Ali */}
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
                {/* Rx Symbol */}
                <div className="absolute top-6 start-6 text-gray-400 text-6xl font-serif select-none pointer-events-none" style={{ fontFamily: 'Times New Roman, serif' }}>
                  ℞/
                </div>

                {/* Drawing Canvas */}
                <div className="p-4 ps-20 h-full">
                  <SimpleDrawingCanvas
                    language={language}
                    minHeight={350}
                    maxHeight={600}
                    placeholder={language === 'ar' ? 'اكتب الروشتة هنا...' : 'Write prescription here...'}
                    onSave={setNotesDrawing}
                  />
                </div>
              </div>

              {/* Footer - Always at bottom */}
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
