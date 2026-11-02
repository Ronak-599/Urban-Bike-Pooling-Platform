import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { setupSocketHandlers } from './sockets/tracking.socket.js';
import { prisma } from './config/prisma.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
export const io = new SocketIOServer(server, {
    cors: {
        origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
});

// Setup real-time tracking & event handlers
setupSocketHandlers(io);

// Start server
server.listen(ENV.PORT, () => {
    console.log(`=======================================================`);
    console.log(` TwoShare Backend Server running on port ${ENV.PORT}`);
    console.log(` Environment: ${ENV.NODE_ENV}`);
    console.log(` Swagger Docs: http://localhost:${ENV.PORT}/api/docs`);
    console.log(` Real-Time WebSockets active on /socket.io`);
    console.log(` Database: MongoDB Atlas`);
    console.log(`=======================================================`);

    // Verify MongoDB connection asynchronously with active ping
    prisma.$runCommandRaw({ ping: 1 })
        .then(() => {
            console.log(' Connected to MongoDB Atlas successfully.');
        })
        .catch((err) => {
            console.warn('⚠️ [MongoDB Atlas Connection Notice]');
            console.warn('   Unable to reach cluster: IP address is not allowed in MongoDB Atlas Network Access.');
            console.warn('   Solution: In cloud.mongodb.com -> Network Access -> Add IP -> Select "Allow Access From Anywhere" (0.0.0.0/0).');
        });
});

// Graceful Shutdown
const handleShutdown = async (signal) => {
    console.log(`\n[${signal}] Initiating graceful shutdown...`);
    server.close(async () => {
        console.log('HTTP & Socket.IO servers closed.');
        await prisma.$disconnect();
        console.log('Database connections closed.');
        process.exit(0);
    });

    // Force close if graceful fails after 10s
    setTimeout(() => {
        console.error('Forced shutdown due to timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
