import { Visit, CreateVisitInput, UpdateVisitInput } from '../entities/Visit';

export interface IVisitRepository {
  findById(id: string): Promise<Visit | null>;
  findByPatientId(patientId: string): Promise<Visit[]>;
  findByDoctorId(doctorId: string): Promise<Visit[]>;
  create(data: CreateVisitInput): Promise<Visit>;
  update(id: string, data: UpdateVisitInput): Promise<Visit>;
  delete(id: string): Promise<void>;
  findByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Visit[]>;
}
