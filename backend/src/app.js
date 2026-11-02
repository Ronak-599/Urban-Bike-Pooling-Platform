import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env.js';
import { swaggerDocument } from './config/swagger.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { NotFoundError } from './errors/app.error.js';
// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import ridesRoutes from './modules/rides/rides.routes.js';
import bookingsRoutes from './modules/bookings/bookings.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
export const createApp = () => {
    const app = express();
    // Security & Core Middlewares
    app.use(helmet({
        contentSecurityPolicy: false, // Allows Swagger UI inline scripts
    }));
    app.use(cors({
        origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
    }));
    app.use(cookieParser());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    // Health Check
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'UP',
            service: 'twoshare-backend',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
    // Swagger Documentation Explorer
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    // Mount API Modules
    const apiRouter = express.Router();
    apiRouter.use('/auth', authRoutes);
    apiRouter.use('/users', usersRoutes);
    apiRouter.use('/rides', ridesRoutes);
    apiRouter.use('/bookings', bookingsRoutes);
    apiRouter.use('/payments', paymentsRoutes);
    apiRouter.use('/reviews', reviewsRoutes);
    apiRouter.use('/notifications', notificationsRoutes);
    app.use('/api/v1', apiRouter);
    // 404 Fallback Handler
    app.use((req, _res, next) => {
        next(new NotFoundError(`Path ${req.originalUrl} not found on this server`));
    });
    // Global Error Handler
    app.use(errorHandler);
    return app;
};
