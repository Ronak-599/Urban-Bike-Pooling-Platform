import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { updateProfileSchema, createRiderProfileSchema, createVehicleSchema, addEmergencyContactSchema, } from './users.validation.js';
const router = Router();
const controller = new UsersController();
// All routes require authentication
router.use(authenticate);
router.get('/profile', controller.getProfile);
router.patch('/profile', validateRequest({ body: updateProfileSchema }), controller.updateProfile);
router.post('/rider-profile', validateRequest({ body: createRiderProfileSchema }), controller.createOrUpdateRiderProfile);
router.post('/vehicles', validateRequest({ body: createVehicleSchema }), controller.addVehicle);
router.get('/emergency-contacts', controller.getEmergencyContacts);
router.post('/emergency-contacts', validateRequest({ body: addEmergencyContactSchema }), controller.addEmergencyContact);
router.get('/wallet', controller.getWallet);
export default router;
