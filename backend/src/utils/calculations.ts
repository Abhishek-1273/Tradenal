import dayjs from 'dayjs';
import { ITrade } from '../models/Trade.model';

export interface TradeCalculations {
  riskReward: number;
  pnl: number;
  rMultiple: number;
  tradeDurationMinutes: number;
}

/**
 * Calculate Risk:Reward ratio from entry, SL, TP
 */
export const calculateRiskReward = (
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number => {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  if (risk === 0) return 0;
  return parseFloat((reward / risk).toFixed(2));
};

/**
 * Calculate PnL in account currency
 * For Forex: (exitPrice - entryPrice) * lotSize * 100000 * pipValue
 * Simplified: directional pnl per unit
 */
export const calculatePnL = (
  tradeType: 'buy' | 'sell',
  entryPrice: number,
  exitPrice: number,
  lotSize: number
): number => {
  const direction = tradeType === 'buy' ? 1 : -1;
  const priceDiff = (exitPrice - entryPrice) * direction;
  const pnl = priceDiff * lotSize * 100000;
  return parseFloat(pnl.toFixed(2));
};

/**
 * Calculate R-Multiple: how many R did we win/lose
 * R = (exit - entry) / (entry - stopLoss) for buys
 */
export const calculateRMultiple = (
  tradeType: 'buy' | 'sell',
  entryPrice: number,
  stopLoss: number,
  exitPrice: number
): number => {
  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  if (riskPerUnit === 0) return 0;

  const direction = tradeType === 'buy' ? 1 : -1;
  const actualReturn = (exitPrice - entryPrice) * direction;
  return parseFloat((actualReturn / riskPerUnit).toFixed(2));
};

/**
 * Calculate trade duration in minutes
 */
export const calculateDuration = (entryTime: Date, exitTime: Date): number => {
  return dayjs(exitTime).diff(dayjs(entryTime), 'minute');
};

/**
 * Format duration in human readable form
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
};

/**
 * Calculate discipline score (0-100) from trade psychology data
 */
export interface DisciplineInput {
  followedPlan: boolean;
  revengeTrade: boolean;
  overtraded: boolean;
  movedSL: boolean;
  riskReward: number;
  riskPercent: number;
  emotionBefore: string;
  mistakes: string[];
}

export const calculateDisciplineScore = (inputs: DisciplineInput[]): number => {
  if (inputs.length === 0) return 0;

  const scores = inputs.map((trade) => {
    let score = 0;

    // Followed plan (20 pts)
    if (trade.followedPlan) score += 20;

    // No revenge trading (20 pts)
    if (!trade.revengeTrade) score += 20;

    // No overtrading (15 pts)
    if (!trade.overtraded) score += 15;

    // RR quality (15 pts)
    if (trade.riskReward >= 2) score += 15;
    else if (trade.riskReward >= 1.5) score += 10;
    else if (trade.riskReward >= 1) score += 5;

    // Risk management (15 pts)
    if (trade.riskPercent <= 1) score += 15;
    else if (trade.riskPercent <= 2) score += 10;
    else if (trade.riskPercent <= 3) score += 5;

    // Emotion control (10 pts)
    const calmEmotions = ['calm', 'confident'];
    if (calmEmotions.includes(trade.emotionBefore.toLowerCase())) score += 10;
    else if (!['greedy', 'fomo', 'fear'].includes(trade.emotionBefore.toLowerCase())) score += 5;

    // No SL movement (5 pts)
    if (!trade.movedSL) score += 5;

    return Math.min(score, 100);
  });

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg);
};

/**
 * Calculate statistics from an array of trades
 */
