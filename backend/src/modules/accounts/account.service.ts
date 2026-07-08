import mongoose from 'mongoose';
import { accountRepository } from '../../repositories/account.repository';
import { AppError } from '../../middleware/error.middleware';
import { IAccount } from '../../models/Account.model';
import { CreateAccountInput, UpdateAccountInput } from './account.schema';

class AccountService {
  // ─── Create Account ────────────────────────────────────────────────────────
  async createAccount(userId: string, input: CreateAccountInput): Promise<IAccount> {
    const existingCount = await accountRepository.countByUserId(userId);
    const isFirstAccount = existingCount === 0;

    const account = await accountRepository.create({
      ...input,
      userId: userId as unknown as mongoose.Types.ObjectId,
      isDefault: isFirstAccount, // first account is automatically default
    } as Partial<IAccount>);

    const derived = await this.deriveCurrentBalances(userId, [account]);
    return derived[0];
  }

  // ─── Get All Accounts for User ─────────────────────────────────────────────
  async getAccounts(userId: string): Promise<IAccount[]> {
    const accounts = await accountRepository.findByUserId(userId);
    return this.deriveCurrentBalances(userId, accounts);
  }

  // ─── Get Single Account ────────────────────────────────────────────────────
  async getAccountById(userId: string, accountId: string): Promise<IAccount> {
    const account = await accountRepository.findByIdAndUserId(accountId, userId);
    if (!account) throw new AppError('Account not found', 404);
    const derived = await this.deriveCurrentBalances(userId, [account]);
    return derived[0];
  }

  // ─── Get Default Account ───────────────────────────────────────────────────
  async getDefaultAccount(userId: string): Promise<IAccount | null> {
    const account = await accountRepository.findDefaultAccount(userId);
    if (!account) return null;
    const derived = await this.deriveCurrentBalances(userId, [account]);
    return derived[0];
  }

  // ─── Update Account ────────────────────────────────────────────────────────
  async updateAccount(
    userId: string,
    accountId: string,
    input: UpdateAccountInput
  ): Promise<IAccount> {
    const account = await accountRepository.findByIdAndUserId(accountId, userId);
    if (!account) throw new AppError('Account not found', 404);

    const updated = await accountRepository.updateById(accountId, { $set: input });
    if (!updated) throw new AppError('Account not found', 404);
    const derived = await this.deriveCurrentBalances(userId, [updated]);
    return derived[0];
  }

  // ─── Set Default Account ───────────────────────────────────────────────────
  async setDefaultAccount(userId: string, accountId: string): Promise<IAccount> {
    const account = await accountRepository.findByIdAndUserId(accountId, userId);
    if (!account) throw new AppError('Account not found', 404);

    const updated = await accountRepository.setDefault(accountId, userId);
    if (!updated) throw new AppError('Failed to set default account', 500);
    const derived = await this.deriveCurrentBalances(userId, [updated]);
    return derived[0];
  }

  // ─── Delete Account ────────────────────────────────────────────────────────
  async deleteAccount(userId: string, accountId: string): Promise<void> {
    const account = await accountRepository.findByIdAndUserId(accountId, userId);
    if (!account) throw new AppError('Account not found', 404);

    if (account.isDefault) {
      throw new AppError(
        'Cannot delete the default account. Set another account as default first.',
        400
      );
    }

    await accountRepository.deleteById(accountId);
  }

  // ─── Resolve Active Account ─────────────────────────────────────────────────
  // Used by controllers to get the accountId to filter data by.
  // If a specific accountId is provided (from query param), validate it belongs
  // to the user. Otherwise fall back to the user's default account.
  async resolveAccountId(userId: string, requestedAccountId?: string): Promise<string | undefined> {
    if (requestedAccountId) {
      const account = await accountRepository.findByIdAndUserId(requestedAccountId, userId);
      if (!account) throw new AppError('Account not found', 404);
      return requestedAccountId;
    }

    // Fall back to default account
    const defaultAccount = await accountRepository.findDefaultAccount(userId);
    return defaultAccount?._id.toString();
  }

  // ─── Private Balance Derivation Helper ──────────────────────────────────────
  private async deriveCurrentBalances(userId: string, accounts: IAccount[]): Promise<IAccount[]> {
    if (accounts.length === 0) return [];

    const accountIds = accounts.map((a) => a._id);
    const pnlSums = await mongoose.model('Trade').aggregate([
      { $match: { accountId: { $in: accountIds } } },
      { $group: { _id: '$accountId', totalPnL: { $sum: '$pnlAmount' } } },
    ]);

    const pnlMap = new Map<string, number>();
    pnlSums.forEach((s) => {
      pnlMap.set(s._id.toString(), s.totalPnL || 0);
    });

    return accounts.map((acc) => {
      const pnlSum = pnlMap.get(acc._id.toString()) || 0;
      const accountObj = acc.toObject();
      accountObj.currentBalance = parseFloat((acc.startingBalance + pnlSum).toFixed(2));
      return accountObj as unknown as IAccount;
    });
  }
}

export const accountService = new AccountService();
