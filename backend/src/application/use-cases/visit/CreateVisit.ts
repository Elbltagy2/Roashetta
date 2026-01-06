import { IVisitRepository } from '../../../domain/repositories/IVisitRepository';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { Visit, CreateVisitInput } from '../../../domain/entities/Visit';
import { NotificationService } from '../../services/NotificationService';

interface UserInfo {
  id: string;
  name: string;
  role: 'doctor' | 'assistant';
}

export class CreateVisit {
  constructor(
    private visitRepository: IVisitRepository,
    private patientRepository: IPatientRepository,
    private notificationService?: NotificationService
  ) {}

  async execute(input: CreateVisitInput, userInfo?: UserInfo): Promise<Visit> {
    // Verify patient exists and belongs to doctor
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== input.doctorId) {
      throw new Error('Unauthorized access to patient');
    }

    const visit = await this.visitRepository.create(input);

    // Create notification if service is available
    if (this.notificationService && userInfo) {
      try {
        await this.notificationService.createAndEmit({
          doctorId: input.doctorId,
          type: 'visit_created',
          title: 'New Visit Added',
          message: `New visit added for patient ${patient.name}`,
          data: {
            visitId: visit.id,
            patientId: patient.id,
            patientName: patient.name,
          },
          createdById: userInfo.id,
          createdByName: userInfo.name,
          createdByRole: userInfo.role,
        });
      } catch (error) {
        // Log error but don't fail the visit creation
        console.error('Failed to create notification:', error);
      }
    }

    return visit;
  }
}
