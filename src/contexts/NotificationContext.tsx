import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import socketService from '../services/socket';
import api from '../services/api';
import { toast } from 'sonner';
import { Notification } from '../types/notification';
import { Patient } from './DataContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Notifications and their live delivery are off by default — a single doctor
 * working alone has no use for being told about their own actions. Re-enable
 * at build time with VITE_ENABLE_NOTIFICATIONS=true (and ENABLE_SOCKET=1 on the
 * server, plus VITE_ENABLE_SOCKET=true here, for instant delivery).
 */
export const NOTIFICATIONS_ENABLED = import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true';
const SOCKET_ENABLED = NOTIFICATIONS_ENABLED && import.meta.env.VITE_ENABLE_SOCKET === 'true';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { refreshCurrentPatient, currentPatient } = useData();

  // Use refs to always have access to latest values in socket callback
  const currentPatientRef = useRef<Patient | null>(currentPatient);
  const refreshCurrentPatientRef = useRef(refreshCurrentPatient);

  // Keep refs updated
  useEffect(() => {
    currentPatientRef.current = currentPatient;
  }, [currentPatient]);

  useEffect(() => {
    refreshCurrentPatientRef.current = refreshCurrentPatient;
  }, [refreshCurrentPatient]);

  // Load notifications on mount
  useEffect(() => {
    if (!NOTIFICATIONS_ENABLED) {
      setIsLoading(false);
      return;
    }
    if (isAuthenticated) {
      loadNotifications();
      if (SOCKET_ENABLED) connectSocket();
    } else {
      // Clear notifications when logged out
      setNotifications([]);
      setUnreadCount(0);
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  // Without a live socket, refresh when the window regains focus so the bell
  // isn't stale after an assistant adds a patient on another machine.
  useEffect(() => {
    if (!NOTIFICATIONS_ENABLED || SOCKET_ENABLED || !isAuthenticated) return;
    const onFocus = () => loadNotifications();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const [notifs, countData] = await Promise.all([
        api.getNotifications(),
        api.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(countData.count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectSocket = () => {
    const socket = socketService.connect();

    socket.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification);

      // Add to list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast
      toast.success(notification.title, {
        description: notification.message,
        duration: 5000,
      });

      // If this is a patient_updated notification and matches current patient, refresh it
      if (notification.type === 'patient_updated' && notification.data?.patientId) {
        const current = currentPatientRef.current;
        if (current && current.id === notification.data.patientId) {
          console.log('Current patient updated, refreshing...');
          refreshCurrentPatientRef.current();
        }
      }

      // If current patient was changed, always refresh
      if (notification.type === 'current_patient_changed') {
        console.log('Current patient changed, refreshing...');
        refreshCurrentPatientRef.current();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  };

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: now })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await api.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        refreshNotifications: loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
