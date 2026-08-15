// On-demand cache for scans, photos and PDFs.
//
// Sync stores only each file's server path (remoteUrl). The bytes are fetched
// the first time the doctor actually opens the file, then kept on disk so it
// works offline afterwards. Downloading everything during sync meant thousands
// of files and gigabytes over clinic wifi — a sync that took over half an hour
// and had not finished half the patients.

import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from './api';
import * as db from './db';

const CACHE_DIR = FileSystem.documentDirectory + 'file-cache/';

export type CachedTable = 'previous_investigations' | 'patient_records' | 'visit_attachments';

function extensionFor(remoteUrl: string, fileType?: string): string {
  const fromPath = remoteUrl.includes('.') ? remoteUrl.split('.').pop() : '';
  if (fromPath && fromPath.length <= 5) return fromPath;
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/heic': 'heic',
    'image/webp': 'webp',
  };
  return (fileType && map[fileType]) || 'bin';
}

/**
 * Returns a local file path for the row, downloading it if this is the first
 * open. Returns null when the file is not cached and the server is unreachable.
 */
export async function ensureLocalFile(
  table: CachedTable,
  row: { id: string; localPath?: string; remoteUrl?: string; fileType?: string }
): Promise<string | null> {
  if (row.localPath) {
    try {
      const info = await FileSystem.getInfoAsync(row.localPath);
      if (info.exists) return row.localPath;
    } catch { /* fall through and re-download */ }
  }

  if (!row.remoteUrl) return null;

  try {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    const dest = CACHE_DIR + row.id + '.' + extensionFor(row.remoteUrl, row.fileType);

    const existing = await FileSystem.getInfoAsync(dest);
    if (!existing.exists) {
      const serverBase = API_URL.replace(/\/api$/, '');
      // Tolerate rows that stored the display path ("/files/...") rather than
      // the storage path, which would otherwise request /files/files/...
      const remotePath = row.remoteUrl.replace(/^\/?files\//, '');
      const res = await FileSystem.downloadAsync(`${serverBase}/files/${remotePath}`, dest);
      if (res.status !== 200) {
        await FileSystem.deleteAsync(dest, { idempotent: true });
        return null;
      }
    }

    db.setLocalPath(table, row.id, dest);
    return dest;
  } catch {
    return null;
  }
}

/**
 * Downloads every file not yet on disk, so the whole record set is available
 * offline. Runs several at a time and skips what's already cached, so it can be
 * interrupted and resumed — closing the app mid-download loses nothing.
 */
export async function downloadAllPending(
  onProgress: (done: number, total: number, failed: number) => void,
  shouldStop: () => boolean = () => false
): Promise<{ done: number; failed: number }> {
  const pending = db.getPendingFiles();
  const total = pending.length;
  let done = 0;
  let failed = 0;

  if (!total) { onProgress(0, 0, 0); return { done: 0, failed: 0 }; }

  const CONCURRENCY = 6;
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    if (shouldStop()) break;
    await Promise.all(
      pending.slice(i, i + CONCURRENCY).map(async row => {
        const path = await ensureLocalFile(row.table, row);
        if (path) done++; else failed++;
        onProgress(done, total, failed);
      })
    );
  }
  return { done, failed };
}

/** Total bytes currently cached — shown in Settings so the doctor can judge storage use. */
export async function cacheSize(): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) return 0;
    const names = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let total = 0;
    for (const name of names) {
      const fileInfo = await FileSystem.getInfoAsync(CACHE_DIR + name);
      total += (fileInfo as any).size ?? 0;
    }
    return total;
  } catch { return 0; }
}

export async function clearCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
  } catch { /* best effort */ }
}
