import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';

export interface AppNotification {
  id: string;
  type: 'job_created' | 'job_updated' | 'truck_updated' | 'meeting_created' | 'report_created' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : '';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { accessToken, user } = useAuthStore();
  const { fetchJobs, fetchTrucks, fetchMeetings, fetchReports } = useAppStore();

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'read'>) => {
    setNotifications(prev => [
      { ...notif, id: `${Date.now()}-${Math.random()}`, read: false },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (!accessToken || !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', 'managers');
      if (user.role === 'admin') socket.emit('join-room', 'admins');
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket.io connection error:', err.message);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('job-created', (data: any) => {
      addNotification({
        type: 'job_created',
        title: 'Umurimo Mushya / New Job',
        message: `"${data?.title || 'Umurimo'}" wongerewe`,
        timestamp: new Date(),
      });
      fetchJobs();
    });

    socket.on('job-updated', (data: any) => {
      addNotification({
        type: 'job_updated',
        title: 'Umurimo Wavuguruwe / Job Updated',
        message: `"${data?.title || 'Umurimo'}" wavuguruwe`,
        timestamp: new Date(),
      });
      fetchJobs();
    });

    socket.on('truck-updated', (data: any) => {
      addNotification({
        type: 'truck_updated',
        title: 'Ikinyabiziga / Truck Updated',
        message: `${data?.name || 'Ikinyabiziga'} - ${data?.status || ''}`,
        timestamp: new Date(),
      });
      fetchTrucks();
    });

    socket.on('truck-created', (data: any) => {
      addNotification({
        type: 'truck_updated',
        title: 'Ikinyabiziga Gishya / New Truck',
        message: `${data?.name || 'Ikinyabiziga'} cyongerewe`,
        timestamp: new Date(),
      });
      fetchTrucks();
    });

    socket.on('meeting-created', (data: any) => {
      addNotification({
        type: 'meeting_created',
        title: 'Inama Nshya / New Meeting',
        message: `"${data?.title || 'Inama'}" iteganyijwe`,
        timestamp: new Date(),
      });
      fetchMeetings();
    });

    socket.on('report-created', (data: any) => {
      addNotification({
        type: 'report_created',
        title: 'Raporo Nshya / New Report',
        message: `"${data?.title || 'Raporo'}" yatanzwe`,
        timestamp: new Date(),
      });
      fetchReports();
    });

    socket.on('dashboard-update', () => {
      fetchJobs();
      fetchTrucks();
    });

    socket.on('notification', (data: any) => {
      addNotification({
        type: 'info',
        title: data?.title || 'Ubutumwa Bushya',
        message: data?.message || '',
        timestamp: new Date(),
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [accessToken, user?.id]);

  return {
    socket: socketRef.current,
    connected,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAllRead,
    markRead,
    clearNotifications,
  };
}
