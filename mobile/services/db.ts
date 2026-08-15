import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('roashetta.db');

export function initDB() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      fileNumber TEXT DEFAULT '',
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      age INTEGER DEFAULT 0,
      gender TEXT DEFAULT 'male',
      medicalHistory TEXT DEFAULT '',
      allergies TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      visitDate TEXT,
      visitType TEXT DEFAULT 'new',
      price REAL DEFAULT 0,
      chiefComplaint TEXT DEFAULT '',
      diagnosis TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      vitals TEXT,
      labTestRequest TEXT,
      radiologyRequest TEXT,
      prescriptionMedicines TEXT,
      medicalChecklists TEXT,
      pastMedicalHistory TEXT DEFAULT '',
      hpi TEXT DEFAULT '',
      drugHistory TEXT DEFAULT '',
      familyHistory TEXT DEFAULT '',
      currentMedication TEXT DEFAULT '',
      updatedAt TEXT DEFAULT '',
      fullSyncedAt TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS lab_results (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      category TEXT,
      testName TEXT,
      resultValue TEXT,
      unit TEXT,
      referenceRange TEXT,
      isAbnormal INTEGER DEFAULT 0,
      testDate TEXT,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS previous_investigations (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      name TEXT DEFAULT '',
      fileType TEXT DEFAULT '',
      localPath TEXT DEFAULT '',
      uploadedAt TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS patient_records (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      name TEXT DEFAULT '',
      fileType TEXT DEFAULT '',
      localPath TEXT DEFAULT '',
      uploadedAt TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS visit_attachments (
      id TEXT PRIMARY KEY,
      visitId TEXT NOT NULL,
      name TEXT DEFAULT '',
      fileType TEXT DEFAULT '',
      localPath TEXT DEFAULT '',
      uploadedAt TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patientId);
  `);
  // Migrations for existing databases
  try { db.execSync(`ALTER TABLE visits ADD COLUMN radiologyRequest TEXT`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE visits ADD COLUMN pastMedicalHistory TEXT DEFAULT ''`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE visits ADD COLUMN hpi TEXT DEFAULT ''`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE visits ADD COLUMN drugHistory TEXT DEFAULT ''`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE visits ADD COLUMN familyHistory TEXT DEFAULT ''`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE visits ADD COLUMN currentMedication TEXT DEFAULT ''`); } catch { /* already exists */ }
  // updatedAt mirrors the server's value; fullSyncedAt records the updatedAt we
  // last pulled full data (drawings, checklists, attachments) for. Equal values
  // mean the visit is unchanged and can be skipped on the next sync.
  try { db.execSync(`ALTER TABLE visits ADD COLUMN updatedAt TEXT DEFAULT ''`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE visits ADD COLUMN fullSyncedAt TEXT DEFAULT ''`); } catch { /* already exists */ }
  // Scans and photos are fetched on demand, not during sync: remoteUrl is the
  // server path, localPath is filled in once the file has been opened and
  // cached. Downloading all of them up front meant gigabytes over clinic wifi.
  try { db.execSync(`ALTER TABLE previous_investigations ADD COLUMN remoteUrl TEXT DEFAULT ''`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE patient_records ADD COLUMN remoteUrl TEXT DEFAULT ''`); } catch { /* already exists */ }
  try { db.execSync(`ALTER TABLE visit_attachments ADD COLUMN remoteUrl TEXT DEFAULT ''`); } catch { /* already exists */ }
  try { db.execSync(`CREATE TABLE IF NOT EXISTS previous_investigations (id TEXT PRIMARY KEY, patientId TEXT NOT NULL, name TEXT DEFAULT '', fileType TEXT DEFAULT '', localPath TEXT DEFAULT '', uploadedAt TEXT DEFAULT '')`); } catch { /* already exists */ }
  try { db.execSync(`CREATE TABLE IF NOT EXISTS patient_records (id TEXT PRIMARY KEY, patientId TEXT NOT NULL, name TEXT DEFAULT '', fileType TEXT DEFAULT '', localPath TEXT DEFAULT '', uploadedAt TEXT DEFAULT '')`); } catch { /* already exists */ }
  try { db.execSync(`CREATE TABLE IF NOT EXISTS visit_attachments (id TEXT PRIMARY KEY, visitId TEXT NOT NULL, name TEXT DEFAULT '', fileType TEXT DEFAULT '', localPath TEXT DEFAULT '', uploadedAt TEXT DEFAULT '')`); } catch { /* already exists */ }
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_lab_patient ON lab_results(patientId);
    CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
    CREATE INDEX IF NOT EXISTS idx_attachments_visit ON visit_attachments(visitId);
  `);
}

export function clearData() {
  db.execSync('DELETE FROM patients; DELETE FROM visits; DELETE FROM lab_results; DELETE FROM previous_investigations; DELETE FROM patient_records; DELETE FROM visit_attachments;');
}

export function insertPatients(patients: any[]) {
  if (!patients.length) return;
  const stmt = db.prepareSync(
    `INSERT OR REPLACE INTO patients (id, fileNumber, name, phone, age, gender, medicalHistory, allergies, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of patients) {
    stmt.executeSync([
      p.id,
      p.fileNumber || '',
      p.name,
      p.phone || '',
      p.age || 0,
      p.gender || 'male',
      p.medicalHistory || '',
      JSON.stringify(p.allergies || []),
      p.createdAt || '',
    ]);
  }
  stmt.finalizeSync();
}

