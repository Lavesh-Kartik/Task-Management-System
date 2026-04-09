import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationAPI } from '../api';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const channelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data.data);
      setUnread(data.unreadCount);
    } catch {
      // silently ignore
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Supabase Realtime subscription — listen for INSERT on notifications table
  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user._id}`,
        },
        (payload) => {
          const n = payload.new;
          const formatted = { ...n, _id: n.id, user: n.user_id };
          setNotifications((prev) => [formatted, ...prev]);
          setUnread((u) => u + 1);

          // Show a toast for the new notification
          toast(n.message, {
            icon: '🔔',
            duration: 4000,
            style: {
              borderRadius: '16px',
              background: '#0f172a',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
            },
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);

  // Fallback polling every 60s (in case Realtime is not available)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications((n) => n.map((x) => x._id === id ? { ...x, read: true } : x));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  const deleteNotification = async (id) => {
    const n = notifications.find((x) => x._id === id);
    await notificationAPI.delete(id);
    setNotifications((prev) => prev.filter((x) => x._id !== id));
    if (!n?.read) setUnread((u) => Math.max(0, u - 1));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unread,
      fetchNotifications,
      markRead,
      markAllRead,
      deleteNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
