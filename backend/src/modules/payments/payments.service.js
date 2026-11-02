import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { razorpayClient } from '../../config/razorpay.js';
import { ENV } from '../../config/env.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../errors/app.error.js';
export class PaymentsService {
    async createOrder(userId, bookingId) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { ride: { include: { riderProfile: true } } },
        });
        if (!booking) {
            throw new NotFoundError('Booking not found');
        }
        if (booking.passengerId !== userId) {
            throw new ForbiddenError('Only the booking passenger can pay for this ride');
        }
        // Check if payment already completed
        const existingPayment = await prisma.payment.findUnique({
            where: { bookingId },
        });
        if (existingPayment && ['CAPTURED', 'TRANSFERRED'].includes(existingPayment.status)) {
            throw new BadRequestError('Payment has already been completed for this booking');
        }
        const amountInPaise = Math.round(Number(booking.totalFare) * 100);
        let razorpayOrderId = `order_mock_${Date.now()}`;
        // Attempt real Razorpay API order creation if configured
        try {
            if (ENV.RAZORPAY_KEY_ID && !ENV.RAZORPAY_KEY_ID.includes('placeholder')) {
                const order = await razorpayClient.orders.create({
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: `rcpt_${booking.id.slice(0, 8)}`,
                    notes: {
                        bookingId: booking.id,
                        passengerId: userId,
                        riderId: booking.ride.riderProfile.userId,
                    },
                });
                razorpayOrderId = order.id;
            }
        }
        catch (err) {
            console.warn('[Razorpay API Warning]: Fallback to sandbox order generation', err);
        }
        const platformCut = booking.platformFee;
        const riderPayout = booking.fareFuelShare;
        const insurancePremium = booking.insuranceFee;
        const payment = await prisma.payment.upsert({
            where: { bookingId },
            update: {
                gatewayOrderId: razorpayOrderId,
                status: 'INITIATED',
            },
            create: {
                bookingId,
                payerId: userId,
                recipientId: booking.ride.riderProfile.userId,
                gatewayOrderId: razorpayOrderId,
                totalAmount: booking.totalFare,
                platformCut,
                riderPayout,
                insurancePremium,
                status: 'INITIATED',
            },
        });
        return {
            orderId: razorpayOrderId,
            amount: amountInPaise,
            currency: 'INR',
            keyId: ENV.RAZORPAY_KEY_ID,
            paymentId: payment.id,
        };
    }
    async verifyPaymentSignature(userId, input) {
        const payment = await prisma.payment.findUnique({
            where: { bookingId: input.bookingId },
            include: { booking: true },
        });
        if (!payment) {
            throw new NotFoundError('Payment record not found');
        }
        if (payment.payerId !== userId) {
            throw new ForbiddenError('Not authorized');
        }
        // HMAC verification
        let isSignatureValid = false;
        if (ENV.RAZORPAY_KEY_SECRET && !ENV.RAZORPAY_KEY_SECRET.includes('placeholder')) {
            const generatedSignature = crypto
                .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
                .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
                .digest('hex');
            isSignatureValid = generatedSignature === input.razorpaySignature;
        }
        else {
            // Sandbox mock validation
            isSignatureValid = true;
        }
        if (!isSignatureValid) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'FAILED', errorCode: 'INVALID_SIGNATURE' },
            });
            throw new BadRequestError('Payment signature verification failed');
        }
        // Mark payment CAPTURED into Escrow
        const updatedPayment = await prisma.$transaction(async (tx) => {
            const captured = await tx.payment.update({
                where: { id: payment.id },
                data: {
                    gatewayPaymentId: input.razorpayPaymentId,
                    status: 'CAPTURED',
                    capturedAt: new Date(),
                },
            });
            // Update booking to CONFIRMED if it was pending
            if (payment.booking.status === 'REQUESTED') {
                await tx.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: 'CONFIRMED', confirmedAt: new Date() },
                });
                // Reserve seat
                await tx.ride.update({
                    where: { id: payment.booking.rideId },
                    data: { availableSeats: 0 },
                });
            }
            return captured;
        });
        return updatedPayment;
    }
    async getPaymentReceipt(bookingId) {
        const payment = await prisma.payment.findUnique({
            where: { bookingId },
            include: {
                booking: {
                    include: {
                        ride: { include: { vehicle: true } },
                        passenger: { select: { fullName: true, phoneNumber: true } },
                    },
                },
                recipient: { select: { fullName: true, phoneNumber: true } },
            },
        });
        if (!payment) {
            throw new NotFoundError('Receipt not found');
        }
        return payment;
    }
}
