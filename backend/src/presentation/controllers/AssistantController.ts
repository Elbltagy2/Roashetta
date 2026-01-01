import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { CreateAssistant } from '../../application/use-cases/assistant/CreateAssistant';
import { GetAssistants } from '../../application/use-cases/assistant/GetAssistants';
import { UpdateAssistant } from '../../application/use-cases/assistant/UpdateAssistant';
import { DeleteAssistant } from '../../application/use-cases/assistant/DeleteAssistant';
import { AssistantRepository } from '../../infrastructure/repositories/AssistantRepository';

const assistantRepository = new AssistantRepository();

export class AssistantController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name, phone, permissions } = req.body;

      const createAssistant = new CreateAssistant(assistantRepository);
      const assistant = await createAssistant.execute({
        doctorId: req.doctorId!,
        email,
        password,
        name,
        phone,
        permissions,
      });

      res.status(201).json({
        id: assistant.id,
        email: assistant.email,
        name: assistant.name,
        phone: assistant.phone,
        isActive: assistant.isActive,
        permissions: assistant.permissions,
        createdAt: assistant.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const getAssistants = new GetAssistants(assistantRepository);
      const assistants = await getAssistants.execute(req.doctorId!);

      res.json(
        assistants.map((a) => ({
          id: a.id,
          email: a.email,
          name: a.name,
          phone: a.phone,
          isActive: a.isActive,
          permissions: a.permissions,
          createdAt: a.createdAt,
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updateAssistant = new UpdateAssistant(assistantRepository);
      const assistant = await updateAssistant.execute(
        req.params.id,
        req.doctorId!,
        req.body
      );

      res.json({
        id: assistant.id,
        email: assistant.email,
        name: assistant.name,
        phone: assistant.phone,
        isActive: assistant.isActive,
        permissions: assistant.permissions,
        updatedAt: assistant.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deleteAssistant = new DeleteAssistant(assistantRepository);
      await deleteAssistant.execute(req.params.id, req.doctorId!);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
