import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { Patient, UpdatePatientInput } from '../../../domain/entities/Patient';
import { NotificationService } from '../../services/NotificationService';

interface UserInfo {
  id: string;
  name: string;
  role: 'doctor' | 'assistant';
}

export class UpdatePatient {
  constructor(
    private patientRepository: IPatientRepository,
    private notificationService?: NotificationService
  ) {}

  async execute(id: string, doctorId: string, input: UpdatePatientInput, userInfo?: UserInfo): Promise<Patient> {
    const patient = await this.patientRepository.findById(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    if (patient.doctorId !== doctorId) {
      throw new Error('Unauthorized access to patient');
    }

    const updatedPatient = await this.patientRepository.update(id, input);

    // Create notification and emit real-time update if service is available
    if (this.notificationService && userInfo) {
      try {
        await this.notificationService.createAndEmit({
          doctorId,
          type: 'patient_updated',
          title: 'Patient Updated',
          message: `Patient ${updatedPatient.name} has been updated`,
          data: {
            patientId: updatedPatient.id,
            patientName: updatedPatient.name,
            patient: updatedPatient,
          },
          createdById: userInfo.id,
          createdByName: userInfo.name,
          createdByRole: userInfo.role,
        });
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    }

    return updatedPatient;
  }
}
