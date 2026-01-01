import { IAssistantRepository } from '../../../domain/repositories/IAssistantRepository';
import { Assistant } from '../../../domain/entities/Assistant';

export class GetAssistants {
  constructor(private assistantRepository: IAssistantRepository) {}

  async execute(doctorId: string): Promise<Assistant[]> {
    return this.assistantRepository.findByDoctorId(doctorId);
  }
}
