export interface Vitals {
  bloodPressure: string;
  temperature: number;
  weight: number;
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  visitDate: Date;
  chiefComplaint: string;
  chiefComplaintDrawing: string | null;
  diagnosis: string;
  diagnosisDrawing: string | null;
  notes: string;
  notesDrawing: string | null;
  vitals: Vitals;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateVisitInput = Omit<Visit, 'id' | 'visitDate' | 'createdAt' | 'updatedAt'>;
export type UpdateVisitInput = Partial<Omit<Visit, 'id' | 'patientId' | 'doctorId' | 'visitDate' | 'createdAt' | 'updatedAt'>>;
