import { prisma } from '../../config/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../../errors/app.error.js';
import { calculateDistanceMeters, calculateStatutoryCostShare } from '../../utils/spatial.util.js';
import { notifyBookingStatus, getIO } from '../../sockets/tracking.socket.js';
export class BookingsService {
    async createBooking(passengerId, input) {
        const ride = await prisma.ride.findUnique({
            where: { id: input.rideId },
            include: { riderProfile: true },
        });
        if (!ride || ride.status !== 'SCHEDULED') {
            throw new BadRequestError('Ride is not available for booking');
        }
        if (ride.riderProfile.userId === passengerId) {
            throw new BadRequestError('You cannot book your own ride');
        }
        if (ride.availableSeats <= 0) {
            throw new ConflictError('No seats available on this ride');
        }
        // Check if passenger already has a pending or confirmed booking for this ride
        const existing = await prisma.booking.findFirst({
            where: {
                rideId: input.rideId,
                passengerId,
                status: { in: ['REQUESTED', 'CONFIRMED', 'STARTED'] },
            },
        });
        if (existing) {
            throw new ConflictError('You already have an active booking for this ride');
        }
        const tripDistance = calculateDistanceMeters({ lat: input.pickupLat, lng: input.pickupLng }, { lat: input.dropoffLat, lng: input.dropoffLng });
        const fare = calculateStatutoryCostShare(tripDistance, Number(ride.perKmCostShare));
        // Generate random 4-digit numeric OTP for pickup verification
        const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // Atomic conditional seat allocation inside a multi-document transaction:
        // Guarantees only one passenger can book at a time by atomically decrementing
        // availableSeats WHERE availableSeats >= 1 and status == 'SCHEDULED'.
        // If two passengers book simultaneously, only one succeeds; the second receives ConflictError.
        // Once booked (availableSeats=0), the ride is immediately hidden from other passengers in search.
        const booking = await prisma.$transaction(async (tx) => {
            const seatClaim = await tx.ride.updateMany({
                where: {
                    id: input.rideId,
                    status: 'SCHEDULED',
                    availableSeats: { gte: 1 },
                },
                data: {
                    availableSeats: { decrement: 1 },
                },
            });

            if (seatClaim.count === 0) {
                throw new ConflictError('This ride has already been booked by another passenger or is no longer available');
            }

            return tx.booking.create({
            data: {
                rideId: input.rideId,
                passengerId,
                pickupLat: input.pickupLat,
                pickupLng: input.pickupLng,
                pickupAddress: input.pickupAddress,
                dropoffLat: input.dropoffLat,
                dropoffLng: input.dropoffLng,
                dropoffAddress: input.dropoffAddress,
                pickupOtp,
                status: 'REQUESTED',
                fareFuelShare: fare.fareFuelShare,
                platformFee: fare.platformFee,
                insuranceFee: fare.insuranceFee,
                totalFare: fare.totalFare,
                detourDistanceMeters: 0,
                detourDurationSeconds: 0,
            },
            include: {
                ride: {
                    include: {
                        riderProfile: {
                            include: { user: { select: { fullName: true, phoneNumber: true, ratingAvg: true } } },
                        },
                        vehicle: true,
                    },
                },
            },
        });
        });
        // Notify host rider of incoming booking request
        await prisma.notification.create({
            data: {
                userId: ride.riderProfile.userId,
                title: 'New Booking Request',
                body: `A passenger requested a seat on your ride from ${ride.originAddress.slice(0, 30)}... Review and accept in My Trips.`,
                notificationType: 'RIDE_REQUESTED',
                channel: 'IN_APP',
                metadata: { bookingId: booking.id, rideId: input.rideId },
            },
        }).catch((err) => console.error('Failed to create host notification:', err));
        return booking;
    }
    async respondToBooking(userId, bookingId, action) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { ride: { include: { riderProfile: true } } },
        });
        if (!booking) {
            throw new NotFoundError('Booking not found');
        }
        if (booking.ride.riderProfile.userId !== userId) {
            throw new ForbiddenError('Only the host rider can accept or reject this booking');
        }
        if (booking.status !== 'REQUESTED') {
            throw new BadRequestError(`Cannot respond to booking with status: ${booking.status}`);
        }
        const result = await prisma.$transaction(async (tx) => {
            if (action === 'ACCEPT') {
                const updatedBooking = await tx.booking.update({
                    where: { id: bookingId },
                    data: {
                        status: 'CONFIRMED',
                        confirmedAt: new Date(),
                    },
                });
                // Reserve seat
                await tx.ride.update({
                    where: { id: booking.rideId },
                    data: { availableSeats: 0 },
                });
                // Notify passenger that host confirmed the ride
                await tx.notification.create({
                    data: {
                        userId: booking.passengerId,
                        title: 'Booking Confirmed!',
                        body: `Your bike pool request has been confirmed by the host! Your seat is reserved.`,
                        notificationType: 'RIDE_CONFIRMED',
                        channel: 'IN_APP',
                        metadata: { bookingId, rideId: booking.rideId },
                    },
                }).catch((err) => console.error('Failed to notify passenger:', err));
                return updatedBooking;
            }
            else {
                const rejectedBooking = await tx.booking.update({
                    where: { id: bookingId },
                    data: {
                        status: 'REJECTED',
                        cancellationReason: 'Rider declined the booking request',
                    },
                });
                // Restore seat on ride offer so other passengers can see and book it again
                await tx.ride.update({
                    where: { id: booking.rideId },
                    data: { availableSeats: { increment: 1 } },
                });
                // Notify passenger of decline
                await tx.notification.create({
                    data: {
                        userId: booking.passengerId,
                        title: 'Booking Request Declined',
                        body: `The ride host was unable to accept your booking request.`,
                        notificationType: 'GENERAL',
                        channel: 'IN_APP',
                        metadata: { bookingId, rideId: booking.rideId },
                    },
                }).catch((err) => console.error('Failed to notify passenger:', err));
                return rejectedBooking;
            }
        });
        if (action === 'ACCEPT') {
            notifyBookingStatus(bookingId, booking.passengerId, 'CONFIRMED');
        } else {
            notifyBookingStatus(bookingId, booking.passengerId, 'REJECTED');
        }
        return result;
    }
    async markArrived(userId, bookingId) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { ride: { include: { riderProfile: true } } },
        });
        if (!booking || booking.ride.riderProfile.userId !== userId) {
            throw new ForbiddenError('Not authorized');
        }
        if (booking.status !== 'CONFIRMED') {
            throw new BadRequestError('Booking must be CONFIRMED before marking arrived');
        }
        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'ARRIVED' },
        });
        notifyBookingStatus(bookingId, booking.passengerId, 'ARRIVED');
        return updated;
    }
    async verifyOtpAndStart(userId, bookingId, enteredOtp) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { ride: { include: { riderProfile: true } } },
        });
        if (!booking || booking.ride.riderProfile.userId !== userId) {
            throw new ForbiddenError('Not authorized');
        }
        if (!['CONFIRMED', 'ARRIVED'].includes(booking.status)) {
            throw new BadRequestError(`Cannot start ride with current status: ${booking.status}`);
        }
        if (booking.pickupOtp !== enteredOtp) {
            throw new BadRequestError('Invalid pickup OTP entered');
        }
        const started = await prisma.$transaction(async (tx) => {
            const startedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'STARTED',
                    startedAt: new Date(),
                },
            });
            await tx.ride.update({
                where: { id: booking.rideId },
                data: { status: 'ACTIVE' },
            });
            return startedBooking;
        });
        notifyBookingStatus(bookingId, booking.passengerId, 'STARTED');
        return started;
    }
    async completeRide(userId, bookingId) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                ride: { include: { riderProfile: true } },
                payment: true,
            },
        });
        if (!booking || booking.ride.riderProfile.userId !== userId) {
            throw new ForbiddenError('Not authorized');
        }
        if (booking.status !== 'STARTED') {
            throw new BadRequestError('Ride must be STARTED to complete');
        }
        const completed = await prisma.$transaction(async (tx) => {
            const completedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });
            await tx.ride.update({
                where: { id: booking.rideId },
                data: { status: 'COMPLETED' },
            });
            // Increment rider stats
            await tx.riderProfile.update({
                where: { id: booking.ride.riderProfileId },
                data: { totalTripsCompleted: { increment: 1 } },
            });
            // If payment was captured, mark payment as TRANSFERRED / settled
            if (booking.payment && booking.payment.status === 'CAPTURED') {
                await tx.payment.update({
                    where: { id: booking.payment.id },
                    data: {
                        status: 'TRANSFERRED',
                        transferredAt: new Date(),
                    },
                });
            }
            return completedBooking;
        });
        notifyBookingStatus(bookingId, booking.passengerId, 'COMPLETED');
        return completed;
    }
    async cancelBooking(userId, bookingId, input) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { ride: { include: { riderProfile: true } } },
        });
        if (!booking) {
            throw new NotFoundError('Booking not found');
        }
        const isPassenger = booking.passengerId === userId;
        const isRider = booking.ride.riderProfile.userId === userId;
        if (!isPassenger && !isRider) {
            throw new ForbiddenError('Not authorized to cancel this booking');
        }
        if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status)) {
            throw new BadRequestError(`Cannot cancel booking with status: ${booking.status}`);
        }
        const cancelled = await prisma.$transaction(async (tx) => {
            const cancelledBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancelledById: userId,
                    cancellationReason: input.reason || (isPassenger ? 'Passenger cancelled' : 'Rider cancelled'),
                },
            });
            // Restore seat on ride offer if booking was holding a seat
            if (['REQUESTED', 'CONFIRMED'].includes(booking.status)) {
                await tx.ride.update({
                    where: { id: booking.rideId },
                    data: { availableSeats: 1 },
                });
            }
            return cancelledBooking;
        });
        notifyBookingStatus(bookingId, booking.passengerId, 'CANCELLED');
        return cancelled;
    }
    async getMyBookings(userId) {
        const bookings = await prisma.booking.findMany({
            where: { passengerId: userId },
            include: {
                ride: {
                    include: {
                        riderProfile: {
                            include: {
                                user: { select: { id: true, fullName: true, phoneNumber: true, ratingAvg: true, avatarUrl: true } },
                            },
                        },
                        vehicle: true,
                    },
                },
                payment: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Mask phone number for non-confirmed bookings
        return bookings.map((b) => {
            const isConfirmed = ['CONFIRMED', 'ARRIVED', 'STARTED', 'COMPLETED'].includes(b.status);
            if (!isConfirmed && b.ride?.riderProfile?.user) {
                b.ride.riderProfile.user.phoneNumber = null;
            }
            return b;
        });
    }
    async getBookingById(userId, bookingId) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                ride: {
                    include: {
                        riderProfile: {
                            include: {
                                user: { select: { id: true, fullName: true, phoneNumber: true, ratingAvg: true, avatarUrl: true } },
                            },
                        },
                        vehicle: true,
                    },
                },
                passenger: {
                    select: { id: true, fullName: true, phoneNumber: true, ratingAvg: true, avatarUrl: true },
                },
                payment: true,
            },
        });
        if (!booking) {
            throw new NotFoundError('Booking not found');
        }
        const isAuthorized = booking.passengerId === userId || booking.ride.riderProfile.userId === userId;
        if (!isAuthorized) {
            throw new ForbiddenError('Access denied to this booking');
        }

        // Phone numbers are revealed ONLY once the ride request is approved & confirmed
        const isConfirmed = ['CONFIRMED', 'ARRIVED', 'STARTED', 'COMPLETED'].includes(booking.status);
        if (!isConfirmed) {
            if (booking.ride?.riderProfile?.user) {
                booking.ride.riderProfile.user.phoneNumber = null;
            }
            if (booking.passenger) {
                booking.passenger.phoneNumber = null;
            }
        }

        return booking;
    }
    async getBookingMessages(userId, bookingId) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { ride: { include: { riderProfile: true } } },
        });
        if (!booking) {
            throw new NotFoundError('Booking not found');
        }
        const isPassenger = booking.passengerId === userId;
        const isRider = booking.ride.riderProfile.userId === userId;
        if (!isPassenger && !isRider) {
            throw new ForbiddenError('Unauthorized to view trip messages');
        }
        const activeStatuses = ['CONFIRMED', 'ARRIVED', 'STARTED', 'COMPLETED'];
        if (!activeStatuses.includes(booking.status)) {
            return [];
        }
        const messages = await prisma.chatMessage.findMany({
            where: { bookingId },
            orderBy: { createdAt: 'asc' },
            take: 100,
            include: {
                sender: { select: { id: true, fullName: true, avatarUrl: true } },
            },
        });
        return messages.map((m) => ({
            id: m.id,
            bookingId: m.bookingId,
            senderId: m.senderId,
            senderName: m.sender.fullName,
            senderAvatar: m.sender.avatarUrl,
            text: m.text,
            createdAt: m.createdAt.toISOString(),
        }));
    }
    async sendBookingMessage(userId, bookingId, text) {
        if (!text || typeof text !== 'string' || !text.trim()) {
            throw new BadRequestError('Message cannot be empty');
        }
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                ride: { include: { riderProfile: true } },
                passenger: { select: { id: true, fullName: true, avatarUrl: true } },
            },
        });
        if (!booking) {
            throw new NotFoundError('Booking not found');
        }
        const isPassenger = booking.passengerId === userId;
        const isRider = booking.ride.riderProfile.userId === userId;
        if (!isPassenger && !isRider) {
            throw new ForbiddenError('Not authorized to message this trip');
        }
        const activeStatuses = ['CONFIRMED', 'ARRIVED', 'STARTED'];
        if (!activeStatuses.includes(booking.status)) {
            throw new BadRequestError('Chat is only accessible once the ride request is confirmed by the host');
        }
        const message = await prisma.chatMessage.create({
            data: {
                bookingId,
                senderId: userId,
                text: text.trim(),
            },
            include: {
                sender: { select: { id: true, fullName: true, avatarUrl: true } },
            },
        });
        const payload = {
            id: message.id,
            bookingId,
            senderId: message.senderId,
            senderName: message.sender.fullName,
            senderAvatar: message.sender.avatarUrl,
            text: message.text,
            createdAt: message.createdAt.toISOString(),
        };
        const io = getIO();
        if (io) {
            io.to(`trip:${bookingId}`).emit('RECEIVE_MESSAGE', payload);
        }
        return payload;
    }
}
