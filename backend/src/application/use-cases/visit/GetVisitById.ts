import { IVisitRepository } from '../../../domain/repositories/IVisitRepository';
import { Visit } from '../../../domain/entities/Visit';

export class GetVisitById {
  constructor(private visitRepository: IVisitRepository) {}

  async execute(id: string, doctorId: string): Promise<Visit> {
    const visit = await this.visitRepository.findById(id);
    if (!visit) {
      throw new Error('Visit not found');
    }
    if (visit.doctorId !== doctorId) {
      throw new Error('Unauthorized access to visit');
    }
    return visit;
  }
}
