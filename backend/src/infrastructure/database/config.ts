import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Extend process for pkg compatibility
declare const process: NodeJS.Process & { pkg?: boolean };

dotenv.config();

// Database file path - when running from pkg, use exe directory
const getDbPath = (): string => {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  if (process.pkg) return path.join(path.dirname(process.execPath), 'roashetta.db');
  return path.join(__dirname, '..', '..', '..', 'roashetta.db');
};

const dbPath = getDbPath();
const dbDir = path.dirname(path.resolve(dbPath));

// When running from a pkg exe, better-sqlite3's native addon must be loaded
// from the directory containing the exe (shipped alongside it, like sql-wasm.wasm was).
const dbOptions: Database.Options = {};
if (process.pkg) {
  dbOptions.nativeBinding = path.join(path.dirname(process.execPath), 'better_sqlite3.node');
}

// Open (or create) the database. better-sqlite3 works directly with the file —
// no 2 GiB limit, no in-memory copy, no periodic manual saves needed.
type DB = InstanceType<typeof Database>;
const database: DB = new Database(dbPath, dbOptions);
export const db: DB = database;

// ── USB / external-drive backup ──────────────────────────────────────────────
// Full backup of everything onto a USB (or any external) drive:
//   <target>/RoashettaBackup/roashetta.db   consistent hot snapshot of the DB
//   <target>/RoashettaBackup/files/...      all uploaded files (photos, PDFs,
//                                           scans, canvas drawings)
//
// The target folder comes from the Settings page (backup_path column) and can
// still be overridden with the USB_BACKUP_PATH env var. Settings win.
//
// Why not a plain file copy of the live DB:
//   • In WAL mode recent writes live in roashetta.db-wal; copying only the .db
//     gives a torn, incomplete backup. better-sqlite3's .backup() takes a
//     consistent hot snapshot (WAL included) even while the server runs.
//   • Running the DB directly from USB corrupts it the moment the stick is
//     pulled mid-write. So we keep the live DB on local disk and only export.
//
// The DB snapshot is copy-then-swap: the previous good backup is never removed
// until the new one is fully written, so a full/unplugged drive can't leave you
// with zero backups. Files are synced incrementally (only new/changed copied),
// so repeated runs are cheap even with gigabytes of photos.
let usbBackupRunning = false;

// Backup folder configured in Settings. The clinic machine has one backup
// drive, so the first non-empty path wins regardless of which doctor set it.
function getConfiguredBackupPath(): string | null {
  try {
    const row = database
      .prepare(`SELECT backup_path FROM settings WHERE backup_path IS NOT NULL AND backup_path != '' LIMIT 1`)
      .get() as { backup_path: string } | undefined;
    if (row?.backup_path) return row.backup_path;
  } catch { /* settings table may not exist yet on first boot */ }
  return process.env.USB_BACKUP_PATH || null;
}

// Mirrors srcDir into destDir: copies only files that are missing or changed
// (size or mtime differ), and prunes anything in the backup that no longer
// exists in the source — so the backup never grows past the real data size.
// Prune runs FIRST to free space on a tight drive before new copies land.
function syncDir(srcDir: string, destDir: string): number {
  let copied = 0;
  fs.mkdirSync(destDir, { recursive: true });

  const srcNames = new Set(fs.readdirSync(srcDir));
  for (const name of fs.readdirSync(destDir)) {
    if (!srcNames.has(name)) {
      try { fs.rmSync(path.join(destDir, name), { recursive: true, force: true }); }
      catch (err) { console.error(`Backup: failed to prune ${name}:`, err); }
    }
  }

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      // A file where a folder should be (name reused) — clear it, then recurse.
      try {
        if (fs.existsSync(dest) && !fs.statSync(dest).isDirectory()) fs.rmSync(dest, { force: true });
      } catch { /* ignore */ }
      copied += syncDir(src, dest);
    } else if (entry.isFile()) {
      try {
        const s = fs.statSync(src);
        const d = fs.existsSync(dest) ? fs.statSync(dest) : null;
        if (d && d.isDirectory()) { fs.rmSync(dest, { recursive: true, force: true }); }
        if (!d || d.isDirectory() || d.size !== s.size || d.mtimeMs < s.mtimeMs) {
          fs.copyFileSync(src, dest);
          copied++;
        }
      } catch (err) {
        console.error(`Backup: failed to copy ${src}:`, err);
      }
    }
  }
  return copied;
}

