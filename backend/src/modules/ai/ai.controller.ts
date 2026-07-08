import { Response, NextFunction } from 'express';
import { aiService } from './ai.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/apiResponse';

export const generateWeeklyReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountId } = req.body;
    const review = await aiService.generateWeeklyReview(req.userId!, accountId);
    sendSuccess(res, review, 'Weekly review generated');
  } catch (error) { next(error); }
};

export const generateMonthlyReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountId } = req.body;
    const review = await aiService.generateMonthlyReview(req.userId!, accountId);
    sendSuccess(res, review, 'Monthly review generated');
  } catch (error) { next(error); }
};

export const getReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const type = (req.query.type as 'weekly' | 'monthly') || 'weekly';
    const limit = parseInt(req.query.limit as string) || 10;
    const accountId = req.query.accountId as string | undefined;
    const reviews = await aiService.getReviews(req.userId!, type, limit, accountId);
    sendSuccess(res, reviews);
  } catch (error) { next(error); }
};

export const getLatestReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const type = req.params.type as 'weekly' | 'monthly';
    const accountId = req.query.accountId as string | undefined;
    const review = await aiService.getLatestReview(req.userId!, type, accountId);
    sendSuccess(res, review);
  } catch (error) { next(error); }
};

export const getPatterns = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const accountId = req.query.accountId as string | undefined;
    const patterns = await aiService.getPatterns(req.userId!, days, accountId);
    sendSuccess(res, patterns);
  } catch (error) { next(error); }
};
