import { Router } from 'express';
import { RidesController } from './rides.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { createRideSchema, searchRidesSchema } from './rides.validation.js';
const router = Router();
const controller = new RidesController();
// Public / Authenticated search
router.get('/search', validateRequest({ query: searchRidesSchema }), controller.searchRides);
router.get('/upcoming', controller.getUpcomingRides);
// Protected routes
router.use(authenticate);
router.post('/offer', validateRequest({ body: createRideSchema }), controller.createRide);
router.get('/my-offers', controller.getMyRides);
router.get('/:id', controller.getRideById);
router.put('/:id/cancel', controller.cancelRide);
export default router;
