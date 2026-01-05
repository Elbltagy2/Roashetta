import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, Calendar, UserCheck } from 'lucide-react';
import { Patient, useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PatientCardProps {
  patient: Patient;
  compact?: boolean;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, compact = false }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { currentPatient, setCurrentPatient } = useData();
  const navigate = useNavigate();
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [isSettingCurrent, setIsSettingCurrent] = useState(false);

  // Check if user is assistant (only assistants can set current patient)
  const canSetCurrent = user?.role === 'assistant';
  const isCurrentPatient = currentPatient?.id === patient.id;

  const handleMakeCurrent = async () => {
    if (currentPatient && currentPatient.id !== patient.id) {
      // Show confirmation dialog
      setShowReplaceDialog(true);
    } else {
      // Set directly
      await doSetCurrentPatient();
    }
  };

  const doSetCurrentPatient = async () => {
    setIsSettingCurrent(true);
    try {
      await setCurrentPatient(patient.id);
    } catch (error) {
      console.error('Failed to set current patient:', error);
    } finally {
      setIsSettingCurrent(false);
      setShowReplaceDialog(false);
    }
  };

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

      <div className="px-6 py-4 bg-muted/50 border-t border-border space-y-2">
        <Button
          onClick={() => navigate(`/patients/${patient.id}`)}
          className="w-full"
        >
          {t('common.view')}
        </Button>
        {canSetCurrent && (
          <Button
            onClick={handleMakeCurrent}
            variant={isCurrentPatient ? "secondary" : "outline"}
            className="w-full gap-2"
            disabled={isSettingCurrent || isCurrentPatient}
          >
            <UserCheck className="w-4 h-4" />
            {isCurrentPatient
              ? (language === 'ar' ? 'المريض الحالي' : 'Current Patient')
              : (language === 'ar' ? 'تحديد كمريض حالي' : 'Make Current')}
          </Button>
        )}
      </div>

      {/* Replace Current Patient Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'استبدال المريض الحالي؟' : 'Replace Current Patient?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? `المريض "${currentPatient?.name}" محدد حالياً. هل تريد استبداله بـ "${patient.name}"؟`
                : `"${currentPatient?.name}" is currently selected. Replace with "${patient.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={doSetCurrentPatient} disabled={isSettingCurrent}>
              {language === 'ar' ? 'استبدال' : 'Replace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
