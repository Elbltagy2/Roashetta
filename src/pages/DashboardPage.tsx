import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, FileText, UserPlus, TrendingUp, User, Phone, AlertTriangle, UserX, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { PatientCard } from '@/components/patients/PatientCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Patient } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { staggerContainer, staggerItem } from '@/lib/animations';
import api from '@/services/api';

const DashboardPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAssistant } = useAuth();
  const { patientsVersion, visits, currentPatient, clearCurrentPatient } = useData();
  const navigate = useNavigate();
  const [isFinishing, setIsFinishing] = useState(false);
  const [totalPatients, setTotalPatients] = useState(0);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);

  useEffect(() => {
    api.getPatientsPaginated({ page: 1, limit: 5 }).then(res => {
      setTotalPatients(res.total);
      setRecentPatients(res.data.map(p => ({
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
      })));
    }).catch(() => {});
  }, [patientsVersion]);

  const handleFinishPatient = async () => {
    setIsFinishing(true);
    try {
      await clearCurrentPatient();
    } catch (error) {
      console.error('Failed to finish patient:', error);
    } finally {
      setIsFinishing(false);
    }
  };

  const today = new Date();
  const todayVisits = visits.filter(
    (v) => v.date.toDateString() === today.toDateString()
  );

  const thisMonthVisits = visits.filter(
    (v) =>
      v.date.getMonth() === today.getMonth() &&
      v.date.getFullYear() === today.getFullYear()
  );

  const prescriptionsCount = visits.filter((v) => v.prescription).length;


  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('dashboard.welcome')}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar'
              ? 'إليك نظرة عامة على عيادتك اليوم'
              : "Here's an overview of your clinic today"}
          </p>
        </div>

        {/* Current Patient Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl card-shadow overflow-hidden"
        >
          <div className="px-6 py-4 bg-primary/5 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'المريض الحالي' : 'Current Patient'}
            </h2>
            {currentPatient && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {language === 'ar' ? 'نشط' : 'Active'}
              </Badge>
            )}
          </div>

          {currentPatient ? (
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-foreground">{currentPatient.name}</h3>
                  <p className="text-muted-foreground">
                    {currentPatient.age} {t('patients.years')} • {t(`patients.${currentPatient.gender}`)}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{currentPatient.phone}</span>
                  </div>
                </div>
              </div>

              {currentPatient.allergies && currentPatient.allergies.length > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-destructive">
                    {t('patients.allergies')}: {currentPatient.allergies.join('، ')}
                  </p>
                </div>
              )}

              {currentPatient.medicalHistory && (
                <div className="mt-4 p-3 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{t('patients.medicalHistory')}:</span> {currentPatient.medicalHistory}
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => navigate(`/patients/${currentPatient.id}`)}
                  className="flex-1 gap-2"
                >
                  <User className="w-4 h-4" />
                  {language === 'ar' ? 'عرض الملف' : 'View Profile'}
                </Button>
                {!isAssistant && (
                  <Button
                    onClick={() => navigate(`/patients/${currentPatient.id}/visit/new`)}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {language === 'ar' ? 'زيارة جديدة' : 'New Visit'}
                  </Button>
                )}
                <Button
                  onClick={handleFinishPatient}
                  variant="secondary"
                  className="gap-2"
                  disabled={isFinishing}
                >
                  <CheckCircle className="w-4 h-4" />
                  {language === 'ar' ? 'إنهاء' : 'Finish'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <UserX className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {language === 'ar' ? 'لم يتم تحديد مريض' : 'No patient selected'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'ar'
                  ? 'يمكن للمساعد تحديد مريض من قائمة المرضى'
                  : 'Assistant can select a patient from the patients list'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={staggerItem}>
            <StatCard
              title={t('dashboard.todayAppointments')}
              value={todayVisits.length}
              icon={<Calendar className="w-6 h-6" />}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              title={t('dashboard.totalPatients')}
              value={totalPatients}
              icon={<Users className="w-6 h-6" />}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              title={t('dashboard.thisMonth')}
              value={thisMonthVisits.length}
              icon={<TrendingUp className="w-6 h-6" />}
              trend={{ value: 12, isPositive: true }}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              title={t('dashboard.prescriptions')}
              value={prescriptionsCount}
              icon={<FileText className="w-6 h-6" />}
            />
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {t('dashboard.quickActions')}
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => navigate('/patients/new')}
              className="gap-2"
              size="lg"
            >
              <UserPlus className="w-5 h-5" />
              {t('patients.addNew')}
            </Button>
            <Button
              onClick={() => navigate('/patients')}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <Users className="w-5 h-5" />
              {t('nav.patients')}
            </Button>
          </div>
        </motion.div>

        {/* Recent Patients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t('dashboard.recentPatients')}
            </h2>
            <Button variant="ghost" onClick={() => navigate('/patients')}>
              {t('common.view')} {t('common.all')}
            </Button>
          </div>
          <div className="space-y-3">
            {recentPatients.length > 0 ? (
              recentPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} compact />
              ))
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl card-shadow">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('patients.noPatients')}</p>
                <Button onClick={() => navigate('/patients/new')} className="mt-4">
                  {t('patients.addNew')}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
