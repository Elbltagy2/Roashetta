import { Server as SocketIOServer } from 'socket.io';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { CreateNotificationInput, Notification } from '../../domain/entities/Notification';

export class NotificationService {
  constructor(
    private notificationRepository: INotificationRepository,
    // null when Socket.io is disabled — the notification is still stored, it
    // just isn't pushed live.
    private io: SocketIOServer | null
  ) {}

  async createAndEmit(input: CreateNotificationInput): Promise<Notification> {
    // Notifications are off by default: a solo doctor does not need to be told
    // about their own actions, and the rows only grow the database. Set
    // ENABLE_NOTIFICATIONS=1 to record them again.
    if (process.env.ENABLE_NOTIFICATIONS !== '1') {
      return {
        id: '',
        ...input,
        isRead: true,
        readAt: null,
        createdAt: new Date(),
      } as unknown as Notification;
    }

    // Save notification to database
    const notification = await this.notificationRepository.create(input);

    if (!this.io) return notification;

    // Emit to all connected clients in the doctor's room
    const room = `doctor:${input.doctorId}`;
    this.io.to(room).emit('notification', notification);

    return notification;
  }

  async getNotifications(doctorId: string, limit?: number): Promise<Notification[]> {
    return this.notificationRepository.findByDoctorId(doctorId, limit);
  }

  async getUnreadCount(doctorId: string): Promise<number> {
    return this.notificationRepository.findUnreadCount(doctorId);
  }

  async markAsRead(id: string): Promise<void> {
    return this.notificationRepository.markAsRead(id);
  }

  async markAllAsRead(doctorId: string): Promise<void> {
    return this.notificationRepository.markAllAsRead(doctorId);
  }
}
