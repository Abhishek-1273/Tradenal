import mongoose from 'mongoose';
import { Account, IAccount } from '../models/Account.model';
import { BaseRepository } from './base.repository';

export class AccountRepository extends BaseRepository<IAccount> {
  constructor() {
    super(Account);
  }

  async findByUserId(userId: string): Promise<IAccount[]> {
    return Account.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: 1 })
      .exec();
  }

  async findDefaultAccount(userId: string): Promise<IAccount | null> {
    return Account.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      isDefault: true,
    }).exec();
  }

  async findByIdAndUserId(accountId: string, userId: string): Promise<IAccount | null> {
    return Account.findOne({
      _id: new mongoose.Types.ObjectId(accountId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();
  }

  /**
   * Ensures only ONE default account per user.
   * Clears isDefault on all other accounts before setting the new one.
   */
  async setDefault(accountId: string, userId: string): Promise<IAccount | null> {
    // Unset all existing defaults for this user
    await Account.updateMany(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: { isDefault: false } }
    ).exec();

    // Set the new default
    return Account.findByIdAndUpdate(
      accountId,
      { $set: { isDefault: true } },
      { new: true }
    ).exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return Account.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();
  }
}

export const accountRepository = new AccountRepository();
