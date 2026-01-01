import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { Patient } from '../../../domain/entities/Patient';

export class GetPatients {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(doctorId: string): Promise<Patient[]> {
    return this.patientRepository.findByDoctorId(doctorId);
  }
}
