// Local-storage drafts for the new/edit visit form.
// Persists across browser closes so a doctor can resume mid-visit
// after a crash, accidental close, or refresh.

const PREFIX = 'visit-draft:';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SCHEMA_VERSION = 1;

export interface VisitDraftEnvelope {
  version: number;
  savedAt: string; // ISO timestamp
  data: Record<string, unknown>;
}

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: 'quota' | 'unknown'; message: string };

export function getDraftKey(patientId: string, visitId?: string): string {
  return visitId
    ? `${PREFIX}edit:${visitId}`
    : `${PREFIX}new:${patientId}`;
}

export function saveDraft(
  key: string,
  data: Record<string, unknown>
): SaveResult {
  const envelope: VisitDraftEnvelope = {
    version: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    data,
  };
  try {
    localStorage.setItem(key, JSON.stringify(envelope));
    return { ok: true };
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      return {
        ok: false,
        reason: 'quota',
        message: 'Browser storage is full — draft was not saved.',
      };
    }
    return {
      ok: false,
      reason: 'unknown',
      message: err instanceof Error ? err.message : 'Failed to save draft',
    };
  }
}

export function loadDraft(key: string): VisitDraftEnvelope | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VisitDraftEnvelope;
    if (!parsed || !parsed.savedAt || !parsed.data) {
      localStorage.removeItem(key);
      return null;
    }
    if (parsed.version !== SCHEMA_VERSION) {
      localStorage.removeItem(key);
      return null;
    }
    const age = Date.now() - new Date(parsed.savedAt).getTime();
    if (age > MAX_AGE_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return null;
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
