import { ILabResultRepository } from '../../../domain/repositories/ILabResultRepository';
import { LabResult, UpdateLabResultInput } from '../../../domain/entities/LabResult';

export class UpdateLabResult {
  constructor(private labResultRepository: ILabResultRepository) {}

  async execute(id: string, doctorId: string, input: UpdateLabResultInput): Promise<LabResult | null> {
    return this.labResultRepository.update(id, doctorId, input);
  }
}
