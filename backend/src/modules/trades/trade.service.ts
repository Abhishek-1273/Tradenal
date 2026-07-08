import mongoose from 'mongoose';
import { tradeRepository, TradeFilters } from '../../repositories/trade.repository';
import { AppError } from '../../middleware/error.middleware';
import { uploadToCloudinary, deleteFromCloudinary } from '../../middleware/upload.middleware';
import {
  calculateRiskReward,
  calculatePnL,
  calculateRMultiple,
  calculateDuration,
} from '../../utils/calculations';
import { CreateTradeInput, UpdateTradeInput, TradeFiltersInput } from './trade.schema';
import { ITrade } from '../../models/Trade.model';
import { accountService } from '../accounts/account.service';

class TradeService {
  // ─── Create Trade ─────────────────────────────────────────────────────────
  async createTrade(userId: string, input: CreateTradeInput): Promise<ITrade> {
    // Resolve which account this trade belongs to
    const accountId = await accountService.resolveAccountId(userId, input.accountId);

    // Server-side calculations
    const riskReward =
      input.stopLoss != null && input.takeProfit != null
        ? calculateRiskReward(input.entryPrice, input.stopLoss, input.takeProfit)
        : undefined;

    const pnl = input.exitPrice
      ? calculatePnL(input.tradeType, input.entryPrice, input.exitPrice, input.lotSize)
      : undefined;

    const rMultiple =
      input.exitPrice && input.stopLoss != null
        ? calculateRMultiple(input.tradeType, input.entryPrice, input.stopLoss, input.exitPrice)
        : undefined;

    const tradeDurationMinutes =
      input.entryTime && input.exitTime
        ? calculateDuration(input.entryTime, input.exitTime)
        : undefined;

    const trade = await tradeRepository.create({
      ...input,
      userId: userId as unknown as mongoose.Types.ObjectId,
      ...(accountId ? { accountId: accountId as unknown as mongoose.Types.ObjectId } : {}),
      riskReward,
      pnl,
      rMultiple,
      tradeDurationMinutes,
    } as Partial<ITrade>);

    return trade;
  }

