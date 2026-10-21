export const COMMON_PAIRS = [
  'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY',
  'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURJPY',
  'NAS100', 'US30', 'SPX500', 'UK100', 'GER40',
  'BTCUSD', 'ETHUSD', 'LTCUSD',
];

// Quick-access shortcuts shown above the searchable pair selector
export const QUICK_PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY'];

export const SESSIONS = [
  { value: 'london',  label: 'London',   icon: 'business-outline',        time: '08:00–17:00 GMT', color: '#60A5FA' },
  { value: 'newyork', label: 'New York', icon: 'trending-up-outline',     time: '13:00–22:00 GMT', color: '#34D399' },
  { value: 'asian',   label: 'Asian',    icon: 'partly-sunny-outline',    time: '00:00–09:00 GMT', color: '#FBBF24' },
  { value: 'overlap', label: 'Overlap',  icon: 'swap-horizontal-outline', time: '13:00–17:00 GMT', color: '#C084FC' },
] as const;

export const SETUPS = [
  { value: 'qml',                    label: 'QML (Quasi Modo Level)',       icon: 'layers-outline',               color: '#10B981' },
  { value: 'iss4',                   label: 'ISS4 (Institutional Setup 4)', icon: 'cube-outline',                 color: '#3B82F6' },
  { value: 'tjl2',                   label: 'TJL2 (Top-Down Journey 2)',   icon: 'git-compare-outline',          color: '#8B5CF6' },
  { value: 'dt_db',                  label: 'Clean DT / DB (Double Top/Bottom)', icon: 'swap-vertical-outline',   color: '#F59E0B' },
  { value: 'breakout',               label: 'Breakout',             icon: 'expand-outline',               color: '#34D399' },
  { value: 'liquiditySweep',         label: 'Liquidity Sweep',      icon: 'water-outline',                color: '#60A5FA' },
  { value: 'smc',                    label: 'SMC',                  icon: 'layers-outline',               color: '#C084FC' },
  { value: 'ict',                    label: 'ICT',                  icon: 'school-outline',               color: '#FBBF24' },
  { value: 'supportResistance',      label: 'Support & Resistance', icon: 'resize-outline',               color: '#F87171' },
  { value: 'trendFollowing',         label: 'Trend Following',      icon: 'analytics-outline',            color: '#34D399' },
  { value: 'scalp',                  label: 'Scalp',                icon: 'flash-outline',                color: '#FBBF24' },
  { value: 'swing',                  label: 'Swing',                icon: 'swap-vertical-outline',        color: '#60A5FA' },
  { value: 'orderBlock',             label: 'Order Block',          icon: 'cube-outline',                 color: '#C084FC' },
  { value: 'fairValueGap',           label: 'Fair Value Gap',       icon: 'git-compare-outline',          color: '#F87171' },
  { value: 'liquiditySweepReversal', label: 'LS Reversal',          icon: 'return-down-back-outline',     color: '#60A5FA' },
  { value: 'custom',                 label: 'Custom',               icon: 'construct-outline',            color: '#94A3B8' },
] as const;

export const RESULTS = [
  { value: 'win',        label: 'Win',         icon: 'trending-up',           colorKey: 'win' },
  { value: 'loss',       label: 'Loss',        icon: 'trending-down',         colorKey: 'loss' },
  { value: 'breakeven',  label: 'Break Even',  icon: 'remove-circle-outline', colorKey: 'breakeven' },
  { value: 'partialWin', label: 'Partial Win', icon: 'pie-chart-outline',     colorKey: 'partialWin' },
] as const;

