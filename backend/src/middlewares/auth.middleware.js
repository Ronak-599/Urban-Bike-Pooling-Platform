import { UnauthorizedError, ForbiddenError } from '../errors/app.error.js';
import { verifyAccessToken } from '../utils/token.util.js';
import { prisma } from '../config/prisma.js';
export const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Authentication token missing or invalid');
        }
        const token = authHeader.split(' ')[1];
        const payload = verifyAccessToken(token);
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, isActive: true, role: true, kycStatus: true, riderProfile: { select: { id: true } } },
        });
        if (!user || !user.isActive) {
            throw new UnauthorizedError('User account is inactive or no longer exists');
        }
        req.user = {
            ...payload,
            role: user.role,
            kycStatus: user.kycStatus,
            riderProfileId: user.riderProfile?.id,
        };
        next();
    }
    catch (error) {
        next(error instanceof UnauthorizedError ? error : new UnauthorizedError('Invalid or expired token'));
    }
};
export const requireRole = (allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError('User not authenticated'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError(`Access denied. Requires one of roles: ${allowedRoles.join(', ')}`));
        }
        next();
    };
};
export const requireRiderVerified = (req, _res, next) => {
    if (!req.user || !req.user.riderProfileId) {
        return next(new ForbiddenError('Rider profile required for this operation'));
    }
    next();
};
