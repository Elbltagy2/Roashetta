import { PatientRecord, CreatePatientRecordInput } from '../entities/PatientRecord';

export interface IPatientRecordRepository {
  findById(id: string): Promise<PatientRecord | null>;
  findByPatientId(patientId: string): Promise<PatientRecord[]>;
  create(data: CreatePatientRecordInput): Promise<PatientRecord>;
  delete(id: string): Promise<void>;
}
