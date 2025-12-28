import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Printer, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Prescription, Patient } from '@/contexts/DataContext';

interface PrescriptionPrintProps {
  prescription: Prescription;
  patient: Patient;
  diagnosis?: string;
}

export const PrescriptionPrint: React.FC<PrescriptionPrintProps> = ({
  prescription,
  patient,
  diagnosis,
}) => {
  const { t, language, direction } = useLanguage();
  const { doctor } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Prescription-${patient.name}-${format(prescription.createdAt, 'yyyy-MM-dd')}`,
  });

  const dateLocale = language === 'ar' ? ar : enUS;

  return (
    <div>
      <Button onClick={() => handlePrint()} className="gap-2 mb-6">
        <Printer className="w-4 h-4" />
        {t('prescriptions.print')}
      </Button>

      <div
        ref={printRef}
        dir={direction}
        className="bg-card p-8 rounded-2xl card-shadow max-w-2xl mx-auto print:shadow-none print:p-4"
        style={{ fontFamily: 'Cairo, sans-serif' }}
      >
        {/* Header */}
        <div className="border-b-2 border-primary pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">{doctor?.clinicName}</h1>
              <p className="text-foreground font-semibold mt-1">{doctor?.name}</p>
              <p className="text-muted-foreground text-sm">{doctor?.specialty}</p>
            </div>
            <div className="text-end">
              <p className="text-sm text-muted-foreground" dir="ltr">
                {doctor?.phone}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'رقم الترخيص' : 'License'}: {doctor?.licenseNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-muted/50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('patients.name')}:</span>
              <span className="font-semibold ms-2">{patient.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('patients.age')}:</span>
              <span className="font-semibold ms-2">
                {patient.age} {t('patients.years')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('visits.date')}:</span>
              <span className="font-semibold ms-2">
                {format(prescription.createdAt, 'PPP', { locale: dateLocale })}
              </span>
            </div>
            {diagnosis && (
              <div>
                <span className="text-muted-foreground">{t('visits.diagnosis')}:</span>
                <span className="font-semibold ms-2">{diagnosis}</span>
              </div>
            )}
          </div>
        </div>

        {/* Allergies Warning */}
        {patient.allergies.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-6">
            <p className="text-destructive font-semibold text-sm">
              ⚠️ {t('patients.allergies')}: {patient.allergies.join('، ')}
            </p>
          </div>
        )}

        {/* Prescription Symbol */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-4xl font-serif text-primary">℞</span>
          <span className="text-lg font-semibold text-foreground">
            {t('prescriptions.title')}
          </span>
        </div>

        {/* Medicines */}
        <div className="space-y-4">
          {prescription.medicines.map((medicine, index) => (
            <div
              key={medicine.id}
              className="flex gap-4 p-4 border border-border rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">{index + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">{medicine.name}</span>
                  <span className="text-muted-foreground">({medicine.dosage})</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">{t('prescriptions.frequency')}:</span>{' '}
                    {medicine.frequency}
                  </p>
                  <p>
                    <span className="font-medium">{t('prescriptions.duration')}:</span>{' '}
                    {medicine.duration}
                  </p>
                  {medicine.instructions && (
                    <p>
                      <span className="font-medium">{t('prescriptions.instructions')}:</span>{' '}
                      {medicine.instructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border flex justify-between items-end">
          <div>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'الشفاء العاجل' : 'Get well soon'}
            </p>
          </div>
          <div className="text-center">
            <div className="border-t border-foreground pt-2 px-8">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'توقيع الطبيب' : 'Doctor Signature'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
