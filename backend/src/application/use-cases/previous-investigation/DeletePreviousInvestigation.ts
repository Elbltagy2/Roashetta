import { IPreviousInvestigationRepository } from '../../../domain/repositories/IPreviousInvestigationRepository';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';

export class DeletePreviousInvestigation {
  constructor(
    private previousInvestigationRepository: IPreviousInvestigationRepository,
    private patientRepository: IPatientRepository
  ) {}

  async execute(investigationId: string, doctorId: string): Promise<void> {
    const investigation = await this.previousInvestigationRepository.findById(investigationId);
    if (!investigation) {
      throw new Error('Investigation not found');
    }

    const patient = await this.patientRepository.findById(investigation.patientId);
    if (!patient || patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to investigation');
    }

    await this.previousInvestigationRepository.delete(investigationId);
  }
}