export function insertVisits(visits: any[]) {
  if (!visits.length) return;
  // Upsert, not INSERT OR REPLACE. These rows come from the meta endpoint,
  // which returns no drawings/checklists/medicines — replacing the row would
  // null out full data that a previous sync already fetched, and reset
  // fullSyncedAt so every visit looked stale forever.
  const stmt = db.prepareSync(
    `INSERT INTO visits (id, patientId, visitDate, visitType, price, chiefComplaint, diagnosis, notes, vitals, labTestRequest, radiologyRequest, prescriptionMedicines, medicalChecklists, pastMedicalHistory, hpi, drugHistory, familyHistory, currentMedication, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       patientId = excluded.patientId,
       visitDate = excluded.visitDate,
       visitType = excluded.visitType,
       price = excluded.price,
       chiefComplaint = excluded.chiefComplaint,
       diagnosis = excluded.diagnosis,
       notes = excluded.notes,
       vitals = excluded.vitals,
       updatedAt = excluded.updatedAt`
  );
  for (const v of visits) {
    stmt.executeSync([
      v.id,
      v.patientId,
      v.visitDate || '',
      v.visitType || 'new',
      v.price || 0,
      v.chiefComplaint || '',
      v.diagnosis || '',
      v.notes || '',
      typeof v.vitals === 'object' ? JSON.stringify(v.vitals) : v.vitals || null,
      v.labTestRequest || null,
      v.radiologyRequest || null,
      v.prescriptionMedicines || null,
      v.medicalChecklists || null,
      v.pastMedicalHistory || '',
      v.hpi || '',
      v.drugHistory || '',
      v.familyHistory || '',
      v.currentMedication || '',
      v.updatedAt || '',
    ]);
  }
  stmt.finalizeSync();
}

