export class AppError extends Error {
    statusCode;
    isOperational;
    details;
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
export class BadRequestError extends AppError {
    constructor(message = 'Bad Request', details) {
        super(message, 400, details);
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden Access') {
        super(message, 403);
    }
}
export class NotFoundError extends AppError {
    constructor(message = 'Resource Not Found') {
        super(message, 404);
    }
}
export class ConflictError extends AppError {
    constructor(message = 'Resource Conflict') {
        super(message, 409);
    }
}