export interface BackupResult {
  ok: boolean;
  message: string;
  destination?: string;
}

export async function backupToUsb(): Promise<BackupResult> {
  const target = getConfiguredBackupPath();
  if (!target) {
    return { ok: false, message: 'No backup folder configured. Set it in Settings.' };
  }
  if (usbBackupRunning) {
    return { ok: false, message: 'A backup is already running.' };
  }
  usbBackupRunning = true;

  const backupDir = path.join(target, 'RoashettaBackup');
  const dbFile = path.join(backupDir, 'roashetta.db');
  const tmpFile = `${dbFile}.tmp`;

  try {
    // Bail (don't crash) if the drive isn't connected right now.
    if (!fs.existsSync(target)) {
      const message = `Backup folder not found: ${target} (drive not connected?)`;
      console.warn(`⚠️  USB backup skipped: ${message}`);
      return { ok: false, message };
    }
    fs.mkdirSync(backupDir, { recursive: true });
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch { /* ignore */ }

    // 1. Consistent DB snapshot to a temp file, then swap in. The safe path
    // needs old + new DB on the drive at once; if that fails (drive too full),
    // fall back to deleting the old backup first and retrying once. Riskier —
    // a failure in the retry window leaves no DB backup — but strictly better
    // than never backing up again on a full drive.
    try {
      await database.backup(tmpFile);
    } catch (err) {
      try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch { /* ignore */ }
      if (!fs.existsSync(dbFile)) throw err; // nothing to free — real failure
      console.warn('⚠️  Backup drive too full for safe snapshot — deleting old DB backup and retrying once.');
      fs.unlinkSync(dbFile);
      await database.backup(tmpFile);
    }
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
    fs.renameSync(tmpFile, dbFile);

    // 2. Sync all uploaded files (photos, PDFs, scans, drawings).
    let copied = 0;
    const filesDir = getStorageDir();
    if (fs.existsSync(filesDir)) {
      copied = syncDir(filesDir, path.join(backupDir, 'files'));
    }

    console.log(`USB backup written: ${backupDir} (${copied} file(s) copied)`);
    return { ok: true, message: `Backup complete (${copied} file(s) copied).`, destination: backupDir };
  } catch (err) {
    console.error('USB backup failed (previous backup, if any, is intact):', err);
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    return { ok: false, message: `Backup failed: ${err instanceof Error ? err.message : String(err)}` };
  } finally {
    usbBackupRunning = false;
  }
}

// ── Initialise ────────────────────────────────────────────────────────────────

