import { IPatientRecordRepository } from '../../../domain/repositories/IPatientRecordRepository';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { PatientRecord, CreatePatientRecordInput } from '../../../domain/entities/PatientRecord';

export class UploadPatientRecord {
  constructor(
    private patientRecordRepository: IPatientRecordRepository,
    private patientRepository: IPatientRepository
  ) {}

  async execute(input: CreatePatientRecordInput, doctorId: string): Promise<PatientRecord> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to patient');
    }

    return this.patientRecordRepository.create(input);
  }
}
