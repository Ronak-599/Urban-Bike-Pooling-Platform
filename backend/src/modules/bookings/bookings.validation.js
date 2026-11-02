import { z } from 'zod';
export const createBookingSchema = z.object({
    rideId: z.string().uuid(),
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    pickupAddress: z.string().min(2),
    dropoffLat: z.number().min(-90).max(90),
    dropoffLng: z.number().min(-180).max(180),
    dropoffAddress: z.string().min(2),
});
export const respondBookingSchema = z.object({
    action: z.enum(['ACCEPT', 'REJECT']),
});
export const verifyOtpSchema = z.object({
    otp: z.string().length(4).regex(/^\d{4}$/, 'Must be a 4-digit numeric OTP'),
});
export const cancelBookingSchema = z.object({
    reason: z.string().min(2).max(255).optional(),
});
