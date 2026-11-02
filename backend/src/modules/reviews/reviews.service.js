import { prisma } from '../../config/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../../errors/app.error.js';
export class ReviewsService {
    async submitReview(userId, input) {
        const booking = await prisma.booking.findUnique({
            where: { id: input.bookingId },
            include: { ride: { include: { riderProfile: true } } },
        });
        if (!booking) {
            throw new NotFoundError('Booking not found');
        }
        if (booking.status !== 'COMPLETED') {
            throw new BadRequestError('You can only review a completed ride');
        }
        const isPassenger = booking.passengerId === userId;
        const isRider = booking.ride.riderProfile.userId === userId;
        if (!isPassenger && !isRider) {
            throw new ForbiddenError('Only trip participants can submit reviews');
        }
        // Determine target reviewee
        const revieweeId = isPassenger ? booking.ride.riderProfile.userId : booking.passengerId;
        // Check if already reviewed
        const existing = await prisma.review.findUnique({
            where: {
                bookingId_reviewerId: {
                    bookingId: input.bookingId,
                    reviewerId: userId,
                },
            },
        });
        if (existing) {
            throw new ConflictError('You have already reviewed this ride');
        }
        return prisma.$transaction(async (tx) => {
            const review = await tx.review.create({
                data: {
                    bookingId: input.bookingId,
                    reviewerId: userId,
                    revieweeId,
                    rating: input.rating,
                    safetyTags: input.safetyTags,
                    comment: input.comment,
                },
            });
            // Recalculate reviewee average rating
            const aggregate = await tx.review.aggregate({
                where: { revieweeId },
                _avg: { rating: true },
                _count: { rating: true },
            });
            const newAvg = aggregate._avg.rating || 5.0;
            const newCount = aggregate._count.rating || 0;
            await tx.user.update({
                where: { id: revieweeId },
                data: {
                    ratingAvg: Math.round(newAvg * 100) / 100,
                    ratingCount: newCount,
                },
            });
            // If reviewee is a rider, also update rider profile safety average
            const riderProf = await tx.riderProfile.findUnique({ where: { userId: revieweeId } });
            if (riderProf) {
                await tx.riderProfile.update({
                    where: { id: riderProf.id },
                    data: { safetyRatingAvg: Math.round(newAvg * 100) / 100 },
                });
            }
            return review;
        });
    }
    async getUserReviews(targetUserId) {
        return prisma.review.findMany({
            where: { revieweeId: targetUserId },
            include: {
                reviewer: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
}
