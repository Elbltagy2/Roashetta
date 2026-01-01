import { IAssistantRepository } from '../../../domain/repositories/IAssistantRepository';

export class DeleteAssistant {
  constructor(private assistantRepository: IAssistantRepository) {}

  async execute(id: string, doctorId: string): Promise<void> {
    const assistant = await this.assistantRepository.findById(id);
    if (!assistant) {
      throw new Error('Assistant not found');
    }
    if (assistant.doctorId !== doctorId) {
      throw new Error('Unauthorized access to assistant');
    }

    await this.assistantRepository.delete(id);
  }
}
