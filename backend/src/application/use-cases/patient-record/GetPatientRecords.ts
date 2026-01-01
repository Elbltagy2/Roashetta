import { IPatientRecordRepository } from '../../../domain/repositories/IPatientRecordRepository';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { PatientRecord } from '../../../domain/entities/PatientRecord';

export class GetPatientRecords {
  constructor(
    private patientRecordRepository: IPatientRecordRepository,
    private patientRepository: IPatientRepository
  ) {}

  async execute(patientId: string, doctorId: string): Promise<PatientRecord[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to patient');
    }

    return this.patientRecordRepository.findByPatientId(patientId);
  }
}
