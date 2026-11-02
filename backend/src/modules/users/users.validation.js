import { z } from 'zod';
export const updateProfileSchema = z.object({
    fullName: z.string().min(2).max(100).optional(),
    bio: z.string().max(255).optional(),
    avatarUrl: z.string().url().optional(),
});
export const createRiderProfileSchema = z.object({
    drivingLicenseNo: z.string().min(5).max(50),
    licenseExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date string required'),
    licenseDocFrontUrl: z.string().url(),
    licenseDocBackUrl: z.string().url().optional(),
});
export const createVehicleSchema = z.object({
    licensePlate: z.string().min(4).max(20),
    make: z.string().min(2).max(50),
    model: z.string().min(1).max(50),
    engineCc: z.number().int().min(50).max(1200),
    color: z.string().min(2).max(30),
    rcNumber: z.string().min(4).max(50),
    rcDocumentUrl: z
        .string()
        .url()
        .optional()
        .default('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80'),
    insurancePolicyNo: z
        .string()
        .optional()
        .or(z.literal(''))
        .transform((val) => (val && val.trim().length >= 3 ? val.trim() : `POL-${Math.floor(10000000 + Math.random() * 90000000)}`)),
    insuranceExpiryDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), 'Valid date string required')
        .optional()
        .default(() => new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()),
    insuranceDocUrl: z
        .string()
        .url()
        .optional()
        .default('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80'),
});
export const addEmergencyContactSchema = z.object({
    contactName: z.string().min(2).max(100),
    relationship: z.string().min(2).max(40),
    phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
    isPrimary: z.boolean().default(false),
});
