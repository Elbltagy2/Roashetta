import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { Patient, CreatePatientInput } from '../../../domain/entities/Patient';

export class CreatePatient {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(input: CreatePatientInput): Promise<Patient> {
    return this.patientRepository.create(input);
  }
}
