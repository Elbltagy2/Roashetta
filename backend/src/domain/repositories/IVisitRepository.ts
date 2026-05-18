import { Visit, CreateVisitInput, UpdateVisitInput } from '../entities/Visit';

export interface IVisitRepository {
  findById(id: string): Promise<Visit | null>;
  findByPatientId(patientId: string): Promise<Visit[]>;
  /**
   * Lightweight visit list — drawings and large JSON blobs (lab requests,
   * radiology requests, medical checklists) are stripped to null. Used to
   * power the patient detail page without shipping megabytes of base64.
   * Callers needing full visit data should call findById per visit.
   */
  findMetaByPatientId(patientId: string): Promise<Visit[]>;
  findByDoctorId(doctorId: string): Promise<Visit[]>;
  create(data: CreateVisitInput): Promise<Visit>;
  update(id: string, data: UpdateVisitInput): Promise<Visit>;
  delete(id: string): Promise<void>;
  findByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Visit[]>;
}
