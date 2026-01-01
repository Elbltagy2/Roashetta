import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { Patient } from '../../../domain/entities/Patient';

export class GetPatientById {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(id: string, doctorId: string): Promise<Patient> {
    const patient = await this.patientRepository.findById(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to patient');
    }
    return patient;
  }
}
