import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, DollarSign, Save, Loader2, ScanLine, RefreshCw, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import api, { Settings as SettingsType, DiscoveredScanner } from '@/services/api';

const SettingsPage: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [formData, setFormData] = useState({
    newVisitPrice: '',
    followupVisitPrice: '',
  });

  // Scanner state
  const [scanners, setScanners] = useState<DiscoveredScanner[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [savingScannerUrl, setSavingScannerUrl] = useState<string | null>(null);

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

  const handleDiscoverScanners = async () => {
    setIsDiscovering(true);
    try {
      const found = await api.discoverScanners();
      setScanners(found);
      if (found.length === 0) {
        toast({
          title: language === 'ar'
            ? 'لم يتم العثور على ماسح ضوئي على الشبكة'
            : 'No scanners found on the network',
          description: language === 'ar'
            ? 'تأكد من تشغيل الماسح الضوئي وأنه متصل بنفس شبكة WiFi'
            : 'Make sure the scanner is on and connected to the same WiFi',
        });
      }
    } catch (error) {
      console.error('Discovery failed:', error);
      toast({
        title: language === 'ar' ? 'فشل البحث عن الماسح' : 'Scanner discovery failed',
        variant: 'destructive',
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSetDefaultScanner = async (scanner: DiscoveredScanner) => {
    setSavingScannerUrl(scanner.url);
    try {
      const updated = await api.setDefaultScanner({ url: scanner.url, name: scanner.name });
      setSettings(updated);
      toast({
        title: language === 'ar'
          ? `تم تعيين "${scanner.name}" كماسح افتراضي`
          : `Default scanner set to "${scanner.name}"`,
      });
    } catch (error) {
      console.error('Failed to save scanner:', error);
      toast({
        title: language === 'ar' ? 'فشل حفظ الماسح' : 'Failed to save scanner',
        variant: 'destructive',
      });
    } finally {
      setSavingScannerUrl(null);
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
                    ? 'السعر للمتابعات والزيارات المتكررة'
                    : 'Price for follow-up and recurring visits'}
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
              <ScanLine className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {language === 'ar' ? 'الماسح الضوئي على الشبكة' : 'Network Scanner'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? 'الاتصال بماسح ضوئي مشترك على نفس شبكة WiFi'
                  : 'Connect to a scanner on the same WiFi network'}
              </p>
            </div>
          </div>

          {settings?.lastScannerUrl ? (
            <div className="mb-4 p-4 rounded-xl border border-border bg-muted/30">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {language === 'ar' ? 'الماسح الافتراضي' : 'Default scanner'}
              </div>
              <div className="font-medium">{settings.lastScannerName || settings.lastScannerUrl}</div>
              <div className="text-xs text-muted-foreground break-all mt-1">{settings.lastScannerUrl}</div>
            </div>
          ) : (
            <div className="mb-4 p-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              {language === 'ar'
                ? 'لم يتم تعيين ماسح افتراضي بعد'
                : 'No default scanner set yet'}
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleDiscoverScanners}
            disabled={isDiscovering}
            className="gap-2"
          >
            {isDiscovering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {language === 'ar' ? 'البحث عن ماسحات' : 'Discover Scanners'}
          </Button>

          {scanners.length > 0 && (
            <div className="mt-4 space-y-2">
              {scanners.map((scanner) => {
                const isCurrent = settings?.lastScannerUrl === scanner.url;
                const isSavingThis = savingScannerUrl === scanner.url;
                return (
                  <div
                    key={scanner.url}
                    className="flex items-center justify-between p-3 rounded-xl border border-border"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{scanner.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {scanner.host}:{scanner.port}
                        {scanner.secure ? ' · HTTPS' : ''}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isCurrent ? 'secondary' : 'default'}
                      disabled={isCurrent || isSavingThis}
                      onClick={() => handleSetDefaultScanner(scanner)}
                      className="gap-2"
                    >
                      {isSavingThis ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isCurrent ? (
                        <Check className="w-3 h-3" />
                      ) : null}
                      {isCurrent
                        ? language === 'ar' ? 'الافتراضي' : 'Default'
                        : language === 'ar' ? 'تعيين كافتراضي' : 'Set as default'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
