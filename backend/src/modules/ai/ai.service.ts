import OpenAI from 'openai';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { env } from '../../config/env';
import { tradeRepository } from '../../repositories/trade.repository';
import { Review, IReview } from '../../models/Review.model';
import { Account } from '../../models/Account.model';
import { AppError } from '../../middleware/error.middleware';
import {
  calculateStats, calculateDisciplineScore, getPairStats,
  getSessionStats, getSetupStats, DisciplineInput,
} from '../../utils/calculations';
import { logger } from '../../utils/logger';
import mongoose from 'mongoose';
import { ITrade, Trade } from '../../models/Trade.model';

dayjs.extend(weekOfYear);

const openai = env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    })
  : null;

export interface TradePattern {
  type: string;
  description: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  suggestion: string;
}

export const detectTradePatterns = (trades: ITrade[]): TradePattern[] => {
  const patterns: TradePattern[] = [];
  if (trades.length < 3) return patterns;

  let revengeCount = 0;
  for (let i = 1; i < trades.length; i++) {
    if (trades[i - 1].result === 'loss' && trades[i].revengeTrade) revengeCount++;
  }
  if (revengeCount > 0) {
    patterns.push({
      type: 'Revenge Trading',
      description: `Detected ${revengeCount} instance${revengeCount > 1 ? 's' : ''} of trading immediately after a loss`,
      frequency: revengeCount, impact: 'negative',
      suggestion: 'Implement a mandatory 30-minute break rule after any losing trade before re-entering.',
    });
  }

  const tradeDays: Record<string, number> = {};
  trades.forEach((t) => {
    const day = dayjs(t.tradeDate).format('YYYY-MM-DD');
    tradeDays[day] = (tradeDays[day] || 0) + 1;
  });
  const overtradeDays = Object.values(tradeDays).filter((c) => c > 3).length;
  if (overtradeDays > 0) {
    patterns.push({
      type: 'Overtrading',
      description: `Found ${overtradeDays} day${overtradeDays > 1 ? 's' : ''} with more than 3 trades`,
      frequency: overtradeDays, impact: 'negative',
      suggestion: 'Hard limit: 3 trades per day maximum. Wait for A+ setups only.',
    });
  }

  const slMovers = trades.filter((t) => t.movedSL);
  if (slMovers.length > 0) {
    const slMoverWR = slMovers.filter((t) => t.result === 'win' || t.result === 'partialWin').length / slMovers.length;
    patterns.push({
      type: 'Stop Loss Movement',
      description: `SL moved ${slMovers.length} times (${(slMoverWR * 100).toFixed(0)}% win rate on those trades)`,
      frequency: slMovers.length, impact: slMoverWR > 0.5 ? 'neutral' : 'negative',
      suggestion: 'Trust your initial stop. Moving SL wider increases risk beyond your plan.',
    });
  }

  const emotionalTrades = trades.filter((t) => t.emotionBefore && ['fomo','fear','greedy'].includes(t.emotionBefore));
  if (emotionalTrades.length >= 2) {
    const eWR = emotionalTrades.filter((t) => t.result === 'win' || t.result === 'partialWin').length / emotionalTrades.length;
    const allWR = trades.filter((t) => t.result === 'win' || t.result === 'partialWin').length / trades.length;
    if (eWR < allWR - 0.1) {
      patterns.push({
        type: 'Emotional Trading Underperformance',
        description: `Win rate drops from ${(allWR*100).toFixed(0)}% to ${(eWR*100).toFixed(0)}% when trading with fear/FOMO/greed`,
        frequency: emotionalTrades.length, impact: 'negative',
        suggestion: 'Only trade when calm or confident. Build a pre-trade checklist that includes an emotional state check.',
      });
    }
  }

  const earlyExits = trades.filter((t) => t.mistakes.includes('closedEarly'));
  if (earlyExits.length >= 2) {
    patterns.push({
      type: 'Premature Exit',
      description: `Closed ${earlyExits.length} trades before hitting take profit`,
      frequency: earlyExits.length, impact: 'negative',
      suggestion: 'Once in profit, move SL to breakeven and let the trade run. Use partials to manage anxiety.',
    });
  }

  const sessionStats = getSessionStats(trades);
  const bestSession = sessionStats.filter((s) => s.totalTrades >= 3).sort((a,b) => b.winRate - a.winRate)[0];
  if (bestSession) {
    patterns.push({
      type: 'Peak Performance Session',
      description: `${bestSession.session.charAt(0).toUpperCase() + bestSession.session.slice(1)} session: ${bestSession.winRate.toFixed(0)}% WR across ${bestSession.totalTrades} trades`,
      frequency: bestSession.totalTrades, impact: 'positive',
      suggestion: `Focus your energy on the ${bestSession.session} session. Reduce or eliminate trades in other sessions.`,
    });
  }

  const setupStats = getSetupStats(trades);
  const bestSetup = setupStats.filter((s) => s.totalTrades >= 2).sort((a,b) => b.netRR - a.netRR)[0];
  if (bestSetup) {
    patterns.push({
      type: 'Most Profitable Setup',
      description: `${bestSetup.setup} generates ${bestSetup.netRR.toFixed(2)}R net across ${bestSetup.totalTrades} trades`,
      frequency: bestSetup.totalTrades, impact: 'positive',
      suggestion: `Prioritise ${bestSetup.setup} setups. Document precise entry criteria for this pattern.`,
    });
  }

  const lowRR = trades.filter((t) => (t.riskReward ?? 0) < 1);
  if (lowRR.length > trades.length * 0.3) {
    patterns.push({
      type: 'Poor RR Selection',
      description: `${lowRR.length} trades (${((lowRR.length/trades.length)*100).toFixed(0)}%) had RR below 1:1`,
      frequency: lowRR.length, impact: 'negative',
      suggestion: 'Enforce a minimum 1.5:1 RR before entry. If not available, skip the trade.',
    });
  }

  return patterns;
};

