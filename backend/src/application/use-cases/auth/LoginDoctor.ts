import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IDoctorRepository } from '../../../domain/repositories/IDoctorRepository';

interface LoginDoctorInput {
  email: string;
  password: string;
}

interface LoginDoctorOutput {
  token: string;
  doctor: {
    id: string;
    email: string;
    name: string;
    specialization: string;
    clinicName: string;
  };
}

export class LoginDoctor {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(input: LoginDoctorInput): Promise<LoginDoctorOutput> {
    const doctor = await this.doctorRepository.findByEmail(input.email);
    if (!doctor) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(input.password, doctor.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { doctorId: doctor.id, email: doctor.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        specialization: doctor.specialization,
        clinicName: doctor.clinicName,
      },
    };
  }
}
