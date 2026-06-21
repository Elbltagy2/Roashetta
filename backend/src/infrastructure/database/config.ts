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
const dbBase = path.basename(dbPath);

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

// ── Daily backup ──────────────────────────────────────────────────────────────
// Uses better-sqlite3's hot-backup API for a consistent snapshot at any time.

async function saveDailyBackup() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const dailyPath = path.join(dbDir, `${dbBase}.${today}.bak`);
    if (!fs.existsSync(dailyPath)) {
      await database.backup(dailyPath);
      console.log(`Daily backup saved: ${dailyPath}`);
    }
    // Keep only last 7 daily backups
    const pattern = new RegExp(`^${dbBase}\\.\\d{4}-\\d{2}-\\d{2}\\.bak$`);
    fs.readdirSync(dbDir)
      .filter(f => pattern.test(f))
      .sort()
      .slice(0, -7)
      .forEach(f => { try { fs.unlinkSync(path.join(dbDir, f)); } catch { /* ignore */ } });
  } catch (err) {
    console.error('Failed to save daily backup:', err);
  }
}

// ── Initialise ────────────────────────────────────────────────────────────────

export async function initializeDatabase(): Promise<void> {
  // WAL mode: writes go to a tiny WAL file instead of the main DB.
  // This eliminates the Windows Defender EBUSY/EPERM locking issues entirely
  // because the main roashetta.db file is only updated during checkpoints.
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');

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

  // Daily backup on startup, then every 24 hours
  saveDailyBackup();
  setInterval(saveDailyBackup, 24 * 60 * 60 * 1000);

  console.log('SQLite database initialized successfully');
}

// ── File migration ────────────────────────────────────────────────────────────
// Converts existing base64 data URLs stored in the DB to real files on disk.
// Runs once automatically; subsequent runs are instant (no base64 rows left).

export function getStorageDir(): string {
  if (process.pkg) return path.join(path.dirname(process.execPath), 'files');
  return path.join(path.dirname(dbPath), 'files');
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

async function migrateBase64ToFiles() {
  const storageDir = getStorageDir();
  ensureDir(storageDir);

  // ── visit_attachments ──────────────────────────────────────────────────────
  const attachments = database.prepare(
    `SELECT id, data_url FROM visit_attachments WHERE data_url LIKE 'data:%' LIMIT 500`
  ).all() as { id: string; data_url: string }[];

  if (attachments.length > 0) {
    console.log(`Migrating ${attachments.length} visit attachments to files...`);
    const updateAttachment = database.prepare(`UPDATE visit_attachments SET data_url = ? WHERE id = ?`);
    const migrate = database.transaction(() => {
      for (const row of attachments) {
        const ext = row.data_url.split(';')[0].split('/')[1]?.split('+')[0] || 'bin';
        const relPath = saveDataUrl(row.data_url, 'attachments', `${row.id}.${ext}`);
        if (relPath) updateAttachment.run(relPath, row.id);
      }
    });
    migrate();
    console.log(`  ✓ ${attachments.length} attachments migrated`);
  }

  // ── patient_records ────────────────────────────────────────────────────────
  const records = database.prepare(
    `SELECT id, file_url FROM patient_records WHERE file_url LIKE 'data:%' LIMIT 500`
  ).all() as { id: string; file_url: string }[];

  if (records.length > 0) {
    console.log(`Migrating ${records.length} patient records to files...`);
    const updateRecord = database.prepare(`UPDATE patient_records SET file_url = ? WHERE id = ?`);
    const migrate = database.transaction(() => {
      for (const row of records) {
        const ext = row.file_url.split(';')[0].split('/')[1]?.split('+')[0] || 'bin';
        const relPath = saveDataUrl(row.file_url, 'records', `${row.id}.${ext}`);
        if (relPath) updateRecord.run(relPath, row.id);
      }
    });
    migrate();
    console.log(`  ✓ ${records.length} records migrated`);
  }

  // ── previous_investigations ────────────────────────────────────────────────
  const investigations = database.prepare(
    `SELECT id, file_url FROM previous_investigations WHERE file_url LIKE 'data:%' LIMIT 500`
  ).all() as { id: string; file_url: string }[];

  if (investigations.length > 0) {
    console.log(`Migrating ${investigations.length} investigations to files...`);
    const updateInv = database.prepare(`UPDATE previous_investigations SET file_url = ? WHERE id = ?`);
    const migrate = database.transaction(() => {
      for (const row of investigations) {
        const ext = row.file_url.split(';')[0].split('/')[1]?.split('+')[0] || 'bin';
        const relPath = saveDataUrl(row.file_url, 'records', `${row.id}.${ext}`);
        if (relPath) updateInv.run(relPath, row.id);
      }
    });
    migrate();
    console.log(`  ✓ ${investigations.length} investigations migrated`);
  }

  // ── visit drawings (14 columns) ────────────────────────────────────────────
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
      visits = database.prepare(
        `SELECT id, ${col} FROM visits WHERE ${col} LIKE 'data:%' OR ${col} LIKE 'TEXT_MODE:%' LIMIT 500`
      ).all() as { id: string; [k: string]: string }[];
    } catch { continue; } // column might not exist yet

    if (visits.length === 0) continue;
    console.log(`Migrating ${visits.length} rows for visits.${col}...`);
    const updateVisit = database.prepare(`UPDATE visits SET ${col} = ? WHERE id = ?`);
    const migrate = database.transaction(() => {
      for (const row of visits) {
        const data = row[col];
        if (!data) continue;
        const relPath = migrateDrawingData(data, 'drawings', `${row.id}_${col}.png`);
        if (relPath) updateVisit.run(relPath, row.id);
      }
    });
    migrate();
    console.log(`  ✓ visits.${col} migrated`);
  }
}

// ── Public helper: save a new file (used by repositories) ────────────────────

export function saveFileToStorage(dataUrl: string, subdir: string, filename: string): string | null {
  return saveDataUrl(dataUrl, subdir, filename);
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
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      doctor_id TEXT UNIQUE NOT NULL,
      new_visit_price REAL NOT NULL DEFAULT 0,
      followup_visit_price REAL NOT NULL DEFAULT 0,
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