class AIService {
  async generateWeeklyReview(userId: string, accountId?: string, rules?: any[]): Promise<IReview> {
    let weekStart = dayjs().startOf('week').toDate();
    let weekEnd = dayjs().endOf('week').toDate();
    let trades = await tradeRepository.findByWeek(userId, weekStart, accountId);

    // If current week has no trades, find the latest week with trades!
    if (trades.length === 0) {
      const userObjId = new mongoose.Types.ObjectId(userId);
      const query: Record<string, any> = { userId: userObjId };
      if (accountId) query.accountId = new mongoose.Types.ObjectId(accountId);

      const latestTrade = await Trade.findOne(query).sort({ tradeDate: -1 }).lean<ITrade>().exec();
      if (!latestTrade || !latestTrade.tradeDate) {
        throw new AppError('No trades found to review. Log some trades first!', 400);
      }

      weekStart = dayjs(latestTrade.tradeDate).startOf('week').toDate();
      weekEnd = dayjs(latestTrade.tradeDate).endOf('week').toDate();
      trades = await tradeRepository.findByWeek(userId, weekStart, accountId);

      if (trades.length === 0) {
        // Fallback: take latest 25 trades
        trades = await Trade.find(query).sort({ tradeDate: -1 }).limit(25).lean<ITrade[]>().exec();
      }
    }

    if (trades.length === 0) throw new AppError('No trades found to review', 400);
    const label = `Week ${dayjs(weekStart).week()}, ${dayjs(weekStart).year()}`;
    return this.generateReview(userId, trades, 'weekly', weekStart, weekEnd, label, accountId, rules);
  }

  async generateMonthlyReview(userId: string, accountId?: string, rules?: any[]): Promise<IReview> {
    let now = dayjs();
    let monthStart = now.startOf('month').toDate();
    let monthEnd = now.endOf('month').toDate();
    let trades = await tradeRepository.findByMonth(userId, now.year(), now.month() + 1, accountId);

    // If current month has no trades, find latest month with trades!
    if (trades.length === 0) {
      const userObjId = new mongoose.Types.ObjectId(userId);
      const query: Record<string, any> = { userId: userObjId };
      if (accountId) query.accountId = new mongoose.Types.ObjectId(accountId);

      const latestTrade = await Trade.findOne(query).sort({ tradeDate: -1 }).lean<ITrade>().exec();
      if (!latestTrade || !latestTrade.tradeDate) {
        throw new AppError('No trades found to review. Log some trades first!', 400);
      }

      now = dayjs(latestTrade.tradeDate);
      monthStart = now.startOf('month').toDate();
      monthEnd = now.endOf('month').toDate();
      trades = await tradeRepository.findByMonth(userId, now.year(), now.month() + 1, accountId);

      if (trades.length === 0) {
        trades = await Trade.find(query).sort({ tradeDate: -1 }).limit(35).lean<ITrade[]>().exec();
      }
    }

    if (trades.length === 0) throw new AppError('No trades found to review', 400);
    const label = now.format('MMMM YYYY');
    return this.generateReview(userId, trades, 'monthly', monthStart, monthEnd, label, accountId, rules);
  }

