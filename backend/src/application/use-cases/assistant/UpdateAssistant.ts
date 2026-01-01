import { IAssistantRepository } from '../../../domain/repositories/IAssistantRepository';
import { Assistant, UpdateAssistantInput } from '../../../domain/entities/Assistant';

export class UpdateAssistant {
  constructor(private assistantRepository: IAssistantRepository) {}

  async execute(id: string, doctorId: string, input: UpdateAssistantInput): Promise<Assistant> {
    const assistant = await this.assistantRepository.findById(id);
    if (!assistant) {
      throw new Error('Assistant not found');
    }
    if (assistant.doctorId !== doctorId) {
      throw new Error('Unauthorized access to assistant');
    }

    return this.assistantRepository.update(id, input);
  }
}
