import bcrypt from 'bcryptjs';
import { IAssistantRepository } from '../../../domain/repositories/IAssistantRepository';
import { Assistant, AssistantPermissions } from '../../../domain/entities/Assistant';

interface CreateAssistantInput {
  doctorId: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  permissions?: Partial<AssistantPermissions>;
}

export class CreateAssistant {
  constructor(private assistantRepository: IAssistantRepository) {}

  async execute(input: CreateAssistantInput): Promise<Assistant> {
    // Check if email already exists
    const existing = await this.assistantRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    return this.assistantRepository.create({
      doctorId: input.doctorId,
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
      permissions: input.permissions,
    });
  }
}
