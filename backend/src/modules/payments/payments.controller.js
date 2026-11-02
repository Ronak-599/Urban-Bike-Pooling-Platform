import { PaymentsService } from './payments.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.util.js';
const paymentsService = new PaymentsService();
export class PaymentsController {
    async createOrder(req, res, next) {
        try {
            const order = await paymentsService.createOrder(req.user.userId, req.body.bookingId);
            sendCreated(res, order, 'Razorpay order created');
        }
        catch (error) {
            next(error);
        }
    }
    async verifyPayment(req, res, next) {
        try {
            const payment = await paymentsService.verifyPaymentSignature(req.user.userId, req.body);
            sendSuccess(res, payment, 'Payment verified and held in escrow');
        }
        catch (error) {
            next(error);
        }
    }
    async getReceipt(req, res, next) {
        try {
            const receipt = await paymentsService.getPaymentReceipt(req.params.bookingId);
            sendSuccess(res, receipt, 'Receipt retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
