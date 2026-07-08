import dayjs from 'dayjs';
import { goalRepository } from '../../repositories/goal.repository';
import { tradeRepository } from '../../repositories/trade.repository';
import { AppError } from '../../middleware/error.middleware';
import { calculateStats, calculateDisciplineScore, DisciplineInput } from '../../utils/calculations';
import { CreateGoalInput, UpdateGoalInput } from './goals.schema';
import { IGoal } from '../../models/Goal.model';
import { accountService } from '../accounts/account.service';

class GoalsService {
  async createOrUpdateGoal(userId: string, input: CreateGoalInput & { accountId?: string }): Promise<IGoal> {
    const accountId = await accountService.resolveAccountId(userId, input.accountId);
    return goalRepository.upsertGoal(userId, input.month, accountId!, { ...input, userId, accountId } as any);
  }

  async getGoal(userId: string, month: string, accountId?: string): Promise<IGoal | null> {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    return goalRepository.findByMonth(userId, month, resolvedAccountId);
  }

  async getGoalWithProgress(userId: string, month: string, accountId?: string) {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    const goal = await goalRepository.findByMonth(userId, month, resolvedAccountId);

    if (!goal) return null;

    // Get trades for that month and account
    const [year, monthNum] = month.split('-').map(Number);
    const trades = await tradeRepository.findByMonth(userId, year, monthNum, resolvedAccountId);
    const stats = calculateStats(trades);

    // Discipline score
    const disciplineInputs: DisciplineInput[] = trades.map((t) => ({
      followedPlan: t.followedPlan,
      revengeTrade: t.revengeTrade,
      overtraded: t.overtraded,
      movedSL: t.movedSL,
      riskReward: t.riskReward ?? 0,
      riskPercent: t.riskPercent,
      emotionBefore: t.emotionBefore ?? 'calm',
      mistakes: t.mistakes,
    }));

    const disciplineScore = calculateDisciplineScore(disciplineInputs);

    // Check daily loss violations
    const today = dayjs();
    const isCurrentMonth = month === today.format('YYYY-MM');

    const progress = {
      winRate: {
        target: goal.targetWinRate,
        current: stats.winRate,
        achieved: stats.winRate >= goal.targetWinRate,
        percentage: Math.min((stats.winRate / goal.targetWinRate) * 100, 100),
      },
      avgRR: {
        target: goal.targetRR,
        current: stats.avgRR,
        achieved: stats.avgRR >= goal.targetRR,
        percentage: Math.min((stats.avgRR / goal.targetRR) * 100, 100),
      },
      consistency: {
        target: goal.targetConsistency,
        current: disciplineScore,
        achieved: disciplineScore >= goal.targetConsistency,
        percentage: Math.min((disciplineScore / goal.targetConsistency) * 100, 100),
      },
      netRR: goal.targetNetRR
        ? {
            target: goal.targetNetRR,
            current: stats.netRR,
            achieved: stats.netRR >= goal.targetNetRR,
            percentage: Math.min(
              Math.max((stats.netRR / goal.targetNetRR) * 100, 0),
              100
            ),
          }
        : null,
      trades: goal.targetTrades
        ? {
            target: goal.targetTrades,
            current: stats.totalTrades,
            achieved: stats.totalTrades >= goal.targetTrades,
            percentage: Math.min((stats.totalTrades / goal.targetTrades) * 100, 100),
          }
        : null,
    };

    return { goal, progress, stats, tradeCount: trades.length };
  }

  async getRecentGoals(userId: string, accountId?: string) {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    const goals = await goalRepository.findRecentGoals(userId, resolvedAccountId, 6);

    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const withProgress = await this.getGoalWithProgress(userId, goal.month, resolvedAccountId);
        return withProgress;
      })
    );

    return goalsWithProgress.filter(Boolean);
  }

  async deleteGoal(userId: string, month: string, accountId?: string): Promise<void> {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    const goal = await goalRepository.findByMonth(userId, month, resolvedAccountId);
    if (!goal) throw new AppError('Goal not found', 404);
    if (goal.userId.toString() !== userId) throw new AppError('Not authorized', 403);
    await goalRepository.deleteById(goal._id.toString());
  }
}

export const goalsService = new GoalsService();