export const EMOTIONS_BEFORE = [
  { value: 'calm_patient',     label: 'Calm & Patient',    desc: 'Waited patiently for the setup to develop with zero rush or FOMO (Ideal state)', icon: 'leaf-outline' },
  { value: 'confident',        label: 'Confident',         desc: 'Analysis was clear and all planned confluences were fully aligned',          icon: 'shield-checkmark-outline' },
  { value: 'fomo_chasing',     label: 'FOMO / Chasing',    desc: 'Saw price aggressively running and entered late out of fear of missing the move', icon: 'flash-outline' },
  { value: 'fearful_hesitant', label: 'Fear / Hesitant',   desc: 'Hesitated to pull the trigger due to fear from recent losses', icon: 'warning-outline' },
  { value: 'bored_forcing',    label: 'Bored / Forcing',   desc: 'No clean setup present; forced a trade out of screen boredom and restlessness', icon: 'bed-outline' },
  { value: 'greedy_impulsive', label: 'Impulsive / Greed', desc: 'Fixated on large gains; tempted to overlook position sizing and risk caps',  icon: 'wallet-outline' },
] as const;

export const EMOTIONS_DURING = [
  { value: 'calm_detached',        label: 'Calm & Detached', desc: 'Set hard SL and TP, then stepped away from the terminal (Detached execution)', icon: 'leaf-outline' },
  { value: 'anxious_tick_watching',label: 'Anxious Watching',desc: 'Obsessively monitored tick-by-tick candles and live floating P&L', icon: 'pulse-outline' },
  { value: 'tempted_to_close',     label: 'Tempted to Exit', desc: 'Tempted to cut a small floating profit prematurely out of fear of reversal', icon: 'exit-outline' },
  { value: 'tempted_to_move_sl',   label: 'Tempted Move SL', desc: 'Felt the urge to move or widen stop-loss backward to avoid taking the loss', icon: 'trending-down-outline' },
  { value: 'tempted_to_add',       label: 'Tempted Add Size',desc: 'Tempted to aggressively add lot size to an active trade out of greed', icon: 'add-circle-outline' },
  { value: 'doubtful_overthinking',label: 'Doubtful / Panic',desc: 'Second-guessed the setup immediately after entry and experienced anxiety', icon: 'help-circle-outline' },
] as const;

export const EMOTIONS_AFTER = [
  { value: 'disciplined',       label: 'Disciplined',       desc: 'Win or loss, the trade was executed 100% within the pre-defined rules', icon: 'checkmark-circle-outline' },
  { value: 'neutral_objective', label: 'Neutral Objective', desc: 'Detached from the outcome; treated the trade purely as a statistical data point', icon: 'remove-circle-outline' },
  { value: 'relieved_lucky',    label: 'Relieved',          desc: 'Trade ended in profit, but acknowledged excessive risk or flawed execution', icon: 'heart-outline' },
  { value: 'frustrated_angry',  label: 'Frustrated',        desc: 'Felt anger or blamed the market when stop-loss was hit', icon: 'flame-outline' },
  { value: 'regretful',         label: 'Regretful',         desc: 'Recognized a clear rule breach (e.g., entered running candle without confirmation)', icon: 'arrow-undo-outline' },
  { value: 'revenge_urge',      label: 'Revenge Urge',      desc: 'Felt an immediate impulse to force another trade to recover the loss', icon: 'alert-circle-outline' },
] as const;

export interface MistakeItem {
  id: string;
  label: string;
  sub: string;
  icon: string;
}

export interface MistakeCategory {
  id: string;
  title: string;
  phase: string;
  icon: string;
  color: string;
  items: MistakeItem[];
}

export const FLAWLESS_MISTAKE_ITEM: MistakeItem = {
  id: 'none_flawless',
  label: 'No Mistakes (Followed Plan 100%)',
  sub: 'Setup and execution followed 100% of rules; loss was within normal statistical variance.',
  icon: 'shield-checkmark-outline',
};

