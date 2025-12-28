import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Activity, Thermometer, Scale, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MedicineForm } from '@/components/prescriptions/MedicineForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData, Medicine } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';

const NewVisitPage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const { t, language, direction } = useLanguage();
  const { getPatient, addVisit, addPrescription } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const patient = getPatient(patientId || '');
  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  const [formData, setFormData] = useState({
    chiefComplaint: '',
    diagnosis: '',
    notes: '',
    bloodPressure: '',
    temperature: '',
    weight: '',
  });

  const [medicines, setMedicines] = useState<Omit<Medicine, 'id'>[]>([]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chiefComplaint || !formData.diagnosis) {
      toast({
        title: language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields',
        variant: 'destructive',
      });
      return;
    }

    const visit = addVisit({
      patientId: patientId!,
      date: new Date(),
      chiefComplaint: formData.chiefComplaint,
      diagnosis: formData.diagnosis,
      notes: formData.notes,
      vitals: {
        bloodPressure: formData.bloodPressure || '120/80',
        temperature: parseFloat(formData.temperature) || 37,
        weight: parseFloat(formData.weight) || 70,
      },
    });

    if (medicines.length > 0 && medicines.some((m) => m.name)) {
      addPrescription(visit.id, medicines.filter((m) => m.name));
    }

    toast({
      title: language === 'ar' ? 'تم حفظ الزيارة بنجاح' : 'Visit saved successfully',
    });

    navigate(`/patients/${patientId}/visit/${visit.id}`);
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
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(`/patients/${patientId}`)} className="gap-2 mb-4">
          <BackIcon className="w-4 h-4" />
          {t('common.back')}
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">{t('visits.newVisit')}</h1>
        <p className="text-muted-foreground mb-8">{patient.name}</p>

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-8">
          {/* Visit Info */}
          <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t('visits.title')}</h2>
            <div className="space-y-2">
              <Label>{t('visits.chiefComplaint')} *</Label>
              <Textarea value={formData.chiefComplaint} onChange={(e) => handleChange('chiefComplaint', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t('visits.diagnosis')} *</Label>
              <Textarea value={formData.diagnosis} onChange={(e) => handleChange('diagnosis', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t('visits.notes')}</Label>
              <Textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
            </div>
          </div>

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

          {/* Prescription */}
          <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('prescriptions.title')}
            </h2>
            <MedicineForm medicines={medicines} onChange={setMedicines} />
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">{t('common.save')}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/patients/${patientId}`)} className="flex-1">{t('common.cancel')}</Button>
          </div>
        </motion.form>
      </div>
    </DashboardLayout>
  );
};

export default NewVisitPage;
