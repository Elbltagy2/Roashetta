import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Calendar, FileText, AlertTriangle, ArrowRight, ArrowLeft, Hash, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';

const EditPatientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language, direction } = useLanguage();
  const { getPatient, updatePatient } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const patient = getPatient(id || '');

  const [formData, setFormData] = useState({
    fileNumber: '',
    name: '',
    phone: '',
    age: '',
    gender: '' as 'male' | 'female' | '',
    medicalHistory: '',
    allergies: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Hydrate form once the patient is available
  useEffect(() => {
    if (!patient) return;
    setFormData({
      fileNumber: patient.fileNumber || '',
      name: patient.name,
      phone: patient.phone,
      age: String(patient.age),
      gender: patient.gender,
      medicalHistory: patient.medicalHistory || '',
      allergies: (patient.allergies || []).join(', '),
    });
  }, [patient]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.age || !formData.gender) {
      toast({
        title: language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!id) return;

    const allergiesArray = formData.allergies
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    setIsSaving(true);
    try {
      await updatePatient(id, {
        fileNumber: formData.fileNumber,
        name: formData.name,
        phone: formData.phone,
        age: parseInt(formData.age),
        gender: formData.gender as 'male' | 'female',
        medicalHistory: formData.medicalHistory,
        allergies: allergiesArray,
      });

      toast({
        title: language === 'ar' ? 'تم تحديث بيانات المريض' : 'Patient updated successfully',
      });

      navigate(`/patients/${id}`);
    } catch (err) {
      toast({
        title: language === 'ar' ? 'فشل التحديث' : 'Update failed',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">
          {language === 'ar' ? 'المريض غير موجود' : 'Patient not found'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/patients/${id}`)}
            className="gap-2 mb-4"
          >
            <BackIcon className="w-4 h-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'ar' ? 'تعديل بيانات المريض' : 'Edit Patient'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'تعديل المعلومات الأساسية والطبية للمريض' : 'Update the patient\'s basic and medical info'}
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl card-shadow p-6 lg:p-8 space-y-6"
        >
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fileNumber">{t('patients.fileNumber')}</Label>
                <div className="relative">
                  <Hash className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fileNumber"
                    value={formData.fileNumber}
                    onChange={(e) => handleChange('fileNumber', e.target.value)}
                    placeholder={language === 'ar' ? 'رقم الملف' : 'File number'}
                    className="ps-10"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name">{t('patients.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={language === 'ar' ? 'اسم المريض بالكامل' : 'Full patient name'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('patients.phone')} *</Label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="01012345678"
                    className="ps-10"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">{t('patients.age')} *</Label>
                <div className="relative">
                  <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="150"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    placeholder="35"
                    className="ps-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">{t('patients.gender')} *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('patients.gender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('patients.male')}</SelectItem>
                    <SelectItem value="female">{t('patients.female')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'المعلومات الطبية' : 'Medical Information'}
            </h2>

            <div className="space-y-2">
              <Label htmlFor="medicalHistory">{t('patients.medicalHistory')}</Label>
              <Textarea
                id="medicalHistory"
                value={formData.medicalHistory}
                onChange={(e) => handleChange('medicalHistory', e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'الأمراض المزمنة، العمليات السابقة، الأدوية الحالية...'
                    : 'Chronic diseases, previous surgeries, current medications...'
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                {t('patients.allergies')}
              </Label>
              <Input
                id="allergies"
                value={formData.allergies}
                onChange={(e) => handleChange('allergies', e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'البنسلين، الأسبرين (افصل بفاصلة)'
                    : 'Penicillin, Aspirin (separate with comma)'
                }
              />
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? 'افصل بين الحساسيات المختلفة بفاصلة'
                  : 'Separate different allergies with a comma'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button type="submit" disabled={isSaving} className="flex-1 gap-2">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/patients/${id}`)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </motion.form>
      </div>
    </DashboardLayout>
  );
};

export default EditPatientPage;
