import { ReviewsService } from './reviews.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.util.js';
const reviewsService = new ReviewsService();
export class ReviewsController {
    async submitReview(req, res, next) {
        try {
            const review = await reviewsService.submitReview(req.user.userId, req.body);
            sendCreated(res, review, 'Review submitted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getUserReviews(req, res, next) {
        try {
            const reviews = await reviewsService.getUserReviews(req.params.userId);
            sendSuccess(res, reviews, 'Reviews retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
