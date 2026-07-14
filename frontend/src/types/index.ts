// ─── Auth Types ───────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  settings: UserSettings;
  lastLoginAt?: string;
  createdAt: string;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  currency: string;
  defaultRisk: number;
  defaultRR: number;
  timezone: string;
  brokerGmtOffset: number;
  notifications: {
    dailyReminder: boolean;
    weeklyReview: boolean;
    monthlyReview: boolean;
    reminderTime: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ─── Trade Types ──────────────────────────────────────────────────────────────
export type TradeType = 'buy' | 'sell';
export type TradeSession = 'london' | 'newyork' | 'asian' | 'overlap';
export type TradeSetup =
  | 'breakout'
  | 'liquiditySweep'
  | 'smc'
  | 'ict'
  | 'supportResistance'
  | 'trendFollowing'
  | 'scalp'
  | 'swing'
  | 'orderBlock'
  | 'fairValueGap'
  | 'liquiditySweepReversal'
  | 'custom';
export type TradeResult = 'win' | 'loss' | 'breakeven' | 'partialWin';
export type EmotionBefore = 'confident' | 'fear' | 'greedy' | 'fomo' | 'calm' | 'excited';
export type EmotionAfter = 'happy' | 'frustrated' | 'angry' | 'satisfied' | 'neutral' | 'regretful';
export type EmotionDuring = 'calm' | 'anxious' | 'doubtful' | 'tempted_to_close' | 'tempted_to_move_sl' | 'confident_held';
export type TradeMistake =
  | 'enteredEarly'
  | 'lateEntry'
  | 'noConfirmation'
  | 'ignoredTrend'
  | 'riskTooHigh'
  | 'poorRR'
  | 'noSL'
  | 'closedEarly'
  | 'heldTooLong'
  | 'modifiedOrderRepeatedly'
  | 'chasedPrice'
  | 'noHigherTFCheck'
  | 'stackedTooManyConfluences'
  | 'custom';

export interface Screenshot {
  url: string;
  publicId: string;
  type: 'before' | 'after' | 'markup';
}

export interface Trade {
  _id: string;
  userId: string;
  accountId?: string; // Phase 1: multi-account scope
  pair: string;
  tradeType: TradeType;
  tradeDate: string;
  entryTime?: string;
  exitTime?: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice?: number;
  lotSize: number;
  riskPercent: number;
  riskReward?: number;
  pnl?: number;
  pnlAmount?: number; // Phase 2: monetary P&L amount
  rMultiple?: number;
  tradeDurationMinutes?: number;
  session: TradeSession;
  setup?: TradeSetup;
  customSetup?: string;
  result: TradeResult;
  emotionBefore?: EmotionBefore;
  emotionDuring?: EmotionDuring;
  emotionAfter?: EmotionAfter;
  confluenceCount?: number;
  followedPlan: boolean;
  overtraded: boolean;
  movedSL: boolean;
  movedTP: boolean;
  revengeTrade: boolean;
  newsTrade: boolean;
  checkedHigherTimeframe: boolean;
  waitedForConfirmation: boolean;
  sizedCorrectly: boolean;
  withinDailyLossLimit: boolean;
  singleTradeDominance: boolean;
  mistakes: TradeMistake[];
  customMistake?: string;
  screenshots: Screenshot[];
  reasonForEntry?: string;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTradePayload {
  accountId?: string; // Phase 1: multi-account scope
  pair: string;
  tradeType: TradeType;
  tradeDate: string;
  entryTime?: string;
  exitTime?: string;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice?: number;
  lotSize: number;
  riskPercent: number;
  pnlAmount?: number; // Phase 2: monetary P&L amount
  session: TradeSession;
  setup?: TradeSetup;
  customSetup?: string;
  result: TradeResult;
  emotionBefore?: EmotionBefore;
  emotionDuring?: EmotionDuring;
  emotionAfter?: EmotionAfter;
  confluenceCount?: number;
  followedPlan: boolean;
  overtraded: boolean;
  movedSL: boolean;
  movedTP: boolean;
  revengeTrade: boolean;
  newsTrade: boolean;
  checkedHigherTimeframe: boolean;
  waitedForConfirmation: boolean;
  sizedCorrectly: boolean;
  withinDailyLossLimit: boolean;
  singleTradeDominance: boolean;
  mistakes: TradeMistake[];
  customMistake?: string;
  reasonForEntry?: string;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
}

// ─── Stats Types ──────────────────────────────────────────────────────────────
export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakEvens: number;
  winRate: number;
  lossRate: number;
  avgRR: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  netRR: number;
  avgHoldingTime: number;
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: number;
  currentStreakType: 'win' | 'loss' | null;
  grossWin: number;
  grossLoss: number;
  // Phase 2: monetary metrics
  netPnL: number;
  grossWinAmount: number;
  grossLossAmount: number;
  avgWinAmount: number;
  avgLossAmount: number;
  profitFactorAmount: number;
  expectancyAmount: number;
}

export interface EquityCurvePoint {
  date: string;
  cumulativeRR: number;
  cumulativePnL?: number; // Phase 5: monetary equity curve value
  tradeNumber: number;
}

export interface CalendarDay {
  date: string;
  trades: number;
  netRR: number;
  wins: number;
  losses: number;
}

export interface DashboardData {
  stats: TradeStats;
  equityCurve: EquityCurvePoint[];
  winLossData: { label: string; value: number; color: string }[];
  disciplineScore: number;
  tradeCount: number;
  recentNotes?: Trade[];
}

export interface PairStat extends TradeStats {
  pair: string;
}

export interface SessionStat {
  session: TradeSession;
  totalTrades: number;
  winRate: number;
  netRR: number;
}

export interface SetupStat {
  setup: string;
  totalTrades: number;
  winRate: number;
  netRR: number;
}

export interface MonthlyPerf {
  month: string;
  monthKey: string;
  netRR: number;
  winRate: number;
  trades: number;
}

export interface AnalyticsData {
  overall: TradeStats;
  byPair: PairStat[];
  bySession: SessionStat[];
  bySetup: SetupStat[];
  emotionBreakdown: { emotion: string; count: number; wins: number; losses: number; winRate: number }[];
  mistakesBreakdown: { mistake: string; count: number }[];
  monthlyPerformance: MonthlyPerf[];
  weeklyPerformance: { week: string; start: string; netRR: number; winRate: number; trades: number }[];
  bestPair?: string;
  worstPair?: string;
  bestSetup?: string;
  bestSession?: string;
  mostCommonMistake?: string;
  disciplineHistory: { date: string; score: number; trades: number }[];
  psychologyComparisons?: {
    planFollowed: { netRR: number; winRate: number; trades: number; netPnL: number };
    planBroken: { netRR: number; winRate: number; trades: number; netPnL: number };
    revenge: { netRR: number; winRate: number; trades: number; netPnL: number };
    standard: { netRR: number; winRate: number; trades: number; netPnL: number };
  };
}

// ─── Goals Types ──────────────────────────────────────────────────────────────
export interface Goal {
  _id: string;
  userId: string;
  accountId?: string; // Phase 1: multi-account scope
  month: string;
  targetRR: number;
  targetWinRate: number;
  maxDailyTrades: number;
  maxDailyLoss: number;
  targetConsistency: number;
  targetNetRR?: number;
  targetTrades?: number;
  notes?: string;
}

export interface GoalProgress {
  winRate: { target: number; current: number; achieved: boolean; percentage: number };
  avgRR: { target: number; current: number; achieved: boolean; percentage: number };
  consistency: { target: number; current: number; achieved: boolean; percentage: number };
  netRR: { target: number; current: number; achieved: boolean; percentage: number } | null;
  trades: { target: number; current: number; achieved: boolean; percentage: number } | null;
}

export interface GoalWithProgress {
  goal: Goal;
  progress: GoalProgress;
  stats: TradeStats;
  tradeCount: number;
}

// ─── Review Types ─────────────────────────────────────────────────────────────
export interface ReviewContent {
  summary: string;
  biggestMistakes: string[];
  bestSetups: string[];
  weaknesses: string[];
  suggestions: string[];
  disciplineScore: number;
  improvementAreas: string[];
  psychologyInsights: string;
  riskManagementFeedback: string;
  strengthsToKeep: string[];
}

export interface Review {
  _id: string;
  userId: string;
  type: 'weekly' | 'monthly';
  period: { start: string; end: string; label: string };
  content: ReviewContent;
  metrics: {
    tradeCount: number;
    winRate: number;
    netRR: number;
    profitFactor: number;
    disciplineScore: number;
    avgRR: number;
  };
  generatedAt: string;
}

// ─── API Types ────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    totalPages?: number;
  };
  errors?: unknown;
}

export interface PaginatedResponse<T> {
  trades: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TradeFilters {
  accountId?: string; // Phase 1: filter by account
  pair?: string;
  result?: string;
  session?: string;
  setup?: string;
  emotionBefore?: string;
  mistakes?: string;
  tags?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  isFavorite?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export * from './account';

