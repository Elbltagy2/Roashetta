import { Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AuthRequest } from '../middleware/authMiddleware';
import { pool } from '../../infrastructure/database/config';
import { PatientRepository } from '../../infrastructure/repositories/PatientRepository';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';
import { NotificationService } from '../../application/services/NotificationService';

const notificationRepository = new NotificationRepository();

export class CurrentPatientController {
  // Get the current patient for the doctor
  async getCurrentPatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;

      // Get the current_patient_id from doctors table
      const doctorResult = await pool.query(
        'SELECT current_patient_id FROM doctors WHERE id = $1',
        [doctorId]
      );

      if (!doctorResult.rows[0] || !doctorResult.rows[0].current_patient_id) {
        return res.json({ currentPatient: null });
      }

      // Get the full patient details
      const patientRepository = new PatientRepository();
      const patient = await patientRepository.findById(doctorResult.rows[0].current_patient_id);

      if (!patient) {
        // Patient was deleted, clear the current_patient_id
        await pool.query(
          'UPDATE doctors SET current_patient_id = NULL WHERE id = $1',
          [doctorId]
        );
        return res.json({ currentPatient: null });
      }

      res.json({ currentPatient: patient });
    } catch (error) {
      next(error);
    }
  }

  // Set a patient as the current patient
  async setCurrentPatient(req: AuthRequest, res: Response, next: NextFunction) {
    console.log('[CurrentPatientController] setCurrentPatient called');
    try {
      const doctorId = req.doctorId!;
      const { patientId } = req.params;

      // Verify the patient exists and belongs to this doctor
      const patientRepository = new PatientRepository();
      const patient = await patientRepository.findById(patientId);

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      if (patient.doctorId !== doctorId) {
        return res.status(403).json({ error: 'Patient does not belong to this doctor' });
      }

      // Update the current_patient_id in doctors table
      await pool.query(
        'UPDATE doctors SET current_patient_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [patientId, doctorId]
      );

      // Emit notification to all connected clients in the doctor's room
      const io = req.app.get('io') as SocketIOServer;
      const notificationService = new NotificationService(notificationRepository, io);

      try {
        await notificationService.createAndEmit({
          doctorId,
          type: 'current_patient_changed',
          title: 'Current Patient Changed',
          message: `Current patient set to ${patient.name}`,
          data: {
            patientId: patient.id,
            patientName: patient.name,
            patient: patient,
          },
          createdById: req.user!.id,
          createdByName: req.user!.email.split('@')[0],
          createdByRole: req.user!.role,
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      res.json({ currentPatient: patient });
    } catch (error) {
      next(error);
    }
  }

  // Clear the current patient (finish)
  async clearCurrentPatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;

      await pool.query(
        'UPDATE doctors SET current_patient_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [doctorId]
      );

      res.json({ currentPatient: null });
    } catch (error) {
      next(error);
    }
  }
}