export function insertLabResults(results: any[]) {
  if (!results.length) return;
  const stmt = db.prepareSync(
    `INSERT OR REPLACE INTO lab_results (id, patientId, category, testName, resultValue, unit, referenceRange, isAbnormal, testDate, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const r of results) {
    stmt.executeSync([
      r.id,
      r.patientId,
      r.category || '',
      r.testName || '',
      r.resultValue || '',
      r.unit || null,
      r.referenceRange || null,
      r.isAbnormal ? 1 : 0,
      r.testDate || '',
      r.notes || null,
    ]);
  }
  stmt.finalizeSync();
}

export function getPatients(search = ''): any[] {
  const q = `%${search}%`;
  if (search) {
    return db.getAllSync(
      `SELECT * FROM patients WHERE name LIKE ? OR fileNumber LIKE ? OR phone LIKE ? ORDER BY name COLLATE NOCASE`,
      [q, q, q]
    );
  }
  return db.getAllSync(`SELECT * FROM patients ORDER BY name COLLATE NOCASE`);
}

export function getPatient(id: string): any {
  return db.getFirstSync(`SELECT * FROM patients WHERE id = ?`, [id]);
}

export function getVisitsByPatient(patientId: string): any[] {
  return db.getAllSync(
    `SELECT * FROM visits WHERE patientId = ? ORDER BY visitDate DESC`,
    [patientId]
  );
}

export function getVisit(id: string): any {
  return db.getFirstSync(`SELECT * FROM visits WHERE id = ?`, [id]);
}

export function getLabResultsByPatient(patientId: string): any[] {
  return db.getAllSync(
    `SELECT * FROM lab_results WHERE patientId = ? ORDER BY testDate DESC`,
    [patientId]
  );
}

export function setSyncMeta(key: string, value: string) {
  db.runSync(`INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)`, [key, value]);
}

export function getSyncMeta(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>(`SELECT value FROM sync_meta WHERE key = ?`, [key]);
  return row?.value ?? null;
}

export function getPatientCount(): number {
  const row = db.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM patients`);
  return row?.count ?? 0;
}

export function getAllVisitIds(): string[] {
  const rows = db.getAllSync<{ id: string }>(`SELECT id FROM visits`);
  return rows.map(r => r.id);
}

/**
 * Visits whose full payload (drawings, checklists, medicines, attachments) has
 * never been fetched, or which changed on the server since it was. Lets a sync
 * skip the expensive per-visit work for everything untouched — the difference
 * between minutes and seconds on a clinic-sized database.
 */
export function getVisitIdsNeedingFullSync(): string[] {
  const rows = db.getAllSync<{ id: string }>(
    `SELECT id FROM visits
     WHERE fullSyncedAt IS NULL OR fullSyncedAt = '' OR fullSyncedAt <> updatedAt`
  );
  return rows.map(r => r.id);
}

export function markVisitFullySynced(visitId: string, updatedAt: string) {
  db.runSync(`UPDATE visits SET fullSyncedAt = ? WHERE id = ?`, [updatedAt || '', visitId]);
}

/**
 * Lab results, investigations and patient records are pulled once per patient
 * and then left alone — they change far less often than visits, and re-fetching
 * three endpoints for every patient on every sync was most of the sync cost.
 * Cleared by markExtrasStale() when the patient's data changes.
 */
