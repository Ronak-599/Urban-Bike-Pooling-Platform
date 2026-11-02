import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { ConflictError, UnauthorizedError } from '../../errors/app.error.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/token.util.js';
export class AuthService {
    async register(input) {
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: input.phoneNumber },
                    ...(input.email ? [{ email: input.email }] : []),
                ],
            },
        });
        if (existingUser) {
            throw new ConflictError('User with this phone number or email already exists');
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        // Create user and initialize commuter wallet
        const user = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    phoneNumber: input.phoneNumber,
                    fullName: input.fullName,
                    email: input.email,
                    passwordHash,
                    gender: input.gender,
                    role: input.role,
                    isPhoneVerified: true, // Auto-verify on registration demo
                },
            });
            // Create linked wallet
            await tx.wallet.create({
                data: {
                    userId: createdUser.id,
                    currency: 'INR',
                    currentBalance: 0.0,
                },
            });
            return createdUser;
        });
        const tokenPayload = {
            userId: user.id,
            phoneNumber: user.phoneNumber,
            role: user.role,
            kycStatus: user.kycStatus,
        };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        return {
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
            },
            accessToken,
            refreshToken,
        };
    }
    async login(input) {
        const user = await prisma.user.findUnique({
            where: { phoneNumber: input.phoneNumber },
            include: { riderProfile: { select: { id: true, isEligibleForPooling: true } } },
        });
        if (!user || !user.passwordHash) {
            throw new UnauthorizedError('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(input.password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedError('Invalid credentials');
        }
        if (!user.isActive) {
            throw new UnauthorizedError('Account has been suspended');
        }
        const tokenPayload = {
            userId: user.id,
            phoneNumber: user.phoneNumber,
            role: user.role,
            kycStatus: user.kycStatus,
        };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        return {
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
                riderProfileId: user.riderProfile?.id,
            },
            accessToken,
            refreshToken,
        };
    }
    async refreshToken(rawRefreshToken) {
        if (!rawRefreshToken) {
            throw new UnauthorizedError('Refresh token required');
        }
        const payload = verifyRefreshToken(rawRefreshToken);
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, phoneNumber: true, role: true, kycStatus: true, isActive: true },
        });
        if (!user || !user.isActive) {
            throw new UnauthorizedError('Invalid session');
        }
        const newAccessToken = generateAccessToken({
            userId: user.id,
            phoneNumber: user.phoneNumber,
            role: user.role,
            kycStatus: user.kycStatus,
        });
        return { accessToken: newAccessToken };
    }
}
