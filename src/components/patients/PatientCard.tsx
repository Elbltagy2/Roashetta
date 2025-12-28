import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, Calendar } from 'lucide-react';
import { Patient } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PatientCardProps {
  patient: Patient;
  compact?: boolean;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, compact = false }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (compact) {
    return (
      <div
        onClick={() => navigate(`/patients/${patient.id}`)}
        className="flex items-center gap-4 p-4 bg-card rounded-xl card-shadow hover:shadow-lg transition-all duration-200 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{patient.name}</p>
          <p className="text-sm text-muted-foreground">
            {patient.age} {t('patients.years')} • {t(`patients.${patient.gender}`)}
          </p>
        </div>
        <div className="text-muted-foreground">
          <Phone className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl card-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground">{patient.name}</h3>
            <p className="text-muted-foreground">
              {patient.age} {t('patients.years')} • {t(`patients.${patient.gender}`)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span dir="ltr">{patient.phone}</span>
            </div>
          </div>
        </div>

        {patient.allergies.length > 0 && (
          <div className="mt-4 p-3 bg-destructive/10 rounded-xl">
            <p className="text-sm font-medium text-destructive">
              {t('patients.allergies')}: {patient.allergies.join('، ')}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(patient.createdAt)}</span>
        </div>
      </div>

      <div className="px-6 py-4 bg-muted/50 border-t border-border">
        <Button
          onClick={() => navigate(`/patients/${patient.id}`)}
          className="w-full"
        >
          {t('common.view')}
        </Button>
      </div>
    </div>
  );
};
