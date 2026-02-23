import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  ChevronUp,
  ChevronDown,
  Play,
  Check,
  X,
  ClipboardList,
  Clock,
  Loader2,
  User,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import api, { QueueEntry, QueueStatus } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const QueuePage: React.FC = () => {
  const { t, language } = useLanguage();
  const { patients, setCurrentPatient, currentPatient } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [confirmEntry, setConfirmEntry] = useState<QueueEntry | null>(null);
  const [isSettingCurrent, setIsSettingCurrent] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      const entries = await api.getQueue();
      setQueue(entries);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const waitingCount = useMemo(
    () => queue.filter(e => e.status === 'waiting').length,
    [queue]
  );

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const queuePatientIds = new Set(queue.map(e => e.patientId));
    return patients
      .filter(p =>
        !queuePatientIds.has(p.id) &&
        (p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.fileNumber && p.fileNumber.includes(q)))
      )
      .slice(0, 8);
  }, [searchQuery, patients, queue]);

  const handleAddToQueue = async (patientId: string) => {
    try {
      const entry = await api.addToQueue({ patientId });
      setQueue(prev => [...prev, entry]);
      setSearchQuery('');
      setShowSearch(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already')) {
        toast({
          title: t('queue.alreadyInQueue'),
          variant: 'destructive',
        });
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: QueueStatus) => {
    try {
      const updated = await api.updateQueueEntry(id, { status });
      setQueue(prev => prev.map(e => (e.id === id ? updated : e)));
    } catch {
      // silent
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await api.removeFromQueue(id);
      setQueue(prev => prev.filter(e => e.id !== id));
    } catch {
      // silent
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newQueue = [...queue];
    const current = newQueue[index];
    const above = newQueue[index - 1];

    const tempPos = current.position;
    current.position = above.position;
    above.position = tempPos;

    newQueue[index] = above;
    newQueue[index - 1] = current;

    setQueue(newQueue);

    try {
      await api.reorderQueue([
        { id: current.id, position: current.position },
        { id: above.id, position: above.position },
      ]);
    } catch {
      loadQueue();
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= queue.length - 1) return;
    const newQueue = [...queue];
    const current = newQueue[index];
    const below = newQueue[index + 1];

    const tempPos = current.position;
    current.position = below.position;
    below.position = tempPos;

    newQueue[index] = below;
    newQueue[index + 1] = current;

    setQueue(newQueue);

    try {
      await api.reorderQueue([
        { id: current.id, position: current.position },
        { id: below.id, position: below.position },
      ]);
    } catch {
      loadQueue();
    }
  };

  const handleMakeCurrent = (entry: QueueEntry) => {
    if (currentPatient && currentPatient.id !== entry.patientId) {
      setConfirmEntry(entry);
    } else {
      doSetCurrentPatient(entry);
    }
  };

  const doSetCurrentPatient = async (entry: QueueEntry) => {
    setIsSettingCurrent(true);
    try {
      await setCurrentPatient(entry.patientId);
    } catch {
      // silent
    } finally {
      setIsSettingCurrent(false);
      setConfirmEntry(null);
    }
  };

  const handleStatusSelect = async (entry: QueueEntry, status: QueueStatus) => {
    await handleUpdateStatus(entry.id, status);
    setStatusDropdownId(null);
  };

  const statusBadge = (status: QueueStatus) => {
    const styles: Record<QueueStatus, string> = {
      waiting: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
      'in-progress': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
      done: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
    };
    const icons: Record<QueueStatus, React.ReactNode> = {
      waiting: <Clock className="w-3 h-3" />,
      'in-progress': <Play className="w-3 h-3" />,
      done: <Check className="w-3 h-3" />,
    };
    const labels: Record<QueueStatus, string> = {
      waiting: t('queue.waiting'),
      'in-progress': t('queue.inProgress'),
      done: t('queue.done'),
    };
    return (
      <button
        type="button"
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors',
          styles[status]
        )}
      >
        {icons[status]}
        {labels[status]}
      </button>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('queue.title')}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {waitingCount} {t('queue.patientCount')}
            </p>
          </div>
          <Button
            onClick={() => setShowSearch(!showSearch)}
            className="gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {t('queue.addPatient')}
          </Button>
        </div>

        {/* Search to add patient */}
        {showSearch && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('queue.searchPatient')}
                className="ps-10"
                autoFocus
              />
            </div>

            {filteredPatients.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddToQueue(p.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="text-start">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.phone}</p>
                    </div>
                    <UserPlus className="w-4 h-4 text-primary" />
                  </button>
                ))}
              </div>
            )}

            {searchQuery.trim() && filteredPatients.length === 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg p-4 text-center text-muted-foreground text-sm">
                {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
              </div>
            )}
          </div>
        )}

        {/* Queue List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ClipboardList className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">{t('queue.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((entry, index) => {
              const isCurrent = currentPatient?.id === entry.patientId;
              const isStatusOpen = statusDropdownId === entry.id;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-3 p-4 bg-card border rounded-xl transition-all',
                    entry.status === 'done' && 'opacity-50',
                    entry.status === 'in-progress' && 'border-primary/50 bg-primary/5',
                    isCurrent && 'ring-2 ring-primary/30',
                    entry.status !== 'done' && entry.status !== 'in-progress' && 'border-border'
                  )}
                >
                  {/* Position number */}
                  <div className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
                    entry.status === 'in-progress'
                      ? 'bg-primary text-primary-foreground'
                      : entry.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-primary/10 text-primary'
                  )}>
                    {index + 1}
                  </div>

                  {/* Patient info — click to view profile */}
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-start hover:opacity-70 transition-opacity"
                    onClick={() => navigate(`/patients/${entry.patientId}`)}
                  >
                    <p className="font-semibold text-foreground truncate">
                      {entry.patientName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.patientPhone}
                      <span className="mx-1.5">•</span>
                      {new Date(entry.addedAt).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>

                  {/* Set as current patient button */}
                  <Button
                    variant={isCurrent ? 'secondary' : 'outline'}
                    size="sm"
                    className={cn('flex-shrink-0 gap-1.5', isCurrent && 'pointer-events-none')}
                    onClick={() => handleMakeCurrent(entry)}
                    disabled={isCurrent}
                  >
                    <User className="w-4 h-4" />
                    {isCurrent
                      ? (language === 'ar' ? 'الحالي' : 'Current')
                      : t('queue.setCurrentPatient')}
                  </Button>

                  {/* Status badge — click to open status dropdown */}
                  <div className="flex-shrink-0 relative">
                    <div onClick={() => setStatusDropdownId(isStatusOpen ? null : entry.id)}>
                      {statusBadge(entry.status)}
                    </div>

                    {isStatusOpen && (
                      <div className="absolute z-30 top-full mt-1 end-0 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                        {(['waiting', 'in-progress', 'done'] as QueueStatus[]).map(status => (
                          <button
                            key={status}
                            type="button"
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                              entry.status === status
                                ? 'bg-muted font-medium'
                                : 'hover:bg-muted/50'
                            )}
                            onClick={() => handleStatusSelect(entry, status)}
                          >
                            {status === 'waiting' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                            {status === 'in-progress' && <Play className="w-3.5 h-3.5 text-blue-600" />}
                            {status === 'done' && <Check className="w-3.5 h-3.5 text-green-600" />}
                            {status === 'waiting' && t('queue.waiting')}
                            {status === 'in-progress' && t('queue.inProgress')}
                            {status === 'done' && t('queue.done')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      title={language === 'ar' ? 'تقديم' : 'Move up'}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === queue.length - 1}
                      onClick={() => handleMoveDown(index)}
                      title={language === 'ar' ? 'تأخير' : 'Move down'}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(entry.id)}
                      title={t('queue.remove')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Replace Current Patient Confirmation */}
      <AlertDialog open={!!confirmEntry} onOpenChange={(open) => !open && setConfirmEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'استبدال المريض الحالي؟' : 'Replace Current Patient?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? `المريض "${currentPatient?.name}" محدد حالياً. هل تريد استبداله بـ "${confirmEntry?.patientName}"؟`
                : `"${currentPatient?.name}" is currently selected. Replace with "${confirmEntry?.patientName}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmEntry && doSetCurrentPatient(confirmEntry)} disabled={isSettingCurrent}>
              {language === 'ar' ? 'استبدال' : 'Replace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default QueuePage;
