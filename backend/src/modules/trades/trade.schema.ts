import { z } from 'zod';

const TRADE_TYPES = ['buy', 'sell'] as const;
const SESSIONS = ['london', 'newyork', 'asian', 'overlap'] as const;
const SETUPS = ['breakout', 'liquiditySweep', 'smc', 'ict', 'supportResistance', 'trendFollowing', 'scalp', 'swing', 'custom'] as const;
const RESULTS = ['win', 'loss', 'breakeven', 'partialWin'] as const;
const EMOTIONS_BEFORE = ['confident', 'fear', 'greedy', 'fomo', 'calm', 'excited'] as const;
const EMOTIONS_AFTER = ['happy', 'frustrated', 'angry', 'satisfied', 'neutral'] as const;
const MISTAKES = ['enteredEarly', 'lateEntry', 'noConfirmation', 'ignoredTrend', 'riskTooHigh', 'poorRR', 'noSL', 'closedEarly', 'heldTooLong', 'custom'] as const;

export const createTradeSchema = z.object({
  // Phase 1: optional accountId — if omitted, service falls back to user's default account
  accountId: z.string().optional(),
  pair: z.string().min(3, 'Pair is required').max(20).toUpperCase().trim(),
  tradeType: z.enum(TRADE_TYPES),
  tradeDate: z.string().or(z.date()).refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Trade date must be a valid date').transform((val) => new Date(val)),
  entryTime: z.string().or(z.date()).refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Entry time must be a valid time').transform((val) => val ? new Date(val) : undefined).optional(),
  exitTime: z.string().or(z.date()).refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Exit time must be a valid time').transform((val) => val ? new Date(val) : undefined).optional(),

  entryPrice: z.number().positive('Entry price must be positive'),
  stopLoss: z.number().positive('Stop loss must be positive').optional(),
  takeProfit: z.number().positive('Take profit must be positive').optional(),
  exitPrice: z.number().positive().optional(),
  lotSize: z.number().min(0.01, 'Minimum lot size is 0.01'),
  riskPercent: z.number().min(0.01).max(100),
  pnlAmount: z.number().optional(), // Phase 2: monetary P&L amount

  session: z.enum(SESSIONS),
  setup: z.enum(SETUPS).optional(),
  customSetup: z.string().max(100).optional(),
  result: z.enum(RESULTS),

  emotionBefore: z.enum(EMOTIONS_BEFORE).optional(),
  emotionAfter: z.enum(EMOTIONS_AFTER).optional(),
  followedPlan: z.boolean().default(true),
  overtraded: z.boolean().default(false),
  movedSL: z.boolean().default(false),
  movedTP: z.boolean().default(false),
  revengeTrade: z.boolean().default(false),
  newsTrade: z.boolean().default(false),
  mistakes: z.array(z.enum(MISTAKES)).default([]),
  customMistake: z.string().max(200).optional(),

  reasonForEntry: z.string().max(1000).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).default([]),
  isFavorite: z.boolean().default(false),
});

export const updateTradeSchema = createTradeSchema.partial();

export const tradeFiltersSchema = z.object({
  accountId: z.string().optional(), // Phase 1: filter by account
  pair: z.string().optional(),
  result: z.string().optional(),
  session: z.string().optional(),
  setup: z.string().optional(),
  emotionBefore: z.string().optional(),
  mistakes: z.string().optional(), // comma-separated
  tags: z.string().optional(),     // comma-separated
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isFavorite: z.string().optional(),
  search: z.string().optional(),
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
  sortBy: z.string().default('tradeDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;
export type TradeFiltersInput = z.infer<typeof tradeFiltersSchema>;
