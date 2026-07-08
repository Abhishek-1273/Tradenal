import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accountId?: mongoose.Types.ObjectId;
  month: string; // Format: YYYY-MM
  targetRR: number;
  targetWinRate: number;
  maxDailyTrades: number;
  maxDailyLoss: number;
  targetConsistency: number; // discipline score target
  targetNetRR?: number;
  targetTrades?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Phase 1: account-scoped goals
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
    },
    targetRR: {
      type: Number,
      required: [true, 'Target RR is required'],
      min: [0.5, 'Minimum RR target is 0.5'],
    },
    targetWinRate: {
      type: Number,
      required: [true, 'Target win rate is required'],
      min: [0, 'Win rate must be between 0 and 100'],
      max: [100, 'Win rate must be between 0 and 100'],
    },
    maxDailyTrades: {
      type: Number,
      required: [true, 'Max daily trades is required'],
      min: [1, 'Must allow at least 1 trade per day'],
    },
    maxDailyLoss: {
      type: Number,
      required: [true, 'Max daily loss is required'],
      min: [0.1, 'Max daily loss must be positive'],
    },
    targetConsistency: {
      type: Number,
      required: [true, 'Target consistency score is required'],
      min: [0, 'Score must be between 0 and 100'],
      max: [100, 'Score must be between 0 and 100'],
    },
    targetNetRR: { type: Number },
    targetTrades: { type: Number, min: 1 },
    notes: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
  }
);

// One goal per user per account per month
GoalSchema.index({ userId: 1, accountId: 1, month: 1 }, { unique: true });

export const Goal: Model<IGoal> = mongoose.model<IGoal>('Goal', GoalSchema);
