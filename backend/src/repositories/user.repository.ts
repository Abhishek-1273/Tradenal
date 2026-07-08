import { User, IUser } from '../models/User.model';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async findByEmailWithTokens(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() })
      .select('+password +refreshTokens')
      .exec();
  }

  async findByIdWithTokens(id: string): Promise<IUser | null> {
    return User.findById(id).select('+refreshTokens').exec();
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    })
      .select('+passwordResetToken +passwordResetExpires')
      .exec();
  }

  async addRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $push: { refreshTokens: token },
      lastLoginAt: new Date(),
    }).exec();
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: token },
    }).exec();
  }

  async removeAllRefreshTokens(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    }).exec();
  }

  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
    }).exec();
  }

  async deactivateAccount(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      isActive: false,
      $set: { refreshTokens: [] },
    }).exec();
  }
}

export const userRepository = new UserRepository();
