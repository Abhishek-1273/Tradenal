import { Response, NextFunction } from 'express';
import { tradeService } from './trade.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';

export const createTrade = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trade = await tradeService.createTrade(req.userId!, req.body);
    sendCreated(res, trade, 'Trade created successfully');
  } catch (error) {
    next(error);
  }
};

export const getTrades = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await tradeService.getTrades(req.userId!, req.query as any);
    sendSuccess(res, result.trades, 'Trades retrieved', 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
};

export const getTradeById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trade = await tradeService.getTradeById(req.userId!, req.params.id);
    sendSuccess(res, trade);
  } catch (error) {
    next(error);
  }
};

export const updateTrade = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trade = await tradeService.updateTrade(req.userId!, req.params.id, req.body);
    sendSuccess(res, trade, 'Trade updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTrade = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await tradeService.deleteTrade(req.userId!, req.params.id);
    sendSuccess(res, null, 'Trade deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const uploadScreenshots = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const types = Array.isArray(req.body.types) ? req.body.types : [req.body.types];

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files uploaded' });
      return;
    }

    const trade = await tradeService.uploadScreenshots(req.userId!, req.params.id, files, types);
    sendSuccess(res, trade, 'Screenshots uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteScreenshot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trade = await tradeService.deleteScreenshot(
      req.userId!,
      req.params.id,
      req.params.publicId
    );
    sendSuccess(res, trade, 'Screenshot deleted');
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trade = await tradeService.toggleFavorite(req.userId!, req.params.id);
    sendSuccess(res, trade, 'Favorite toggled');
  } catch (error) {
    next(error);
  }
};

export const getTags = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accountId = req.query.accountId as string | undefined;
    const tags = await tradeService.getTags(req.userId!, accountId);
    sendSuccess(res, tags);
  } catch (error) {
    next(error);
  }
};

export const getPairs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accountId = req.query.accountId as string | undefined;
    const pairs = await tradeService.getPairs(req.userId!, accountId);
    sendSuccess(res, pairs);
  } catch (error) {
    next(error);
  }
};
