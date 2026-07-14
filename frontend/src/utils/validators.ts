import { z } from 'zod';

export const tradeFormSchema = z.object({
  pair: z.string().min(3, 'Pair is required').max(20),
  tradeType: z.enum(['buy', 'sell']),
  tradeDate: z
    .string()
    .min(1, 'Date is required')
    .refine(
      (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
      'Date must be in YYYY-MM-DD format'
    )
    .refine(
      (v) => !isNaN(new Date(v).getTime()),
      'Date must be a valid date'
    ),
  entryTime: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      'Entry time must be in HH:MM format'
    ),
  exitTime: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      'Exit time must be in HH:MM format'
    ),

  entryPrice: z
    .string()
    .min(1, 'Entry price is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Must be a positive number'),
  stopLoss: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) > 0), 'Must be a positive number'),
  takeProfit: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) > 0), 'Must be a positive number'),
  exitPrice: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) > 0), 'Must be a positive number'),
  lotSize: z
    .string()
    .min(1, 'Lot size is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0.01, 'Minimum 0.01'),
  riskPercent: z
    .string()
    .min(1, 'Risk % is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0 && parseFloat(v) <= 100, 'Must be 0-100'),
  pnlAmount: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), 'Must be a valid number'),

  session: z.enum(['london', 'newyork', 'asian', 'overlap']),
  setup: z.enum(['breakout', 'liquiditySweep', 'smc', 'ict', 'supportResistance', 'trendFollowing', 'scalp', 'swing', 'orderBlock', 'fairValueGap', 'liquiditySweepReversal', 'custom']).optional(),
  customSetup: z.string().max(100).optional(),
  result: z.enum(['win', 'loss', 'breakeven', 'partialWin']),

  emotionBefore: z.enum(['confident', 'fear', 'greedy', 'fomo', 'calm', 'excited']).optional(),
  emotionDuring: z.enum(['calm', 'anxious', 'doubtful', 'tempted_to_close', 'tempted_to_move_sl', 'confident_held']).optional(),
  emotionAfter: z.enum(['happy', 'frustrated', 'angry', 'satisfied', 'neutral', 'regretful']).optional(),
  confluenceCount: z.number().int().min(0).max(20).default(0),
  followedPlan: z.boolean().default(true),
  overtraded: z.boolean().default(false),
  movedSL: z.boolean().default(false),
  movedTP: z.boolean().default(false),
  revengeTrade: z.boolean().default(false),
  newsTrade: z.boolean().default(false),
  checkedHigherTimeframe: z.boolean().default(false),
  waitedForConfirmation: z.boolean().default(false),
  sizedCorrectly: z.boolean().default(true),
  withinDailyLossLimit: z.boolean().default(true),
  singleTradeDominance: z.boolean().default(true),
  mistakes: z.array(z.string()).default([]),
  customMistake: z.string().max(200).optional(),

  reasonForEntry: z.string().max(1000).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
});

export type TradeFormData = z.infer<typeof tradeFormSchema>;

export const tradeFormDefaults: TradeFormData = {
  pair: '',
  tradeType: 'buy',
  tradeDate: new Date().toISOString().split('T')[0],
  entryTime: '',
  exitTime: '',
  entryPrice: '',
  stopLoss: '',
  takeProfit: '',
  exitPrice: '',
  lotSize: '0.10',
  riskPercent: '1',
  pnlAmount: '',
  session: 'london',
  setup: undefined,
  customSetup: '',
  result: 'win',
  emotionBefore: undefined,
  emotionDuring: undefined,
  emotionAfter: undefined,
  confluenceCount: 0,
  followedPlan: true,
  overtraded: false,
  movedSL: false,
  movedTP: false,
  revengeTrade: false,
  newsTrade: false,
  checkedHigherTimeframe: false,
  waitedForConfirmation: false,
  sizedCorrectly: true,
  withinDailyLossLimit: true,
  singleTradeDominance: true,
  mistakes: [],
  customMistake: '',
  reasonForEntry: '',
  notes: '',
  tags: [],
  isFavorite: false,
};
