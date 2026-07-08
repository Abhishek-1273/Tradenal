import dayjs from 'dayjs';
import { tradeRepository } from '../../repositories/trade.repository';
import {
  calculateStats,
  calculateDisciplineScore,
  getPairStats,
  getSessionStats,
  getSetupStats,
  DisciplineInput,
} from '../../utils/calculations';
import { accountService } from '../accounts/account.service';

class StatsService {
  // ─── Dashboard ────────────────────────────────────────────────────────────
  async getDashboard(
    userId: string,
    period: 'today' | 'week' | 'month' | 'all' = 'month',
    accountId?: string
  ) {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    const now = dayjs();
    let startDate: Date | undefined;

    switch (period) {
      case 'today':
        startDate = now.startOf('day').toDate();
        break;
      case 'week':
        startDate = now.startOf('week').toDate();
        break;
      case 'month':
        startDate = now.startOf('month').toDate();
        break;
      case 'all':
        startDate = undefined;
        break;
    }

    const trades = await tradeRepository.findForStats({
      userId,
      accountId: resolvedAccountId,
      startDate,
      endDate: now.endOf('day').toDate(),
    });

    const stats = calculateStats(trades);

    // Equity curve
    const equityCurve = await tradeRepository.getEquityCurve(
      userId,
      startDate,
      now.endOf('day').toDate(),
      resolvedAccountId
    );

    // Win/Loss breakdown for pie chart
    const winLossData = [
      { label: 'Win', value: stats.wins, color: '#22c55e' },
      { label: 'Loss', value: stats.losses, color: '#ef4444' },
      { label: 'Break Even', value: stats.breakEvens, color: '#f59e0b' },
    ].filter((d) => d.value > 0);

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
    const recentNotes = await tradeRepository.findRecentNotes(userId, resolvedAccountId, 3);

    return {
      stats,
      equityCurve,
      winLossData,
      disciplineScore,
      tradeCount: trades.length,
      accountId: resolvedAccountId,
      recentNotes,
    };
  }