export async function initializeDatabase(): Promise<void> {
  // WAL mode: writes go to a tiny WAL file instead of the main DB, which
  // eliminates the Windows Defender EBUSY/EPERM locking issues on local disks.
  // BUT WAL needs mmap shared memory and is unsupported on USB/exFAT/FAT32 and
  // network drives — there SQLite silently falls back. When the DB lives on a
  // removable/network drive, set SQLITE_JOURNAL_MODE=DELETE.
  const allowedModes = ['WAL', 'DELETE', 'TRUNCATE', 'PERSIST', 'MEMORY', 'OFF'];
  const requested = (process.env.SQLITE_JOURNAL_MODE || 'WAL').toUpperCase();
  const journalMode = allowedModes.includes(requested) ? requested : 'WAL';
  const applied = String(database.pragma(`journal_mode = ${journalMode}`, { simple: true })).toUpperCase();
  if (applied !== journalMode) {
    console.warn(`⚠️  Requested journal_mode=${journalMode} but SQLite is using '${applied}'. ` +
      `On USB/network drives WAL is unsupported — set SQLITE_JOURNAL_MODE=DELETE for a durable database.`);
  }
  database.pragma('foreign_keys = ON');

  // Durability: fsync on every commit so a committed visit survives a power cut
  // or hard reset. With WAL + the default synchronous=NORMAL, the last commits
  // can silently roll back after power loss — unacceptable for medical records.
  // FULL is slightly slower per write but a clinic's write rate is trivial.
  database.pragma('synchronous = FULL');

  // In WAL mode, keep the -wal file small and flushed into the main DB often, so
  // little committed data lives only in the WAL (shrinks the window where a
  // deleted/quarantined .db-wal — e.g. by antivirus — could lose recent visits).
  if (applied === 'WAL') {
    database.pragma('wal_autocheckpoint = 256'); // ~1 MB
    setInterval(() => {
      try { database.pragma('wal_checkpoint(TRUNCATE)'); } catch { /* ignore transient locks */ }
    }, 5 * 60 * 1000).unref?.();
  }

  createTables();
  createDefaultDoctor();
  seedDrugs();

  // Migrate existing base64 blobs to files (one-time, skipped if already done)
  await migrateBase64ToFiles();

  // Log database size
  try {
    const stats = fs.statSync(dbPath);
    const dbMB = Math.round(stats.size / 1024 / 1024);
    if (dbMB > 100) {
      console.warn(`⚠️  Database size: ${dbMB} MB. Run file migration to reduce it.`);
    }
  } catch { /* ignore */ }

  // USB backup: once at startup (covers "clinic opens → yesterday's data lands
  // on the stick") and then on a timer. Default is daily; set
  // USB_BACKUP_INTERVAL_HOURS=1 for hourly — safe, won't crash. A snapshot also
  // runs on graceful shutdown (see index.ts) for the end-of-day case.
  // The timer always runs: the path comes from Settings and is re-read on every
  // tick, so it picks up a folder configured after startup with no restart.
  // Each run silently no-ops if no path is set or the drive isn't plugged in.
  backupToUsb();
  const hours = Math.max(1, Number(process.env.USB_BACKUP_INTERVAL_HOURS) || 24);
  setInterval(() => { backupToUsb(); }, hours * 60 * 60 * 1000);

  console.log('SQLite database initialized successfully');
}

// ── File migration ────────────────────────────────────────────────────────────
// Converts existing base64 data URLs stored in the DB to real files on disk.
// Runs once automatically; subsequent runs are instant (no base64 rows left).

export function getStorageDir(): string {
  // Explicit override wins (e.g. a dedicated media drive).
  if (process.env.STORAGE_DIR) return process.env.STORAGE_DIR;
  // Otherwise keep uploaded files next to the database file. dbDir already
  // honours DATABASE_PATH and the pkg exe location, so moving the DB to a USB
  // drive (DATABASE_PATH=E:\roashetta\roashetta.db) moves its files with it.
  return path.join(dbDir, 'files');
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Saves a base64 data URL to disk. Returns the relative path stored in the DB.
// Returns null if the value is not a base64 data URL (already migrated or empty).
function saveDataUrl(dataUrl: string, subdir: string, filename: string): string | null {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) return null;
    const base64 = match[2];
    const dir = path.join(getStorageDir(), subdir);
    ensureDir(dir);
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    return path.join(subdir, filename).replace(/\\/g, '/');
  } catch (err) {
    console.error(`Failed to save file ${filename}:`, err);
    return null;
  }
}

// Handles TEXT_MODE canvas data: extracts the inner dataUrl, saves it, and
// returns the TEXT_MODE JSON with the path instead of the base64.
function migrateDrawingData(data: string, subdir: string, filename: string): string | null {
  if (!data) return null;
  const TEXT_MODE_PREFIX = 'TEXT_MODE:';
  if (data.startsWith(TEXT_MODE_PREFIX)) {
    try {
      const parsed = JSON.parse(data.slice(TEXT_MODE_PREFIX.length)) as { text: string; dataUrl: string };
      if (parsed.dataUrl && parsed.dataUrl.startsWith('data:')) {
        const relPath = saveDataUrl(parsed.dataUrl, subdir, filename);
        if (relPath) return TEXT_MODE_PREFIX + JSON.stringify({ text: parsed.text, dataUrl: relPath });
      }
    } catch { /* leave as-is */ }
    return null; // already migrated or not a data URL
  }
  return saveDataUrl(data, subdir, filename);
}

