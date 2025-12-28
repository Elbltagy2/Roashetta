import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, FileText, UserPlus, ClipboardPlus, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { PatientCard } from '@/components/patients/PatientCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { staggerContainer, staggerItem } from '@/lib/animations';

const DashboardPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { patients, visits } = useData();
  const navigate = useNavigate();

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

  const recentPatients = [...patients]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

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
              value={patients.length}
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