const EXTRAS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function hasExtrasSynced(patientId: string): boolean {
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM sync_meta WHERE key = ?`,
    [`extras:${patientId}`]
  );
  if (!row?.value) return false;
  // Re-pull anyway after a week, so lab results added without a matching visit
  // can't stay invisible on the phone forever.
  const age = Date.now() - new Date(row.value).getTime();
  return Number.isFinite(age) && age < EXTRAS_MAX_AGE_MS;
}

export function markExtrasSynced(patientId: string) {
  setSyncMeta(`extras:${patientId}`, new Date().toISOString());
}

export function markExtrasStale(patientId: string) {
  db.runSync(`DELETE FROM sync_meta WHERE key = ?`, [`extras:${patientId}`]);
}

export interface PendingFile {
  table: 'previous_investigations' | 'patient_records' | 'visit_attachments';
  id: string;
  name: string;
  fileType: string;
  remoteUrl: string;
  localPath: string;
}

/** Every file not yet on disk — the work list for the offline download pass. */
export function getPendingFiles(): PendingFile[] {
  const rows: PendingFile[] = [];
  const tables: PendingFile['table'][] = ['previous_investigations', 'patient_records', 'visit_attachments'];
  for (const table of tables) {
    const found = db.getAllSync<any>(
      `SELECT id, name, fileType, remoteUrl, localPath FROM ${table}
       WHERE remoteUrl <> '' AND (localPath IS NULL OR localPath = '')`
    );
    found.forEach(r => rows.push({ ...r, table }));
  }
  return rows;
}

export function countPendingFiles(): number {
  return getPendingFiles().length;
}

/** Records where a lazily-fetched file was cached, so it opens offline next time. */
export function setLocalPath(table: 'previous_investigations' | 'patient_records' | 'visit_attachments', id: string, localPath: string) {
  db.runSync(`UPDATE ${table} SET localPath = ? WHERE id = ?`, [localPath, id]);
}

export function updateVisitFullData(visitId: string, data: any) {
  db.runSync(
    `UPDATE visits SET
      prescriptionMedicines = ?,
      labTestRequest = ?,
      radiologyRequest = ?,
      medicalChecklists = ?,
      pastMedicalHistory = ?,
      hpi = ?,
      drugHistory = ?,
      familyHistory = ?,
      currentMedication = ?
     WHERE id = ?`,
    [
      data.prescriptionMedicines || null,
      data.labTestRequest || null,
      data.radiologyRequest || null,
      data.medicalChecklists || null,
      data.pastMedicalHistory || '',
      data.hpi || '',
      data.drugHistory || '',
      data.familyHistory || '',
      data.currentMedication || '',
      visitId,
    ]
  );
}

export function insertPreviousInvestigations(items: any[]) {
  if (!items.length) return;
  const stmt = db.prepareSync(
    // Upsert that leaves localPath alone — it holds the cached copy of a file
    // the doctor already opened, which a plain REPLACE would discard.
    `INSERT INTO previous_investigations (id, patientId, name, fileType, localPath, uploadedAt, remoteUrl)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       patientId = excluded.patientId, name = excluded.name,
       fileType = excluded.fileType, uploadedAt = excluded.uploadedAt,
       remoteUrl = excluded.remoteUrl`
  );
  for (const i of items) {
    stmt.executeSync([i.id, i.patientId, i.name || '', i.fileType || '', i.localPath || '', i.uploadedAt || '', i.remoteUrl || '']);
  }
  stmt.finalizeSync();
}

export function getInvestigationsByPatient(patientId: string): any[] {
  return db.getAllSync(
    `SELECT * FROM previous_investigations WHERE patientId = ? ORDER BY uploadedAt DESC`,
    [patientId]
  );
}

export function deleteInvestigationsForPatient(patientId: string) {
  db.runSync(`DELETE FROM previous_investigations WHERE patientId = ?`, [patientId]);
}

export function insertPatientRecords(items: any[]) {
  if (!items.length) return;
  const stmt = db.prepareSync(
    `INSERT INTO patient_records (id, patientId, name, fileType, localPath, uploadedAt, remoteUrl)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       patientId = excluded.patientId, name = excluded.name,
       fileType = excluded.fileType, uploadedAt = excluded.uploadedAt,
       remoteUrl = excluded.remoteUrl`
  );
  for (const i of items) {
    stmt.executeSync([i.id, i.patientId, i.name || '', i.fileType || '', i.localPath || '', i.uploadedAt || '', i.remoteUrl || '']);
  }
  stmt.finalizeSync();
}

export function getRecordsByPatient(patientId: string): any[] {
  return db.getAllSync(
    `SELECT * FROM patient_records WHERE patientId = ? ORDER BY uploadedAt DESC`,
    [patientId]
  );
}

export function deleteRecordsForPatient(patientId: string) {
  db.runSync(`DELETE FROM patient_records WHERE patientId = ?`, [patientId]);
}

export function insertVisitAttachments(items: any[]) {
  if (!items.length) return;
  const stmt = db.prepareSync(
    `INSERT INTO visit_attachments (id, visitId, name, fileType, localPath, uploadedAt, remoteUrl)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       visitId = excluded.visitId, name = excluded.name,
       fileType = excluded.fileType, uploadedAt = excluded.uploadedAt,
       remoteUrl = excluded.remoteUrl`
  );
  for (const i of items) {
    stmt.executeSync([i.id, i.visitId, i.name || '', i.fileType || '', i.localPath || '', i.uploadedAt || '', i.remoteUrl || '']);
  }
  stmt.finalizeSync();
}

export function getAttachmentsByVisit(visitId: string): any[] {
  return db.getAllSync(
    `SELECT * FROM visit_attachments WHERE visitId = ? ORDER BY uploadedAt DESC`,
    [visitId]
  );
}

export function deleteAttachmentsForVisit(visitId: string) {
  db.runSync(`DELETE FROM visit_attachments WHERE visitId = ?`, [visitId]);
}
