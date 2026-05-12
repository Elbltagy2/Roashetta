import { useEffect, useRef, useState } from 'react';
import { saveDraft } from '@/lib/visit-draft';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Options {
  /** Set false to suspend auto-save (e.g. while the restore dialog is open). */
  enabled: boolean;
  /** Storage key. See getDraftKey() in visit-draft.ts. */
  key: string;
  /**
   * Memoized snapshot of all form fields. Reference equality is used to
   * detect changes, so callers should wrap this in useMemo with all the
   * underlying field values as dependencies.
   */
  snapshot: Record<string, unknown>;
  /** Debounce window in ms. Defaults to 1500. */
  debounceMs?: number;
}

interface Result {
  status: AutoSaveStatus;
  lastSavedAt: string | null;
  errorMessage: string | null;
}

export function useVisitDraftAutoSave({
  enabled,
  key,
  snapshot,
  debounceMs = 1500,
}: Options): Result {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const firstRunRef = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    // Skip the initial render so we don't immediately overwrite a draft
    // we may have just restored from storage.
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }

    setStatus('saving');
    const timer = setTimeout(() => {
      const result = saveDraft(key, snapshot);
      if (result.ok) {
        setStatus('saved');
        setLastSavedAt(new Date().toISOString());
        setErrorMessage(null);
      } else {
        setStatus('error');
        setErrorMessage(result.message);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [enabled, key, snapshot, debounceMs]);

  // Reset first-run flag when the storage key changes so a different
  // visit doesn't inherit stale state.
  useEffect(() => {
    firstRunRef.current = true;
    setStatus('idle');
    setLastSavedAt(null);
    setErrorMessage(null);
  }, [key]);

  return { status, lastSavedAt, errorMessage };
}
