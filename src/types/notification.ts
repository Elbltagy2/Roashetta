export interface Notification {
  id: string;
  doctorId: string;
  type: 'visit_created' | 'patient_updated' | 'current_patient_changed';
  title: string;
  message: string;
  data: {
    visitId?: string;
    patientId?: string;
    patientName?: string;
    patient?: any;
  };
  isRead: boolean;
  createdById: string;
  createdByName: string;
  createdByRole: 'doctor' | 'assistant';
  createdAt: string;
  readAt: string | null;
}
