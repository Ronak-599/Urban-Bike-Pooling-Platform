import { BookingsService } from './bookings.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.util.js';
const bookingsService = new BookingsService();
export class BookingsController {
    async createBooking(req, res, next) {
        try {
            const booking = await bookingsService.createBooking(req.user.userId, req.body);
            sendCreated(res, booking, 'Booking request created');
        }
        catch (error) {
            next(error);
        }
    }
    async respondToBooking(req, res, next) {
        try {
            const booking = await bookingsService.respondToBooking(req.user.userId, req.params.id, req.body.action);
            sendSuccess(res, booking, `Booking ${req.body.action.toLowerCase()}ed`);
        }
        catch (error) {
            next(error);
        }
    }
    async markArrived(req, res, next) {
        try {
            const booking = await bookingsService.markArrived(req.user.userId, req.params.id);
            sendSuccess(res, booking, 'Marked arrived at pickup');
        }
        catch (error) {
            next(error);
        }
    }
    async verifyOtpAndStart(req, res, next) {
        try {
            const booking = await bookingsService.verifyOtpAndStart(req.user.userId, req.params.id, req.body.otp);
            sendSuccess(res, booking, 'Ride verified and started successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async completeRide(req, res, next) {
        try {
            const booking = await bookingsService.completeRide(req.user.userId, req.params.id);
            sendSuccess(res, booking, 'Ride completed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async cancelBooking(req, res, next) {
        try {
            const booking = await bookingsService.cancelBooking(req.user.userId, req.params.id, req.body);
            sendSuccess(res, booking, 'Booking cancelled successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getMyBookings(req, res, next) {
        try {
            const bookings = await bookingsService.getMyBookings(req.user.userId);
            sendSuccess(res, bookings, 'Bookings retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async getBookingById(req, res, next) {
        try {
            const booking = await bookingsService.getBookingById(req.user.userId, req.params.id);
            sendSuccess(res, booking, 'Booking details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
