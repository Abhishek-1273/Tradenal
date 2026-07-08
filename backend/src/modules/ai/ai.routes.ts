import { Router } from 'express';
import * as aiController from './ai.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { aiLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();
router.use(authenticate);
router.get('/reviews', aiController.getReviews);
router.get('/reviews/:type', aiController.getLatestReview);
router.get('/patterns', aiController.getPatterns);
router.post('/generate/weekly', aiLimiter, aiController.generateWeeklyReview);
router.post('/generate/monthly', aiLimiter, aiController.generateMonthlyReview);
export default router;
