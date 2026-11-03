import React, { useState, useEffect, useRef } from 'react';
import { useSocket, ChatMessage } from '../hooks/useSocket.js';
import { useAuthStore } from '../store/useAuthStore.js';
import {
  MessageCircle,
  Send,
  Phone,
  Lock,
  Copy,
  Check,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  User,
  X,
  ChevronDown,
} from 'lucide-react';

interface OtherParticipant {
  id?: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roleLabel?: string; // 'Host Rider' or 'Passenger'
}

interface TripChatProps {
  bookingId: string;
  bookingStatus: string;
  otherUser?: OtherParticipant;
  isFloating?: boolean;
  onClose?: () => void;
}

const QUICK_COMMUTE_REPLIES = [
  'I have reached the pickup spot 📍',
  'On my way, arriving in 3 mins 🏍️',
  'Where are you waiting?',
  'I am wearing a helmet and ready',
  'Stuck in traffic for 2 mins, please hold on',
];

export const TripChat: React.FC<TripChatProps> = ({
  bookingId,
  bookingStatus,
  otherUser,
  isFloating = false,
  onClose,
}) => {
  const { user } = useAuthStore();
  const {
    messages,
    sendMessage,
    sendTypingStatus,
    isOtherUserTyping,
    isConnected,
    liveBookingStatus,
  } = useSocket(bookingId);

  const [inputVal, setInputVal] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const currentStatus = liveBookingStatus || bookingStatus;
  const isConfirmed = ['CONFIRMED', 'ARRIVED', 'STARTED', 'COMPLETED'].includes(currentStatus);
  const isOngoing = ['CONFIRMED', 'ARRIVED', 'STARTED'].includes(currentStatus);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || sending || !isConfirmed) return;

    setSending(true);
    setInputVal('');
    sendTypingStatus(false);

    try {
      await sendMessage(text);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    sendTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 1500);
  };

  const handleCopyPhone = () => {
    if (otherUser?.phoneNumber) {
      navigator.clipboard.writeText(otherUser.phoneNumber);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div
      className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-200 ${
        isFloating ? 'w-full max-w-md h-[520px]' : 'w-full h-[480px]'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30 overflow-hidden">
              {otherUser?.avatarUrl ? (
                <img src={otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                otherUser?.fullName?.slice(0, 2).toUpperCase() || 'TP'
              )}
            </div>
            {isConfirmed && (
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  isConnected ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
                title={isConnected ? 'Connected' : 'Syncing'}
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {otherUser?.fullName || 'Trip Participant'}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400">
                ({otherUser?.roleLabel || 'Commuter'})
              </span>
            </div>

            {/* Revealed Phone Number once confirmed */}
            {isConfirmed && otherUser?.phoneNumber ? (
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={`tel:${otherUser.phoneNumber}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  <span>{otherUser.phoneNumber}</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title="Copy Phone"
                >
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                <Lock className="w-3 h-3" />
                <span>Phone hidden until confirmed</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!isConfirmed ? (
        // LOCKED STATE: Ride not approved yet
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Chat & Contact Locked
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time messaging and direct phone calling unlock automatically once the rider approves this ride request.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span>Status:</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold uppercase">{currentStatus}</span>
          </div>
        </div>
      ) : (
        // UNLOCKED STATE: Ride confirmed
        <>
          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40 dark:bg-slate-950/40">
            {/* Safe Corridor Privacy Notice */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Booking confirmed! Coordinate your curbside pickup spot and timing safely.
              </span>
            </div>

            {messages.length === 0 ? (
              <div className="py-8 text-center space-y-1 text-slate-400 dark:text-slate-500">
                <MessageCircle className="w-8 h-8 mx-auto opacity-40 mb-1" />
                <p className="text-xs font-semibold">No messages yet</p>
                <p className="text-[11px]">Send a quick message to coordinate pickup!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === user?.id;
                const timeStr = new Date(m.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-0.5`}
                  >
                    {!isMe && (
                      <span className="text-[10px] font-semibold text-slate-400 px-1">
                        {m.senderName}
                      </span>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs break-words ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-bl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[9px] text-slate-400 px-1 font-mono">{timeStr}</span>
                  </div>
                );
              })
            )}

            {isOtherUserTyping && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 italic py-1 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] ml-1">{otherUser?.fullName || 'User'} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Chips */}
          {isOngoing && (
            <div className="px-3 py-1.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {QUICK_COMMUTE_REPLIES.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(reply)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors shrink-0"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          {isOngoing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={inputVal}
                onChange={handleInputChange}
                className="flex-1 h-10 px-3.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || sending}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white flex items-center justify-center transition-all shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              Trip completed. Messaging is closed for this ride.
            </div>
          )}
        </>
      )}
    </div>
  );
};