  async getPatterns(userId: string, days = 30, accountId?: string): Promise<TradePattern[]> {
    const startDate = dayjs().subtract(days, 'day').toDate();
    const trades = await tradeRepository.findForStats({ userId, startDate, accountId });
    return detectTradePatterns(trades);
  }

  async getReviews(userId: string, type: 'weekly' | 'monthly', limit = 10, accountId?: string): Promise<IReview[]> {
    const query: Record<string, any> = { userId, type };
    if (accountId) query.accountId = accountId;
    return Review.find(query).sort({ 'period.start': -1 }).limit(limit).exec();
  }

  async getLatestReview(userId: string, type: 'weekly' | 'monthly', accountId?: string): Promise<IReview | null> {
    const query: Record<string, any> = { userId, type };
    if (accountId) query.accountId = accountId;
    return Review.findOne(query).sort({ 'period.start': -1 }).exec();
  }

  private async generateReview(
    userId: string, trades: ITrade[], type: 'weekly' | 'monthly',
    periodStart: Date, periodEnd: Date, label: string, accountId?: string, rules?: any[]
  ): Promise<IReview> {
    const stats = calculateStats(trades);
    const patterns = detectTradePatterns(trades);
    const pairStats = getPairStats(trades);
    const sessionStats = getSessionStats(trades);

    const disciplineInputs: DisciplineInput[] = trades.map((t) => ({
      followedPlan: t.followedPlan, revengeTrade: t.revengeTrade, overtraded: t.overtraded,
      movedSL: t.movedSL, riskReward: t.riskReward ?? 0, riskPercent: t.riskPercent,
      emotionBefore: t.emotionBefore ?? 'calm', mistakes: t.mistakes,
    }));
    const disciplineScore = calculateDisciplineScore(disciplineInputs);

    // Compute execution metrics for exact rule checking
    const dailyCounts: Record<string, number> = {};
    let maxDailyTrades = 0;
    let revengeCount = 0;
    let movedSLCount = 0;
    let planBreaches = 0;
    let maxConsecutiveLosses = 0;
    let curLossStreak = 0;
    let outsideEntryTrades = 0;

    trades.forEach((t) => {
      const day = dayjs(t.tradeDate).format('YYYY-MM-DD');
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      if (dailyCounts[day] > maxDailyTrades) maxDailyTrades = dailyCounts[day];

      if (t.revengeTrade) revengeCount++;
      if (t.movedSL) movedSLCount++;
      if (t.followedPlan === false) planBreaches++;

      // Session timing rule: entries only allowed in London or New York sessions (closing has no rule)
      if (t.session && !['london', 'newyork'].includes(t.session.toLowerCase())) {
        outsideEntryTrades++;
      }

      if (t.result === 'loss') {
        curLossStreak++;
        if (curLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = curLossStreak;
      } else if (t.result === 'win') {
        curLossStreak = 0;
      }
    });

    const overtradeDays = Object.entries(dailyCounts)
      .filter(([_, c]) => c > 2)
      .map(([d, c]) => `${d} (${c} trades)`);

    const executionStats = {
      maxDailyTrades,
      overtradeDays,
      revengeTrades: revengeCount,
      movedStopLosses: movedSLCount,
      planDeviations: planBreaches,
      maxConsecutiveLosses,
      outsideEntryTrades,
    };

    // Fetch account details if available for context
    let accountContext: Record<string, unknown> | null = null;
    if (accountId) {
      try {
        const acc = await Account.findById(accountId).lean();
        if (acc) {
          accountContext = {
            name: acc.name,
            accountType: acc.accountType,
            currency: acc.currency,
            startingBalance: acc.startingBalance,
            currentBalance: acc.currentBalance ?? acc.startingBalance,
            targets: acc.propFirmRules || acc.personalGoals || null,
          };
        }
      } catch (e) { /* ignore */ }
    }

    const setupStats = getSetupStats(trades);
    const setupBreakdown = setupStats
      .filter((s) => s.totalTrades > 0)
      .slice(0, 6)
      .map((s) => ({
        setup: s.setup,
        trades: s.totalTrades,
        winRate: `${s.winRate.toFixed(0)}%`,
        netRR: `${s.netRR >= 0 ? '+' : ''}${s.netRR.toFixed(2)}R`,
      }));

    // Plan adherence vs breach comparisons
    const followedTrades = trades.filter((t) => t.followedPlan);
    const brokenTrades = trades.filter((t) => !t.followedPlan);
    const followedWR = followedTrades.length > 0 ? (followedTrades.filter((t) => t.result === 'win').length / followedTrades.length) * 100 : 0;
    const brokenWR = brokenTrades.length > 0 ? (brokenTrades.filter((t) => t.result === 'win').length / brokenTrades.length) * 100 : 0;

    const psychologyMetrics = {
      planFollowedWinRate: `${followedWR.toFixed(0)}% (${followedTrades.length} trades)`,
      planBrokenWinRate: `${brokenWR.toFixed(0)}% (${brokenTrades.length} trades)`,
      revengeTradeCount: revengeCount,
      movedSLCount: movedSLCount,
    };

    const defaultRules = [
      { title: 'Strict "Max 2 Trades"', description: 'Max 2 trades per day. Close terminal once limit is reached.', category: 'risk' },
      { title: 'Max 1% Daily Risk', description: 'Strict 1% daily risk cap. Pre-calculate lot size before entry.', category: 'risk' },
      { title: 'Minimum 1:2 to 1:3 RR', description: 'Minimum 1:2 room required. Protect capital first.', category: 'setup' },
      { title: 'No Revenge Trading', description: 'Mandatory 30-min break after loss.', category: 'psychology' },
      { title: 'No Widening Stop-Loss', description: 'Never move SL further away.', category: 'risk' },
    ];

    const userRules = (rules && rules.length > 0)
      ? rules.map((r: any) => ({
          title: r.title || r.name || String(r),
          description: r.description || undefined,
          category: r.category || undefined,
          isActive: r.isActive !== false,
        }))
      : defaultRules.map((r) => ({ ...r, isActive: true }));

    const promptData = {
      period: label,
      type,
      accountContext,
      rules: userRules,
      executionStats,
      psychologyMetrics,
      setupBreakdown,
      stats: {
        totalTrades: stats.totalTrades,
        winRate: `${stats.winRate.toFixed(1)}%`,
        avgRR: stats.avgRR.toFixed(2),
        netRR: `${stats.netRR >= 0 ? '+' : ''}${stats.netRR.toFixed(2)}R`,
        profitFactor: stats.profitFactor.toFixed(2),
        expectancy: stats.expectancy.toFixed(2),
        longestWinStreak: stats.longestWinStreak,
        longestLossStreak: stats.longestLossStreak,
        disciplineScore,
      },
      patterns: patterns.map((p) => `${p.type}: ${p.description} (Action: ${p.suggestion})`),
      topPairs: pairStats.slice(0, 5).map((p) => ({ pair: p.pair, trades: p.totalTrades, winRate: `${p.winRate.toFixed(0)}%`, netRR: `${p.netRR >= 0 ? '+' : ''}${p.netRR.toFixed(2)}R` })),
      sessionBreakdown: sessionStats.filter((s) => s.totalTrades > 0).map((s) => ({ session: s.session, trades: s.totalTrades, winRate: `${s.winRate.toFixed(0)}%`, netRR: `${s.netRR >= 0 ? '+' : ''}${s.netRR.toFixed(2)}R` })),
      tradesSummary: trades.slice(0, 35).map((t) => ({
        date: dayjs(t.tradeDate).format('YYYY-MM-DD'),
        pair: t.pair,
        type: t.tradeType,
        session: t.session,
        result: t.result,
        rr: t.riskReward,
        rMult: t.rMultiple,
        pnl: t.pnl,
        planFollowed: t.followedPlan,
        revenge: t.revengeTrade,
        movedSL: t.movedSL,
        setup: t.setup || undefined,
        emotion: t.emotionBefore || t.emotionDuring || t.emotionAfter || undefined,
        mistakes: t.mistakes?.join(', ') || 'none',
        notes: t.notes ? t.notes.slice(0, 100) : undefined,
      })),
    };

    let content: Record<string, unknown>;
    if (!openai) {
      logger.warn('OpenAI not configured — using rule-based review');
      content = this.generateRuleBasedReview(promptData, stats, disciplineScore, patterns, userRules, executionStats);
    } else {
      content = await this.callOpenAI(promptData);
    }

    const query: Record<string, any> = { userId, type, 'period.start': periodStart };
    if (accountId) query.accountId = accountId;

    const review = await Review.findOneAndUpdate(
      query,
      {
        userId,
        accountId,
        type,
        period: { start: periodStart, end: periodEnd, label },
        content,
        metrics: { tradeCount: stats.totalTrades, winRate: stats.winRate, netRR: stats.netRR, profitFactor: stats.profitFactor, disciplineScore, avgRR: stats.avgRR },
        tradeIds: trades.map((t) => t._id),
        generatedAt: new Date(),
      },
      { new: true, upsert: true }
    );
    return review!;
  }

  private async callOpenAI(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const systemPrompt = `You are an elite, institutional prop firm risk manager and trading performance auditor.
Your job: Analyze the trader's actual trade log, execution stats, and defined trading rules.
Tone: Direct, authoritative, data-dense, zero fluff, zero generic platitudes.
Rules of Engagement:
1. Every bullet point MUST be short (under 18 words), punchy, and cite specific data (dates, pairs, trade count, sessions, setups, or rule names).
2. Do NOT give vague advice like "be patient" or "discipline is important".
3. Evaluate EVERY rule in USER TRADING RULES in the "ruleAdherence" array:
   - If a rule has isActive: false, mark status as "Not Tested" and verdict as "Rule is currently paused in settings."
   - For timing/session rules (e.g. London & NY Sessions): Note that this rule STRICTLY restricts only taking NEW TRADE ENTRIES. There is NO rule/restriction on closing or holding time.
   - If an active rule was broken, mark status as "Violated" with a 1-sentence data-backed verdict citing exact trades.
   - If an active rule was respected, mark status as "Followed" with a 1-sentence data-backed verdict.
4. Output ONLY valid JSON matching the exact schema requested.`;

    const userPrompt = `${data.type?.toString().toUpperCase()} TRADING PERFORMANCE AUDIT (${data.period})

USER DEFINED TRADING RULES:
${JSON.stringify(data.rules, null, 2)}

ACCOUNT CONTEXT & TARGETS:
${JSON.stringify(data.accountContext, null, 2)}

OBJECTIVE EXECUTION STATS:
${JSON.stringify((data as any).executionStats, null, 2)}

DISCIPLINE & PSYCHOLOGY METRICS:
${JSON.stringify((data as any).psychologyMetrics, null, 2)}

SETUP PLAYBOOK PERFORMANCE:
${JSON.stringify((data as any).setupBreakdown, null, 2)}

PERFORMANCE METRICS:
${JSON.stringify(data.stats, null, 2)}

BEHAVIORAL PATTERNS DETECTED:
${JSON.stringify(data.patterns, null, 2)}

ASSET PERFORMANCE:
${JSON.stringify(data.topPairs, null, 2)}

SESSION PERFORMANCE:
${JSON.stringify(data.sessionBreakdown, null, 2)}

TRADE LOG SAMPLE (WITH EMOTIONS, MISTAKES, SETUPS & NOTES):
${JSON.stringify(data.tradesSummary, null, 2)}

Return ONLY raw JSON with this exact schema (no markdown, no backticks):
{
  "summary": "2 crisp sentences: net results, rule adherence rate, and the primary driver of P&L.",
  "ruleAdherence": [
    {
      "rule": "Title of the user rule",
      "status": "Followed" | "Violated" | "Not Tested",
      "verdict": "1 crisp sentence with exact trade data/dates."
    }
  ],
  "biggestMistakes": ["Up to 3 high-impact leaks with exact numbers, pairs, or dates and rules broken"],
  "bestSetups": ["Up to 3 high-expectancy setups/habits quoting win rate, R-multiple, or pairs"],
  "weaknesses": ["Up to 3 structural execution or psychological leaks"],
  "suggestions": ["Up to 3 high-impact, immediate action steps for the next trading cycle"],
  "disciplineScore": ${(data.stats as any).disciplineScore},
  "improvementAreas": ["Up to 2 key focus areas"],
  "psychologyInsights": "1-2 sharp sentences on emotional control, revenge trades, and FOMO execution.",
  "riskManagementFeedback": "1-2 sharp sentences on drawdown control, SL adherence, and RR ratio quality.",
  "strengthsToKeep": ["Up to 2 positive execution habits to maintain"]
}`;

    try {
      const model = env.OPENAI_MODEL || (env.OPENAI_BASE_URL?.includes('bynara') ? 'deepseek-v4-flash' : 'gpt-4o-mini');
      const response = await openai!.chat.completions.create({
        model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.6, max_tokens: 2200,
      });
      const raw = response.choices[0]?.message?.content || '{}';
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed.ruleAdherence || !Array.isArray(parsed.ruleAdherence)) {
        parsed.ruleAdherence = this.buildRuleAudits((data as any).rules || [], (data as any).executionStats, data.stats);
      }
      return parsed;
    } catch (err) {
      logger.error('OpenAI call failed:', err);
      return this.generateRuleBasedReview(data, null, (data.stats as any).disciplineScore, [], (data as any).rules, (data as any).executionStats);
    }
  }