// Tiny key/value table for one-off flags (e.g. "migration finished").
function getMeta(key: string): string | null {
  database.prepare(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)`).run();
  const row = database.prepare(`SELECT value FROM app_meta WHERE key = ?`).get(key) as { value: string } | undefined;
  return row?.value ?? null;
}
function setMeta(key: string, value: string): void {
  database.prepare(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)`).run();
  database.prepare(
    `INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

async function migrateBase64ToFiles() {
  // Once every base64 blob has been moved to a file, skip this entirely.
  // Previously it re-ran 14 full-table LIKE scans on `visits` on EVERY boot,
  // which is why startup got slow as the database grew.
  if (getMeta('base64_migration_v1') === 'done') {
    vacuumAfterMigration();
    return;
  }

  const storageDir = getStorageDir();
  ensureDir(storageDir);

  // Queries below are batched (LIMIT 500), so loop passes until a full pass
  // finds nothing — one startup finishes the whole migration instead of one
  // restart per 500 rows. `migrated` guards against rows whose file write
  // keeps failing (they would match forever): a pass that finds rows but
  // migrates none stops here and leaves the retry to the next startup.
  let foundAny = true;
  while (foundAny) {
    foundAny = false;
    let migrated = 0;

    // ── visit_attachments ────────────────────────────────────────────────────
    const attachments = database.prepare(
      `SELECT id, data_url FROM visit_attachments WHERE data_url LIKE 'data:%' LIMIT 500`
    ).all() as { id: string; data_url: string }[];

    if (attachments.length > 0) {
      foundAny = true;
      console.log(`Migrating ${attachments.length} visit attachments to files...`);
      const updateAttachment = database.prepare(`UPDATE visit_attachments SET data_url = ? WHERE id = ?`);
      const migrate = database.transaction(() => {
        for (const row of attachments) {
          const ext = row.data_url.split(';')[0].split('/')[1]?.split('+')[0] || 'bin';
          const relPath = saveDataUrl(row.data_url, 'attachments', `${row.id}.${ext}`);
          if (relPath) { updateAttachment.run(relPath, row.id); migrated++; }
        }
      });
      migrate();
      console.log(`  ✓ ${attachments.length} attachments migrated`);
    }

    // ── patient_records ──────────────────────────────────────────────────────
    const records = database.prepare(
      `SELECT id, file_url FROM patient_records WHERE file_url LIKE 'data:%' LIMIT 500`
    ).all() as { id: string; file_url: string }[];

    if (records.length > 0) {
      foundAny = true;
      console.log(`Migrating ${records.length} patient records to files...`);
      const updateRecord = database.prepare(`UPDATE patient_records SET file_url = ? WHERE id = ?`);
      const migrate = database.transaction(() => {
        for (const row of records) {
          const ext = row.file_url.split(';')[0].split('/')[1]?.split('+')[0] || 'bin';
          const relPath = saveDataUrl(row.file_url, 'records', `${row.id}.${ext}`);
          if (relPath) { updateRecord.run(relPath, row.id); migrated++; }
        }
      });
      migrate();
      console.log(`  ✓ ${records.length} records migrated`);
    }

    // ── previous_investigations ──────────────────────────────────────────────
    const investigations = database.prepare(
      `SELECT id, file_url FROM previous_investigations WHERE file_url LIKE 'data:%' LIMIT 500`
    ).all() as { id: string; file_url: string }[];

    if (investigations.length > 0) {
      foundAny = true;
      console.log(`Migrating ${investigations.length} investigations to files...`);
      const updateInv = database.prepare(`UPDATE previous_investigations SET file_url = ? WHERE id = ?`);
      const migrate = database.transaction(() => {
        for (const row of investigations) {
          const ext = row.file_url.split(';')[0].split('/')[1]?.split('+')[0] || 'bin';
          const relPath = saveDataUrl(row.file_url, 'records', `${row.id}.${ext}`);
          if (relPath) { updateInv.run(relPath, row.id); migrated++; }
        }
      });
      migrate();
      console.log(`  ✓ ${investigations.length} investigations migrated`);
    }

    // ── visit drawings (14 columns) ──────────────────────────────────────────
    const drawingCols = [
      'chief_complaint_drawing', 'diagnosis_drawing',
      'notes_drawing', 'notes_drawing_2', 'notes_drawing_3',
      'past_medical_history_drawing', 'hpi_drawing', 'drug_history_drawing',
      'family_history_drawing', 'current_medication_drawing',
      'radiology_drawing', 'radiology_drawing_2', 'radiology_drawing_3',
      'drawing_data',
    ];

    for (const col of drawingCols) {
      let visits: { id: string; [k: string]: string }[];
      try {
        // Match only rows that still hold base64: raw "data:..." or a TEXT_MODE
        // blob whose inner dataUrl is still base64. Already-migrated TEXT_MODE
        // rows hold a file path, so they no longer match (they used to re-match
        // every boot, which meant the migration never registered as finished).
        visits = database.prepare(
          `SELECT id, ${col} FROM visits WHERE ${col} LIKE 'data:%' OR ${col} LIKE '%dataUrl":"data:%' LIMIT 500`
        ).all() as { id: string; [k: string]: string }[];
      } catch { continue; } // column might not exist yet

      if (visits.length === 0) continue;
      foundAny = true;
      console.log(`Migrating ${visits.length} rows for visits.${col}...`);
      const updateVisit = database.prepare(`UPDATE visits SET ${col} = ? WHERE id = ?`);
      const migrate = database.transaction(() => {
        for (const row of visits) {
          const data = row[col];
          if (!data) continue;
          const relPath = migrateDrawingData(data, 'drawings', `${row.id}_${col}.png`);
          if (relPath) { updateVisit.run(relPath, row.id); migrated++; }
        }
      });
      migrate();
      console.log(`  ✓ visits.${col} migrated`);
    }

    if (foundAny && migrated === 0) {
      console.warn('⚠️  Some base64 rows could not be saved as files; will retry on next startup.');
      return;
    }
  }

  // A pass that found nothing left means the migration is complete — record it
  // so every future startup skips the scan and boots fast regardless of DB size.
  setMeta('base64_migration_v1', 'done');
  console.log('Base64→file migration complete; future startups will skip the scan.');
  vacuumAfterMigration();
}

// The migration UPDATEs old base64 blobs away, but SQLite keeps the freed
// pages inside the .db file (freelist), so a 2 GB file stays 2 GB. A one-time
// VACUUM rewrites the file with only live data and returns the space to the
// OS. Needs free disk roughly the size of the live data and can take a minute
// on a large file; guarded by a meta flag so it never runs twice.
function vacuumAfterMigration() {
  if (getMeta('post_migration_vacuum_v1') === 'done') return;
  try {
    const pageSize = database.pragma('page_size', { simple: true }) as number;
    const freePages = database.pragma('freelist_count', { simple: true }) as number;
    const freeMB = Math.round((pageSize * freePages) / 1024 / 1024);
    if (freeMB > 20) {
      console.log(`Reclaiming ${freeMB} MB freed by the base64→file migration (one-time VACUUM, may take a minute)...`);
      try { database.pragma('wal_checkpoint(TRUNCATE)'); } catch { /* not in WAL mode */ }
      database.exec('VACUUM');
      const afterMB = Math.round(fs.statSync(dbPath).size / 1024 / 1024);
      console.log(`  ✓ VACUUM complete — database file is now ${afterMB} MB`);
    }
    setMeta('post_migration_vacuum_v1', 'done');
  } catch (err) {
    // Most likely not enough free disk space; leave the flag unset so the
    // next startup tries again.
    console.error('VACUUM failed (will retry on next startup):', err);
  }
}

// ── Public helper: save a new file (used by repositories) ────────────────────

export function saveFileToStorage(dataUrl: string, subdir: string, filename: string): string | null {
  return saveDataUrl(dataUrl, subdir, filename);
}

/**
 * Strips the "/files/" URL prefix from a stored file reference.
 *
 * The web app resolves a stored path like "drawings/x.png" into "/files/drawings/x.png"
 * for display, and re-sends that resolved value when the visit is saved again. Storing it
 * verbatim produced rows the server then looked for at <storage>/files/drawings/x.png —
 * hence the ENOENT 404s. Values are normalised on write and repaired on startup.
 */
export function normalizeStoredPath<T extends string | null | undefined>(value: T): T {
  if (!value || typeof value !== 'string') return value;
  if (value.startsWith('data:') || value.startsWith('http')) return value;
  return value.replace(/^\/?files\//, '') as T;
}

export function deleteFileFromStorage(relativePath: string) {
  if (!relativePath || relativePath.startsWith('data:')) return;
  try {
    const fullPath = path.join(getStorageDir(), relativePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch { /* best-effort */ }
}

// ── Close ─────────────────────────────────────────────────────────────────────

export function closeDatabase() {
  database.close();
  console.log('Database closed');
}

// ── Schema ────────────────────────────────────────────────────────────────────

function createTables() {
  // Create doctors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      specialization TEXT,
      phone TEXT,
      clinic_name TEXT,
      clinic_address TEXT,
      current_patient_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create patients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      age INTEGER,
      gender TEXT CHECK (gender IN ('male', 'female')),
      national_id TEXT,
      medical_history TEXT,
      allergies TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    )
  `);

  // Create visits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      visit_date TEXT DEFAULT (datetime('now')),
      chief_complaint TEXT,
      chief_complaint_drawing TEXT,
      diagnosis TEXT,
      diagnosis_drawing TEXT,
      notes TEXT,
      notes_drawing TEXT,
      drawing_data TEXT,
      past_medical_history_drawing TEXT,
      hpi_drawing TEXT,
      drug_history_drawing TEXT,
      family_history_drawing TEXT,
      current_medication_drawing TEXT,
      radiology_drawing TEXT,
      blood_pressure TEXT,
      temperature REAL,
      weight REAL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    )
  `);

  // Add new columns to visits table if they don't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN past_medical_history_drawing TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN hpi_drawing TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN drug_history_drawing TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN family_history_drawing TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN current_medication_drawing TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN radiology_drawing TEXT`);
  } catch (e) { /* Column already exists */ }
  // Migrate data from old requested_lab_drawing to new radiology_drawing
  try {
    db.exec(`UPDATE visits SET radiology_drawing = requested_lab_drawing WHERE radiology_drawing IS NULL AND requested_lab_drawing IS NOT NULL`);
  } catch (e) { /* Migration already done or column doesn't exist */ }
  // Add visit_type and price columns for visit pricing feature
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN visit_type TEXT DEFAULT 'new'`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN price REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }
  // Add prescription pages 2 and 3
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN notes_drawing_2 TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN notes_drawing_3 TEXT`);
  } catch (e) { /* Column already exists */ }
  // Add radiology pages 2 and 3
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN radiology_drawing_2 TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN radiology_drawing_3 TEXT`);
  } catch (e) { /* Column already exists */ }
  // Add lab test request JSON field
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN lab_test_request TEXT`);
  } catch (e) { /* Column already exists */ }
  // Add radiology request JSON field (checkbox-based)
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN radiology_request TEXT`);
  } catch (e) { /* Column already exists */ }
  // Add medical checklists JSON field (combined 7 checklist forms)
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN medical_checklists TEXT`);
  } catch (e) { /* Column already exists */ }
  // Add prescription medicines JSON field (structured Rx lines from the drug picker)
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN prescription_medicines TEXT`);
  } catch (e) { /* Column already exists */ }

  // Add file_number column to patients table
  try {
    db.exec(`ALTER TABLE patients ADD COLUMN file_number TEXT DEFAULT ''`);
  } catch (e) { /* Column already exists */ }

  // Scanner: remember last-used network scanner per doctor
  try {
    db.exec(`ALTER TABLE settings ADD COLUMN last_scanner_url TEXT DEFAULT ''`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE settings ADD COLUMN last_scanner_name TEXT DEFAULT ''`);
  } catch (e) { /* Column already exists */ }

  // Backup destination folder (USB drive), configurable from the Settings page
  try {
    db.exec(`ALTER TABLE settings ADD COLUMN backup_path TEXT DEFAULT ''`);
  } catch (e) { /* Column already exists */ }

  // Repair file references that were saved with the web app's display prefix
  // ("/files/drawings/x.png" instead of "drawings/x.png"). Those rows resolve to
  // <storage>/files/drawings/... on disk, which does not exist — the images look
  // fine in the browser but 404 everywhere else and flood the log with ENOENT.
  try {
    const drawingCols = [
      'chief_complaint_drawing', 'diagnosis_drawing',
      'notes_drawing', 'notes_drawing_2', 'notes_drawing_3',
      'past_medical_history_drawing', 'hpi_drawing', 'drug_history_drawing',
      'family_history_drawing', 'current_medication_drawing',
      'radiology_drawing', 'radiology_drawing_2', 'radiology_drawing_3',
    ];
    let repaired = 0;
    for (const col of drawingCols) {
      const res = db.prepare(
        `UPDATE visits SET ${col} = REPLACE(${col}, '/files/', '')
         WHERE ${col} LIKE '%/files/%' AND ${col} NOT LIKE 'data:%'`
      ).run();
      repaired += res.changes ?? 0;
      const res2 = db.prepare(
        `UPDATE visits SET ${col} = SUBSTR(${col}, 7)
         WHERE ${col} LIKE 'files/%'`
      ).run();
      repaired += res2.changes ?? 0;
    }
    for (const [table, col] of [
      ['visit_attachments', 'data_url'],
      ['patient_records', 'file_url'],
      ['previous_investigations', 'file_url'],
    ] as [string, string][]) {
      try {
        const res = db.prepare(
          `UPDATE ${table} SET ${col} = REPLACE(${col}, '/files/', '')
           WHERE ${col} LIKE '%/files/%' AND ${col} NOT LIKE 'data:%'`
        ).run();
        repaired += res.changes ?? 0;
      } catch { /* table may not exist yet on a fresh database */ }
    }
    if (repaired > 0) {
      console.log(`Repaired ${repaired} file reference(s) that had a /files/ prefix`);
    }
  } catch (e) {
    console.error('File-path repair failed (non-fatal):', e);
  }

  // Visit type chosen when the patient is put in the queue (كشف / نص كشف /
  // استشارة / كشف مجاني). This is what the day's revenue is calculated from —
  // the price on the visit record itself is not used for analytics.
  try {
    db.exec(`ALTER TABLE queue ADD COLUMN visit_type TEXT DEFAULT 'examination'`);
  } catch (e) { /* Column already exists */ }

  // Price for استشارة. كشف and نص كشف reuse the existing new/followup prices,
  // and كشف مجاني is always zero.
  try {
    db.exec(`ALTER TABLE settings ADD COLUMN consultation_price REAL NOT NULL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }

  // Create visit_attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS visit_attachments (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      data_url TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      uploader_type TEXT NOT NULL CHECK (uploader_type IN ('doctor', 'assistant')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
    )
  `);

  // Create prescriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      visit_id TEXT UNIQUE NOT NULL,
      notes TEXT,
      drawing_data TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
    )
  `);

  // Create medicines table
  db.exec(`
    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      prescription_id TEXT NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT,
      frequency TEXT,
      duration TEXT,
      instructions TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
    )
  `);

  // Create patient_records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patient_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // Create previous_investigations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS previous_investigations (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // Create assistants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assistants (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      can_create_patients INTEGER DEFAULT 1,
      can_edit_patients INTEGER DEFAULT 1,
      can_delete_patients INTEGER DEFAULT 0,
      can_create_visits INTEGER DEFAULT 1,
      can_edit_visits INTEGER DEFAULT 1,
      can_delete_visits INTEGER DEFAULT 0,
      can_view_prescriptions INTEGER DEFAULT 0,
      can_create_prescriptions INTEGER DEFAULT 0,
      can_manage_records INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    )
  `);

  // Create expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      expense_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    )
  `);

  // Create settings table for storing doctor-specific configuration (visit prices, etc.)
  db.exec(`
    -- NOTE: columns added later must be listed here as well as in an ALTER
    -- above. The ALTER statements run before this table exists, so on a brand
    -- new database they fail silently and the column would be missing —
    -- queue and settings writes then fail with "no such column".
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      doctor_id TEXT UNIQUE NOT NULL,
      new_visit_price REAL NOT NULL DEFAULT 0,
      followup_visit_price REAL NOT NULL DEFAULT 0,
      consultation_price REAL NOT NULL DEFAULT 0,
      backup_path TEXT DEFAULT '',
      last_scanner_url TEXT DEFAULT '',
      last_scanner_name TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    )
  `);

  // Create lab_results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lab_results (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      category TEXT NOT NULL,
      test_name TEXT NOT NULL,
      result_value TEXT NOT NULL,
      unit TEXT,
      reference_range TEXT,
      is_abnormal INTEGER DEFAULT 0,
      test_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    )
  `);

  // Create notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      is_read INTEGER DEFAULT 0,
      created_by_id TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      created_by_role TEXT NOT NULL CHECK (created_by_role IN ('doctor', 'assistant')),
      created_at TEXT DEFAULT (datetime('now')),
      read_at TEXT,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    )
  `);

  // Create queue table
  db.exec(`
    CREATE TABLE IF NOT EXISTS queue (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      patient_phone TEXT,
      position INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'done')),
      visit_type TEXT DEFAULT 'examination',
      added_at TEXT DEFAULT (datetime('now')),
      added_by TEXT NOT NULL,
      queue_date TEXT NOT NULL,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // Create drugs table (Egyptian drug database - read-only reference data, seeded once)
  db.exec(`
    CREATE TABLE IF NOT EXISTS drugs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commercial_name_en TEXT,
      commercial_name_ar TEXT,
      scientific_name TEXT,
      manufacturer TEXT,
      drug_class TEXT,
      route TEXT,
      price_egp REAL
    )
  `);

  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patient_records_patient_id ON patient_records(patient_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_previous_investigations_patient_id ON previous_investigations(patient_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_assistants_doctor_id ON assistants(doctor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_assistants_email ON assistants(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_expenses_doctor_id ON expenses(doctor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_settings_doctor_id ON settings(doctor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results(patient_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_lab_results_doctor_id ON lab_results(doctor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_doctor_id ON notifications(doctor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_visit_attachments_visit_id ON visit_attachments(visit_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_queue_doctor_date ON queue(doctor_id, queue_date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_queue_patient_date ON queue(patient_id, queue_date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_drugs_name_en ON drugs(commercial_name_en)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_drugs_scientific ON drugs(scientific_name)`);
}

// Seed the drugs table from the bundled Egyptian drug database JSON.
// Read-only reference data: only runs when the table is empty (first launch /
// fresh DB), so it's a one-time ~1-2s cost. The JSON file ships via pkg.assets
// ("data/**/*") and resolves the same way the writable DB path does.
function seedDrugs() {
  try {
    const count = (db.prepare('SELECT COUNT(*) AS n FROM drugs').get() as { n: number }).n;
    if (count > 0) return; // already seeded

    const dataPath = path.join(__dirname, '..', '..', '..', 'data', 'egyptian-drugs.json');
    if (!fs.existsSync(dataPath)) {
      console.warn(`Drug database file not found at ${dataPath}; skipping drug seed.`);
      return;
    }

    type DrugRow = {
      commercial_name_en?: string;
      commercial_name_ar?: string;
      scientific_name?: string;
      manufacturer?: string;
      drug_class?: string;
      route?: string;
      price_egp?: number;
    };
    const drugs = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as DrugRow[];
    if (!Array.isArray(drugs) || drugs.length === 0) return;

    const insert = db.prepare(`
      INSERT INTO drugs (commercial_name_en, commercial_name_ar, scientific_name, manufacturer, drug_class, route, price_egp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const seed = db.transaction((rows: DrugRow[]) => {
      for (const d of rows) {
        insert.run(
          d.commercial_name_en ?? null,
          d.commercial_name_ar ?? null,
          d.scientific_name ?? null,
          d.manufacturer ?? null,
          d.drug_class ?? null,
          d.route ?? null,
          typeof d.price_egp === 'number' ? d.price_egp : null
        );
      }
    });
    seed(drugs);
    console.log(`Seeded ${drugs.length} drugs into the drug database.`);
  } catch (err) {
    console.error('Failed to seed drugs:', err);
  }
}

// Create default doctor account for testing
function createDefaultDoctor() {
  // Check if any doctor exists
  const existingDoctor = db.prepare('SELECT id FROM doctors LIMIT 1').get();

  if (!existingDoctor) {
    const id = uuidv4();
    const email = 'doctor@test.com';
    const password = '123456';
    const passwordHash = bcrypt.hashSync(password, 10);
    const name = 'Dr. Test Account';

    db.prepare(`
      INSERT INTO doctors (id, email, password_hash, name, specialization, clinic_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, email, passwordHash, name, 'General Practice', 'Test Clinic');

    console.log('');
    console.log('========================================');
    console.log('  Default Doctor Account Created');
    console.log('========================================');
    console.log('  Email:    doctor@test.com');
    console.log('  Password: 123456');
    console.log('========================================');
    console.log('');
  }
}
