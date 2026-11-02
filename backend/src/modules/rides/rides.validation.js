import { z } from 'zod';
export const createRideSchema = z.object({
    vehicleId: z.string().uuid(),
    originLat: z.number().min(-90).max(90),
    originLng: z.number().min(-180).max(180),
    originAddress: z.string().min(2),
    destinationLat: z.number().min(-90).max(90),
    destinationLng: z.number().min(-180).max(180),
    destinationAddress: z.string().min(2),
    routePolyline: z.string().min(5), // Encoded or geojson string
    scheduledDeparture: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid ISO date required'),
    bufferMinutes: z.number().int().min(0).max(30).default(10),
    helmetProvided: z.boolean().default(true),
    isWomenOnly: z.boolean().default(false),
    perKmCostShare: z.number().positive().max(1000.0), // Flexible per-km share or direct cost derived rate
    estimatedDistanceMeters: z.number().int().positive(),
    estimatedDurationSeconds: z.number().int().positive(),
    recurringCron: z.string().optional(),
});
export const searchRidesSchema = z.object({
    pickupLat: z.coerce.number().min(-90).max(90).optional(),
    pickupLng: z.coerce.number().min(-180).max(180).optional(),
    dropoffLat: z.coerce.number().min(-90).max(90).optional(),
    dropoffLng: z.coerce.number().min(-180).max(180).optional(),
    originAddress: z.string().optional(),
    destinationAddress: z.string().optional(),
    departureDate: z.string().optional(),
    departureTime: z.string().optional(),
    womenOnly: z.enum(['true', 'false']).optional(),
    maxWalkDistanceMeters: z.coerce.number().positive().default(5000),
});
