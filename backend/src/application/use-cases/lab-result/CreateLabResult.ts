import { ILabResultRepository } from '../../../domain/repositories/ILabResultRepository';
import { LabResult, CreateLabResultInput } from '../../../domain/entities/LabResult';

export class CreateLabResult {
  constructor(private labResultRepository: ILabResultRepository) {}

  async execute(input: CreateLabResultInput): Promise<LabResult> {
    return this.labResultRepository.create(input);
  }
}
