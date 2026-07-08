import { Router } from 'express';
import * as statsController from './stats.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', statsController.getDashboard);
router.get('/analytics', statsController.getAnalytics);
router.get('/calendar', statsController.getCalendar);
router.get('/calendar/:date', statsController.getCalendarDay);
router.get('/discipline', statsController.getDisciplineScore);

export default router;
