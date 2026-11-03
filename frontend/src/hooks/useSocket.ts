import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore.js';

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
}

export const useSocket = (bookingId?: string) => {
  const token = useAuthStore((state) => state.token);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number; speedKmh: number } | null>(null);
  const [sosAlert, setSosAlert] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [liveBookingStatus, setLiveBookingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io('http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (bookingId) {
        socket.emit('JOIN_TRIP_ROOM', { bookingId });
        socket.emit('GET_MESSAGES', { bookingId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('RIDER_LOCATION_UPDATE', (data) => {
      if (!bookingId || data.bookingId === bookingId) {
        setRiderLocation({
          lat: data.location.lat,
          lng: data.location.lng,
          speedKmh: data.speedKmh,
        });
      }
    });

    socket.on('SOS_DISPATCHED', (data) => {
      setSosAlert(data);
    });

    socket.on('RECEIVE_MESSAGE', (msg: ChatMessage) => {
      if (!bookingId || msg.bookingId === bookingId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    socket.on('MESSAGES_HISTORY', (data: { bookingId: string; messages: ChatMessage[] }) => {
      if (!bookingId || data.bookingId === bookingId) {
        setMessages(data.messages || []);
      }
    });

    socket.on('USER_TYPING', (data: { bookingId: string; userId: string; isTyping: boolean }) => {
      if (!bookingId || data.bookingId === bookingId) {
        setIsOtherUserTyping(data.isTyping);
      }
    });

    socket.on('BOOKING_STATUS_CHANGED', (data: { bookingId: string; status: string }) => {
      if (!bookingId || data.bookingId === bookingId) {
        setLiveBookingStatus(data.status);
      }
    });

    socket.on('RIDE_STATUS_UPDATED', (data: { bookingId: string; status: string }) => {
      if (!bookingId || data.bookingId === bookingId) {
        setLiveBookingStatus(data.status);
      }
    });

    return () => {
      if (bookingId) {
        socket.emit('LEAVE_TRIP_ROOM', { bookingId });
      }
      socket.disconnect();
    };
  }, [token, bookingId]);

  const sendMessage = useCallback((text: string) => {
    if (!socketRef.current || !bookingId || !text.trim()) return;
    return new Promise<{ success?: boolean; message?: ChatMessage; error?: string }>((resolve) => {
      socketRef.current?.emit('SEND_MESSAGE', { bookingId, text: text.trim() }, (res: any) => {
        resolve(res);
      });
    });
  }, [bookingId]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!socketRef.current || !bookingId) return;
    socketRef.current.emit('TYPING_STATUS', { bookingId, isTyping });
  }, [bookingId]);

  const fetchMessages = useCallback(() => {
    if (!socketRef.current || !bookingId) return;
    socketRef.current.emit('GET_MESSAGES', { bookingId });
  }, [bookingId]);

  const sendTelemetryPing = (data: { lat: number; lng: number; speedKmh: number; bearing: number; accuracy: number }) => {
    if (socketRef.current && bookingId) {
      socketRef.current.emit('TELEMETRY_PING', {
        bookingId,
        ...data,
      });
    }
  };

  const triggerSos = (coords: { lat: number; lng: number }) => {
    if (socketRef.current && bookingId) {
      socketRef.current.emit('TRIGGER_SOS', {
        bookingId,
        ...coords,
      });
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    riderLocation,
    sosAlert,
    messages,
    setMessages,
    isOtherUserTyping,
    liveBookingStatus,
    sendMessage,
    sendTypingStatus,
    fetchMessages,
    sendTelemetryPing,
    triggerSos,
  };
};
