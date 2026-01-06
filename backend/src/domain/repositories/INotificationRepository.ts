import { Notification, CreateNotificationInput } from '../entities/Notification';

export interface INotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  findByDoctorId(doctorId: string, limit?: number): Promise<Notification[]>;
  findUnreadCount(doctorId: string): Promise<number>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(doctorId: string): Promise<void>;
}
