import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Plus,
  Trash2,
  Edit2,
  Home,
  Zap,
  Package,
  Wrench,
  Settings,
  MoreHorizontal,
  DollarSign,
  Calendar,
  Filter,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData, Expense } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { ExpenseCategory } from '@/services/api';

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  rent: <Home className="w-5 h-5" />,
  utilities: <Zap className="w-5 h-5" />,
  supplies: <Package className="w-5 h-5" />,
  equipment: <Settings className="w-5 h-5" />,
  maintenance: <Wrench className="w-5 h-5" />,
  other: <MoreHorizontal className="w-5 h-5" />,
};

const categoryColors: Record<ExpenseCategory, string> = {
  rent: 'bg-blue-100 text-blue-600',
  utilities: 'bg-yellow-100 text-yellow-600',
  supplies: 'bg-green-100 text-green-600',
  equipment: 'bg-purple-100 text-purple-600',
  maintenance: 'bg-orange-100 text-orange-600',
  other: 'bg-gray-100 text-gray-600',
};

const ExpensesPage: React.FC = () => {
  const { language } = useLanguage();
  const { expenses, addExpense, updateExpense, deleteExpense } = useData();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'other' as ExpenseCategory,
    description: '',
    expenseDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Date filter state
  const [filterStartDate, setFilterStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filterEndDate, setFilterEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');

  // Quick filter presets
  const setThisMonth = () => {
    setFilterStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setFilterEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  };

  const setLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1);
    setFilterStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
    setFilterEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
  };

  const setLast3Months = () => {
    const threeMonthsAgo = subMonths(new Date(), 3);
    setFilterStartDate(format(startOfMonth(threeMonthsAgo), 'yyyy-MM-dd'));
    setFilterEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  };

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.expenseDate);
      const start = new Date(filterStartDate);
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);

      const inDateRange = expenseDate >= start && expenseDate <= end;
      const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;

      return inDateRange && matchesCategory;
    });
  }, [expenses, filterStartDate, filterEndDate, filterCategory]);

  const categoryLabels: Record<ExpenseCategory, { ar: string; en: string }> = {
    rent: { ar: 'الإيجار', en: 'Rent' },
    utilities: { ar: 'المرافق', en: 'Utilities' },
    supplies: { ar: 'المستلزمات', en: 'Supplies' },
    equipment: { ar: 'المعدات', en: 'Equipment' },
    maintenance: { ar: 'الصيانة', en: 'Maintenance' },
    other: { ar: 'أخرى', en: 'Other' },
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category: 'other',
      description: '',
      expenseDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setEditingExpense(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      expenseDate: format(expense.expenseDate, 'yyyy-MM-dd'),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: language === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          expenseDate: new Date(formData.expenseDate),
        });
        toast({
          title: language === 'ar' ? 'تم تحديث المصروف' : 'Expense updated',
        });
      } else {
        await addExpense({
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          expenseDate: new Date(formData.expenseDate),
        });
        toast({
          title: language === 'ar' ? 'تم إضافة المصروف' : 'Expense added',
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      toast({
        title: language === 'ar' ? 'تم حذف المصروف' : 'Expense deleted',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  // Calculate total for filtered expenses
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for summary (filtered)
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {language === 'ar' ? 'المصروفات' : 'Expenses'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'إدارة مصروفات العيادة' : 'Manage clinic expenses'}
            </p>
          </div>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة مصروف' : 'Add Expense'}
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
            <Button variant="outline" size="sm" onClick={setThisMonth}>
              {language === 'ar' ? 'هذا الشهر' : 'This Month'}
            </Button>
            <Button variant="outline" size="sm" onClick={setLastMonth}>
              {language === 'ar' ? 'الشهر الماضي' : 'Last Month'}
            </Button>
            <Button variant="outline" size="sm" onClick={setLast3Months}>
              {language === 'ar' ? 'آخر 3 شهور' : 'Last 3 Months'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
              <Select
                value={filterCategory}
                onValueChange={(value: ExpenseCategory | 'all') => setFilterCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'ar' ? 'الكل' : 'All'}
                  </SelectItem>
                  {(Object.keys(categoryLabels) as ExpenseCategory[]).map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        {categoryIcons[category]}
                        {categoryLabels[category][language === 'ar' ? 'ar' : 'en']}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl card-shadow p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}
                <span className="text-xs ms-2">
                  ({filterStartDate} → {filterEndDate})
                </span>
              </p>
              <p className="text-2xl font-bold">{totalExpenses.toLocaleString()} EGP</p>
            </div>
          </div>

          {Object.keys(expensesByCategory).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t">
              {(Object.entries(expensesByCategory) as [ExpenseCategory, number][]).map(
                ([category, amount]) => (
                  <div key={category} className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${categoryColors[category]}`}>
                      {categoryIcons[category]}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabels[category][language === 'ar' ? 'ar' : 'en']}
                      </p>
                      <p className="font-semibold">{amount.toLocaleString()}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </motion.div>

        {/* Expenses List */}
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد مصروفات في هذه الفترة' : 'No expenses in this period'}
              </p>
            </div>
          ) : (
            filteredExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl card-shadow p-4 flex items-center gap-4"
              >
                <div className={`p-3 rounded-xl ${categoryColors[expense.category]}`}>
                  {categoryIcons[expense.category]}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {expense.amount.toLocaleString()} EGP
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                      {categoryLabels[expense.category][language === 'ar' ? 'ar' : 'en']}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {expense.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(expense.expenseDate, 'yyyy-MM-dd')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(expense)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(expense.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense
                  ? language === 'ar'
                    ? 'تعديل المصروف'
                    : 'Edit Expense'
                  : language === 'ar'
                  ? 'إضافة مصروف جديد'
                  : 'Add New Expense'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المبلغ (EGP)' : 'Amount (EGP)'}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ExpenseCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(categoryLabels) as ExpenseCategory[]).map(
                      (category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            {categoryIcons[category]}
                            {categoryLabels[category][language === 'ar' ? 'ar' : 'en']}
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={
                    language === 'ar' ? 'وصف اختياري...' : 'Optional description...'
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
                <Input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expenseDate: e.target.value })
                  }
                  dir="ltr"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingExpense
                    ? language === 'ar'
                      ? 'تحديث'
                      : 'Update'
                    : language === 'ar'
                    ? 'إضافة'
                    : 'Add'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ExpensesPage;