  private buildRuleAudits(rules: any[], executionStats: any, stats: any): Array<{ rule: string; status: 'Followed' | 'Violated' | 'Not Tested'; verdict: string }> {
    const audits: Array<{ rule: string; status: 'Followed' | 'Violated' | 'Not Tested'; verdict: string }> = [];
    const maxDaily = executionStats?.maxDailyTrades ?? 0;
    const overDays = executionStats?.overtradeDays ?? [];
    const revengeCount = executionStats?.revengeTrades ?? 0;
    const movedSLCount = executionStats?.movedStopLosses ?? 0;
    const avgRR = typeof stats?.avgRR === 'number' ? stats.avgRR : parseFloat(stats?.avgRR) || 0;

    for (const r of rules) {
      const title = r.title || String(r);
      const lower = title.toLowerCase();

      // Skip evaluation for paused rules
      if (r.isActive === false) {
        audits.push({
          rule: title,
          status: 'Not Tested',
          verdict: 'Rule is currently paused by user; excluded from active audit.',
        });
        continue;
      }

      if (lower.includes('max 2 trades') || lower.includes('overtrad')) {
        if (maxDaily > 2) {
          audits.push({
            rule: title,
            status: 'Violated',
            verdict: `Exceeded on ${overDays.length} day(s). Peak: ${maxDaily} trades in a single day.`,
          });
        } else {
          audits.push({
            rule: title,
            status: 'Followed',
            verdict: `Maintained strict volume control with max ${maxDaily} trades per day.`,
          });
        }
      } else if (lower.includes('revenge')) {
        if (revengeCount > 0) {
          audits.push({
            rule: title,
            status: 'Violated',
            verdict: `Triggered ${revengeCount} revenge trade(s) directly following losses.`,
          });
        } else {
          audits.push({
            rule: title,
            status: 'Followed',
            verdict: 'Zero revenge trading detected after losing trades.',
          });
        }
      } else if (lower.includes('stop-loss') || lower.includes('stop loss') || lower.includes('widening')) {
        if (movedSLCount > 0) {
          audits.push({
            rule: title,
            status: 'Violated',
            verdict: `Moved or widened stop-loss on ${movedSLCount} position(s).`,
          });
        } else {
          audits.push({
            rule: title,
            status: 'Followed',
            verdict: 'Stop-loss parameters were strictly respected without moving.',
          });
        }
      } else if (lower.includes('1:2') || lower.includes('rr') || lower.includes('risk reward')) {
        if (avgRR > 0 && avgRR < 1.8) {
          audits.push({
            rule: title,
            status: 'Violated',
            verdict: `Average realized RR was 1:${avgRR.toFixed(2)}, below the 1:2 standard.`,
          });
        } else {
          audits.push({
            rule: title,
            status: 'Followed',
            verdict: `Solid risk-to-reward discipline maintained with 1:${avgRR.toFixed(2)} average RR.`,
          });
        }
      } else if (lower.includes('session') || lower.includes('timing') || lower.includes('london')) {
        const outsideCount = executionStats?.outsideEntryTrades ?? 0;
        if (outsideCount > 0) {
          audits.push({
            rule: title,
            status: 'Violated',
            verdict: `${outsideCount} trade entry(s) taken outside London & NY session windows (Rule restricts trade entry times only; closing/holding is unrestricted).`,
          });
        } else {
          audits.push({
            rule: title,
            status: 'Followed',
            verdict: 'All new trades entered strictly during approved London & NY sessions. No trade closing time limits.',
          });
        }
      } else {
        audits.push({
          rule: title,
          status: 'Followed',
          verdict: 'Execution aligned with operational plan during this review cycle.',
        });
      }
    }
    return audits;
  }

