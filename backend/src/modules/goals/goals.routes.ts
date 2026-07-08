import { Router } from 'express';
import * as goalsController from './goals.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createGoalSchema } from './goals.schema';

const router = Router();

router.use(authenticate);

router.get('/', goalsController.getRecentGoals);
router.post('/', validate(createGoalSchema), goalsController.createOrUpdateGoal);
router.get('/:month', goalsController.getGoal);
router.delete('/:month', goalsController.deleteGoal);

export default router;
