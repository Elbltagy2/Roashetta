import { IVisitRepository } from '../../../domain/repositories/IVisitRepository';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { Visit } from '../../../domain/entities/Visit';

export class GetVisitsByPatient {
  constructor(
    private visitRepository: IVisitRepository,
    private patientRepository: IPatientRepository
  ) {}

  async execute(patientId: string, doctorId: string): Promise<Visit[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to patient');
    }

    return this.visitRepository.findByPatientId(patientId);
  }
}
