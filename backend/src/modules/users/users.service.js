import { prisma } from '../../config/prisma.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../errors/app.error.js';
export class UsersService {
    async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                phoneNumber: true,
                email: true,
                fullName: true,
                gender: true,
                avatarUrl: true,
                bio: true,
                role: true,
                kycStatus: true,
                ratingAvg: true,
                ratingCount: true,
                isActive: true,
                createdAt: true,
                wallet: {
                    select: {
                        id: true,
                        currency: true,
                        currentBalance: true,
                        lockedEscrowBalance: true,
                    },
                },
                emergencyContacts: true,
                riderProfile: {
                    include: {
                        vehicles: true,
                    },
                },
            },
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return user;
    }
    async updateProfile(userId, input) {
        return prisma.user.update({
            where: { id: userId },
            data: input,
            select: {
                id: true,
                fullName: true,
                bio: true,
                avatarUrl: true,
                updatedAt: true,
            },
        });
    }
    async createOrUpdateRiderProfile(userId, input) {
        const existing = await prisma.riderProfile.findUnique({
            where: { userId },
        });
        if (existing) {
            return prisma.riderProfile.update({
                where: { userId },
                data: {
                    drivingLicenseNo: input.drivingLicenseNo,
                    licenseExpiryDate: new Date(input.licenseExpiryDate),
                    licenseDocFrontUrl: input.licenseDocFrontUrl,
                    licenseDocBackUrl: input.licenseDocBackUrl,
                    verificationStatus: 'SUBMITTED',
                },
            });
        }
        return prisma.$transaction(async (tx) => {
            const profile = await tx.riderProfile.create({
                data: {
                    userId,
                    drivingLicenseNo: input.drivingLicenseNo,
                    licenseExpiryDate: new Date(input.licenseExpiryDate),
                    licenseDocFrontUrl: input.licenseDocFrontUrl,
                    licenseDocBackUrl: input.licenseDocBackUrl,
                    verificationStatus: 'VERIFIED', // Auto-verified for frictionless demo
                    isEligibleForPooling: true,
                },
            });
            await tx.user.update({
                where: { id: userId },
                data: { role: 'RIDER', kycStatus: 'VERIFIED' },
            });
            return profile;
        });
    }
    async addVehicle(userId, input) {
        const riderProfile = await prisma.riderProfile.findUnique({
            where: { userId },
        });
        if (!riderProfile) {
            throw new BadRequestError('Please create a Rider Profile before adding a vehicle');
        }
        const existingVehicle = await prisma.vehicle.findFirst({
            where: {
                OR: [{ licensePlate: input.licensePlate }, { rcNumber: input.rcNumber }],
            },
        });
        if (existingVehicle) {
            throw new ConflictError('A vehicle with this license plate or RC number is already registered');
        }
        return prisma.vehicle.create({
            data: {
                riderProfileId: riderProfile.id,
                licensePlate: input.licensePlate.toUpperCase(),
                make: input.make,
                model: input.model,
                engineCc: input.engineCc,
                color: input.color,
                rcNumber: input.rcNumber.toUpperCase(),
                rcDocumentUrl: input.rcDocumentUrl,
                insurancePolicyNo: input.insurancePolicyNo,
                insuranceExpiryDate: new Date(input.insuranceExpiryDate),
                insuranceDocUrl: input.insuranceDocUrl,
                isVerified: true,
                isActive: true,
            },
        });
    }
    async addEmergencyContact(userId, input) {
        if (input.isPrimary) {
            await prisma.emergencyContact.updateMany({
                where: { userId, isPrimary: true },
                data: { isPrimary: false },
            });
        }
        return prisma.emergencyContact.create({
            data: {
                userId,
                contactName: input.contactName,
                relationship: input.relationship,
                phoneNumber: input.phoneNumber,
                isPrimary: input.isPrimary,
            },
        });
    }
    async getEmergencyContacts(userId) {
        return prisma.emergencyContact.findMany({
            where: { userId },
            orderBy: { isPrimary: 'desc' },
        });
    }
    async getWallet(userId) {
        const wallet = await prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!wallet) {
            throw new NotFoundError('Wallet not found');
        }
        return wallet;
    }
}
