import { Assistant, CreateAssistantInput, UpdateAssistantInput } from '../entities/Assistant';

export interface IAssistantRepository {
  findById(id: string): Promise<Assistant | null>;
  findByEmail(email: string): Promise<Assistant | null>;
  findByDoctorId(doctorId: string): Promise<Assistant[]>;
  create(data: CreateAssistantInput): Promise<Assistant>;
  update(id: string, data: UpdateAssistantInput): Promise<Assistant>;
  delete(id: string): Promise<void>;
}
