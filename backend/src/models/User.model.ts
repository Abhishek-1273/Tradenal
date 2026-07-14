import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserSettings {
  theme: 'dark' | 'light';
  currency: string;
  defaultRisk: number;
  defaultRR: number;
  timezone: string;
  brokerGmtOffset: number;
  notifications: {
    dailyReminder: boolean;
    weeklyReview: boolean;
    monthlyReview: boolean;
    reminderTime: string;
  };
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  settings: IUserSettings;
  refreshTokens: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): Omit<IUser, 'password' | 'refreshTokens' | 'passwordResetToken' | 'passwordResetExpires'>;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    currency: { type: String, default: 'USD' },
    defaultRisk: { type: Number, default: 1, min: 0.1, max: 10 },
    defaultRR: { type: Number, default: 2, min: 0.5, max: 20 },
    timezone: { type: String, default: 'UTC' },
    brokerGmtOffset: { type: Number, default: 0, min: -12, max: 14 },
    notifications: {
      dailyReminder: { type: Boolean, default: true },
      weeklyReview: { type: Boolean, default: true },
      monthlyReview: { type: Boolean, default: true },
      reminderTime: { type: String, default: '20:00' },
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    avatar: {
      type: String,
    },
    settings: {
      type: UserSettingsSchema,
      default: () => ({}),
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return user without sensitive fields
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
