import { makeClient, API_URL } from './api';
import * as db from './db';
import { saveVisitCanvases } from './canvasService';
import { downloadAllPending } from './fileCache';
import * as FileSystem from 'expo-file-system/legacy';

const INV_DIR = FileSystem.documentDirectory + 'investigations/';
const RECORDS_DIR = FileSystem.documentDirectory + 'patient-records/';
const ATTACH_DIR = FileSystem.documentDirectory + 'visit-attachments/';

export interface SyncProgress {
  current: number;
  total: number;
  message: string;
  phase: 'patients' | 'drawings';
}

const CANVAS_BATCH = 3;   // concurrent visit fetches for drawings
const PATIENT_BATCH = 6;  // concurrent patients in phase 1 (4 requests each)

// Guesses a file extension from the MIME type the server stored, so a
// downloaded file keeps an extension the OS viewer understands.
function extFromType(type: string, fallback = 'bin'): string {
  if (!type) return fallback;
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/heic': 'heic',
    'image/webp': 'webp',
  };
  return map[type] || type.split('/').pop() || fallback;
}

/**
 * Pulls one visit's attachments and caches each file on the device.
 *
 * The API field is named `dataUrl` for historical reasons but now holds a
 * relative storage path (e.g. "attachments/<id>.pdf") served from /files.
 * Older databases can still hold a real base64 data: URI, so both are handled.
 */
async function syncVisitAttachments(client: any, visitId: string, serverBase: string) {
  const res = await client.get(`/visits/${visitId}/attachments`);
  const rows: any[] = res.data || [];
  if (!rows.length) {
    db.deleteAttachmentsForVisit(visitId);
    return;
  }

  await FileSystem.makeDirectoryAsync(ATTACH_DIR, { intermediates: true });

  const attachments: any[] = [];
  for (const att of rows) {
    const source: string = att.dataUrl || '';
    let localPath = '';
    let remoteUrl = '';

    if (source.startsWith('data:')) {
      // Legacy inline base64 — already in hand, so write it out now.
      try {
        const dest = ATTACH_DIR + att.id + '.' + extFromType(att.type);
        const info = await FileSystem.getInfoAsync(dest);
        if (!info.exists) {
          await FileSystem.writeAsStringAsync(dest, source.split(',')[1] || '', {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        localPath = dest;
      } catch { /* listed but not openable */ }
    } else if (source) {
      // Photos and PDFs are downloaded on first open, not during sync.
      remoteUrl = source;
    }

    attachments.push({
      id: att.id,
      visitId,
      name: att.name || '',
      fileType: att.type || '',
      localPath,
      remoteUrl,
      uploadedAt: att.createdAt || '',
    });
  }

  db.deleteAttachmentsForVisit(visitId);
  db.insertVisitAttachments(attachments);
}

async function runBatched<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(fn));
  }
}

/** Default staleness window for automatic syncs. Slightly under the 30 min
 *  background interval so an OS slot that fires a little early still syncs. */
export const AUTO_SYNC_MAX_AGE_MS = 25 * 60 * 1000;

// Single-flight guard. Background fetch, a foreground resume and the manual
// button can all fire at once; running two full sweeps concurrently would
// double every download and interleave writes to the same tables.
//
// Callers that arrive while a sweep is in flight JOIN it — they await the same
// promise and receive its progress — rather than returning early. Returning
// early made the caller believe the sync had finished when only the patient
// names were in (they are inserted first, before the per-patient detail loop),
// so the UI showed a full list with empty visits.
let inFlight: Promise<number> | null = null;
const progressListeners = new Set<(p: SyncProgress) => void>();

export function isSyncRunning(): boolean {
  return inFlight !== null;
}

export async function runSync(
  token: string,
  onProgress: (p: SyncProgress) => void
): Promise<number> {
  progressListeners.add(onProgress);
  try {
    if (!inFlight) {
      inFlight = performSync(token, p => {
        progressListeners.forEach(listener => {
          try { listener(p); } catch { /* a bad listener must not kill the sync */ }
        });
      }).finally(() => { inFlight = null; });
    }
    return await inFlight;
  } finally {
    progressListeners.delete(onProgress);
  }
}

/**
 * Syncs only if the last successful sync is older than `maxAgeMs`.
 * Used by the automatic triggers so resuming the app repeatedly doesn't
 * re-download everything each time.
 */
export async function runSyncIfDue(
  token: string,
  maxAgeMs: number = AUTO_SYNC_MAX_AGE_MS,
  onProgress: (p: SyncProgress) => void = () => {}
): Promise<'synced' | 'fresh' | 'busy'> {
  // A sweep is already running — it will finish on its own. Automatic triggers
  // don't need to wait for it, unlike the manual button in runSync().
  if (inFlight) return 'busy';

  const last = db.getSyncMeta('lastSyncAt');
  if (last) {
    const age = Date.now() - new Date(last).getTime();
    if (Number.isFinite(age) && age < maxAgeMs) return 'fresh';
  }

  await runSync(token, onProgress);
  return 'synced';
}

