import { RidesService } from './rides.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.util.js';
const ridesService = new RidesService();
export class RidesController {
    async createRide(req, res, next) {
        try {
            const ride = await ridesService.createRide(req.user.userId, req.body);
            sendCreated(res, ride, 'Ride published successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async searchRides(req, res, next) {
        try {
            const matches = await ridesService.searchRides(req.query, req.user?.userId);
            sendSuccess(res, matches, `Found ${matches.length} matching ride offers`);
        }
        catch (error) {
            next(error);
        }
    }
    async getUpcomingRides(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const rides = await ridesService.getUpcomingRides(limit);
            sendSuccess(res, rides, `Found ${rides.length} upcoming rides`);
        }
        catch (error) {
            next(error);
        }
    }
    async getMyRides(req, res, next) {
        try {
            const rides = await ridesService.getMyRides(req.user.userId);
            sendSuccess(res, rides, 'Rides retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async getRideById(req, res, next) {
        try {
            const ride = await ridesService.getRideById(req.params.id);
            sendSuccess(res, ride, 'Ride details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async cancelRide(req, res, next) {
        try {
            const cancelled = await ridesService.cancelRide(req.user.userId, req.params.id);
            sendSuccess(res, cancelled, 'Ride cancelled successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
