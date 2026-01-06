import { Server as SocketIOServer } from 'socket.io';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { CreateNotificationInput, Notification } from '../../domain/entities/Notification';

export class NotificationService {
  constructor(
    private notificationRepository: INotificationRepository,
    private io: SocketIOServer
  ) {}

  async createAndEmit(input: CreateNotificationInput): Promise<Notification> {
    console.log('[NotificationService] Creating notification:', input.type, 'for doctor:', input.doctorId);

    // Save notification to database
    const notification = await this.notificationRepository.create(input);
    console.log('[NotificationService] Notification saved to DB:', notification.id);

    // Emit to all connected clients in the doctor's room
    const room = `doctor:${input.doctorId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    console.log(`[NotificationService] Sockets in room ${room}:`, socketsInRoom?.size || 0);

    this.io.to(room).emit('notification', notification);
    console.log(`[NotificationService] Notification emitted to room ${room}:`, notification.title);

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
