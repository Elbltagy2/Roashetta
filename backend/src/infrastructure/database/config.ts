import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Extend process for pkg compatibility
declare const process: NodeJS.Process & { pkg?: boolean };

dotenv.config();

// Database file path - when running from pkg, use exe directory
const getDbPath = () => {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  // When running from pkg executable, save db next to the exe
  if (process.pkg) {
    return path.join(path.dirname(process.execPath), 'roashetta.db');
  }
  // In development, save in backend folder
  return path.join(__dirname, '..', '..', '..', 'roashetta.db');
};

const dbPath = getDbPath();

// Database instance (will be initialized async)
let database: SqlJsDatabase | null = null;

// Auto-save interval (save every 5 seconds if there are changes)
let saveTimer: NodeJS.Timeout | null = null;
let hasChanges = false;

// Save database to file
function saveDatabase() {
  if (database && hasChanges) {
    const data = database.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    hasChanges = false;
  }
}

// Mark that changes were made (for auto-save)
function markChanged() {
  hasChanges = true;
}

// Database wrapper to provide better-sqlite3 like API
export const db = {
  prepare(sql: string) {
    return {
      run(...params: unknown[]) {
        if (!database) throw new Error('Database not initialized');
        database.run(sql, params as any[]);
        markChanged();
        return { changes: database.getRowsModified() };
      },
      get(...params: unknown[]): Record<string, unknown> | undefined {
        if (!database) throw new Error('Database not initialized');
        const stmt = database.prepare(sql);
        stmt.bind(params as any[]);
        if (stmt.step()) {
          const result = stmt.getAsObject() as Record<string, unknown>;
          stmt.free();
          return result;
        }
        stmt.free();
        return undefined;
      },
      all(...params: unknown[]): Record<string, unknown>[] {
        if (!database) throw new Error('Database not initialized');
        const stmt = database.prepare(sql);
        stmt.bind(params as any[]);
        const results: Record<string, unknown>[] = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject() as Record<string, unknown>);
        }
        stmt.free();
        return results;
      }
    };
  },
  exec(sql: string) {
    if (!database) throw new Error('Database not initialized');
    database.run(sql);
    markChanged();
  },
  pragma(sql: string) {
    if (!database) throw new Error('Database not initialized');
    database.run(`PRAGMA ${sql}`);
  }
};

// Initialize database
export async function initializeDatabase(): Promise<void> {
  // Initialize sql.js with WASM file location for pkg compatibility
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      // When running from pkg executable, look for WASM in same directory
      if (process.pkg) {
        return path.join(path.dirname(process.execPath), file);
      }
      // In development, use node_modules
      return path.join(__dirname, '..', '..', '..', 'node_modules', 'sql.js', 'dist', file);
    }
  });

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    database = new SQL.Database(fileBuffer);
    console.log(`Loaded existing database from ${dbPath}`);
  } else {
    database = new SQL.Database();
    console.log('Created new database');
  }

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  createTables();

  // Create default doctor account for testing
  createDefaultDoctor();

  // Start auto-save timer (save every 5 seconds if changes)
  saveTimer = setInterval(saveDatabase, 5000);

  console.log('SQLite database initialized successfully');
}

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
      requested_lab_drawing TEXT,
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
    db.exec(`ALTER TABLE visits ADD COLUMN requested_lab_drawing TEXT`);
  } catch (e) { /* Column already exists */ }
  // Add visit_type and price columns for visit pricing feature
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN visit_type TEXT DEFAULT 'new'`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE visits ADD COLUMN price REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }

  // Add file_number column to patients table
  try {
    db.exec(`ALTER TABLE patients ADD COLUMN file_number TEXT DEFAULT ''`);
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

  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patient_records_patient_id ON patient_records(patient_id)`);
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

// Close database and save
export function closeDatabase() {
  if (saveTimer) {
    clearInterval(saveTimer);
  }
  saveDatabase(); // Final save
  if (database) {
    database.close();
    database = null;
  }
  console.log('Database closed and saved');
}
