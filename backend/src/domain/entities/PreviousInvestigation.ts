export interface PreviousInvestigation {
  id: string;
  patientId: string;
  name: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
}

export type CreatePreviousInvestigationInput = Omit<PreviousInvestigation, 'id' | 'uploadedAt'>;
