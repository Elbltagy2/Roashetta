import React from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';

export const NotificationList: React.FC = () => {
  const { notifications, unreadCount, isLoading, markAllAsRead, deleteAllNotifications } = useNotifications();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Bell className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground font-medium">No notifications yet</p>
        <p className="text-sm text-muted-foreground/70 mt-2">
          You'll see notifications here when there's activity
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-b flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex-1"
            >
              Mark all as read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={deleteAllNotifications}
            className={unreadCount > 0 ? "flex-1" : "w-full"}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear all
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
