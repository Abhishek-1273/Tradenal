import { Response, NextFunction } from 'express';
import { goalsService } from './goals.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import dayjs from 'dayjs';

export const createOrUpdateGoal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const goal = await goalsService.createOrUpdateGoal(req.userId!, req.body);
    sendCreated(res, goal, 'Goal saved');
  } catch (error) {
    next(error);
  }
};

export const getGoal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const month = req.params.month || dayjs().format('YYYY-MM');
    const accountId = req.query.accountId as string | undefined;
    const data = await goalsService.getGoalWithProgress(req.userId!, month, accountId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getRecentGoals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accountId = req.query.accountId as string | undefined;
    const goals = await goalsService.getRecentGoals(req.userId!, accountId);
    sendSuccess(res, goals);
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accountId = req.query.accountId as string | undefined;
    await goalsService.deleteGoal(req.userId!, req.params.month, accountId);
    sendSuccess(res, null, 'Goal deleted');
  } catch (error) {
    next(error);
  }
};