  // ─── Full Analytics ───────────────────────────────────────────────────────
  async getAnalytics(
    userId: string,
    startDate?: string,
    endDate?: string,
    accountId?: string
  ) {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    const trades = await tradeRepository.findForStats({
      userId,
      accountId: resolvedAccountId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    const overall = calculateStats(trades);
    const byPair = getPairStats(trades).sort((a, b) => b.totalTrades - a.totalTrades);
    const bySession = getSessionStats(trades);
    const bySetup = getSetupStats(trades).sort((a, b) => b.totalTrades - a.totalTrades);

    // Comparative Psychology Stats
    const planFollowedTrades = trades.filter((t) => t.followedPlan);
    const planBrokenTrades = trades.filter((t) => !t.followedPlan);
    const planFollowedStats = calculateStats(planFollowedTrades);
    const planBrokenStats = calculateStats(planBrokenTrades);

    const revengeTrades = trades.filter((t) => t.revengeTrade);
    const standardTrades = trades.filter((t) => !t.revengeTrade);
    const revengeStats = calculateStats(revengeTrades);
    const standardStats = calculateStats(standardTrades);

    const psychologyComparisons = {
      planFollowed: { netRR: planFollowedStats.netRR, winRate: planFollowedStats.winRate, trades: planFollowedStats.totalTrades, netPnL: planFollowedStats.netPnL },
      planBroken: { netRR: planBrokenStats.netRR, winRate: planBrokenStats.winRate, trades: planBrokenStats.totalTrades, netPnL: planBrokenStats.netPnL },
      revenge: { netRR: revengeStats.netRR, winRate: revengeStats.winRate, trades: revengeStats.totalTrades, netPnL: revengeStats.netPnL },
      standard: { netRR: standardStats.netRR, winRate: standardStats.winRate, trades: standardStats.totalTrades, netPnL: standardStats.netPnL },
    };

    // Psychology breakdown
    const emotionBreakdown = this.getEmotionBreakdown(trades);
    const mistakesBreakdown = this.getMistakesBreakdown(trades);

    // Monthly performance
    const monthlyPerformance = await this.getMonthlyPerformance(userId, resolvedAccountId);

    // Weekly performance
    const weeklyPerformance = await this.getWeeklyPerformance(userId, resolvedAccountId);

    // Best/worst pair
    const sortedByWinRate = [...byPair].filter((p) => p.totalTrades >= 3);
    const bestPair = sortedByWinRate.sort((a, b) => b.winRate - a.winRate)[0];
    const worstPair = sortedByWinRate.sort((a, b) => a.winRate - b.winRate)[0];

    // Most profitable setup
    const sortedByNetRR = [...bySetup].filter((s) => s.totalTrades >= 2);
    const bestSetup = sortedByNetRR.sort((a, b) => b.netRR - a.netRR)[0];

    // Best session
    const bestSession = [...bySession]
      .filter((s) => s.totalTrades > 0)
      .sort((a, b) => b.winRate - a.winRate)[0];

    // Most common mistake
    const allMistakes = trades.flatMap((t) => t.mistakes);
    const mistakeCounts: Record<string, number> = {};
    allMistakes.forEach((m) => { mistakeCounts[m] = (mistakeCounts[m] || 0) + 1; });
    const mostCommonMistake = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0];

    // Discipline score history (last 30 days)
    const disciplineHistory = await this.getDisciplineHistory(userId, resolvedAccountId);

    return {
      overall,
      byPair,
      bySession,
      bySetup,
      emotionBreakdown,
      mistakesBreakdown,
      monthlyPerformance,
      weeklyPerformance,
      bestPair: bestPair?.pair,
      worstPair: worstPair?.pair,
      bestSetup: bestSetup?.setup,
      bestSession: bestSession?.session,
      mostCommonMistake: mostCommonMistake?.[0],
      disciplineHistory,
      psychologyComparisons,
    };
  }

  // ─── Calendar Data ─────────────────────────────────────────────────────────
  async getCalendar(userId: string, year: number, month: number, accountId?: string) {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    const calendarData = await tradeRepository.getCalendarData(userId, year, month, resolvedAccountId);

    // Get trades for each day that has trades
    const result = {
      calendar: calendarData,
      month: `${year}-${String(month).padStart(2, '0')}`,
    };

    return result;
  }

  async getCalendarDay(userId: string, date: string, accountId?: string) {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    const trades = await tradeRepository.findByDate(userId, new Date(date), resolvedAccountId);
    const stats = calculateStats(trades);
    return { date, trades, stats };
  }

  // ─── Discipline Score ─────────────────────────────────────────────────────
  async getDisciplineScore(
    userId: string,
    period: 'week' | 'month' | 'all' = 'month',
    accountId?: string
  ) {
    const resolvedAccountId = await accountService.resolveAccountId(userId, accountId);
    const now = dayjs();
    let startDate: Date | undefined;

    switch (period) {
      case 'week':
        startDate = now.startOf('week').toDate();
        break;
      case 'month':
        startDate = now.startOf('month').toDate();
        break;
    }

    const trades = await tradeRepository.findForStats({ userId, accountId: resolvedAccountId, startDate });

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

    const score = calculateDisciplineScore(disciplineInputs);
    const history = await this.getDisciplineHistory(userId, resolvedAccountId);

    // Breakdown by category
    const planFollowedRate = trades.length
      ? (trades.filter((t) => t.followedPlan).length / trades.length) * 100
      : 0;
    const noRevengeRate = trades.length
      ? (trades.filter((t) => !t.revengeTrade).length / trades.length) * 100
      : 0;
    const noOvertradingRate = trades.length
      ? (trades.filter((t) => !t.overtraded).length / trades.length) * 100
      : 0;
    const noMovedSLRate = trades.length
      ? (trades.filter((t) => !t.movedSL).length / trades.length) * 100
      : 0;

    return {
      score,
      history,
      breakdown: {
        planFollowed: Math.round(planFollowedRate),
        noRevengeTrade: Math.round(noRevengeRate),
        noOvertrading: Math.round(noOvertradingRate),
        noMovedSL: Math.round(noMovedSLRate),
      },
      tradeCount: trades.length,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────
  private getEmotionBreakdown(trades: any[]) {
    const emotions: Record<string, { count: number; wins: number; losses: number }> = {};

    trades.forEach((t) => {
      if (!t.emotionBefore) return;
      if (!emotions[t.emotionBefore]) {
        emotions[t.emotionBefore] = { count: 0, wins: 0, losses: 0 };
      }
      emotions[t.emotionBefore].count++;
      if (t.result === 'win' || t.result === 'partialWin') emotions[t.emotionBefore].wins++;
      if (t.result === 'loss') emotions[t.emotionBefore].losses++;
    });

    return Object.entries(emotions).map(([emotion, data]) => ({
      emotion,
      ...data,
      winRate: data.count ? parseFloat(((data.wins / data.count) * 100).toFixed(1)) : 0,
    }));
  }

  private getMistakesBreakdown(trades: any[]) {
    const mistakes: Record<string, number> = {};
    trades.forEach((t) => {
      t.mistakes?.forEach((m: string) => {
        mistakes[m] = (mistakes[m] || 0) + 1;
      });
    });

    return Object.entries(mistakes)
      .map(([mistake, count]) => ({ mistake, count }))
      .sort((a, b) => b.count - a.count);
  }

  private async getMonthlyPerformance(userId: string, accountId?: string) {
    const months = [];
    const dateLimit = dayjs().subtract(5, 'month').startOf('month').toDate();

    const trades = await tradeRepository.findForStats({
      userId,
      accountId,
      startDate: dateLimit,
      endDate: dayjs().endOf('day').toDate(),
    });

    for (let i = 5; i >= 0; i--) {
      const date = dayjs().subtract(i, 'month');
      const start = date.startOf('month');
      const end = date.endOf('month');

      const monthTrades = trades.filter((t) => {
        const tDate = dayjs(t.tradeDate);
        return (tDate.isAfter(start) || tDate.isSame(start)) && (tDate.isBefore(end) || tDate.isSame(end));
      });
      const stats = calculateStats(monthTrades);

      months.push({
        month: date.format('MMM YYYY'),
        monthKey: date.format('YYYY-MM'),
        netRR: stats.netRR,
        winRate: stats.winRate,
        trades: stats.totalTrades,
      });
    }
    return months;
  }

  private async getWeeklyPerformance(userId: string, accountId?: string) {
    const weeks = [];
    const dateLimit = dayjs().subtract(7, 'week').startOf('week').toDate();

    const trades = await tradeRepository.findForStats({
      userId,
      accountId,
      startDate: dateLimit,
      endDate: dayjs().endOf('day').toDate(),
    });

    for (let i = 7; i >= 0; i--) {
      const date = dayjs().subtract(i, 'week');
      const start = date.startOf('week');
      const end = date.endOf('week');

      const weekTrades = trades.filter((t) => {
        const tDate = dayjs(t.tradeDate);
        return (tDate.isAfter(start) || tDate.isSame(start)) && (tDate.isBefore(end) || tDate.isSame(end));
      });
      const stats = calculateStats(weekTrades);

      weeks.push({
        week: `W${date.week()} ${date.format('MMM')}`,
        start: date.startOf('week').format('YYYY-MM-DD'),
        netRR: stats.netRR,
        winRate: stats.winRate,
        trades: stats.totalTrades,
      });
    }
    return weeks;
  }

  private async getDisciplineHistory(userId: string, accountId?: string) {
    const days = [];
    const dateLimit = dayjs().subtract(29, 'day').startOf('day').toDate();

    const trades = await tradeRepository.findForStats({
      userId,
      accountId,
      startDate: dateLimit,
      endDate: dayjs().endOf('day').toDate(),
    });

    for (let i = 29; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const start = date.startOf('day');
      const end = date.endOf('day');

      const dayTrades = trades.filter((t) => {
        const tDate = dayjs(t.tradeDate);
        return (tDate.isAfter(start) || tDate.isSame(start)) && (tDate.isBefore(end) || tDate.isSame(end));
      });

      if (dayTrades.length === 0) continue;

      const disciplineInputs: DisciplineInput[] = dayTrades.map((t) => ({
        followedPlan: t.followedPlan,
        revengeTrade: t.revengeTrade,
        overtraded: t.overtraded,
        movedSL: t.movedSL,
        riskReward: t.riskReward ?? 0,
        riskPercent: t.riskPercent,
        emotionBefore: t.emotionBefore ?? 'calm',
        mistakes: t.mistakes,
      }));

      days.push({
        date: date.format('YYYY-MM-DD'),
        score: calculateDisciplineScore(disciplineInputs),
        trades: dayTrades.length,
      });
    }
    return days;
  }
}

export const statsService = new StatsService();
