import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { ArrowRight, ArrowLeft, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrescriptionPrint } from '@/components/prescriptions/PrescriptionPrint';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';

const VisitDetailPage: React.FC = () => {
  const { id: patientId, visitId } = useParams<{ id: string; visitId: string }>();
  const { t, language, direction } = useLanguage();
  const { getPatient, visits } = useData();
  const navigate = useNavigate();

  const patient = getPatient(patientId || '');
  const visit = visits.find((v) => v.id === visitId);
  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;
  const dateLocale = language === 'ar' ? ar : enUS;

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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate(`/patients/${patientId}`)} className="gap-2 mb-4">
            <BackIcon className="w-4 h-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{patient.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {format(visit.date, 'PPP', { locale: dateLocale })}
          </p>
        </div>

        {/* Visit Details */}
        <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('visits.chiefComplaint')}</p>
            <p className="font-semibold text-foreground">{visit.chiefComplaint}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('visits.diagnosis')}</p>
            <p className="font-semibold text-foreground">{visit.diagnosis}</p>
          </div>
          {visit.notes && (
            <div>
              <p className="text-sm text-muted-foreground">{t('visits.notes')}</p>
              <p className="text-foreground">{visit.notes}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">{t('visits.bloodPressure')}</p>
              <p className="font-semibold">{visit.vitals.bloodPressure} mmHg</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('visits.temperature')}</p>
              <p className="font-semibold">{visit.vitals.temperature}°C</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('visits.weight')}</p>
              <p className="font-semibold">{visit.vitals.weight} kg</p>
            </div>
          </div>
        </div>

        {/* Prescription */}
        {visit.prescription && (
          <PrescriptionPrint prescription={visit.prescription} patient={patient} diagnosis={visit.diagnosis} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default VisitDetailPage;