async function performSync(
  token: string,
  onProgress: (p: SyncProgress) => void
): Promise<number> {
  const client = makeClient(token);

  // ── Phase 1: patients + visit metadata ─────────────────────────────────
  onProgress({ current: 0, total: 1, message: 'Fetching patients…', phase: 'patients' });

  const patientsRes = await client.get('/patients');
  const patients: any[] = patientsRes.data;
  const total = patients.length;

  onProgress({ current: 0, total, message: `Syncing ${total} patients…`, phase: 'patients' });

  db.insertPatients(patients);

  // Visit history first, on its own. This used to fetch labs, investigations
  // and records in the same pass — 4 requests per patient, ~2000 round trips
  // before the visit list was usable. Those three are extras most patients
  // don't have, so they moved to phase 3.
  let patientsDone = 0;
  await runBatched(patients, PATIENT_BATCH, async (p: any) => {
    const visitsRes = await client
      .get(`/visits/patient/${p.id}`)
      .catch(() => ({ data: [] as any[] }));

    db.insertVisits(visitsRes.data);

    patientsDone++;
    onProgress({ current: patientsDone, total, message: `${patientsDone}/${total}: ${p.name}`, phase: 'patients' });
  });

  // ── Phase 2: full visits (drawings, checklists, attachments) ────────────
  // Only visits that are new or changed since the last sync. Everything else
  // is already on disk, so a repeat sync costs almost nothing.
  const visitIds = db.getVisitIdsNeedingFullSync();
  const visitTotal = visitIds.length;
  let visitDone = 0;

  onProgress({ current: 0, total: visitTotal, message: `Downloading ${visitTotal} new/changed visits…`, phase: 'drawings' });

  await runBatched(visitIds, CANVAS_BATCH, async (visitId) => {
    try {
      const res = await client.get(`/visits/${visitId}`);
      db.updateVisitFullData(visitId, res.data);
      const serverBase = API_URL.replace(/\/api$/, '');
      try { await saveVisitCanvases(visitId, res.data, serverBase); } catch { /* skip bad canvas */ }
      try { await syncVisitAttachments(client, visitId, serverBase); } catch { /* skip attachments */ }
      // Only mark complete once everything above succeeded, so a partial
      // sync is retried next time instead of being treated as done.
      db.markVisitFullySynced(visitId, res.data?.updatedAt ?? '');
      // A changed visit usually means new lab results or records for that
      // patient too, so let phase 3 re-pull their extras this same run.
      if (res.data?.patientId) db.markExtrasStale(res.data.patientId);
    } catch {
      // skip if visit fetch fails
    } finally {
      visitDone++;
      onProgress({
        current: visitDone,
        total: visitTotal,
        message: `Drawings: ${visitDone}/${visitTotal}`,
        phase: 'drawings',
      });
    }
  });

  // ── Phase 3: extras (lab results, investigations, records) ──────────────
  // Runs last, and only for patients whose extras were never pulled. Most
  // patients have none, so this is cheap after the first sync — and if the
  // doctor closes the app here, the core records are already complete.
  const extrasPending = patients.filter((p: any) => !db.hasExtrasSynced(p.id));
  const extrasTotal = extrasPending.length;
  let extrasDone = 0;

  if (extrasTotal > 0) {
    onProgress({ current: 0, total: extrasTotal, message: `Lab results & records for ${extrasTotal} patients…`, phase: 'drawings' });

    const serverBase = API_URL.replace(/\/api$/, '');

    await runBatched(extrasPending, PATIENT_BATCH, async (p: any) => {
      try {
        const [labRes, invRes, recRes] = await Promise.all([
          client.get(`/lab-results/patient/${p.id}`).catch(() => ({ data: [] as any[] })),
          client.get(`/previous-investigations/patient/${p.id}`).catch(() => ({ data: [] as any[] })),
          client.get(`/patient-records/patient/${p.id}`).catch(() => ({ data: [] as any[] })),
        ]);

        db.insertLabResults(labRes.data);

        // Metadata only. The scan/photo itself is fetched by fileCache when the
        // doctor opens it — this clinic has 2,442 of these files.
        db.deleteInvestigationsForPatient(p.id);
        db.insertPreviousInvestigations(toFileRows(invRes.data as any[]));

        db.deleteRecordsForPatient(p.id);
        db.insertPatientRecords(toFileRows(recRes.data as any[]));

        db.markExtrasSynced(p.id);
      } catch {
        // leave unmarked so the next sync retries this patient
      } finally {
        extrasDone++;
        onProgress({ current: extrasDone, total: extrasTotal, message: `Records: ${extrasDone}/${extrasTotal}`, phase: 'drawings' });
      }
    });
  }

  // ── Phase 4: files for offline use ──────────────────────────────────────
  // Every scan, photo and PDF, downloaded several at a time and skipping what
  // is already on disk. Interrupting it costs nothing — the next sync picks up
  // exactly where this one stopped. Turn off in Settings to keep syncs light.
  if (db.getSyncMeta('offlineFiles') !== '0') {
    const pendingCount = db.countPendingFiles();
    if (pendingCount > 0) {
      onProgress({ current: 0, total: pendingCount, message: `Downloading ${pendingCount} files for offline use…`, phase: 'drawings' });
      await downloadAllPending((done, filesTotal, failed) => {
        onProgress({
          current: done,
          total: filesTotal,
          message: `Files: ${done}/${filesTotal}${failed ? ` (${failed} failed)` : ''}`,
          phase: 'drawings',
        });
      });
    }
  }

  const now = new Date().toISOString();
  db.setSyncMeta('lastSyncAt', now);
  db.setSyncMeta('patientCount', String(total));

  return total;
}

/** Keeps the server path so the file can be fetched on first open. */
function toFileRows(rows: any[]): any[] {
  return rows.map(row => ({ ...row, remoteUrl: row.fileUrl || '', localPath: '' }));
}
