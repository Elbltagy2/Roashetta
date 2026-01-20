import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, UserPlus, Filter, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PatientCard } from '@/components/patients/PatientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { staggerContainer, staggerItem } from '@/lib/animations';

const PatientsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { patients } = useData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery) ||
        (patient.fileNumber && patient.fileNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGender =
        genderFilter === 'all' || patient.gender === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [patients, searchQuery, genderFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('patients.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar'
                ? `${patients.length} مريض مسجل`
                : `${patients.length} registered patients`}
            </p>
          </div>
          <Button onClick={() => navigate('/patients/new')} className="gap-2">
            <UserPlus className="w-5 h-5" />
            {t('patients.addNew')}
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('patients.search')}
              className="ps-10"
            />
          </div>
          <Select
            value={genderFilter}
            onValueChange={(value) => setGenderFilter(value as 'all' | 'male' | 'female')}
          >
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 me-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="male">{t('patients.male')}</SelectItem>
              <SelectItem value="female">{t('patients.female')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Patients Grid */}
        {filteredPatients.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPatients.map((patient) => (
              <motion.div key={patient.id} variants={staggerItem}>
                <PatientCard patient={patient} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl card-shadow">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('patients.noPatients')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? language === 'ar'
                  ? 'لم يتم العثور على نتائج'
                  : 'No results found'
                : language === 'ar'
                ? 'ابدأ بإضافة أول مريض'
                : 'Start by adding your first patient'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/patients/new')}>
                {t('patients.addNew')}
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientsPage;
