import { Request, Response, NextFunction } from 'express';
import { RegisterDoctor } from '../../application/use-cases/auth/RegisterDoctor';
import { LoginDoctor } from '../../application/use-cases/auth/LoginDoctor';
import { LoginAssistant } from '../../application/use-cases/auth/LoginAssistant';
import { DoctorRepository } from '../../infrastructure/repositories/DoctorRepository';
import { AssistantRepository } from '../../infrastructure/repositories/AssistantRepository';

const doctorRepository = new DoctorRepository();
const assistantRepository = new AssistantRepository();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, specialization, phone, clinicName, clinicAddress } = req.body;

      const registerDoctor = new RegisterDoctor(doctorRepository);
      const doctor = await registerDoctor.execute({
        email,
        password,
        name,
        specialization,
        phone,
        clinicName,
        clinicAddress,
      });

      res.status(201).json({
        message: 'Doctor registered successfully',
        doctor: {
          id: doctor.id,
          email: doctor.email,
          name: doctor.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // First, try to login as doctor
      try {
        const loginDoctor = new LoginDoctor(doctorRepository);
        const result = await loginDoctor.execute({ email, password });

        return res.json({
          token: result.token,
          user: {
            ...result.doctor,
            role: 'doctor',
          },
        });
      } catch {
        // Doctor login failed, try assistant
      }

      // Try to login as assistant
      try {
        const loginAssistant = new LoginAssistant(assistantRepository);
        const result = await loginAssistant.execute({ email, password });

        return res.json({
          token: result.token,
          user: result.user,
        });
      } catch {
        // Assistant login also failed
      }

      // Both failed
      return res.status(401).json({ error: 'Invalid email or password' });
    } catch (error) {
      next(error);
    }
  }
}
