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
        label: 'Ignored Higher Timeframe Trend',
        sub: 'Entered counter to the 4H/1H macro trend or major order flow.',
        icon: 'trending-down-outline',
      },
      {
        id: 'boredom_trade',
        label: 'Boredom Trade (No Clean Setup)',
        sub: 'No valid TOPG level or key POI; forced a trade in low-probability consolidation.',
        icon: 'bed-outline',
      },
      {
        id: 'traded_outside_killzone',
        label: 'Traded Outside Killzone Times',
        sub: 'Executed outside London (12:30–15:30 IST) or NY (17:30–21:00 IST) volume windows.',
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
        label: 'Entered in a Hurry',
        sub: 'Entered on a running candle before official bar closure.',
        icon: 'timer-outline',
      },
      {
        id: 'chased_price',
        label: 'Chased Moving Price',
        sub: 'Missed limit/level and chased late out of FOMO.',
        icon: 'rocket-outline',
      },
      {
        id: 'front_ran_level',
        label: 'Entered Before Level Hit',
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
        label: 'Lot Size Too Big (>1%)',
        sub: 'Breached the ≤ 1% account risk cap.',
        icon: 'layers-outline',
      },
      {
        id: 'naked_entry',
        label: 'No Stop-Loss Set',
        sub: 'Entered without an immediate hard stop-loss in the market.',
        icon: 'shield-outline',
      },
      {
        id: 'news_gamble',
        label: 'Traded During High News',
        sub: 'Traded around major economic news releases.',
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
        label: 'Shifted SL Too Early',
        sub: 'Moved stop to BE prematurely and got wicked out.',
        icon: 'hand-left-outline',
      },
      {
        id: 'widened_sl',
        label: 'Moved Stop-Loss Back',
        sub: 'Widened the SL backward to avoid taking a loss.',
        icon: 'lock-open-outline',
      },
      {
        id: 'panic_cut',
        label: 'Exited Early Out of Fear',
        sub: 'Manually exited winning trade way before planned target out of anxiety.',
        icon: 'exit-outline',
      },
      {
        id: 'held_past_tp',
        label: 'Greedy (Didn\'t Book Profit)',
        sub: 'Held past TP out of greed and gave back profits.',
        icon: 'hourglass-outline',
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
        sub: 'Urgency to make back previous loss immediately.',
        icon: 'flame-outline',
      },
      {
        id: 'broke_one_and_done',
        label: 'Overtraded (Took Extra Trade)',
        sub: 'Exceeded strict 1 trade/day rule.',
        icon: 'power-outline',
      },
      {
        id: 'screen_staring',
        label: 'Stared at Live Profit/Loss',
        sub: 'Watched live tick-by-tick PnL anxiously.',
        icon: 'phone-portrait-outline',
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
  // ── High Compliance / Common Core Rules (Pre-selected by default) ──
  {
    id: 'plan_followed',
    label: 'Followed My Plan',
    sub: 'Executed purely based on pre-defined strategy rules without impromptu tweaks.',
    icon: 'document-text-outline',
  },
  {
    id: 'risk_cap',
    label: 'Risked Under 1%',
    sub: 'Planned or realized risk strictly kept within ≤ 1% total account balance.',
    icon: 'shield-half-outline',
  },
  {
    id: 'sl_immediate',
    label: 'Set Stop-Loss at Entry',
    sub: 'Never entered a naked trade; hard SL was in the market instantly.',
    icon: 'shield-outline',
  },
  {
    id: 'zero_sl_widening',
    label: 'Didn\'t Increase Stop-Loss',
    sub: 'Did not move or widen the stop-loss backward to avoid getting stopped out.',
    icon: 'lock-closed-outline',
  },
  {
    id: 'one_and_done',
    label: 'Only 1 Trade Taken',
    sub: 'Strictly took only 1 trade for the day; closed terminal regardless of outcome.',
    icon: 'power-outline',
  },
  {
    id: 'not_revenge_trade',
    label: 'Not a Revenge Trade',
    sub: "Entered with zero emotional urgency to recover previous loss.",
    icon: 'heart-outline',
  },
  {
    id: 'clean_entry_no_chase',
    label: 'Didn\'t Chase Price',
    sub: 'Filled at planned limit/key level; did not chase price late.',
    icon: 'locate-outline',
  },
  {
    id: 'news_window_clear',
    label: 'Avoided Big News',
    sub: 'No active entry within 15 minutes before or during major economic releases.',
    icon: 'newspaper-outline',
  },
  {
    id: 'killzone_execution',
    label: 'Traded in Session Time',
    sub: 'Trade taken strictly during London or NY volume windows.',
    icon: 'time-outline',
  },
  {
    id: 'pre_market_routine',
    label: 'Checked Trend First',
    sub: 'Top-down HTF directional bias established before entering session.',
    icon: 'telescope-outline',
  },
  {
    id: 'setup_liquidity_alignment',
    label: 'Proper Setup Appeared',
    sub: 'Valid setup tap confirmed after a clear liquidity sweep.',
    icon: 'water-outline',
  },
  {
    id: 'min_rr_feasible',
    label: 'Target at Least 2x Risk',
    sub: 'Setup had legitimate room to hit at least 1:2 RR without obstacles.',
    icon: 'trending-up-outline',
  },
  {
    id: 'not_boredom_trade',
    label: 'Not a Boredom Trade',
    sub: 'Did not force a trade during consolidation just to feel active.',
    icon: 'cafe-outline',
  },
  {
    id: 'emotionally_grounded',
    label: 'Calm & Relaxed Mind',
    sub: 'Felt calm, rested, and free from emotional distraction.',
    icon: 'leaf-outline',
  },

  // ── Execution Challenges & Conditional Rules (Trader explicitly toggles) ──
  {
    id: 'candle_close_confirmation',
    label: 'Waited for Candle Close',
    sub: 'Did not jump in on a running bar; waited for official bar close.',
    icon: 'timer-outline',
  },
  {
    id: 'be_shift_per_rules',
    label: 'Made Trade Risk-Free',
    sub: 'Protected capital at structure without choking the trade early.',
    icon: 'swap-horizontal-outline',
  },
  {
    id: 'let_winners_run',
    label: 'Waited for Full Target',
    sub: 'Did not manually cut a winning trade prematurely out of fear.',
    icon: 'trophy-outline',
  },
  {
    id: 'screen_detached',
    label: 'Closed Screen After Entry',
    sub: 'Set SL & TP and stepped away; did not stare at live P&L.',
    icon: 'laptop-outline',
  },
];

export const DISCIPLINE_ITEMS = DISCIPLINE_CHECKLIST_ITEMS;

// Common rules with low probability of breaking are pre-selected by default
export const DEFAULT_DISCIPLINE_CHECKLIST: string[] = [
  'plan_followed',
  'risk_cap',
  'sl_immediate',
  'zero_sl_widening',
  'one_and_done',
  'not_revenge_trade',
  'clean_entry_no_chase',
  'news_window_clear',
  'killzone_execution',
  'pre_market_routine',
  'setup_liquidity_alignment',
  'min_rr_feasible',
  'not_boredom_trade',
  'emotionally_grounded',
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
