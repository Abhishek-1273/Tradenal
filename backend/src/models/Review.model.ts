import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IReviewContent {
  summary: string;
  biggestMistakes: string[];
  bestSetups: string[];
  weaknesses: string[];
  suggestions: string[];
  disciplineScore: number;
  improvementAreas: string[];
  psychologyInsights: string;
  riskManagementFeedback: string;
  strengthsToKeep: string[];
}

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accountId?: mongoose.Types.ObjectId;
  type: 'weekly' | 'monthly';
  period: {
    start: Date;
    end: Date;
    label: string; // e.g. "Week 28, 2024" or "July 2024"
  };
  content: IReviewContent;
  metrics: {
    tradeCount: number;
    winRate: number;
    netRR: number;
    profitFactor: number;
    disciplineScore: number;
    avgRR: number;
  };
  tradeIds: mongoose.Types.ObjectId[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewContentSchema = new Schema<IReviewContent>(
  {
    summary: { type: String, required: true },
    biggestMistakes: { type: [String], default: [] },
    bestSetups: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    disciplineScore: { type: Number, min: 0, max: 100 },
    improvementAreas: { type: [String], default: [] },
    psychologyInsights: { type: String },
    riskManagementFeedback: { type: String },
    strengthsToKeep: { type: [String], default: [] },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
    },
    type: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: true,
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
      label: { type: String, required: true },
    },
    content: {
      type: ReviewContentSchema,
      required: true,
    },
    metrics: {
      tradeCount: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      netRR: { type: Number, default: 0 },
      profitFactor: { type: Number, default: 0 },
      disciplineScore: { type: Number, default: 0 },
      avgRR: { type: Number, default: 0 },
    },
    tradeIds: [{ type: Schema.Types.ObjectId, ref: 'Trade' }],
    generatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ userId: 1, accountId: 1, type: 1, 'period.start': -1 });

export const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);
