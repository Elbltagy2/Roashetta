import bcrypt from 'bcryptjs';
import { IDoctorRepository } from '../../../domain/repositories/IDoctorRepository';
import { Doctor } from '../../../domain/entities/Doctor';

interface RegisterDoctorInput {
  email: string;
  password: string;
  name: string;
  specialization?: string;
  phone?: string;
  clinicName?: string;
  clinicAddress?: string;
}

export class RegisterDoctor {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(input: RegisterDoctorInput): Promise<Doctor> {
    const existingDoctor = await this.doctorRepository.findByEmail(input.email);
    if (existingDoctor) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    return this.doctorRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
      specialization: input.specialization || '',
      phone: input.phone || '',
      clinicName: input.clinicName || '',
      clinicAddress: input.clinicAddress || '',
    });
  }
}