  // ─── Get Trades (paginated + filtered) ────────────────────────────────────
  async getTrades(
    userId: string,
    filtersInput: TradeFiltersInput
  ): Promise<{
    trades: ITrade[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Resolve account: if accountId provided, validate it; else use default
    const accountId = await accountService.resolveAccountId(userId, filtersInput.accountId);

    const filters: TradeFilters = {
      userId,
      accountId,
      pair: filtersInput.pair,
      result: filtersInput.result,
      session: filtersInput.session,
      setup: filtersInput.setup,
      emotionBefore: filtersInput.emotionBefore,
      startDate: filtersInput.startDate,
      endDate: filtersInput.endDate,
      search: filtersInput.search,
      isFavorite: filtersInput.isFavorite === 'true' ? true : undefined,
    };

    if (filtersInput.mistakes) {
      filters.mistakes = filtersInput.mistakes.split(',').map((m) => m.trim());
    }
    if (filtersInput.tags) {
      filters.tags = filtersInput.tags.split(',').map((t) => t.trim());
    }

    const { trades, total } = await tradeRepository.findWithFilters(filters, {
      page: filtersInput.page,
      limit: filtersInput.limit,
      sortBy: filtersInput.sortBy,
      sortOrder: filtersInput.sortOrder,
    });

    return {
      trades,
      total,
      page: filtersInput.page,
      totalPages: Math.ceil(total / filtersInput.limit),
    };
  }

  // ─── Get Single Trade ─────────────────────────────────────────────────────
  async getTradeById(userId: string, tradeId: string): Promise<ITrade> {
    const trade = await tradeRepository.findById(tradeId);

    if (!trade) throw new AppError('Trade not found', 404);
    if (trade.userId.toString() !== userId) throw new AppError('Not authorized', 403);

    return trade;
  }

  // ─── Update Trade ─────────────────────────────────────────────────────────
  async updateTrade(userId: string, tradeId: string, input: UpdateTradeInput): Promise<ITrade> {
    const trade = await tradeRepository.findById(tradeId);
    if (!trade) throw new AppError('Trade not found', 404);
    if (trade.userId.toString() !== userId) throw new AppError('Not authorized', 403);

    // Recalculate derived fields if price data changed
    const updates: Partial<ITrade> = { ...input } as Partial<ITrade>;

    const entryPrice = input.entryPrice ?? trade.entryPrice;
    const stopLoss = input.stopLoss ?? trade.stopLoss;
    const takeProfit = input.takeProfit ?? trade.takeProfit;
    const exitPrice = input.exitPrice ?? trade.exitPrice;
    const lotSize = input.lotSize ?? trade.lotSize;
    const tradeType = input.tradeType ?? trade.tradeType;
    const entryTime = input.entryTime ?? trade.entryTime;
    const exitTime = input.exitTime ?? trade.exitTime;

    if (stopLoss != null && takeProfit != null) {
      updates.riskReward = calculateRiskReward(entryPrice, stopLoss, takeProfit);
    } else {
      updates.riskReward = undefined;
    }

    if (exitPrice) {
      updates.pnl = calculatePnL(tradeType, entryPrice, exitPrice, lotSize);
      if (stopLoss != null) {
        updates.rMultiple = calculateRMultiple(tradeType, entryPrice, stopLoss, exitPrice);
      }
    }

    if (entryTime && exitTime) {
      updates.tradeDurationMinutes = calculateDuration(
        new Date(entryTime),
        new Date(exitTime)
      );
    }

    const updated = await tradeRepository.updateById(tradeId, updates);
    if (!updated) throw new AppError('Trade not found', 404);

    return updated;
  }

  // ─── Delete Trade ─────────────────────────────────────────────────────────
  async deleteTrade(userId: string, tradeId: string): Promise<void> {
    const trade = await tradeRepository.findById(tradeId);
    if (!trade) throw new AppError('Trade not found', 404);
    if (trade.userId.toString() !== userId) throw new AppError('Not authorized', 403);

    // Delete screenshots from Cloudinary
    if (trade.screenshots.length > 0) {
      await Promise.allSettled(
        trade.screenshots.map((s) => deleteFromCloudinary(s.publicId))
      );
    }

    await tradeRepository.deleteById(tradeId);
  }

  // ─── Upload Screenshots ───────────────────────────────────────────────────
  async uploadScreenshots(
    userId: string,
    tradeId: string,
    files: Express.Multer.File[],
    types: string[]
  ): Promise<ITrade> {
    const trade = await tradeRepository.findById(tradeId);
    if (!trade) throw new AppError('Trade not found', 404);
    if (trade.userId.toString() !== userId) throw new AppError('Not authorized', 403);

    if (trade.screenshots.length + files.length > 10) {
      throw new AppError('Maximum 10 screenshots per trade', 400);
    }

    const uploadResults = await Promise.all(
      files.map((file, index) =>
        uploadToCloudinary(file, 'screenshots', userId).then((result) => ({
          ...result,
          type: (types[index] || 'before') as 'before' | 'after' | 'markup',
        }))
      )
    );

    const updated = await tradeRepository.updateById(tradeId, {
      $push: { screenshots: { $each: uploadResults } },
    });

    if (!updated) throw new AppError('Trade not found', 404);
    return updated;
  }

  // ─── Delete Screenshot ────────────────────────────────────────────────────
  async deleteScreenshot(userId: string, tradeId: string, publicId: string): Promise<ITrade> {
    const trade = await tradeRepository.findById(tradeId);
    if (!trade) throw new AppError('Trade not found', 404);
    if (trade.userId.toString() !== userId) throw new AppError('Not authorized', 403);

    await deleteFromCloudinary(publicId);

    const updated = await tradeRepository.updateById(tradeId, {
      $pull: { screenshots: { publicId } },
    });

    if (!updated) throw new AppError('Trade not found', 404);
    return updated;
  }

  // ─── Toggle Favorite ──────────────────────────────────────────────────────
  async toggleFavorite(userId: string, tradeId: string): Promise<ITrade> {
    const trade = await tradeRepository.findById(tradeId);
    if (!trade) throw new AppError('Trade not found', 404);
    if (trade.userId.toString() !== userId) throw new AppError('Not authorized', 403);

    const updated = await tradeRepository.updateById(tradeId, {
      isFavorite: !trade.isFavorite,
    });

    if (!updated) throw new AppError('Trade not found', 404);
    return updated;
  }

  // ─── Get Tags ─────────────────────────────────────────────────────────────
  async getTags(userId: string, accountId?: string): Promise<string[]> {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    return tradeRepository.getUniqueTags(userId, resolvedAccountId);
  }

  // ─── Get Pairs ────────────────────────────────────────────────────────────
  async getPairs(userId: string, accountId?: string): Promise<string[]> {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    return tradeRepository.getUniquePairs(userId, resolvedAccountId);
  }
}

export const tradeService = new TradeService();
