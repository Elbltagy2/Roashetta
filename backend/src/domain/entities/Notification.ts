export interface Notification {
  id: string;
  doctorId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  createdById: string;
  createdByName: string;
  createdByRole: 'doctor' | 'assistant';
  createdAt: Date;
  readAt: Date | null;
}

export type NotificationType = 'visit_created' | 'patient_updated' | 'current_patient_changed';

export interface CreateNotificationInput {
  doctorId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  createdById: string;
  createdByName: string;
  createdByRole: 'doctor' | 'assistant';
}
