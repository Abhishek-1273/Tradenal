import { Goal, IGoal } from '../models/Goal.model';
import { BaseRepository } from './base.repository';

export class GoalRepository extends BaseRepository<IGoal> {
  constructor() {
    super(Goal);
  }

  async findByMonth(userId: string, month: string, accountId?: string): Promise<IGoal | null> {
    const filter: Record<string, any> = { userId, month };
    if (accountId) filter.accountId = accountId;
    return Goal.findOne(filter).exec();
  }

  async findRecentGoals(userId: string, accountId?: string, limit = 6): Promise<IGoal[]> {
    const filter: Record<string, any> = { userId };
    if (accountId) filter.accountId = accountId;
    return Goal.find(filter).sort({ month: -1 }).limit(limit).exec();
  }

  async upsertGoal(userId: string, month: string, accountId: string, data: Partial<IGoal>): Promise<IGoal> {
    return Goal.findOneAndUpdate(
      { userId, accountId, month },
      { ...data, userId, accountId, month },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).exec() as Promise<IGoal>;
  }
}

export const goalRepository = new GoalRepository();
