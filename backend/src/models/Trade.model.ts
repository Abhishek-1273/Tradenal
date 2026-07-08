import mongoose, { Document, Schema, Model } from 'mongoose';

export type TradeType = 'buy' | 'sell';
export type TradeSession = 'london' | 'newyork' | 'asian' | 'overlap';
export type TradeSetup =
  | 'breakout'
  | 'liquiditySweep'
  | 'smc'
  | 'ict'
  | 'supportResistance'
  | 'trendFollowing'
  | 'scalp'
  | 'swing'
  | 'custom';
export type TradeResult = 'win' | 'loss' | 'breakeven' | 'partialWin';
export type EmotionBefore = 'confident' | 'fear' | 'greedy' | 'fomo' | 'calm' | 'excited';
export type EmotionAfter = 'happy' | 'frustrated' | 'angry' | 'satisfied' | 'neutral';
export type TradeMistake =
  | 'enteredEarly'
  | 'lateEntry'
  | 'noConfirmation'
  | 'ignoredTrend'
  | 'riskTooHigh'
  | 'poorRR'
  | 'noSL'
  | 'closedEarly'
  | 'heldTooLong'
  | 'custom';

export interface IScreenshot {
  url: string;
  publicId: string;
  type: 'before' | 'after' | 'markup';
}

export interface ITrade extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accountId?: mongoose.Types.ObjectId;

  // Trade basics
  pair: string;
  tradeType: TradeType;
  tradeDate: Date;
  entryTime?: Date;
  exitTime?: Date;

  // Prices
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice?: number;
  lotSize: number;
  riskPercent: number;
  pnlAmount?: number; // Phase 2: monetary P&L amount

  // Calculated fields
  riskReward?: number;
  pnl?: number;
  rMultiple?: number;
  tradeDurationMinutes?: number;

  // Classification
  session: TradeSession;
  setup?: TradeSetup;
  customSetup?: string;
  result: TradeResult;

  // Psychology
  emotionBefore?: EmotionBefore;
  emotionAfter?: EmotionAfter;
  followedPlan: boolean;
  overtraded: boolean;
  movedSL: boolean;
  movedTP: boolean;
  revengeTrade: boolean;
  newsTrade: boolean;
  mistakes: TradeMistake[];
  customMistake?: string;

  // Media & Notes
  screenshots: IScreenshot[];
  reasonForEntry?: string;
  notes?: string;

  // Tags
  tags: string[];
  isFavorite: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ScreenshotSchema = new Schema<IScreenshot>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ['before', 'after', 'markup'], required: true },
  },
  { _id: false }
);

const TradeSchema = new Schema<ITrade>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Phase 1: Multi-account support. Optional so migration can run without
    // breaking existing documents. After migration all trades will have this.
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
    },
    pair: {
      type: String,
      required: [true, 'Pair is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    tradeType: {
      type: String,
      enum: ['buy', 'sell'],
      required: [true, 'Trade type is required'],
    },
    tradeDate: {
      type: Date,
      required: [true, 'Trade date is required'],
      index: true,
    },
    entryTime: { type: Date },
    exitTime: { type: Date },

    entryPrice: {
      type: Number,
      required: [true, 'Entry price is required'],
      min: [0, 'Entry price must be positive'],
    },
    stopLoss: {
      type: Number,
      min: [0, 'Stop loss must be positive'],
    },
    takeProfit: {
      type: Number,
      min: [0, 'Take profit must be positive'],
    },
    exitPrice: {
      type: Number,
      min: [0, 'Exit price must be positive'],
    },
    pnlAmount: {
      type: Number, // Phase 2: monetary P&L amount
    },
    lotSize: {
      type: Number,
      required: [true, 'Lot size is required'],
      min: [0.01, 'Minimum lot size is 0.01'],
    },
    riskPercent: {
      type: Number,
      required: [true, 'Risk percent is required'],
      min: [0.01, 'Risk must be positive'],
      max: [100, 'Risk cannot exceed 100%'],
    },

    // Calculated
    riskReward: { type: Number },
    pnl: { type: Number },
    rMultiple: { type: Number },
    tradeDurationMinutes: { type: Number },

    session: {
      type: String,
      enum: ['london', 'newyork', 'asian', 'overlap'],
      required: [true, 'Session is required'],
      index: true,
    },
    setup: {
      type: String,
      enum: ['breakout', 'liquiditySweep', 'smc', 'ict', 'supportResistance', 'trendFollowing', 'scalp', 'swing', 'custom'],
      index: true,
    },
    customSetup: { type: String, maxlength: 100 },

    result: {
      type: String,
      enum: ['win', 'loss', 'breakeven', 'partialWin'],
      required: [true, 'Result is required'],
      index: true,
    },

    emotionBefore: {
      type: String,
      enum: ['confident', 'fear', 'greedy', 'fomo', 'calm', 'excited'],
    },
    emotionAfter: {
      type: String,
      enum: ['happy', 'frustrated', 'angry', 'satisfied', 'neutral'],
    },
    followedPlan: { type: Boolean, default: true },
    overtraded: { type: Boolean, default: false },
    movedSL: { type: Boolean, default: false },
    movedTP: { type: Boolean, default: false },
    revengeTrade: { type: Boolean, default: false },
    newsTrade: { type: Boolean, default: false },
    mistakes: {
      type: [String],
      enum: ['enteredEarly', 'lateEntry', 'noConfirmation', 'ignoredTrend', 'riskTooHigh', 'poorRR', 'noSL', 'closedEarly', 'heldTooLong', 'custom'],
      default: [],
    },
    customMistake: { type: String, maxlength: 200 },

    screenshots: { type: [ScreenshotSchema], default: [] },
    reasonForEntry: { type: String, maxlength: 1000 },
    notes: { type: String, maxlength: 5000 },

    tags: { type: [String], default: [], index: true },
    isFavorite: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common query patterns
TradeSchema.index({ userId: 1, tradeDate: -1 });
TradeSchema.index({ userId: 1, result: 1 });
TradeSchema.index({ userId: 1, pair: 1, result: 1 });
TradeSchema.index({ userId: 1, session: 1 });
TradeSchema.index({ userId: 1, setup: 1 });
TradeSchema.index({ userId: 1, tags: 1 });
// Phase 1: account-scoped query indexes
TradeSchema.index({ accountId: 1, tradeDate: -1 });
TradeSchema.index({ accountId: 1, result: 1 });

export const Trade: Model<ITrade> = mongoose.model<ITrade>('Trade', TradeSchema);
