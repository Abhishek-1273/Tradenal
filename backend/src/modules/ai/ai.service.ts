import OpenAI from 'openai';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { env } from '../../config/env';
import { tradeRepository } from '../../repositories/trade.repository';
import { Review, IReview } from '../../models/Review.model';
import { AppError } from '../../middleware/error.middleware';
import {
  calculateStats, calculateDisciplineScore, getPairStats,
  getSessionStats, getSetupStats, DisciplineInput,
} from '../../utils/calculations';
import { logger } from '../../utils/logger';
import { ITrade } from '../../models/Trade.model';

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
  async generateWeeklyReview(userId: string, accountId?: string): Promise<IReview> {
    const weekStart = dayjs().startOf('week').toDate();
    const weekEnd = dayjs().endOf('week').toDate();
    const trades = await tradeRepository.findByWeek(userId, weekStart, accountId);
    if (trades.length === 0) throw new AppError('No trades this week to review', 400);
    const label = `Week ${dayjs().week()}, ${dayjs().year()}`;
    return this.generateReview(userId, trades, 'weekly', weekStart, weekEnd, label, accountId);
  }

  async generateMonthlyReview(userId: string, accountId?: string): Promise<IReview> {
    const now = dayjs();
    const monthStart = now.startOf('month').toDate();
    const monthEnd = now.endOf('month').toDate();
    const trades = await tradeRepository.findByMonth(userId, now.year(), now.month() + 1, accountId);
    if (trades.length === 0) throw new AppError('No trades this month to review', 400);
    const label = now.format('MMMM YYYY');
    return this.generateReview(userId, trades, 'monthly', monthStart, monthEnd, label, accountId);
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
    periodStart: Date, periodEnd: Date, label: string, accountId?: string
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

    const promptData = {
      period: label, type,
      stats: {
        totalTrades: stats.totalTrades, winRate: stats.winRate, avgRR: stats.avgRR,
        netRR: stats.netRR, profitFactor: stats.profitFactor, expectancy: stats.expectancy,
        longestWinStreak: stats.longestWinStreak, longestLossStreak: stats.longestLossStreak, disciplineScore,
      },
      patterns: patterns.map((p) => ({ type: p.type, impact: p.impact, frequency: p.frequency, description: p.description })),
      topPairs: pairStats.slice(0, 4).map((p) => ({ pair: p.pair, trades: p.totalTrades, winRate: p.winRate, netRR: p.netRR })),
      sessionBreakdown: sessionStats.filter((s) => s.totalTrades > 0).map((s) => ({ session: s.session, trades: s.totalTrades, winRate: s.winRate, netRR: s.netRR })),
      tradesSummary: trades.slice(0, 20).map((t) => ({
        pair: t.pair, result: t.result, rr: t.riskReward, rMultiple: t.rMultiple,
        emotionBefore: t.emotionBefore, followedPlan: t.followedPlan,
        mistakes: t.mistakes, revengeTrade: t.revengeTrade, movedSL: t.movedSL,
      })),
    };

    let content: Record<string, unknown>;
    if (!openai) {
      logger.warn('OpenAI not configured — using rule-based review');
      content = this.generateRuleBasedReview(promptData, stats, disciplineScore, patterns);
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
    const systemPrompt = `You are a brutal, no-nonsense trading coach. Be extremely concise. Every bullet point must be under 12 words. No filler, no praise padding — only data-backed, actionable insights. Reference actual numbers from the data.`;
    const userPrompt = `${data.type} review for ${data.period}.\nMETRICS: ${JSON.stringify(data.stats)}\nPATTERNS: ${JSON.stringify(data.patterns)}\nPAIRS: ${JSON.stringify(data.topPairs)}\nSESSIONS: ${JSON.stringify(data.sessionBreakdown)}\n\nReturn ONLY raw JSON (no markdown, no backticks):\n{"summary":"2-3 sentence max, mention key numbers","biggestMistakes":["max 3 items, each under 12 words"],"bestSetups":["max 3 items, each under 12 words"],"weaknesses":["max 3 items, each under 12 words"],"suggestions":["max 3 items, each under 12 words"],"disciplineScore":${(data.stats as any).disciplineScore},"improvementAreas":["max 2 items, each under 12 words"],"psychologyInsights":"1-2 sentences max","riskManagementFeedback":"1-2 sentences max","strengthsToKeep":["max 2 items, each under 12 words"]}`;

    try {
      const response = await openai!.chat.completions.create({
        model: 'mistral-large',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.65, max_tokens: 2000,
      });
      const raw = response.choices[0]?.message?.content || '{}';
      // Mistral sometimes wraps JSON in ```json ... ``` — strip it
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      logger.error('OpenAI call failed:', err);
      return this.generateRuleBasedReview(data, null, (data.stats as any).disciplineScore, []);
    }
  }

  private generateRuleBasedReview(data: Record<string, unknown>, stats: any, disciplineScore: number, patterns: TradePattern[]): Record<string, unknown> {
    const s = (data.stats as any);
    const winRate = s?.winRate ?? 0;
    const avgRR = s?.avgRR ?? 0;
    const profitFactor = s?.profitFactor ?? 0;
    const netRR = s?.netRR ?? 0;
    const neg = patterns.filter((p) => p.impact === 'negative');
    const pos = patterns.filter((p) => p.impact === 'positive');

    return {
      summary: winRate >= 60 && avgRR >= 1.5 && disciplineScore >= 75
        ? `Strong ${data.type} with ${winRate.toFixed(0)}% win rate and ${netRR >= 0 ? '+' : ''}${netRR.toFixed(2)}R net. Discipline score ${disciplineScore}/100 reflects consistent execution. Focus on maintaining this standard.`
        : winRate >= 50
        ? `Moderate ${data.type} with ${winRate.toFixed(0)}% win rate. Average RR of ${avgRR.toFixed(2)} is limiting profitability. You are winning directionally but leaving money on the table.`
        : `Challenging ${data.type} with ${winRate.toFixed(0)}% win rate and ${netRR.toFixed(2)}R net. Poor setup selection and psychological interference are the primary culprits.`,
      biggestMistakes: neg.length > 0 ? neg.slice(0,3).map((p) => p.description) : [winRate < 50 ? 'Win rate below 50% — tighten entry criteria' : 'Continue monitoring trade quality'],
      bestSetups: pos.length > 0 ? pos.map((p) => p.description) : profitFactor > 1.5 ? [`Profit factor ${profitFactor.toFixed(2)} confirms positive edge`] : ['Document your strongest setup conditions for future reference'],
      weaknesses: [
        disciplineScore < 70 ? `Discipline score ${disciplineScore}/100 shows consistent plan deviations` : null,
        avgRR < 1.5 ? `Average RR ${avgRR.toFixed(2)} — risking more than you reward` : null,
        winRate < 50 ? 'Win rate below breakeven requires immediate setup qualification improvement' : null,
      ].filter(Boolean) as string[],
      suggestions: [
        avgRR < 1.5 ? 'Enforce 1.5:1 minimum RR on every trade' : 'Maintain current RR discipline',
        disciplineScore < 75 ? 'Create pre-trade checklist — only trade when all conditions are met' : 'Continue consistent plan execution',
        neg.length > 0 ? `Address: ${neg[0].suggestion}` : 'Keep refining your best performing setups',
      ],
      disciplineScore,
      improvementAreas: [disciplineScore < 80 ? 'Plan adherence and pre-trade preparation' : 'Setup refinement and patience', avgRR < 1.5 ? 'RR selection discipline' : 'Scaling into winning positions'],
      psychologyInsights: disciplineScore >= 80
        ? `Psychological discipline is solid this ${data.type}. Trading calm and confident correlates with best results.`
        : `Emotional interference is measurably impacting performance. ${neg.find((p) => p.type.includes('Emotional'))?.description ?? 'Emotional states other than calm/confident are leading to suboptimal decisions.'}`,
      riskManagementFeedback: profitFactor >= 1.5
        ? `Risk management working — profit factor ${profitFactor.toFixed(2)} shows capital is protected effectively.`
        : `Risk management needs attention. Profit factor ${profitFactor.toFixed(2)} indicates losses are too large relative to wins.`,
      strengthsToKeep: [
        winRate >= 50 ? `${winRate.toFixed(0)}% win rate shows solid directional accuracy` : 'Commitment to journaling every trade',
        profitFactor > 1 ? `Positive profit factor ${profitFactor.toFixed(2)} confirms you have edge` : 'Resilience through a difficult period',
        pos.length > 0 ? pos[0].description : 'Consistency in detailed trade documentation',
      ],
    };
  }
}

export const aiService = new AIService();
