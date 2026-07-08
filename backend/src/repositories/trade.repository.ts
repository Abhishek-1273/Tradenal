import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { Trade, ITrade } from '../models/Trade.model';
import { BaseRepository } from './base.repository';

export interface TradeFilters {
  userId: string;
  accountId?: string;  // Phase 1: scope by account
  pair?: string;
  result?: string | string[];
  session?: string;
  setup?: string;
  emotionBefore?: string;
  mistakes?: string[];
  tags?: string[];
  startDate?: Date | string;
  endDate?: Date | string;
  isFavorite?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TradeRepository extends BaseRepository<ITrade> {
  constructor() {
    super(Trade);
  }

  buildFilter(filters: TradeFilters): Record<string, unknown> {
    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(filters.userId),
    };

    // Phase 1: if accountId is provided, add it to the filter.
    // Trades without an accountId (pre-migration) can still be queried by userId alone.
    if (filters.accountId) {
      query.accountId = new mongoose.Types.ObjectId(filters.accountId);
    }
    if (filters.pair) query.pair = filters.pair.toUpperCase();
    if (filters.result) {
      query.result = Array.isArray(filters.result)
        ? { $in: filters.result }
        : filters.result;
    }
    if (filters.session) query.session = filters.session;
    if (filters.setup) query.setup = filters.setup;
    if (filters.emotionBefore) query.emotionBefore = filters.emotionBefore;
    if (filters.isFavorite !== undefined) query.isFavorite = filters.isFavorite;

    if (filters.mistakes?.length) {
      query.mistakes = { $in: filters.mistakes };
    }

    if (filters.tags?.length) {
      query.tags = { $in: filters.tags };
    }

    if (filters.startDate || filters.endDate) {
      const dateRange: Record<string, Date> = {};
      if (filters.startDate) dateRange.$gte = new Date(filters.startDate);
      if (filters.endDate) dateRange.$lte = new Date(filters.endDate);
      query.tradeDate = dateRange;
    }

    if (filters.search) {
      query.$or = [
        { pair: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } },
        { reasonForEntry: { $regex: filters.search, $options: 'i' } },
        { tags: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: TradeFilters,
    pagination: PaginationOptions
  ): Promise<{ trades: ITrade[]; total: number }> {
    const query = this.buildFilter(filters);
    const { page, limit, sortBy = 'tradeDate', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 } as Record<string, 1 | -1>;

    const [trades, total] = await Promise.all([
      Trade.find(query).sort(sort).skip(skip).limit(limit).exec(),
      Trade.countDocuments(query).exec(),
    ]);

    return { trades, total };
  }

  async findForStats(filters: TradeFilters): Promise<ITrade[]> {
    const query = this.buildFilter(filters);
    return Trade.find(query).sort({ tradeDate: 1 }).exec();
  }

  async findByDate(userId: string, date: Date, accountId?: string): Promise<ITrade[]> {
    const start = dayjs(date).startOf('day').toDate();
    const end = dayjs(date).endOf('day').toDate();
    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
      tradeDate: { $gte: start, $lte: end },
    };
    if (accountId) filter.accountId = new mongoose.Types.ObjectId(accountId);

    return Trade.find(filter)
      .sort({ tradeDate: 1 })
      .exec();
  }

  async findByMonth(userId: string, year: number, month: number, accountId?: string): Promise<ITrade[]> {
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month').toDate();
    const end = dayjs(start).endOf('month').toDate();
    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
      tradeDate: { $gte: start, $lte: end },
    };
    if (accountId) filter.accountId = new mongoose.Types.ObjectId(accountId);

    return Trade.find(filter)
      .sort({ tradeDate: 1 })
      .exec();
  }

  async findByWeek(userId: string, weekStart: Date, accountId?: string): Promise<ITrade[]> {
    const start = dayjs(weekStart).startOf('week').toDate();
    const end = dayjs(weekStart).endOf('week').toDate();
    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
      tradeDate: { $gte: start, $lte: end },
    };
    if (accountId) filter.accountId = new mongoose.Types.ObjectId(accountId);

    return Trade.find(filter)
      .sort({ tradeDate: 1 })
      .exec();
  }

  async getCalendarData(
    userId: string,
    year: number,
    month: number,
    accountId?: string
  ): Promise<{ date: string; trades: number; netRR: number; wins: number; losses: number }[]> {
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month').toDate();
    const end = dayjs(start).endOf('month').toDate();

    const matchStage: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
      tradeDate: { $gte: start, $lte: end },
    };
    if (accountId) matchStage.accountId = new mongoose.Types.ObjectId(accountId);

    const result = await Trade.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$tradeDate' } },
          trades: { $sum: 1 },
          netRR: { $sum: '$rMultiple' },
          wins: {
            $sum: {
              $cond: [{ $in: ['$result', ['win', 'partialWin']] }, 1, 0],
            },
          },
          losses: {
            $sum: {
              $cond: [{ $eq: ['$result', 'loss'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          trades: 1,
          netRR: { $round: ['$netRR', 2] },
          wins: 1,
          losses: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    return result;
  }

  async getEquityCurve(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    accountId?: string
  ): Promise<{ date: string; cumulativeRR: number; tradeNumber: number }[]> {
    const matchStage: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (accountId) {
      matchStage.accountId = new mongoose.Types.ObjectId(accountId);
    }

    if (startDate || endDate) {
      const dateRange: Record<string, Date> = {};
      if (startDate) dateRange.$gte = startDate;
      if (endDate) dateRange.$lte = endDate;
      matchStage.tradeDate = dateRange;
    }

    const trades = await Trade.find(matchStage)
      .select('tradeDate rMultiple pnlAmount result')
      .sort({ tradeDate: 1 })
      .exec();

    let cumulativeRR = 0;
    let cumulativePnL = 0;
    return trades.map((trade, index) => {
      cumulativeRR += trade.rMultiple ?? 0;
      cumulativePnL += trade.pnlAmount ?? 0;
      return {
        date: dayjs(trade.tradeDate).format('YYYY-MM-DD'),
        cumulativeRR: parseFloat(cumulativeRR.toFixed(2)),
        cumulativePnL: parseFloat(cumulativePnL.toFixed(2)),
        tradeNumber: index + 1,
      };
    });
  }

  async getDailyTradeCount(userId: string, date: Date, accountId?: string): Promise<number> {
    const start = dayjs(date).startOf('day').toDate();
    const end = dayjs(date).endOf('day').toDate();
    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
      tradeDate: { $gte: start, $lte: end },
    };
    if (accountId) filter.accountId = new mongoose.Types.ObjectId(accountId);
    return Trade.countDocuments(filter).exec();
  }

  async getUniqueTags(userId: string, accountId?: string): Promise<string[]> {
    const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
    if (accountId) filter.accountId = new mongoose.Types.ObjectId(accountId);
    const result = await Trade.distinct('tags', filter);
    return result.filter(Boolean);
  }

  async getUniquePairs(userId: string, accountId?: string): Promise<string[]> {
    const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
    if (accountId) filter.accountId = new mongoose.Types.ObjectId(accountId);
    return Trade.distinct('pair', filter);
  }

  async findRecentNotes(userId: string, accountId?: string, limit = 3): Promise<ITrade[]> {
    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
      notes: { $exists: true, $ne: '' },
    };
    if (accountId) filter.accountId = new mongoose.Types.ObjectId(accountId);

    return Trade.find(filter)
      .sort({ tradeDate: -1 })
      .limit(limit)
      .exec();
  }
}

export const tradeRepository = new TradeRepository();
