import { IPreviousInvestigationRepository } from '../../../domain/repositories/IPreviousInvestigationRepository';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { PreviousInvestigation, CreatePreviousInvestigationInput } from '../../../domain/entities/PreviousInvestigation';

export class UploadPreviousInvestigation {
  constructor(
    private previousInvestigationRepository: IPreviousInvestigationRepository,
    private patientRepository: IPatientRepository
  ) {}

  async execute(input: CreatePreviousInvestigationInput, doctorId: string): Promise<PreviousInvestigation> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to patient');
    }

    return this.previousInvestigationRepository.create(input);
  }
}
