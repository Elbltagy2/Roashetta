import { QueueEntry, CreateQueueEntryInput, UpdateQueueEntryInput } from '../entities/QueueEntry';

export interface IQueueRepository {
  findById(id: string): Promise<QueueEntry | null>;
  findByDate(doctorId: string, date: string): Promise<QueueEntry[]>;
  findByPatientAndDate(doctorId: string, patientId: string, date: string): Promise<QueueEntry | null>;
  create(data: CreateQueueEntryInput): Promise<QueueEntry>;
  update(id: string, data: UpdateQueueEntryInput): Promise<QueueEntry>;
  reorder(entries: { id: string; position: number }[]): Promise<void>;
  delete(id: string): Promise<void>;
  getNextPosition(doctorId: string, date: string): Promise<number>;
}
