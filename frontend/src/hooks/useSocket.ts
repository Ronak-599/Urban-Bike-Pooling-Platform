import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore.js';

export const useSocket = (bookingId?: string) => {
  const token = useAuthStore((state) => state.token);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number; speedKmh: number } | null>(null);
  const [sosAlert, setSosAlert] = useState<any | null>(null);

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

    return () => {
      if (bookingId) {
        socket.emit('LEAVE_TRIP_ROOM', { bookingId });
      }
      socket.disconnect();
    };
  }, [token, bookingId]);

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
    sendTelemetryPing,
    triggerSos,
  };
};
