import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Download,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import api, { UpdateState } from '@/services/api';

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export const UpdatesPanel: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [state, setState] = useState<UpdateState | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getUpdateInfo()
      .then((info) => {
        if (!cancelled) setState(info);
      })
      .catch(() => {
        // silent on initial load
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll download progress when an install is in flight
  useEffect(() => {
    if (state?.downloadStatus.state !== 'downloading') return;
    const id = setInterval(async () => {
      try {
        const fresh = await api.getUpdateInfo();
        setState(fresh);
        if (fresh.downloadStatus.state !== 'downloading') {
          clearInterval(id);
        }
      } catch {
        // ignore
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state?.downloadStatus.state]);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const fresh = await api.checkForUpdates();
      setState(fresh);
      if (fresh.lastCheckError) {
        toast({
          title: language === 'ar' ? 'تعذر فحص التحديثات' : 'Update check failed',
          description: fresh.lastCheckError,
          variant: 'destructive',
        });
      } else if (
        fresh.manifest &&
        fresh.currentVersion !== fresh.manifest.version
      ) {
        toast({
          title: language === 'ar' ? 'يوجد تحديث جديد' : 'Update available',
          description: `${fresh.currentVersion} → ${fresh.manifest.version}`,
        });
      } else {
        toast({
          title: language === 'ar' ? 'لا توجد تحديثات' : 'Up to date',
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const fresh = await api.installUpdate();
      setState(fresh);
      if (fresh.downloadStatus.state === 'error') {
        toast({
          title: language === 'ar' ? 'فشل تنزيل التحديث' : 'Download failed',
          description: fresh.downloadStatus.message,
          variant: 'destructive',
        });
        return;
      }
      if (fresh.downloadStatus.state === 'downloaded') {
        toast({
          title: language === 'ar'
            ? 'تم التنزيل، جاري إعادة التشغيل...'
            : 'Downloaded, restarting...',
        });
        // Auto-restart immediately — no second button needed
        setTimeout(async () => {
          try {
            await api.restartForUpdate();
          } catch {
            // Server is restarting — connection drop is expected
          }
        }, 1500);
      }
    } catch (err) {
      toast({
        title: language === 'ar' ? 'فشل التحديث' : 'Update failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const currentVersion = state?.currentVersion ?? '—';
  const latestVersion = state?.manifest?.version ?? null;
  const updateAvailable =
    !!latestVersion && latestVersion !== currentVersion;
  const downloadStatus = state?.downloadStatus;
  const isDownloaded = downloadStatus?.state === 'downloaded';
  const isDownloading = downloadStatus?.state === 'downloading';
  const downloadError =
    downloadStatus?.state === 'error' ? downloadStatus.message : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl p-6 card-shadow"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <RotateCw className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {language === 'ar' ? 'التحديثات' : 'Updates'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === 'ar'
              ? 'تحقق من توفر إصدار جديد'
              : 'Check for a newer version of the app'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Version row */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
          <div>
            <div className="text-xs text-muted-foreground">
              {language === 'ar' ? 'الإصدار الحالي' : 'Current version'}
            </div>
            <div className="font-semibold">{currentVersion}</div>
          </div>
          {latestVersion && (
            <div className="text-end">
              <div className="text-xs text-muted-foreground">
                {language === 'ar' ? 'أحدث إصدار' : 'Latest version'}
              </div>
              <div className="font-semibold flex items-center gap-2 justify-end">
                {latestVersion}
                {updateAvailable ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {language === 'ar' ? 'جديد' : 'new'}
                  </span>
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Release notes */}
        {updateAvailable && state?.manifest?.notes && (
          <div className="p-3 rounded-xl border border-border bg-background">
            <div className="text-xs text-muted-foreground mb-1">
              {language === 'ar' ? 'ملاحظات الإصدار' : 'Release notes'}
            </div>
            <div className="text-sm whitespace-pre-wrap">
              {state.manifest.notes}
            </div>
          </div>
        )}

        {/* Download progress */}
        {isDownloading && downloadStatus.state === 'downloading' && (
          <div className="p-3 rounded-xl border border-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === 'ar' ? 'جاري التنزيل...' : 'Downloading…'}
              </span>
              <span className="text-muted-foreground">
                {formatBytes(downloadStatus.receivedBytes)}
                {downloadStatus.totalBytes > 0 &&
                  ` / ${formatBytes(downloadStatus.totalBytes)}`}
              </span>
            </div>
            {downloadStatus.totalBytes > 0 && (
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (downloadStatus.receivedBytes /
                        downloadStatus.totalBytes) *
                        100
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Error from last check */}
        {state?.lastCheckError && !state.manifest && (
          <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <span>{state.lastCheckError}</span>
          </div>
        )}

        {/* Error from last download */}
        {downloadError && (
          <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleCheck}
            disabled={isChecking || isInstalling || isDownloading}
            className="gap-2"
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {language === 'ar' ? 'فحص التحديثات' : 'Check for updates'}
          </Button>

          {updateAvailable && !isDownloaded && (
            <Button
              onClick={handleInstall}
              disabled={isInstalling || isDownloading}
              className="gap-2"
            >
              {isInstalling || isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {language === 'ar' ? 'تنزيل وتثبيت' : 'Download & install'}
            </Button>
          )}

          {isDownloaded && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {language === 'ar' ? 'جاري إعادة التشغيل...' : 'Restarting...'}
            </div>
          )}
        </div>

        {state?.lastCheckedAt && (
          <div className="text-xs text-muted-foreground">
            {language === 'ar' ? 'آخر فحص:' : 'Last checked:'}{' '}
            {new Date(state.lastCheckedAt).toLocaleString(
              language === 'ar' ? 'ar-EG' : 'en-US'
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UpdatesPanel;
