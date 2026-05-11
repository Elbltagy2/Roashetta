export interface Vitals {
  bloodPressure: string;
  temperature: number;
  weight: number;
}

export type VisitType = 'new' | 'followup';

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  visitDate: Date;
  visitType: VisitType;
  price: number;
  chiefComplaint: string;
  chiefComplaintDrawing: string | null;
  diagnosis: string;
  diagnosisDrawing: string | null;
  notes: string;
  notesDrawing: string | null;
  notesDrawing2: string | null;
  notesDrawing3: string | null;
  // Medical History Fields
  pastMedicalHistoryDrawing: string | null;
  hpiDrawing: string | null;
  drugHistoryDrawing: string | null;
  familyHistoryDrawing: string | null;
  currentMedicationDrawing: string | null;
  // Radiology (3 pages)
  radiologyDrawing: string | null;
  radiologyDrawing2: string | null;
  radiologyDrawing3: string | null;
  // Lab Test Request (JSON string)
  labTestRequest: string | null;
  // Radiology Request (JSON string)
  radiologyRequest: string | null;
  // Medical Checklists (JSON string - all 7 checklist forms combined)
  medicalChecklists: string | null;
  vitals: Vitals;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateVisitInput = Omit<Visit, 'id' | 'visitDate' | 'createdAt' | 'updatedAt'>;
export type UpdateVisitInput = Partial<Omit<Visit, 'id' | 'patientId' | 'doctorId' | 'visitDate' | 'createdAt' | 'updatedAt'>>;
