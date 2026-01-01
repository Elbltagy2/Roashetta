import { IPatientRecordRepository } from '../../../domain/repositories/IPatientRecordRepository';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';

export class DeletePatientRecord {
  constructor(
    private patientRecordRepository: IPatientRecordRepository,
    private patientRepository: IPatientRepository
  ) {}

  async execute(recordId: string, doctorId: string): Promise<void> {
    const record = await this.patientRecordRepository.findById(recordId);
    if (!record) {
      throw new Error('Record not found');
    }

    const patient = await this.patientRepository.findById(record.patientId);
    if (!patient || patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to record');
    }

    await this.patientRecordRepository.delete(recordId);
  }
}
