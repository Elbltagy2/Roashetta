import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Loader2,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import api, { AnalyticsData } from '@/services/api';

const AnalyticsPage: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const locale = language === 'ar' ? ar : enUS;

  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [filterStartDate, setFilterStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filterEndDate, setFilterEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    loadAnalytics();
  }, [filterStartDate, filterEndDate]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAnalytics(filterStartDate, filterEndDate);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: language === 'ar' ? 'فشل في تحميل التحليلات' : 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick filter presets
  const setToday = () => {
    setFilterStartDate(format(startOfDay(new Date()), 'yyyy-MM-dd'));
    setFilterEndDate(format(endOfDay(new Date()), 'yyyy-MM-dd'));
  };

  const setThisWeek = () => {
    setFilterStartDate(format(startOfWeek(new Date(), { weekStartsOn: 6 }), 'yyyy-MM-dd'));
    setFilterEndDate(format(endOfWeek(new Date(), { weekStartsOn: 6 }), 'yyyy-MM-dd'));
  };

  const setThisMonth = () => {
    setFilterStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setFilterEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  };

  const setLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1);
    setFilterStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
    setFilterEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} EGP`;
  };

  const getVisitTypePercentage = (type: 'new' | 'followup') => {
    if (!analytics || analytics.totalVisits === 0) return 0;
    const count = type === 'new' ? analytics.newVisits : analytics.followupVisits;
    return Math.round((count / analytics.totalVisits) * 100);
  };

  if (isLoading && !analytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              {language === 'ar' ? 'التحليلات' : 'Analytics'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'تحليل أداء العيادة' : 'Clinic performance analysis'}
            </p>
          </div>
          <Button variant="outline" onClick={loadAnalytics} disabled={isLoading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        {/* Date Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl card-shadow p-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-primary" />
            <span className="font-semibold">
              {language === 'ar' ? 'تصفية حسب الفترة' : 'Filter by Period'}
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={setToday}>
              {language === 'ar' ? 'اليوم' : 'Today'}
            </Button>
            <Button variant="outline" size="sm" onClick={setThisWeek}>
              {language === 'ar' ? 'هذا الأسبوع' : 'This Week'}
            </Button>
            <Button variant="outline" size="sm" onClick={setThisMonth}>
              {language === 'ar' ? 'هذا الشهر' : 'This Month'}
            </Button>
            <Button variant="outline" size="sm" onClick={setLastMonth}>
              {language === 'ar' ? 'الشهر الماضي' : 'Last Month'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {language === 'ar' ? 'من تاريخ' : 'From Date'}
              </Label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {language === 'ar' ? 'إلى تاريخ' : 'To Date'}
              </Label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        </motion.div>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Visits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl card-shadow p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
                    </p>
                    <p className="text-2xl font-bold">{analytics.totalVisits}</p>
                  </div>
                </div>
              </motion.div>

              {/* Unique Patients */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-2xl card-shadow p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'المرضى' : 'Patients'}
                    </p>
                    <p className="text-2xl font-bold">{analytics.uniquePatients}</p>
                  </div>
                </div>
              </motion.div>

              {/* Total Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl card-shadow p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'الإيرادات' : 'Revenue'}
                    </p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                  </div>
                </div>
              </motion.div>

              {/* Net Profit */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card rounded-2xl card-shadow p-5"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    analytics.netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {analytics.netProfit >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'صافي الربح' : 'Net Profit'}
                    </p>
                    <p className={`text-2xl font-bold ${
                      analytics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(analytics.netProfit)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Visit Type Breakdown & Revenue Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Visit Type Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl card-shadow p-6"
              >
                <h3 className="text-lg font-semibold mb-4">
                  {language === 'ar' ? 'توزيع الزيارات' : 'Visit Breakdown'}
                </h3>

                <div className="space-y-4">
                  {/* New Visits */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        {language === 'ar' ? 'كشف جديد' : 'New Visit'}
                      </span>
                      <span className="font-semibold">
                        {analytics.newVisits} ({getVisitTypePercentage('new')}%)
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${getVisitTypePercentage('new')}%` }}
                      />
                    </div>
                  </div>

                  {/* Follow-up Visits */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        {language === 'ar' ? 'متابعة' : 'Follow-up'}
                      </span>
                      <span className="font-semibold">
                        {analytics.followupVisits} ({getVisitTypePercentage('followup')}%)
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${getVisitTypePercentage('followup')}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Revenue Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card rounded-2xl card-shadow p-6"
              >
                <h3 className="text-lg font-semibold mb-4">
                  {language === 'ar' ? 'تفاصيل الإيرادات' : 'Revenue Details'}
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
                    <span className="text-green-700">
                      {language === 'ar' ? 'إيرادات الكشف الجديد' : 'New Visit Revenue'}
                    </span>
                    <span className="font-semibold text-green-700">
                      {formatCurrency(analytics.newVisitRevenue)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50">
                    <span className="text-blue-700">
                      {language === 'ar' ? 'إيرادات المتابعة' : 'Follow-up Revenue'}
                    </span>
                    <span className="font-semibold text-blue-700">
                      {formatCurrency(analytics.followupVisitRevenue)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-lg bg-red-50">
                    <span className="text-red-700">
                      {language === 'ar' ? 'المصروفات' : 'Expenses'}
                    </span>
                    <span className="font-semibold text-red-700">
                      -{formatCurrency(analytics.totalExpenses)}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        {language === 'ar' ? 'صافي الربح' : 'Net Profit'}
                      </span>
                      <span className={`text-xl font-bold ${
                        analytics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(analytics.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Daily Breakdown Table */}
            {analytics.dailyBreakdown.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-2xl card-shadow p-6"
              >
                <h3 className="text-lg font-semibold mb-4">
                  {language === 'ar' ? 'التفاصيل اليومية' : 'Daily Details'}
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-start py-3 px-4 font-semibold">
                          {language === 'ar' ? 'التاريخ' : 'Date'}
                        </th>
                        <th className="text-center py-3 px-4 font-semibold">
                          {language === 'ar' ? 'الزيارات' : 'Visits'}
                        </th>
                        <th className="text-center py-3 px-4 font-semibold">
                          {language === 'ar' ? 'جديد' : 'New'}
                        </th>
                        <th className="text-center py-3 px-4 font-semibold">
                          {language === 'ar' ? 'متابعة' : 'Follow-up'}
                        </th>
                        <th className="text-end py-3 px-4 font-semibold">
                          {language === 'ar' ? 'الإيرادات' : 'Revenue'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.dailyBreakdown.map((day, index) => (
                        <tr
                          key={day.date}
                          className={index % 2 === 0 ? 'bg-muted/30' : ''}
                        >
                          <td className="py-3 px-4">
                            {format(new Date(day.date), 'EEE, MMM d', { locale })}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold">
                            {day.totalVisits}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold">
                              {day.newVisits}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                              {day.followupVisits}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-end font-semibold text-green-600">
                            {formatCurrency(day.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
