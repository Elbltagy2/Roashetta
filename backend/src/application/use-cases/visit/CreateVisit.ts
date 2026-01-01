import { IVisitRepository } from '../../../domain/repositories/IVisitRepository';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { Visit, CreateVisitInput } from '../../../domain/entities/Visit';

export class CreateVisit {
  constructor(
    private visitRepository: IVisitRepository,
    private patientRepository: IPatientRepository
  ) {}

  async execute(input: CreateVisitInput): Promise<Visit> {
    // Verify patient exists and belongs to doctor
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== input.doctorId) {
      throw new Error('Unauthorized access to patient');
    }

    return this.visitRepository.create(input);
  }
}
