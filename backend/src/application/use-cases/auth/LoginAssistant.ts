import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAssistantRepository } from '../../../domain/repositories/IAssistantRepository';
import { AssistantPermissions } from '../../../domain/entities/Assistant';

interface LoginAssistantInput {
  email: string;
  password: string;
}

interface LoginAssistantOutput {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'assistant';
    doctorId: string;
    permissions: AssistantPermissions;
  };
}

export class LoginAssistant {
  constructor(private assistantRepository: IAssistantRepository) {}

  async execute(input: LoginAssistantInput): Promise<LoginAssistantOutput> {
    const assistant = await this.assistantRepository.findByEmail(input.email);
    if (!assistant) {
      throw new Error('Invalid email or password');
    }

    if (!assistant.isActive) {
      throw new Error('Account is deactivated');
    }

    const isValidPassword = await bcrypt.compare(input.password, assistant.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      {
        id: assistant.id,
        email: assistant.email,
        role: 'assistant',
        doctorId: assistant.doctorId,
        permissions: assistant.permissions,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: assistant.id,
        email: assistant.email,
        name: assistant.name,
        role: 'assistant',
        doctorId: assistant.doctorId,
        permissions: assistant.permissions,
      },
    };
  }
}
