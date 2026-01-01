import { Doctor, CreateDoctorInput, UpdateDoctorInput } from '../entities/Doctor';

export interface IDoctorRepository {
  findById(id: string): Promise<Doctor | null>;
  findByEmail(email: string): Promise<Doctor | null>;
  create(data: CreateDoctorInput): Promise<Doctor>;
  update(id: string, data: UpdateDoctorInput): Promise<Doctor>;
  delete(id: string): Promise<void>;
}
