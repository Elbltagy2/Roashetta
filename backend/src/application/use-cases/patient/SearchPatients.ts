import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { Patient } from '../../../domain/entities/Patient';

export class SearchPatients {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(doctorId: string, query: string): Promise<Patient[]> {
    return this.patientRepository.search(doctorId, query);
  }
}
