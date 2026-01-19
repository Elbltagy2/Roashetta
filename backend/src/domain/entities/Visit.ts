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
  // Medical History Fields
  pastMedicalHistoryDrawing: string | null;
  hpiDrawing: string | null;
  drugHistoryDrawing: string | null;
  familyHistoryDrawing: string | null;
  currentMedicationDrawing: string | null;
  // Requested Lab
  requestedLabDrawing: string | null;
  vitals: Vitals;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateVisitInput = Omit<Visit, 'id' | 'visitDate' | 'createdAt' | 'updatedAt'>;
export type UpdateVisitInput = Partial<Omit<Visit, 'id' | 'patientId' | 'doctorId' | 'visitDate' | 'createdAt' | 'updatedAt'>>;
