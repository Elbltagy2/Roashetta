export interface PatientRecord {
  id: string;
  patientId: string;
  name: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
}

export type CreatePatientRecordInput = Omit<PatientRecord, 'id' | 'uploadedAt'>;
