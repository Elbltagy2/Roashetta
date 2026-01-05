import { ILabResultRepository } from '../../../domain/repositories/ILabResultRepository';
import { LabResult } from '../../../domain/entities/LabResult';

export class GetLabResults {
  constructor(private labResultRepository: ILabResultRepository) {}

  async execute(patientId: string, doctorId: string): Promise<LabResult[]> {
    return this.labResultRepository.findByPatientId(patientId, doctorId);
  }

  async executeByDateRange(
    patientId: string,
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<LabResult[]> {
    return this.labResultRepository.findByDateRange(patientId, doctorId, startDate, endDate);
  }
}
