import { ILabResultRepository } from '../../../domain/repositories/ILabResultRepository';

export class DeleteLabResult {
  constructor(private labResultRepository: ILabResultRepository) {}

  async execute(id: string, doctorId: string): Promise<boolean> {
    return this.labResultRepository.delete(id, doctorId);
  }
}
