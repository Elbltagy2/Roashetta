import { Patient, CreatePatientInput, UpdatePatientInput } from '../entities/Patient';

export interface PaginatedPatientsOptions {
  page: number;
  limit: number;
  search?: string;
  gender?: 'male' | 'female';
}

export interface PaginatedPatientsResult {
  data: Patient[];
  total: number;
}

export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByDoctorId(doctorId: string): Promise<Patient[]>;
  findPaginated(doctorId: string, opts: PaginatedPatientsOptions): Promise<PaginatedPatientsResult>;
  create(data: CreatePatientInput): Promise<Patient>;
  update(id: string, data: UpdatePatientInput): Promise<Patient>;
  delete(id: string): Promise<void>;
  search(doctorId: string, query: string): Promise<Patient[]>;
}
