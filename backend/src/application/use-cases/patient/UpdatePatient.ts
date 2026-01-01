import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { Patient, UpdatePatientInput } from '../../../domain/entities/Patient';

export class UpdatePatient {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(id: string, doctorId: string, input: UpdatePatientInput): Promise<Patient> {
    const patient = await this.patientRepository.findById(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to patient');
    }

    return this.patientRepository.update(id, input);
  }
}
