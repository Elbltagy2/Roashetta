import { IPreviousInvestigationRepository } from '../../../domain/repositories/IPreviousInvestigationRepository';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { PreviousInvestigation } from '../../../domain/entities/PreviousInvestigation';

export class GetPreviousInvestigations {
  constructor(
    private previousInvestigationRepository: IPreviousInvestigationRepository,
    private patientRepository: IPatientRepository
  ) {}

  async execute(patientId: string, doctorId: string): Promise<PreviousInvestigation[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to patient');
    }

    return this.previousInvestigationRepository.findByPatientId(patientId);
  }
}
