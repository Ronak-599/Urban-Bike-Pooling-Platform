import { z } from 'zod';
export const createOrderSchema = z.object({
    bookingId: z.string().uuid(),
});
export const verifyPaymentSchema = z.object({
    bookingId: z.string().uuid(),
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
});
