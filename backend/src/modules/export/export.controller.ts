import { Response, NextFunction } from 'express';
import { exportService } from './export.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const exportCSV = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, pair, result, accountId } = req.query as Record<string, string>;
    const csv = await exportService.exportCSV(req.userId!, { startDate, endDate, pair, result, accountId });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="trades-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

export const exportJSON = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, accountId } = req.query as Record<string, string>;
    const data = await exportService.exportJSON(req.userId!, { startDate, endDate, accountId });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="trades-${Date.now()}.json"`);
    res.json(data);
  } catch (error) {
    next(error);
  }
};
