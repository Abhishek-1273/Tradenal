import mongoose, { Document, Schema, Model } from 'mongoose';

export type AccountType = 'propFirmChallenge' | 'fundedAccount' | 'personal' | 'demo';
export type AccountStatus = 'active' | 'passed' | 'failed' | 'funded' | 'archived';

export interface IPropFirmRules {
  profitTarget?: number;      // % e.g. 8
  maxDailyLoss?: number;      // % e.g. 3
  maxOverallLoss?: number;    // % e.g. 6
  minTradingDays?: number;
  maxTradingDays?: number;
  challengeStartDate?: Date;
  challengeEndDate?: Date;
}

export interface IPersonalGoals {
  monthlyTarget?: number;     // $ amount
  maxDailyLoss?: number;      // %
  maxDrawdown?: number;       // %
}

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  accountType: AccountType;
  broker?: string;
  currency: string;
  startingBalance: number;
  isDefault: boolean;
  status: AccountStatus;
  brokerGmtOffset: number;
  propFirmRules?: IPropFirmRules;
  personalGoals?: IPersonalGoals;
  currentBalance?: number; // Phase 2: auto-derived balance
  createdAt: Date;
  updatedAt: Date;
}

const PropFirmRulesSchema = new Schema<IPropFirmRules>(
  {
    profitTarget: { type: Number, min: 0 },
    maxDailyLoss: { type: Number, min: 0 },
    maxOverallLoss: { type: Number, min: 0 },
    minTradingDays: { type: Number, min: 1 },
    maxTradingDays: { type: Number, min: 1 },
    challengeStartDate: { type: Date },
    challengeEndDate: { type: Date },
  },
  { _id: false }
);

const PersonalGoalsSchema = new Schema<IPersonalGoals>(
  {
    monthlyTarget: { type: Number, min: 0 },
    maxDailyLoss: { type: Number, min: 0 },
    maxDrawdown: { type: Number, min: 0 },
  },
  { _id: false }
);

const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: [100, 'Account name cannot exceed 100 characters'],
    },
    accountType: {
      type: String,
      enum: ['propFirmChallenge', 'fundedAccount', 'personal', 'demo'],
      required: [true, 'Account type is required'],
    },
    broker: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      trim: true,
      maxlength: 10,
      default: 'USD',
    },
    startingBalance: {
      type: Number,
      required: [true, 'Starting balance is required'],
      min: [0, 'Starting balance cannot be negative'],
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'passed', 'failed', 'funded', 'archived'],
      default: 'active',
    },
    propFirmRules: { type: PropFirmRulesSchema },
    personalGoals: { type: PersonalGoalsSchema },
    brokerGmtOffset: { type: Number, default: 0, min: -12, max: 14 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
AccountSchema.index({ userId: 1, isDefault: 1 });
AccountSchema.index({ userId: 1, status: 1 });

export const Account: Model<IAccount> = mongoose.model<IAccount>('Account', AccountSchema);
