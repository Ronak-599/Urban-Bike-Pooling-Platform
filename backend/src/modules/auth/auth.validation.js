import { z } from 'zod';
export const registerSchema = z.object({
    phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Valid E.164 phone format required (e.g. +919876543210)'),
    fullName: z.string().min(2).max(100),
    email: z.string().email().optional(),
    password: z.string().min(6).max(100),
    gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']),
    role: z.enum(['COMMUTER', 'RIDER']).default('COMMUTER'),
});
export const loginSchema = z.object({
    phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
    password: z.string().min(1),
});
export const requestOtpSchema = z.object({
    phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
});
export const verifyOtpSchema = z.object({
    phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
    otp: z.string().length(6),
});