export const MISTAKE_CATEGORIES: MistakeCategory[] = [
  {
    id: 'setup_premarket',
    title: 'Setup & Pre-Market Errors',
    phase: 'Analysis Phase',
    icon: 'telescope-outline',
    color: '#3B82F6',
    items: [
      {
        id: 'ignored_htf',
        label: 'Ignored 15M/1H Structure Level',
        sub: 'Entered without a confirmed 15M or 1H market structure level (Rule 01).',
        icon: 'trending-down-outline',
      },
      {
        id: 'invalid_pattern',
        label: 'Pattern Not Allowed',
        sub: 'Setup was not QML, ISS4, TJL2, or clean DT/DB with strict confirmation (Rule 02).',
        icon: 'layers-outline',
      },
      {
        id: 'no_confirmation',
        label: 'Entered Without Confirmation',
        sub: 'No engulfing candle or 1H/5M CHOCH confirmed before entry (Rule 03).',
        icon: 'help-circle-outline',
      },
      {
        id: 'boredom_trade',
        label: 'Boredom / Forced Trade',
        sub: 'No valid level or POI; forced a trade in low-probability consolidation.',
        icon: 'bed-outline',
      },
      {
        id: 'traded_outside_killzone',
        label: 'Traded Outside London/NY Sessions',
        sub: 'Executed outside London or NY volume windows (Rule 14).',
        icon: 'time-outline',
      },
    ],
  },
  {
    id: 'entry_timing',
    title: 'Entry & Timing Errors',
    phase: 'Execution Phase',
    icon: 'flash-outline',
    color: '#F59E0B',
    items: [
      {
        id: 'jumped_early',
        label: 'Entered Before Candle Close',
        sub: 'Entered on a running candle before official bar closure.',
        icon: 'timer-outline',
      },
      {
        id: 'chased_price',
        label: 'Chased Moving Price (FOMO)',
        sub: 'Missed limit/level and chased late out of FOMO.',
        icon: 'rocket-outline',
      },
      {
        id: 'front_ran_level',
        label: 'Front-Ran Level (Entered Too Soon)',
        sub: 'Entered before price actually tapped the planned POI/level.',
        icon: 'arrow-forward-outline',
      },
    ],
  },
  {
    id: 'risk_sizing',
    title: 'Risk & Sizing Errors',
    phase: 'Capital Protection',
    icon: 'shield-half-outline',
    color: '#EF4444',
    items: [
      {
        id: 'oversized_lot',
        label: 'Lot Size Too Big (>1% Day Risk)',
        sub: 'Breached the maximum 1% account daily risk cap (Rule 04).',
        icon: 'layers-outline',
      },
      {
        id: 'tight_unnatural_sl',
        label: 'SL Too Tight (<12-15 Pts on Gold)',
        sub: 'Shrank SL unnaturally instead of lowering lot size to 0.01 (Rule 10 & 11).',
        icon: 'alert-circle-outline',
      },
      {
        id: 'naked_entry',
        label: 'No Stop-Loss Placed',
        sub: 'Entered without an immediate hard structural stop-loss in market (Rule 12).',
        icon: 'shield-outline',
      },
      {
        id: 'news_gamble',
        label: 'Traded During High-Impact News',
        sub: 'Traded around major macroeconomic news releases (Rule 15).',
        icon: 'newspaper-outline',
      },
    ],
  },
  {
    id: 'trade_management',
    title: 'Trade Management Errors',
    phase: 'Running Trade Phase',
    icon: 'swap-horizontal-outline',
    color: '#8B5CF6',
    items: [
      {
        id: 'choked_trade',
        label: 'Shifted SL to BE Prematurely',
        sub: 'Moved stop to BE prematurely before reaching 1:1.5 RR (Rule 07).',
        icon: 'hand-left-outline',
      },
      {
        id: 'widened_sl',
        label: 'Moved Stop-Loss Backward',
        sub: 'Widened the SL backward to avoid taking a loss (Rule 11).',
        icon: 'lock-open-outline',
      },
      {
        id: 'mid_trade_scaling',
        label: 'Interfered Mid-Trade / Added Size',
        sub: 'Modified lot size or interfered with order mid-trade (Rule 09).',
        icon: 'construct-outline',
      },
      {
        id: 'held_past_tp',
        label: 'Greedy (Did Not Book Partials at TP)',
        sub: 'Held past TP out of greed and gave back profits (Rule 08, 17).',
        icon: 'hourglass-outline',
      },
      {
        id: 'hope_trading',
        label: 'Hope Trading (Held Invalidation)',
        sub: 'Did not cut small loss instantly when PA invalidated (Rule 18).',
        icon: 'eye-off-outline',
      },
    ],
  },
  {
    id: 'mindset_overtrading',
    title: 'Mindset & Overtrading Errors',
    phase: 'Emotional Phase',
    icon: 'flame-outline',
    color: '#EC4899',
    items: [
      {
        id: 'revenge_trade',
        label: 'Revenge Trade (Anger)',
        sub: 'Urgency to make back previous loss immediately (Rule 20).',
        icon: 'flame-outline',
      },
      {
        id: 'aar_paar_mode',
        label: 'Aar-Paar Mode (All-or-Nothing)',
        sub: 'Entered double-lot or all-or-nothing mode under account pressure (Rule 20).',
        icon: 'nuclear-outline',
      },
      {
        id: 'broke_trade_limit',
        label: 'Overtraded (>2 Trades Limit)',
        sub: 'Exceeded maximum 2 trades per day limit (Rule 05).',
        icon: 'power-outline',
      },
      {
        id: 'no_cooldown_break',
        label: 'Skipped Cooldown Break After Loss',
        sub: 'Did not take mandatory 30-45 min cooldown break after first SL (Rule 19).',
        icon: 'pause-circle-outline',
      },
      {
        id: 'distracted_noise',
        label: 'Trading Noise (YouTube / Signals)',
        sub: 'Traded with background YouTube stream, signal channels, or chatter (Rule 16).',
        icon: 'volume-high-outline',
      },
    ],
  },
];

