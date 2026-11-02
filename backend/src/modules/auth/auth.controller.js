import { AuthService } from './auth.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.util.js';
const authService = new AuthService();
export class AuthController {
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body);
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });
            sendCreated(res, result, 'User registered successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const result = await authService.login(req.body);
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            sendSuccess(res, result, 'Logged in successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const token = req.cookies?.refreshToken || req.body?.refreshToken;
            const result = await authService.refreshToken(token);
            sendSuccess(res, result, 'Access token refreshed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async logout(_req, res, next) {
        try {
            res.clearCookie('refreshToken');
            sendSuccess(res, null, 'Logged out successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
