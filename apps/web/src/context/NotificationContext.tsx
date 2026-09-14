import React, { createContext, useContext, useState, useEffect } from 'react';
import { InAppNotification, NotificationType } from '../types/notification';

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  addNotification: (item: {
    title: string;
    message: string;
    type: NotificationType;
    actionTab?: 'marketplace' | 'my-sessions' | 'profile';
    slotId?: string;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'peermock_notifications_v1';

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'init-1',
    title: 'Welcome to Connect by Swipecraft!',
    message: '100% free peer technical mock practice with zero paywalls & zero ads. Upskill your craft and elevate others.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    type: 'system',
    actionTab: 'marketplace',
  },
  {
    id: 'init-2',
    title: 'Platform Unlocked & Ready',
    message: 'Explore open slots or host your own interview session with zero fees and no paywalls.',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    read: false,
    type: 'credit',
    actionTab: 'marketplace',
  },
  {
    id: 'init-3',
    title: 'Anti-Flake Honor Code Active',
    message: 'Remember: Always give 2+ hours courtesy notice if cancelling to keep your 100% reliability score.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: true,
    type: 'system',
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback to initial
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (item: {
    title: string;
    message: string;
    type: NotificationType;
    actionTab?: 'marketplace' | 'my-sessions' | 'profile';
    slotId?: string;
  }) => {
    const newItem: InAppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: item.title,
      message: item.message,
      timestamp: new Date().toISOString(),
      read: false,
      type: item.type,
      actionTab: item.actionTab,
      slotId: item.slotId,
    };
    setNotifications((prev) => [newItem, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
