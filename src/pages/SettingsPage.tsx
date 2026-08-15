import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, DollarSign, Save, Loader2, HardDrive, DatabaseBackup, Folder, FolderOpen, ArrowUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import api, { Settings as SettingsType, FolderBrowseResult } from '@/services/api';
import UpdatesPanel from '@/components/settings/UpdatesPanel';

const SettingsPage: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [, setSettings] = useState<SettingsType | null>(null);
  const [formData, setFormData] = useState({
    newVisitPrice: '',
    followupVisitPrice: '',
    consultationPrice: '',
    backupPath: '',
  });
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [browse, setBrowse] = useState<FolderBrowseResult | null>(null);
  const [isBrowsing, setIsBrowsing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSettings();
      setSettings(data);
      setFormData({
        newVisitPrice: data.newVisitPrice.toString(),
        followupVisitPrice: data.followupVisitPrice.toString(),
        consultationPrice: (data.consultationPrice ?? 0).toString(),
        backupPath: data.backupPath || '',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: language === 'ar' ? 'فشل في تحميل الإعدادات' : 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      const updatedSettings = await api.updateSettings({
        newVisitPrice: parseFloat(formData.newVisitPrice) || 0,
        followupVisitPrice: parseFloat(formData.followupVisitPrice) || 0,
        consultationPrice: parseFloat(formData.consultationPrice) || 0,
        backupPath: formData.backupPath.trim(),
      });
      setSettings(updatedSettings);
      toast({
        title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: language === 'ar' ? 'فشل في حفظ الإعدادات' : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadFolders = async (path?: string) => {
    try {
      setIsBrowsing(true);
      setBrowse(await api.browseFolders(path));
    } catch (error) {
      toast({
        title: language === 'ar' ? 'فشل في فتح المجلد' : 'Failed to open folder',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setIsBrowsing(false);
    }
  };

  const openPicker = () => {
    setPickerOpen(true);
    loadFolders(); // start at the drive list (USB drives show up here)
  };

  const selectCurrentFolder = () => {
    if (browse?.path) {
      setFormData((prev) => ({ ...prev, backupPath: browse.path }));
    }
    setPickerOpen(false);
  };

  const handleBackupNow = async () => {
    try {
      setIsBackingUp(true);
      // Save the path first so the backup uses what's typed in the field
      await api.updateSettings({ backupPath: formData.backupPath.trim() });
      const result = await api.backupNow();
      toast({
        title: result.ok
          ? language === 'ar' ? 'تم النسخ الاحتياطي بنجاح' : 'Backup completed'
          : language === 'ar' ? 'فشل النسخ الاحتياطي' : 'Backup failed',
        description: result.destination || result.message,
        variant: result.ok ? undefined : 'destructive',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'فشل النسخ الاحتياطي' : 'Backup failed',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  if (isLoading) {
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'إدارة إعدادات العيادة' : 'Manage clinic settings'}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl card-shadow p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {language === 'ar' ? 'أسعار الكشف' : 'Visit Prices'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? 'تعيين الأسعار الافتراضية للكشوفات'
                  : 'Set default prices for visits'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold">
                    {language === 'ar' ? 'ج' : 'N'}
                  </span>
                  {language === 'ar' ? 'سعر الكشف الجديد (EGP)' : 'New Visit Price (EGP)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.newVisitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, newVisitPrice: e.target.value })
                  }
                  placeholder="0.00"
                  dir="ltr"
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'ar'
                    ? 'السعر للمرضى الجدد أو الكشف الأول'
                    : 'Price for new patients or first visit'}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                    {language === 'ar' ? 'م' : 'F'}
                  </span>
                  {language === 'ar' ? 'سعر كشف المتابعة (EGP)' : 'Follow-up Visit Price (EGP)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.followupVisitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, followupVisitPrice: e.target.value })
                  }
                  placeholder="0.00"
                  dir="ltr"
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'ar'
                    ? 'السعر لنص الكشف والزيارات المتكررة'
                    : 'Price for half examination and recurring visits'}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold">
                    {language === 'ar' ? 'س' : 'C'}
                  </span>
                  {language === 'ar' ? 'سعر الاستشارة (EGP)' : 'Consultation Price (EGP)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.consultationPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, consultationPrice: e.target.value })
                  }
                  placeholder="0.00"
                  dir="ltr"
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'ar'
                    ? 'سعر الاستشارة — الكشف المجاني دائماً بدون رسوم'
                    : 'Consultation price — free examination is always zero'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button type="submit" disabled={isSaving} className="w-full sm:w-auto gap-2">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving
                  ? language === 'ar'
                    ? 'جاري الحفظ...'
                    : 'Saving...'
                  : language === 'ar'
                  ? 'حفظ الإعدادات'
                  : 'Save Settings'}
              </Button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl card-shadow p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {language === 'ar' ? 'النسخ الاحتياطي' : 'Backup'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? 'نسخ قاعدة البيانات وجميع الملفات (صور، PDF، رسومات) إلى فلاشة USB'
                  : 'Copy the database and all files (photos, PDFs, drawings) to a USB drive'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {language === 'ar' ? 'مجلد النسخ الاحتياطي' : 'Backup folder'}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={formData.backupPath}
                  onChange={(e) =>
                    setFormData({ ...formData, backupPath: e.target.value })
                  }
                  placeholder={language === 'ar' ? 'مثال: E:\\' : 'e.g. E:\\'}
                  dir="ltr"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={openPicker} className="gap-2 shrink-0">
                  <FolderOpen className="w-4 h-4" />
                  {language === 'ar' ? 'استعراض' : 'Browse'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar'
                  ? 'اختر الفلاشة أو المجلد. سيتم إنشاء مجلد RoashettaBackup بداخله. النسخ يتم تلقائياً كل يوم وعند إغلاق البرنامج.'
                  : 'Pick the USB drive or folder. A RoashettaBackup folder is created inside it. Backups also run automatically daily and on shutdown.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
              <Button
                type="button"
                onClick={handleBackupNow}
                disabled={isBackingUp || !formData.backupPath.trim()}
                className="gap-2"
              >
                {isBackingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <DatabaseBackup className="w-4 h-4" />
                )}
                {isBackingUp
                  ? language === 'ar' ? 'جاري النسخ...' : 'Backing up...'
                  : language === 'ar' ? 'نسخ احتياطي الآن' : 'Backup Now'}
              </Button>
            </div>
          </div>
        </motion.div>

        <UpdatesPanel />

        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'اختر مجلد النسخ الاحتياطي' : 'Select backup folder'}
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-2 min-w-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                disabled={browse?.parent === null || browse?.parent === undefined || isBrowsing}
                onClick={() => loadFolders(browse?.parent || undefined)}
                title={language === 'ar' ? 'المجلد الأعلى' : 'Up one level'}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <div className="flex-1 min-w-0 text-sm bg-muted rounded-md px-3 py-2 truncate" dir="ltr">
                {browse?.path || (language === 'ar' ? 'الأقراص' : 'Drives')}
              </div>
            </div>

            <div className="h-64 overflow-y-auto rounded-md border divide-y">
              {isBrowsing ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : browse && browse.dirs.length > 0 ? (
                browse.dirs.map((dir) => (
                  <button
                    key={dir.path}
                    type="button"
                    onClick={() => loadFolders(dir.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent text-start"
                  >
                    {browse.path === '' ? (
                      <HardDrive className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 text-primary shrink-0" />
                    )}
                    <span className="truncate" dir="ltr">{dir.name}</span>
                  </button>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  {language === 'ar' ? 'لا توجد مجلدات' : 'No folders'}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={selectCurrentFolder}
                disabled={!browse?.path || isBrowsing}
                className="gap-2"
              >
                <Folder className="w-4 h-4" />
                {language === 'ar' ? 'اختيار هذا المجلد' : 'Select this folder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
