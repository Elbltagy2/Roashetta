import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { Patient, CreatePatientInput } from '../../../domain/entities/Patient';

export class CreatePatient {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(input: CreatePatientInput): Promise<Patient> {
    // Check for duplicate national ID
    if (input.nationalId) {
      const existing = await this.patientRepository.findByNationalId(input.nationalId);
      if (existing) {
        throw new Error('Patient with this national ID already exists');
      }
    }

    return this.patientRepository.create(input);
  }
}
