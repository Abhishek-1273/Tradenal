import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(duration);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

// ─── Date/Time Combination ─────────────────────────────────────────────────────
// The backend stores entryTime/exitTime as full Date objects (used for duration
// calculations), but the UI only collects a time-of-day ('HH:mm'). Combine the
// trade date with the picked time before sending it to the API.
export const combineDateAndTime = (dateStr: string, timeStr?: string): string | undefined => {
  if (!timeStr) return undefined;
  const combined = dayjs(`${dateStr}T${timeStr}:00`);
  return combined.isValid() ? combined.toISOString() : undefined;
};

// ─── Price Calculations ────────────────────────────────────────────────────────
export const calcRiskReward = (
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number => {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  if (risk === 0) return 0;
  return parseFloat((reward / risk).toFixed(2));
};

export const calcRMultiple = (
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

export const calcPnL = (
  tradeType: 'buy' | 'sell',
  entryPrice: number,
  exitPrice: number,
  lotSize: number
): number => {
  const direction = tradeType === 'buy' ? 1 : -1;
  const priceDiff = (exitPrice - entryPrice) * direction;
  return parseFloat((priceDiff * lotSize * 100000).toFixed(2));
};

// ─── Formatters ───────────────────────────────────────────────────────────────
export const formatRR = (rr: number | undefined): string => {
  if (rr === undefined || rr === null) return '—';
  return `${rr >= 0 ? '' : ''}${rr.toFixed(2)}R`;
};

export const formatPnL = (pnl: number | undefined, currency = 'USD'): string => {
  if (pnl === undefined || pnl === null) return '—';
  const abs = Math.abs(pnl);
  const sign = pnl >= 0 ? '+' : '-';
  try {
    const formatted = abs.toLocaleString('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${sign}${formatted}`;
  } catch {
    return `${sign}${currency} ${abs.toFixed(2)}`;
  }
};

export const formatBalance = (balance: number | undefined, currency = 'USD'): string => {
  if (balance === undefined || balance === null) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance);
  } catch {
    return `${currency} ${balance.toFixed(2)}`;
  }
};

export const formatPercent = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatProfitFactor = (value: number | undefined): string => {
  if (value === undefined || value === null) return '—';
  if (value === Infinity || !isFinite(value)) return '∞';
  return value.toFixed(2);
};

export const formatDuration = (minutes: number | undefined): string => {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const hr = h % 24;
  return hr > 0 ? `${d}d ${hr}h` : `${d}d`;
};

export const formatDate = (date: string | Date, format = 'DD MMM YYYY'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD MMM YYYY, HH:mm');
};

export const formatRelativeDate = (date: string | Date): string => {
  const d = dayjs(date);
  const now = dayjs();
  if (d.isToday()) return 'Today';
  if (d.isYesterday()) return 'Yesterday';
  if (now.diff(d, 'day') < 7) return d.format('dddd');
  return d.format('DD MMM YYYY');
};

export const formatPrice = (price: number, decimals = 5): string => {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 10) return price.toFixed(3);
  return price.toFixed(decimals);
};

export const formatLotSize = (lots: number): string => {
  return lots.toFixed(2);
};

// ─── Label Helpers ─────────────────────────────────────────────────────────────
export const getResultColor = (result: string, colors: any): string => {
  switch (result) {
    case 'win': return colors.win;
    case 'loss': return colors.loss;
    case 'breakeven': return colors.breakeven;
    case 'partialWin': return colors.partialWin;
    default: return colors.textTertiary;
  }
};

export const getResultLabel = (result: string): string => {
  switch (result) {
    case 'win': return 'Win';
    case 'loss': return 'Loss';
    case 'breakeven': return 'Break Even';
    case 'partialWin': return 'Partial Win';
    default: return result;
  }
};

export const getSetupLabel = (setup: string): string => {
  const labels: Record<string, string> = {
    breakout: 'Breakout',
    liquiditySweep: 'Liquidity Sweep',
    smc: 'SMC',
    ict: 'ICT',
    supportResistance: 'S&R',
    trendFollowing: 'Trend Following',
    scalp: 'Scalp',
    swing: 'Swing',
    custom: 'Custom',
  };
  return labels[setup] || setup;
};

export const getSessionLabel = (session: string): string => {
  const labels: Record<string, string> = {
    london: 'London',
    newyork: 'New York',
    asian: 'Asian',
    overlap: 'Overlap',
  };
  return labels[session] || session;
};

export const getEmotionEmoji = (emotion: string): string => {
  const map: Record<string, string> = {
    confident: '😎',
    fear: '😨',
    greedy: '🤑',
    fomo: '😰',
    calm: '😌',
    excited: '🤩',
    happy: '😄',
    frustrated: '😤',
    angry: '😠',
    satisfied: '😊',
    neutral: '😐',
  };
  return map[emotion] || '😐';
};

export const getMistakeLabel = (mistake: string): string => {
  const labels: Record<string, string> = {
    enteredEarly: 'Entered Early',
    lateEntry: 'Late Entry',
    noConfirmation: 'No Confirmation',
    ignoredTrend: 'Ignored Trend',
    riskTooHigh: 'Risk Too High',
    poorRR: 'Poor RR',
    noSL: 'No Stop Loss',
    closedEarly: 'Closed Early',
    heldTooLong: 'Held Too Long',
    custom: 'Other',
  };
  return labels[mistake] || mistake;
};

// ─── Score helpers ─────────────────────────────────────────────────────────────
export const getDisciplineScoreColor = (score: number, colors: any): string => {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.error;
};

export const getDisciplineScoreLabel = (score: number): string => {
  if (score >= 90) return 'Elite';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 50) return 'Below Average';
  return 'Poor';
};
