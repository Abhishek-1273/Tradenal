import { Router } from 'express';
import * as exportController from './export.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { apiLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/csv', exportController.exportCSV);
router.get('/json', exportController.exportJSON);

export default router;