export const ALL_MISTAKE_ITEMS: MistakeItem[] = [
  FLAWLESS_MISTAKE_ITEM,
  ...MISTAKE_CATEGORIES.flatMap((cat) => cat.items),
  { id: 'custom', label: 'Custom Mistake', sub: 'Custom user-specified mistake or execution fault.', icon: 'construct-outline' },
];

export const MISTAKES = [
  ...ALL_MISTAKE_ITEMS.map((m) => ({
    value: m.id,
    label: m.label,
    sub: m.sub,
    icon: m.icon,
  })),
  // Legacy aliases for backward compatibility with past recorded trades
  { value: 'enteredEarly', label: 'Jumped Early', sub: 'Entered before confirmation', icon: 'play-skip-back-outline' },
  { value: 'lateEntry', label: 'Late Entry', sub: 'Entered after move started', icon: 'time-outline' },
  { value: 'noConfirmation', label: 'No Confirmation', sub: 'Entered without confirmation', icon: 'help-circle-outline' },
  { value: 'ignoredTrend', label: 'Ignored Trend', sub: 'Counter-trend entry', icon: 'trending-up-outline' },
  { value: 'riskTooHigh', label: 'Risk Too High', sub: 'Overleveraged position', icon: 'warning-outline' },
  { value: 'poorRR', label: 'Poor R:R', sub: 'Sub-optimal risk reward', icon: 'stats-chart-outline' },
  { value: 'noSL', label: 'No Stop Loss', sub: 'Unprotected trade', icon: 'shield-outline' },
  { value: 'closedEarly', label: 'Closed Early', sub: 'Premature exit', icon: 'exit-outline' },
  { value: 'heldTooLong', label: 'Held Too Long', sub: 'Did not take profit', icon: 'hourglass-outline' },
  { value: 'modifiedOrderRepeatedly', label: 'Modified Repeatedly', sub: 'Fidgeted with active order', icon: 'repeat-outline' },
  { value: 'chasedPrice', label: 'Chased Price', sub: 'FOMO market fill', icon: 'rocket-outline' },
  { value: 'noHigherTFCheck', label: 'No HTF Check', sub: 'Ignored HTF', icon: 'telescope-outline' },
  { value: 'stackedTooManyConfluences', label: 'Overcomplicated', sub: 'Analysis paralysis', icon: 'layers-outline' },
] as const;

export interface DisciplineChecklistItem {
  id: string;
  label: string;
  sub: string;
  icon: string;
}

