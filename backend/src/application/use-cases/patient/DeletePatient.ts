import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';

export class DeletePatient {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(id: string, doctorId: string): Promise<void> {
    const patient = await this.patientRepository.findById(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to patient');
    }

    await this.patientRepository.delete(id);
  }
}
