import { z } from 'zod';
export const createReviewSchema = z.object({
    bookingId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    safetyTags: z.array(z.string()).default([]),
    comment: z.string().max(500).optional(),
});
