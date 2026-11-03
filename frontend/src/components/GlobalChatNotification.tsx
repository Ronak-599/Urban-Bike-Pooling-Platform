import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore.js';
import { TripChat } from './TripChat.js';
import { MessageCircle, X, ExternalLink, BellRing } from 'lucide-react';

interface ChatToast {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
}

export const GlobalChatNotification: React.FC = () => {
  const { user, token } = useAuthStore();
  const [toast, setToast] = useState<ChatToast | null>(null);
  const [floatingBookingId, setFloatingBookingId] = useState<string | null>(null);
  const [floatingOtherUser, setFloatingOtherUser] = useState<any>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Sound chime via Web Audio API
  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy handled gracefully
    }
  };

  useEffect(() => {
    if (!token || !user) return;

    const socket: Socket = io('http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('NEW_CHAT_NOTIFICATION', (data: any) => {
      // Only notify if someone else sent the message
      if (data.senderId === user.id) return;

      playChime();
      setToast({
        id: data.id || String(Date.now()),
        bookingId: data.bookingId,
        senderId: data.senderId,
        senderName: data.senderName || 'Trip Participant',
        senderAvatar: data.senderAvatar,
        text: data.text,
        createdAt: data.createdAt || new Date().toISOString(),
      });

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 9000);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  const handleOpenChat = () => {
    if (!toast) return;
    setFloatingBookingId(toast.bookingId);
    setFloatingOtherUser({
      id: toast.senderId,
      fullName: toast.senderName,
      avatarUrl: toast.senderAvatar,
      roleLabel: 'Trip Participant',
    });
    setToast(null);
  };

  return (
    <>
      {/* Real-time Notification Banner / Toast */}
      {toast && !floatingBookingId && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl shadow-2xl p-4 text-white space-y-3 glass-panel">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/40 shrink-0">
                  {toast.senderName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-100">{toast.senderName}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-md font-semibold">
                      New Message
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 font-medium">
                    "{toast.text}"
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleOpenChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Reply in Real-Time</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Real-Time Chat Drawer */}
      {floatingBookingId && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md shadow-2xl rounded-2xl overflow-hidden border border-slate-700 bg-white dark:bg-slate-900 animate-in slide-in-from-bottom-5 duration-300">
          <TripChat
            bookingId={floatingBookingId}
            bookingStatus="CONFIRMED"
            otherUser={floatingOtherUser}
            isFloating={true}
            onClose={() => setFloatingBookingId(null)}
          />
        </div>
      )}
    </>
  );
};

