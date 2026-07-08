import { Response, NextFunction } from 'express';
import { statsService } from './stats.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/apiResponse';

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const period = (req.query.period as 'today' | 'week' | 'month' | 'all') || 'month';
    const accountId = req.query.accountId as string | undefined;
    const data = await statsService.getDashboard(req.userId!, period, accountId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, accountId } = req.query as {
      startDate?: string;
      endDate?: string;
      accountId?: string;
    };
    const data = await statsService.getAnalytics(req.userId!, startDate, endDate, accountId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getCalendar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const accountId = req.query.accountId as string | undefined;
    const data = await statsService.getCalendar(req.userId!, year, month, accountId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getCalendarDay = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.params;
    const accountId = req.query.accountId as string | undefined;
    const data = await statsService.getCalendarDay(req.userId!, date, accountId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getDisciplineScore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const period = (req.query.period as 'week' | 'month' | 'all') || 'month';
    const accountId = req.query.accountId as string | undefined;
    const data = await statsService.getDisciplineScore(req.userId!, period, accountId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
