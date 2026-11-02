import { verifyAccessToken } from '../utils/token.util.js';
export const setupSocketHandlers = (io) => {
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
            socket.join(`trip:${bookingId}`);
            console.log(`[Socket] User ${user.userId} joined room trip:${bookingId}`);
            socket.emit('ROOM_JOINED', { bookingId, timestamp: new Date() });
        });
        // Leave trip room
        socket.on('LEAVE_TRIP_ROOM', ({ bookingId }) => {
            socket.leave(`trip:${bookingId}`);
            console.log(`[Socket] User ${user.userId} left room trip:${bookingId}`);
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
