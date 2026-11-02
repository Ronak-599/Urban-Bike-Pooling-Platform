import { UsersService } from './users.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.util.js';
const usersService = new UsersService();
export class UsersController {
    async getProfile(req, res, next) {
        try {
            const user = await usersService.getProfile(req.user.userId);
            sendSuccess(res, user, 'Profile retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const updated = await usersService.updateProfile(req.user.userId, req.body);
            sendSuccess(res, updated, 'Profile updated');
        }
        catch (error) {
            next(error);
        }
    }
    async createOrUpdateRiderProfile(req, res, next) {
        try {
            const profile = await usersService.createOrUpdateRiderProfile(req.user.userId, req.body);
            sendSuccess(res, profile, 'Rider profile saved');
        }
        catch (error) {
            next(error);
        }
    }
    async addVehicle(req, res, next) {
        try {
            const vehicle = await usersService.addVehicle(req.user.userId, req.body);
            sendCreated(res, vehicle, 'Vehicle registered successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async addEmergencyContact(req, res, next) {
        try {
            const contact = await usersService.addEmergencyContact(req.user.userId, req.body);
            sendCreated(res, contact, 'Emergency contact added');
        }
        catch (error) {
            next(error);
        }
    }
    async getEmergencyContacts(req, res, next) {
        try {
            const contacts = await usersService.getEmergencyContacts(req.user.userId);
            sendSuccess(res, contacts, 'Emergency contacts retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async getWallet(req, res, next) {
        try {
            const wallet = await usersService.getWallet(req.user.userId);
            sendSuccess(res, wallet, 'Wallet details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
