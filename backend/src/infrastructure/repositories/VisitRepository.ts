import { db, saveFileToStorage } from '../database/config';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { Visit, CreateVisitInput, UpdateVisitInput, VisitType } from '../../domain/entities/Visit';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsData {
  totalVisits: number;
  newVisits: number;
  followupVisits: number;
  totalRevenue: number;
  newVisitRevenue: number;
  followupVisitRevenue: number;
  uniquePatients: number;
  dailyBreakdown: {
    date: string;
    totalVisits: number;
    newVisits: number;
    followupVisits: number;
    revenue: number;
  }[];
}

export class VisitRepository implements IVisitRepository {
  findById(id: string): Promise<Visit | null> {
    const row = db.prepare('SELECT * FROM visits WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return Promise.resolve(row ? this.mapToEntity(row) : null);
  }

  findByPatientId(patientId: string): Promise<Visit[]> {
    const rows = db.prepare('SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date DESC').all(patientId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  // SELECT only the small columns — skip the 15+ TEXT columns that store
  // base64 drawings and big JSON blobs. The Visit entity still requires
  // those fields, so we fill them with null in mapToMetaEntity.
  findMetaByPatientId(patientId: string): Promise<Visit[]> {
    const rows = db.prepare(`
      SELECT id, patient_id, doctor_id, visit_type, price,
             chief_complaint, diagnosis, notes,
             blood_pressure, temperature, weight,
             visit_date, created_at, updated_at
      FROM visits
      WHERE patient_id = ?
      ORDER BY visit_date DESC
    `).all(patientId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToMetaEntity(row)));
  }

  findByDoctorId(doctorId: string): Promise<Visit[]> {
    const rows = db.prepare('SELECT * FROM visits WHERE doctor_id = ? ORDER BY visit_date DESC').all(doctorId) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  create(data: CreateVisitInput): Promise<Visit> {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO visits (
        id, patient_id, doctor_id, visit_type, price,
        chief_complaint, chief_complaint_drawing,
        diagnosis, diagnosis_drawing, notes, notes_drawing, notes_drawing_2, notes_drawing_3,
        past_medical_history_drawing, hpi_drawing, drug_history_drawing,
        family_history_drawing, current_medication_drawing,
        radiology_drawing, radiology_drawing_2, radiology_drawing_3,
        lab_test_request, radiology_request, medical_checklists,
        blood_pressure, temperature, weight, visit_date, created_at, updated_at
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.patientId,
      data.doctorId,
      data.visitType || 'new',
      data.price ?? 0,
      data.chiefComplaint ?? null,
      data.chiefComplaintDrawing ?? null,
      data.diagnosis ?? null,
      data.diagnosisDrawing ?? null,
      data.notes ?? null,
      data.notesDrawing ?? null,
      data.notesDrawing2 ?? null,
      data.notesDrawing3 ?? null,
      data.pastMedicalHistoryDrawing ?? null,
      data.hpiDrawing ?? null,
      data.drugHistoryDrawing ?? null,
      data.familyHistoryDrawing ?? null,
      data.currentMedicationDrawing ?? null,
      data.radiologyDrawing ?? null,
      data.radiologyDrawing2 ?? null,
      data.radiologyDrawing3 ?? null,
      data.labTestRequest ?? null,
      data.radiologyRequest ?? null,
      data.medicalChecklists ?? null,
      data.vitals?.bloodPressure ?? null,
      data.vitals?.temperature ?? null,
      data.vitals?.weight ?? null,
      now,
      now,
      now
    );

    return this.findById(id) as Promise<Visit>;
  }

  private saveDrawing(visitId: string, col: string, data: string | null | undefined): string | null | undefined {
    if (!data) return data;
    const TEXT_MODE_PREFIX = 'TEXT_MODE:';
    if (data.startsWith(TEXT_MODE_PREFIX)) {
      try {
        const parsed = JSON.parse(data.slice(TEXT_MODE_PREFIX.length)) as { text: string; dataUrl: string };
        if (parsed.dataUrl?.startsWith('data:')) {
          const rel = saveFileToStorage(parsed.dataUrl, 'drawings', `${visitId}_${col}.png`);
          if (rel) return TEXT_MODE_PREFIX + JSON.stringify({ text: parsed.text, dataUrl: rel });
        }
      } catch { /* leave as-is */ }
      return data;
    }
    if (data.startsWith('data:')) {
      return saveFileToStorage(data, 'drawings', `${visitId}_${col}.png`) ?? data;
    }
    return data;
  }

  update(id: string, data: UpdateVisitInput): Promise<Visit> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.visitType !== undefined) {
      fields.push('visit_type = ?');
      values.push(data.visitType);
    }
    if (data.price !== undefined) {
      fields.push('price = ?');
      values.push(data.price);
    }
    if (data.chiefComplaint !== undefined) {
      fields.push('chief_complaint = ?');
      values.push(data.chiefComplaint);
    }
    if (data.chiefComplaintDrawing !== undefined) {
      fields.push('chief_complaint_drawing = ?');
      values.push(this.saveDrawing(id, 'chief_complaint_drawing', data.chiefComplaintDrawing));
    }
    if (data.diagnosis !== undefined) {
      fields.push('diagnosis = ?');
      values.push(data.diagnosis);
    }
    if (data.diagnosisDrawing !== undefined) {
      fields.push('diagnosis_drawing = ?');
      values.push(this.saveDrawing(id, 'diagnosis_drawing', data.diagnosisDrawing));
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }
    if (data.notesDrawing !== undefined) {
      fields.push('notes_drawing = ?');
      values.push(this.saveDrawing(id, 'notes_drawing', data.notesDrawing));
    }
    if (data.notesDrawing2 !== undefined) {
      fields.push('notes_drawing_2 = ?');
      values.push(this.saveDrawing(id, 'notes_drawing_2', data.notesDrawing2));
    }
    if (data.notesDrawing3 !== undefined) {
      fields.push('notes_drawing_3 = ?');
      values.push(this.saveDrawing(id, 'notes_drawing_3', data.notesDrawing3));
    }
    if (data.pastMedicalHistoryDrawing !== undefined) {
      fields.push('past_medical_history_drawing = ?');
      values.push(this.saveDrawing(id, 'past_medical_history_drawing', data.pastMedicalHistoryDrawing));
    }
    if (data.hpiDrawing !== undefined) {
      fields.push('hpi_drawing = ?');
      values.push(this.saveDrawing(id, 'hpi_drawing', data.hpiDrawing));
    }
    if (data.drugHistoryDrawing !== undefined) {
      fields.push('drug_history_drawing = ?');
      values.push(this.saveDrawing(id, 'drug_history_drawing', data.drugHistoryDrawing));
    }
    if (data.familyHistoryDrawing !== undefined) {
      fields.push('family_history_drawing = ?');
      values.push(this.saveDrawing(id, 'family_history_drawing', data.familyHistoryDrawing));
    }
    if (data.currentMedicationDrawing !== undefined) {
      fields.push('current_medication_drawing = ?');
      values.push(this.saveDrawing(id, 'current_medication_drawing', data.currentMedicationDrawing));
    }
    if (data.radiologyDrawing !== undefined) {
      fields.push('radiology_drawing = ?');
      values.push(this.saveDrawing(id, 'radiology_drawing', data.radiologyDrawing));
    }
    if (data.radiologyDrawing2 !== undefined) {
      fields.push('radiology_drawing_2 = ?');
      values.push(this.saveDrawing(id, 'radiology_drawing_2', data.radiologyDrawing2));
    }
    if (data.radiologyDrawing3 !== undefined) {
      fields.push('radiology_drawing_3 = ?');
      values.push(this.saveDrawing(id, 'radiology_drawing_3', data.radiologyDrawing3));
    }
    if (data.labTestRequest !== undefined) {
      fields.push('lab_test_request = ?');
      values.push(data.labTestRequest);
    }
    if (data.radiologyRequest !== undefined) {
      fields.push('radiology_request = ?');
      values.push(data.radiologyRequest);
    }
    if (data.medicalChecklists !== undefined) {
      fields.push('medical_checklists = ?');
      values.push(data.medicalChecklists);
    }
    if (data.vitals?.bloodPressure !== undefined) {
      fields.push('blood_pressure = ?');
      values.push(data.vitals.bloodPressure);
    }
    if (data.vitals?.temperature !== undefined) {
      fields.push('temperature = ?');
      values.push(data.vitals.temperature);
    }
    if (data.vitals?.weight !== undefined) {
      fields.push('weight = ?');
      values.push(data.vitals.weight);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE visits SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id) as Promise<Visit>;
  }

  delete(id: string): Promise<void> {
    db.prepare('DELETE FROM visits WHERE id = ?').run(id);
    return Promise.resolve();
  }

  findByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Visit[]> {
    const rows = db.prepare(
      `SELECT * FROM visits
       WHERE doctor_id = ? AND visit_date >= ? AND visit_date <= ?
       ORDER BY visit_date DESC`
    ).all(doctorId, startDate.toISOString(), endDate.toISOString()) as Record<string, unknown>[];
    return Promise.resolve(rows.map(row => this.mapToEntity(row)));
  }

  getAnalytics(doctorId: string, startDate: Date, endDate: Date): Promise<AnalyticsData> {
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // Get summary statistics
    const summary = db.prepare(`
      SELECT
        COUNT(*) as total_visits,
        COUNT(CASE WHEN visit_type = 'new' OR visit_type IS NULL THEN 1 END) as new_visits,
        COUNT(CASE WHEN visit_type = 'followup' THEN 1 END) as followup_visits,
        COALESCE(SUM(price), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN visit_type = 'new' OR visit_type IS NULL THEN price ELSE 0 END), 0) as new_visit_revenue,
        COALESCE(SUM(CASE WHEN visit_type = 'followup' THEN price ELSE 0 END), 0) as followup_visit_revenue,
        COUNT(DISTINCT patient_id) as unique_patients
      FROM visits
      WHERE doctor_id = ? AND visit_date >= ? AND visit_date <= ?
    `).get(doctorId, startStr, endStr) as Record<string, unknown>;

    // Get daily breakdown
    const dailyRows = db.prepare(`
      SELECT
        DATE(visit_date) as date,
        COUNT(*) as total_visits,
        COUNT(CASE WHEN visit_type = 'new' OR visit_type IS NULL THEN 1 END) as new_visits,
        COUNT(CASE WHEN visit_type = 'followup' THEN 1 END) as followup_visits,
        COALESCE(SUM(price), 0) as revenue
      FROM visits
      WHERE doctor_id = ? AND visit_date >= ? AND visit_date <= ?
      GROUP BY DATE(visit_date)
      ORDER BY date DESC
    `).all(doctorId, startStr, endStr) as Record<string, unknown>[];

    const dailyBreakdown = dailyRows.map(row => ({
      date: row.date as string,
      totalVisits: Number(row.total_visits) || 0,
      newVisits: Number(row.new_visits) || 0,
      followupVisits: Number(row.followup_visits) || 0,
      revenue: Number(row.revenue) || 0,
    }));

    return Promise.resolve({
      totalVisits: Number(summary.total_visits) || 0,
      newVisits: Number(summary.new_visits) || 0,
      followupVisits: Number(summary.followup_visits) || 0,
      totalRevenue: Number(summary.total_revenue) || 0,
      newVisitRevenue: Number(summary.new_visit_revenue) || 0,
      followupVisitRevenue: Number(summary.followup_visit_revenue) || 0,
      uniquePatients: Number(summary.unique_patients) || 0,
      dailyBreakdown,
    });
  }

  private mapToEntity(row: Record<string, unknown>): Visit {
    return {
      id: row.id as string,
      patientId: row.patient_id as string,
      doctorId: row.doctor_id as string,
      visitDate: new Date(row.visit_date as string),
      visitType: (row.visit_type as VisitType) || 'new',
      price: typeof row.price === 'string' ? parseFloat(row.price) : (row.price as number) || 0,
      chiefComplaint: row.chief_complaint as string,
      chiefComplaintDrawing: row.chief_complaint_drawing as string | null,
      diagnosis: row.diagnosis as string,
      diagnosisDrawing: row.diagnosis_drawing as string | null,
      notes: row.notes as string,
      notesDrawing: row.notes_drawing as string | null,
      notesDrawing2: row.notes_drawing_2 as string | null,
      notesDrawing3: row.notes_drawing_3 as string | null,
      pastMedicalHistoryDrawing: row.past_medical_history_drawing as string | null,
      hpiDrawing: row.hpi_drawing as string | null,
      drugHistoryDrawing: row.drug_history_drawing as string | null,
      familyHistoryDrawing: row.family_history_drawing as string | null,
      currentMedicationDrawing: row.current_medication_drawing as string | null,
      radiologyDrawing: row.radiology_drawing as string | null,
      radiologyDrawing2: row.radiology_drawing_2 as string | null,
      radiologyDrawing3: row.radiology_drawing_3 as string | null,
      labTestRequest: row.lab_test_request as string | null,
      radiologyRequest: row.radiology_request as string | null,
      medicalChecklists: row.medical_checklists as string | null,
      vitals: {
        bloodPressure: row.blood_pressure as string,
        temperature: row.temperature as number,
        weight: row.weight as number,
      },
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  // Like mapToEntity but for rows from findMetaByPatientId — the heavy
  // drawing/checklist columns weren't SELECT'd, so we fill them with null.
  // Frontend code that wants drawings should call findById(visitId).
  private mapToMetaEntity(row: Record<string, unknown>): Visit {
    return {
      id: row.id as string,
      patientId: row.patient_id as string,
      doctorId: row.doctor_id as string,
      visitDate: new Date(row.visit_date as string),
      visitType: (row.visit_type as VisitType) || 'new',
      price: typeof row.price === 'string' ? parseFloat(row.price) : (row.price as number) || 0,
      chiefComplaint: (row.chief_complaint as string) || '',
      chiefComplaintDrawing: null,
      diagnosis: (row.diagnosis as string) || '',
      diagnosisDrawing: null,
      notes: (row.notes as string) || '',
      notesDrawing: null,
      notesDrawing2: null,
      notesDrawing3: null,
      pastMedicalHistoryDrawing: null,
      hpiDrawing: null,
      drugHistoryDrawing: null,
      familyHistoryDrawing: null,
      currentMedicationDrawing: null,
      radiologyDrawing: null,
      radiologyDrawing2: null,
      radiologyDrawing3: null,
      labTestRequest: null,
      radiologyRequest: null,
      medicalChecklists: null,
      vitals: {
        bloodPressure: (row.blood_pressure as string) || '',
        temperature: (row.temperature as number) ?? 0,
        weight: (row.weight as number) ?? 0,
      },
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
