import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, UserPlus, UserCheck, Clock, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Notification } from '@/types/notification';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();

  const getIcon = () => {
    switch (notification.type) {
      case 'visit_created':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'patient_updated':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'current_patient_changed':
        return <UserCheck className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleClick = async () => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to related page
    if (notification.data.patientId) {
      navigate(`/patients/${notification.data.patientId}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    await deleteNotification(notification.id);
  };

  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md',
        !notification.isRead && 'bg-blue-50 border-blue-200 dark:bg-blue-950/20'
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
              )}
              <button
                onClick={handleDelete}
                className="flex-shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{getTimeAgo()}</span>
            <span>•</span>
            <span className="capitalize">{notification.createdByRole}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
