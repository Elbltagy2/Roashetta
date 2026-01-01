import { Patient, CreatePatientInput, UpdatePatientInput } from '../entities/Patient';

export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByDoctorId(doctorId: string): Promise<Patient[]>;
  findByNationalId(nationalId: string): Promise<Patient | null>;
  create(data: CreatePatientInput): Promise<Patient>;
  update(id: string, data: UpdatePatientInput): Promise<Patient>;
  delete(id: string): Promise<void>;
  search(doctorId: string, query: string): Promise<Patient[]>;
}