export const DISCIPLINE_CHECKLIST_ITEMS: DisciplineChecklistItem[] = [
  {
    id: 'htf_level_15m_1h',
    label: '15M / 1H Key Level',
    sub: 'Confirmed 15M or 1H market structure level identified (Rule 01).',
    icon: 'telescope-outline',
  },
  {
    id: 'allowed_pattern',
    label: 'Valid Setup (QML/ISS4/TJL2/DT-DB)',
    sub: 'Strictly QML, ISS4, TJL2, or clean Double Top/Bottom with confirmation (Rule 02).',
    icon: 'layers-outline',
  },
  {
    id: 'mandatory_confirmation',
    label: 'Engulfing / CHOCH Confirmed',
    sub: 'Confirmed by an engulfing candle or 1H/5M CHOCH before entry (Rule 03).',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'risk_cap',
    label: 'Max 1% Day Risk Cap',
    sub: 'Strictly max 1% total risk per day; calculated lot to fit structural SL (Rule 04).',
    icon: 'calculator-outline',
  },
  {
    id: 'sl_immediate',
    label: 'Hard Structural SL Set',
    sub: 'SL placed outside structure, min 12-15 pts on Gold; compulsory on every trade (Rule 10, 12).',
    icon: 'shield-outline',
  },
  {
    id: 'zero_sl_widening',
    label: 'Never Widened Stop-Loss',
    sub: 'Never moved or widened the stop-loss backward to avoid loss (Rule 11).',
    icon: 'lock-closed-outline',
  },
  {
    id: 'max_two_trades',
    label: 'Max 2 Trades Day Limit',
    sub: 'Have not exceeded maximum 2 trades for the day; zero overtrading (Rule 05).',
    icon: 'ban-outline',
  },
  {
    id: 'killzone_execution',
    label: 'London / NY Session Only',
    sub: 'Trade taken strictly during London or New York volume sessions (Rule 14).',
    icon: 'time-outline',
  },
  {
    id: 'news_window_clear',
    label: 'No High-Impact News',
    sub: 'Stayed clear of major high-impact macroeconomic news releases (Rule 15).',
    icon: 'flash-outline',
  },
  {
    id: 'min_rr_feasible',
    label: 'Target 1:2+ R:R Feasible',
    sub: 'Target offers minimum 1:2 or 1:3 risk-to-reward ratio (Rule 06).',
    icon: 'scale-outline',
  },
  {
    id: 'emotionally_grounded',
    label: 'Calm Mindset (No Revenge / FOMO)',
    sub: 'Calm and focused; zero revenge urge or all-or-nothing mindset (Rule 20).',
    icon: 'leaf-outline',
  },
  {
    id: 'set_and_forget',
    label: 'Set & Forget (No Tampering)',
    sub: 'Let trade play out cleanly; zero emotional tampering or panic closing (Rule 09).',
    icon: 'hourglass-outline',
  },
];

export const DISCIPLINE_ITEMS = DISCIPLINE_CHECKLIST_ITEMS;

// Core discipline rules pre-selected by default
export const DEFAULT_DISCIPLINE_CHECKLIST: string[] = [
  'htf_level_15m_1h',
  'allowed_pattern',
  'mandatory_confirmation',
  'risk_cap',
  'sl_immediate',
  'zero_sl_widening',
  'max_two_trades',
  'killzone_execution',
  'news_window_clear',
  'min_rr_feasible',
  'emotionally_grounded',
  'set_and_forget',
];

// Suggested tags shown as quick-add chips on the Notes screen (Curated Essential Tags)
export const SUGGESTED_TAGS = [
  'A+ Setup',
  'Breakout',
  'Pullback',
  'Trend Follow',
  'Reversal',
  'Key Level',
  'High Volume',
  'Scalp Trade',
  'News Event',
  'Clean Entry',
  'Full Target',
  'Early Exit',
];

export const API_ENDPOINTS = {
  auth: {
    register:       '/auth/register',
    login:          '/auth/login',
    logout:         '/auth/logout',
    refresh:        '/auth/refresh',
    me:             '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword:  '/auth/reset-password',
    settings:       '/auth/settings',
    changePassword: '/auth/change-password',
  },
  trades:  '/trades',
  stats:   '/stats',
  goals:   '/goals',
  ai:      '/ai',
  export:  '/export',
};