export const calculateStats = (trades: ITrade[]) => {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakEvens: 0,
      winRate: 0,
      lossRate: 0,
      avgRR: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      netRR: 0,
      avgHoldingTime: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      // Phase 2: monetary defaults
      netPnL: 0,
      grossWinAmount: 0,
      grossLossAmount: 0,
      avgWinAmount: 0,
      avgLossAmount: 0,
      profitFactorAmount: 0,
      expectancyAmount: 0,
    };
  }

  const wins = trades.filter((t) => t.result === 'win');
  const losses = trades.filter((t) => t.result === 'loss');
  const partialWins = trades.filter((t) => t.result === 'partialWin');

  const totalWins = wins.length + partialWins.length;
  const totalLosses = losses.length;

  const winRate = parseFloat(((totalWins / trades.length) * 100).toFixed(2));
  const lossRate = parseFloat(((totalLosses / trades.length) * 100).toFixed(2));

  const winningRRs = [...wins, ...partialWins].map((t) => t.rMultiple ?? 0);
  const losingRRs = losses.map((t) => Math.abs(t.rMultiple ?? 0));

  const avgWin = winningRRs.length
    ? parseFloat((winningRRs.reduce((a, b) => a + b, 0) / winningRRs.length).toFixed(2))
    : 0;

  const avgLoss = losingRRs.length
    ? parseFloat((losingRRs.reduce((a, b) => a + b, 0) / losingRRs.length).toFixed(2))
    : 0;

  const grossWin = winningRRs.reduce((a, b) => a + b, 0);
  const grossLoss = losingRRs.reduce((a, b) => a + b, 0);

  const profitFactor = grossLoss === 0 ? (grossWin === 0 ? 0 : Infinity) : parseFloat((grossWin / grossLoss).toFixed(2));
  const expectancy = parseFloat(
    ((winRate / 100) * avgWin - (lossRate / 100) * avgLoss).toFixed(2)
  );

  const allRRs = trades.map((t) => t.rMultiple ?? 0);
  const netRR = parseFloat(allRRs.reduce((a, b) => a + b, 0).toFixed(2));
  const avgRR = parseFloat((netRR / trades.length).toFixed(2));

  const durations = trades.filter((t) => t.tradeDurationMinutes).map((t) => t.tradeDurationMinutes!);
  const avgHoldingTime = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  // Phase 2: Monetary P&L calculations
  const tradesWithPnl = trades.filter((t) => typeof t.pnlAmount === 'number');
  const winsAmount = tradesWithPnl.filter((t) => t.result === 'win' || t.result === 'partialWin').map((t) => t.pnlAmount!);
  const lossesAmount = tradesWithPnl.filter((t) => t.result === 'loss').map((t) => Math.abs(t.pnlAmount!));

  const grossWinAmount = parseFloat(winsAmount.reduce((a, b) => a + b, 0).toFixed(2));
  const grossLossAmount = parseFloat(lossesAmount.reduce((a, b) => a + b, 0).toFixed(2));
  const netPnL = parseFloat(tradesWithPnl.reduce((sum, t) => sum + (t.pnlAmount ?? 0), 0).toFixed(2));

  const avgWinAmount = winsAmount.length
    ? parseFloat((grossWinAmount / winsAmount.length).toFixed(2))
    : 0;
  const avgLossAmount = lossesAmount.length
    ? parseFloat((grossLossAmount / lossesAmount.length).toFixed(2))
    : 0;

  const profitFactorAmount = grossLossAmount === 0
    ? (grossWinAmount === 0 ? 0 : Infinity)
    : parseFloat((grossWinAmount / grossLossAmount).toFixed(2));

  const winRateAmount = tradesWithPnl.length
    ? (winsAmount.length / tradesWithPnl.length) * 100
    : 0;
  const lossRateAmount = tradesWithPnl.length
    ? (lossesAmount.length / tradesWithPnl.length) * 100
    : 0;

  const expectancyAmount = parseFloat(
    ((winRateAmount / 100) * avgWinAmount - (lossRateAmount / 100) * avgLossAmount).toFixed(2)
  );

  // Streaks
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentStreak = 0;
  let currentStreakType: 'win' | 'loss' | null = null;

  const sorted = [...trades].sort(
    (a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()
  );

  sorted.forEach((trade) => {
    const isWin = trade.result === 'win' || trade.result === 'partialWin';

    if (isWin) {
      currentWinStreak++;
      currentLossStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else if (trade.result === 'loss') {
      currentLossStreak++;
      currentWinStreak = 0;
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
    }

    if (isWin) {
      if (currentStreakType !== 'win') { currentStreakType = 'win'; currentStreak = 1; }
      else currentStreak++;
    } else if (trade.result === 'loss') {
      if (currentStreakType !== 'loss') { currentStreakType = 'loss'; currentStreak = -1; }
      else currentStreak--;
    }
  });

  return {
    totalTrades: trades.length,
    wins: totalWins,
    losses: totalLosses,
    breakEvens: trades.filter((t) => t.result === 'breakeven').length,
    winRate,
    lossRate,
    avgRR,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    netRR,
    avgHoldingTime,
    longestWinStreak,
    longestLossStreak,
    currentStreak,
    currentStreakType,
    grossWin,
    grossLoss,
    // Phase 2: monetary returns
    netPnL,
    grossWinAmount,
    grossLossAmount,
    avgWinAmount,
    avgLossAmount,
    profitFactorAmount,
    expectancyAmount,
  };
};

/**
 * Group trades by pair and get best/worst
 */
export const getPairStats = (trades: ITrade[]) => {
  const pairMap: Record<string, ITrade[]> = {};

  trades.forEach((trade) => {
    if (!pairMap[trade.pair]) pairMap[trade.pair] = [];
    pairMap[trade.pair].push(trade);
  });

  return Object.entries(pairMap).map(([pair, pairTrades]) => {
    const stats = calculateStats(pairTrades);
    return { pair, ...stats };
  });
};

/**
 * Group trades by session
 */
export const getSessionStats = (trades: ITrade[]) => {
  const sessions = ['london', 'newyork', 'asian', 'overlap'] as const;
  return sessions.map((session) => {
    const sessionTrades = trades.filter((t) => t.session === session);
    return { session, ...calculateStats(sessionTrades) };
  });
};

/**
 * Group trades by setup
 */
export const getSetupStats = (trades: ITrade[]) => {
  const setupMap: Record<string, ITrade[]> = {};

  trades.filter((t) => t.setup).forEach((trade) => {
    const key = trade.setup!;
    if (!setupMap[key]) setupMap[key] = [];
    setupMap[key].push(trade);
  });

  return Object.entries(setupMap).map(([setup, setupTrades]) => {
    const stats = calculateStats(setupTrades);
    return { setup, ...stats };
  });
};
