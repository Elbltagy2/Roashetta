import React, { useState } from 'react';
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
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language, direction } = useLanguage();
  const { getPatient, getPatientVisits } = useData();
  const navigate = useNavigate();

  const patient = getPatient(id || '');
  const visits = getPatientVisits(id || '');

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
                      {visit.prescription && (
                        <Badge variant="secondary">
                          <FileText className="w-3 h-3 me-1" />
                          {language === 'ar' ? 'وصفة طبية' : 'Prescription'}
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
