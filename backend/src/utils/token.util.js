import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, ENV.JWT_SECRET, {
        expiresIn: ENV.JWT_EXPIRES_IN,
    });
};
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, ENV.REFRESH_TOKEN_SECRET, {
        expiresIn: ENV.REFRESH_TOKEN_EXPIRES_IN,
    });
};
export const verifyAccessToken = (token) => {
    return jwt.verify(token, ENV.JWT_SECRET);
};
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, ENV.REFRESH_TOKEN_SECRET);
};
