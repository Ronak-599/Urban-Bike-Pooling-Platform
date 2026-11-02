import { AppError } from '../errors/app.error.js';
import { ENV } from '../config/env.js';
export const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.details ? { details: err.details } : {}),
            ...(ENV.NODE_ENV === 'development' ? { stack: err.stack } : {}),
        });
        return;
    }
    // Unhandled internal server error
    console.error('[Unhandled Internal Error]:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        ...(ENV.NODE_ENV === 'development' ? { error: err.message, stack: err.stack } : {}),
    });
};
