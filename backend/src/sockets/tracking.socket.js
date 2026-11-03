import { verifyAccessToken } from '../utils/token.util.js';
import { prisma } from '../config/prisma.js';

let ioInstance = null;

export const getIO = () => ioInstance;

export const notifyBookingStatus = (bookingId, passengerId, status, extra = {}) => {
    if (!ioInstance) return;
    const payload = {
        bookingId,
        status,
        timestamp: new Date().toISOString(),
        ...extra,
    };
    ioInstance.to(`trip:${bookingId}`).emit('BOOKING_STATUS_CHANGED', payload);
    if (passengerId) {
        ioInstance.to(`user:${passengerId}`).emit('RIDE_STATUS_UPDATED', payload);
    }
};

export const setupSocketHandlers = (io) => {
    ioInstance = io;

    // Authentication Middleware for WebSockets
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const payload = verifyAccessToken(token);
            socket.user = payload;
            next();
        }
        catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`[Socket Connected] User: ${user.userId} (${socket.id})`);

        // User personal notification room
        socket.join(`user:${user.userId}`);

        // Join active trip room
        socket.on('JOIN_TRIP_ROOM', ({ bookingId }) => {
            if (!bookingId) return;
            socket.join(`trip:${bookingId}`);
            console.log(`[Socket] User ${user.userId} joined room trip:${bookingId}`);
            socket.emit('ROOM_JOINED', { bookingId, timestamp: new Date() });
        });

        // Leave trip room
        socket.on('LEAVE_TRIP_ROOM', ({ bookingId }) => {
            if (!bookingId) return;
            socket.leave(`trip:${bookingId}`);
            console.log(`[Socket] User ${user.userId} left room trip:${bookingId}`);
        });

        // Real-Time Chat: Send Message
        socket.on('SEND_MESSAGE', async ({ bookingId, text }, callback) => {
            try {
                if (!bookingId || !text || typeof text !== 'string' || !text.trim()) {
                    return callback?.({ error: 'Message cannot be empty' });
                }

                const booking = await prisma.booking.findUnique({
                    where: { id: bookingId },
                    include: {
                        ride: { include: { riderProfile: true } },
                        passenger: { select: { id: true, fullName: true, avatarUrl: true } },
                    },
                });

                if (!booking) {
                    return callback?.({ error: 'Booking not found' });
                }

                const isPassenger = booking.passengerId === user.userId;
                const isRider = booking.ride.riderProfile.userId === user.userId;

                if (!isPassenger && !isRider) {
                    return callback?.({ error: 'Not authorized to send messages for this trip' });
                }

                // Chat is only available when the ride is confirmed or ongoing
                const activeStatuses = ['CONFIRMED', 'ARRIVED', 'STARTED'];
                if (!activeStatuses.includes(booking.status)) {
                    return callback?.({ error: 'Chat is only unlocked once the ride request is approved by the host' });
                }

                const message = await prisma.chatMessage.create({
                    data: {
                        bookingId,
                        senderId: user.userId,
                        text: text.trim(),
                    },
                    include: {
                        sender: { select: { id: true, fullName: true, avatarUrl: true } },
                    },
                });

                const recipientId = isPassenger ? booking.ride.riderProfile.userId : booking.passengerId;

                const payload = {
                    id: message.id,
                    bookingId,
                    senderId: message.senderId,
                    senderName: message.sender.fullName,
                    senderAvatar: message.sender.avatarUrl,
                    text: message.text,
                    createdAt: message.createdAt.toISOString(),
                };

                // 1. Broadcast to trip room
                io.to(`trip:${bookingId}`).emit('RECEIVE_MESSAGE', payload);

                // 2. Broadcast directly to recipient's personal user room
                io.to(`user:${recipientId}`).emit('RECEIVE_MESSAGE', payload);
                io.to(`user:${recipientId}`).emit('NEW_CHAT_NOTIFICATION', {
                    ...payload,
                    recipientId,
                    bookingStatus: booking.status,
                    otherUserName: message.sender.fullName,
                });

                // 3. Persist notification in database
                prisma.notification.create({
                    data: {
                        userId: recipientId,
                        title: `Message from ${message.sender.fullName}`,
                        body: message.text.slice(0, 100),
                        notificationType: 'GENERAL',
                        channel: 'IN_APP',
                        metadata: { bookingId, senderId: user.userId },
                    },
                }).catch((err) => console.error('Failed to create notification:', err));

                callback?.({ success: true, message: payload });
            }
            catch (error) {
                console.error('[Socket SEND_MESSAGE Error]:', error);
                callback?.({ error: 'Failed to send message' });
            }
        });

        // Real-Time Chat: Retrieve Message History
        socket.on('GET_MESSAGES', async ({ bookingId }, callback) => {
            try {
                if (!bookingId) return callback?.({ error: 'Booking ID required' });

                const booking = await prisma.booking.findUnique({
                    where: { id: bookingId },
                    include: {
                        ride: { include: { riderProfile: true } },
                    },
                });

                if (!booking) {
                    return callback?.({ error: 'Booking not found' });
                }

                const isPassenger = booking.passengerId === user.userId;
                const isRider = booking.ride.riderProfile.userId === user.userId;

                if (!isPassenger && !isRider) {
                    return callback?.({ error: 'Unauthorized to view messages' });
                }

                const activeStatuses = ['CONFIRMED', 'ARRIVED', 'STARTED', 'COMPLETED'];
                if (!activeStatuses.includes(booking.status)) {
                    return callback?.({ bookingId, messages: [], locked: true });
                }

                const messages = await prisma.chatMessage.findMany({
                    where: { bookingId },
                    orderBy: { createdAt: 'asc' },
                    take: 100,
                    include: {
                        sender: { select: { id: true, fullName: true, avatarUrl: true } },
                    },
                });

                const formatted = messages.map((m) => ({
                    id: m.id,
                    bookingId: m.bookingId,
                    senderId: m.senderId,
                    senderName: m.sender.fullName,
                    senderAvatar: m.sender.avatarUrl,
                    text: m.text,
                    createdAt: m.createdAt.toISOString(),
                }));

                socket.emit('MESSAGES_HISTORY', { bookingId, messages: formatted });
                callback?.({ bookingId, messages: formatted });
            }
            catch (error) {
                console.error('[Socket GET_MESSAGES Error]:', error);
                callback?.({ error: 'Failed to retrieve messages' });
            }
        });

        // Typing Indicator
        socket.on('TYPING_STATUS', ({ bookingId, isTyping }) => {
            if (!bookingId) return;
            socket.to(`trip:${bookingId}`).emit('USER_TYPING', {
                bookingId,
                userId: user.userId,
                isTyping: !!isTyping,
            });
        });

        // Rider live location broadcast
        socket.on('TELEMETRY_PING', async (payload) => {
            try {
                const { bookingId, lat, lng, speedKmh, bearing, accuracy } = payload;
                // Broadcast to passengers & safety observers in the trip room
                io.to(`trip:${bookingId}`).emit('RIDER_LOCATION_UPDATE', {
                    bookingId,
                    location: { lat, lng },
                    speedKmh,
                    bearing,
                    accuracy,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                console.error('[Socket Telemetry Error]:', error);
            }
        });

        // Real-Time SOS Alert
        socket.on('TRIGGER_SOS', async ({ bookingId, lat, lng }) => {
            console.warn(`[EMERGENCY SOS] Triggered by user ${user.userId} on booking ${bookingId}`);
            // Broadcast to trip room and emergency dispatch room
            io.to(`trip:${bookingId}`).emit('SOS_DISPATCHED', {
                bookingId,
                triggeredBy: user.userId,
                location: { lat, lng },
                timestamp: new Date().toISOString(),
            });
            io.to('emergency_dispatch').emit('EMERGENCY_INCIDENT', {
                bookingId,
                userId: user.userId,
                location: { lat, lng },
            });
        });

        socket.on('disconnect', () => {
            console.log(`[Socket Disconnected] User: ${user.userId} (${socket.id})`);
        });
    });
};
