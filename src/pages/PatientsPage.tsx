import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, UserPlus, Filter, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useData, Patient } from '@/contexts/DataContext';
import api from '@/services/api';
import { staggerContainer, staggerItem } from '@/lib/animations';

const PAGE_SIZE = 12;

const PatientsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { patients: allPatients } = useData();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to first page whenever the query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, genderFilter]);

  const fetchPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getPatientsPaginated({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        gender: genderFilter === 'all' ? undefined : genderFilter,
      });
      const mapped: Patient[] = response.data.map((p) => ({
        id: p.id,
        fileNumber: p.fileNumber || '',
        name: p.name,
        phone: p.phone,
        age: p.age,
        gender: p.gender,
        medicalHistory: p.medicalHistory,
        allergies: p.allergies || [],
        records: [],
        createdAt: new Date(p.createdAt),
      }));
      setResults(mapped);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, genderFilter]);

  // Fetch on filter/page change. Also refetch when DataContext patients
  // change (covers add/update/delete from elsewhere in the app).
  useEffect(() => {
    fetchPage();
  }, [fetchPage, allPatients.length]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('patients.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar'
                ? `${total} مريض مسجل`
                : `${total} registered patients`}
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
        {results.length > 0 ? (
          <>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {results.map((patient) => (
                <motion.div key={patient.id} variants={staggerItem}>
                  <PatientCard patient={patient} />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar'
                    ? `صفحة ${page} من ${totalPages}`
                    : `Page ${page} of ${totalPages}`}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!canPrev || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4 me-1" />
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!canNext || isLoading}
                  >
                    {language === 'ar' ? 'التالي' : 'Next'}
                    <ChevronRight className="w-4 h-4 ms-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl card-shadow">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('patients.noPatients')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {debouncedSearch
                ? language === 'ar'
                  ? 'لم يتم العثور على نتائج'
                  : 'No results found'
                : language === 'ar'
                ? 'ابدأ بإضافة أول مريض'
                : 'Start by adding your first patient'}
            </p>
            {!debouncedSearch && (
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
