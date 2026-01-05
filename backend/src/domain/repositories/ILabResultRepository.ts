import { LabResult, CreateLabResultInput, UpdateLabResultInput } from '../entities/LabResult';

export interface ILabResultRepository {
  findById(id: string): Promise<LabResult | null>;
  findByPatientId(patientId: string, doctorId: string): Promise<LabResult[]>;
  findByDateRange(patientId: string, doctorId: string, startDate: Date, endDate: Date): Promise<LabResult[]>;
  create(input: CreateLabResultInput): Promise<LabResult>;
  update(id: string, doctorId: string, input: UpdateLabResultInput): Promise<LabResult | null>;
  delete(id: string, doctorId: string): Promise<boolean>;
}
