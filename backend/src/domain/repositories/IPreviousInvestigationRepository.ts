import { PreviousInvestigation, CreatePreviousInvestigationInput } from '../entities/PreviousInvestigation';

export interface IPreviousInvestigationRepository {
  findById(id: string): Promise<PreviousInvestigation | null>;
  findByPatientId(patientId: string): Promise<PreviousInvestigation[]>;
  create(data: CreatePreviousInvestigationInput): Promise<PreviousInvestigation>;
  delete(id: string): Promise<void>;
}
