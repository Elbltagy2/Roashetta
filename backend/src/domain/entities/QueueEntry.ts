export type QueueStatus = 'waiting' | 'in-progress' | 'done';

export interface QueueEntry {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  position: number;
  status: QueueStatus;
  addedAt: Date;
  addedBy: string;
  queueDate: string; // YYYY-MM-DD
}

export interface CreateQueueEntryInput {
  doctorId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  addedBy: string;
}

export interface UpdateQueueEntryInput {
  status?: QueueStatus;
  position?: number;
}