  private generateRuleBasedReview(
    data: Record<string, unknown>,
    _stats: any,
    disciplineScore: number,
    patterns: TradePattern[],
    rules?: any[],
    executionStats?: any
  ): Record<string, unknown> {
    const s = (data.stats as any);
    const winRate = typeof s?.winRate === 'number' ? s.winRate : parseFloat(s?.winRate) || 0;
    const avgRR = typeof s?.avgRR === 'number' ? s.avgRR : parseFloat(s?.avgRR) || 0;
    const profitFactor = typeof s?.profitFactor === 'number' ? s.profitFactor : parseFloat(s?.profitFactor) || 0;
    const netRR = typeof s?.netRR === 'number' ? s.netRR : parseFloat(s?.netRR) || 0;
    const neg = (patterns || []).filter((p) => p.impact === 'negative');
    const pos = (patterns || []).filter((p) => p.impact === 'positive');

    const ruleAudits = this.buildRuleAudits(rules || (data.rules as any[]) || [], executionStats || (data as any).executionStats, s);
    const violatedCount = ruleAudits.filter((a) => a.status === 'Violated').length;

    return {
      summary: winRate >= 55 && netRR >= 0
        ? `Solid ${data.type} with ${winRate.toFixed(0)}% win rate and ${netRR >= 0 ? '+' : ''}${netRR.toFixed(2)}R net. ${violatedCount === 0 ? 'All trading rules were strictly respected.' : `${violatedCount} trading rule(s) breached during the period.`}`
        : `Demanding ${data.type} with ${winRate.toFixed(0)}% win rate and ${netRR >= 0 ? '+' : ''}${netRR.toFixed(2)}R net. Execution leaks and rule deviations accounted for the primary drawdown.`,
      ruleAdherence: ruleAudits,
      biggestMistakes: neg.length > 0
        ? neg.slice(0, 3).map((p) => p.description)
        : [winRate < 50 ? 'Sub-50% win rate — entries lack required confluence' : 'Check trade timing around major session opens'],
      bestSetups: pos.length > 0
        ? pos.map((p) => p.description)
        : profitFactor > 1.2
        ? [`Profit factor ${profitFactor.toFixed(2)} confirms positive statistical expectancy`]
        : ['Document setups with favorable 1:2+ RR for replication'],
      weaknesses: [
        disciplineScore < 75 ? `Discipline score ${disciplineScore}/100 indicates inconsistent plan execution` : null,
        avgRR < 1.5 ? `Average RR 1:${avgRR.toFixed(2)} — risk too high relative to reward` : null,
        violatedCount > 0 ? `${violatedCount} trading rule(s) breached during this cycle` : null,
      ].filter(Boolean) as string[],
      suggestions: [
        avgRR < 1.8 ? 'Enforce minimum 1:2 risk-to-reward before pulling the trigger' : 'Scale winners at 1:3 targets',
        violatedCount > 0 ? 'Review daily checklist before opening the charting terminal' : 'Maintain rigorous execution consistency',
        neg.length > 0 ? `Fix: ${neg[0].suggestion}` : 'Continue logging trade emotions honestly',
      ],
      disciplineScore,
      improvementAreas: [
        disciplineScore < 80 ? 'Trade selection and pre-market preparation' : 'Position sizing consistency',
        avgRR < 1.8 ? 'RR filter adherence' : 'Letting winning trades hit target',
      ],
      psychologyInsights: disciplineScore >= 80
        ? `Solid psychological control during ${data.type}. Calm execution directly correlated with your best trades.`
        : `Emotional friction detected. Losses triggered deviations from standard operating rules.`,
      riskManagementFeedback: profitFactor >= 1.3
        ? `Capital protection was effective with a profit factor of ${profitFactor.toFixed(2)}.`
        : `Risk parameters breached. Losses must be contained strictly within defined limits.`,
      strengthsToKeep: [
        winRate >= 50 ? `${winRate.toFixed(0)}% win rate demonstrates directional accuracy` : 'Disciplined post-trade journaling',
        pos.length > 0 ? pos[0].description : 'Committed tracking of trading performance metrics',
      ],
    };
  }
}

export const aiService = new AIService();
