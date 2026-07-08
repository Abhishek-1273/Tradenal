export const COMMON_PAIRS = [
  'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY',
  'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURJPY',
  'NAS100', 'US30', 'SPX500', 'UK100', 'GER40',
  'BTCUSD', 'ETHUSD', 'LTCUSD',
];

// Quick-access shortcuts shown above the searchable pair selector
export const QUICK_PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY'];

export const SESSIONS = [
  { value: 'london',  label: 'London',   icon: 'business-outline',        time: '08:00–17:00 GMT' },
  { value: 'newyork', label: 'New York', icon: 'trending-up-outline',     time: '13:00–22:00 GMT' },
  { value: 'asian',   label: 'Asian',    icon: 'partly-sunny-outline',    time: '00:00–09:00 GMT' },
  { value: 'overlap', label: 'Overlap',  icon: 'swap-horizontal-outline', time: '13:00–17:00 GMT' },
] as const;

export const SETUPS = [
  { value: 'breakout',          label: 'Breakout',             icon: 'expand-outline' },
  { value: 'liquiditySweep',    label: 'Liquidity Sweep',      icon: 'water-outline' },
  { value: 'smc',               label: 'SMC',                  icon: 'layers-outline' },
  { value: 'ict',               label: 'ICT',                  icon: 'school-outline' },
  { value: 'supportResistance', label: 'Support & Resistance', icon: 'resize-outline' },
  { value: 'trendFollowing',    label: 'Trend Following',      icon: 'analytics-outline' },
  { value: 'scalp',             label: 'Scalp',                icon: 'flash-outline' },
  { value: 'swing',             label: 'Swing',                icon: 'swap-vertical-outline' },
  { value: 'custom',            label: 'Custom',               icon: 'construct-outline' },
] as const;

export const RESULTS = [
  { value: 'win',        label: 'Win',         icon: 'trending-up',           colorKey: 'win' },
  { value: 'loss',       label: 'Loss',        icon: 'trending-down',         colorKey: 'loss' },
  { value: 'breakeven',  label: 'Break Even',  icon: 'remove-circle-outline', colorKey: 'breakeven' },
  { value: 'partialWin', label: 'Partial Win', icon: 'pie-chart-outline',     colorKey: 'partialWin' },
] as const;

export const EMOTIONS_BEFORE = [
  { value: 'confident', label: 'Confident', icon: 'shield-checkmark-outline' },
  { value: 'fear',      label: 'Fear',      icon: 'warning-outline' },
  { value: 'greedy',    label: 'Greedy',    icon: 'trending-up-outline' },
  { value: 'fomo',      label: 'FOMO',      icon: 'flash-outline' },
  { value: 'calm',      label: 'Calm',      icon: 'water-outline' },
  { value: 'excited',   label: 'Excited',   icon: 'sparkles-outline' },
] as const;

export const EMOTIONS_AFTER = [
  { value: 'happy',      label: 'Happy',      icon: 'happy-outline' },
  { value: 'frustrated', label: 'Frustrated', icon: 'sad-outline' },
  { value: 'angry',      label: 'Angry',      icon: 'flame-outline' },
  { value: 'satisfied',  label: 'Satisfied',  icon: 'checkmark-circle-outline' },
  { value: 'neutral',    label: 'Neutral',    icon: 'remove-circle-outline' },
] as const;

export const MISTAKES = [
  { value: 'enteredEarly',   label: 'Entered Early',   icon: 'play-skip-back-outline' },
  { value: 'lateEntry',      label: 'Late Entry',      icon: 'time-outline' },
  { value: 'noConfirmation', label: 'No Confirmation', icon: 'help-circle-outline' },
  { value: 'ignoredTrend',   label: 'Ignored Trend',   icon: 'trending-up-outline' },
  { value: 'riskTooHigh',    label: 'Risk Too High',   icon: 'warning-outline' },
  { value: 'poorRR',         label: 'Poor R:R',        icon: 'stats-chart-outline' },
  { value: 'noSL',           label: 'No Stop Loss',    icon: 'shield-outline' },
  { value: 'closedEarly',    label: 'Closed Early',    icon: 'exit-outline' },
  { value: 'heldTooLong',    label: 'Held Too Long',   icon: 'hourglass-outline' },
  { value: 'custom',         label: 'Other',           icon: 'ellipsis-horizontal-outline' },
] as const;

export const DISCIPLINE_ITEMS = [
  { name: 'followedPlan', label: 'Followed Plan?',     sub: 'Did you execute your strategy?', icon: 'clipboard-outline',     warn: false },
  { name: 'overtraded',   label: 'Overtraded?',        sub: 'Too many trades today?',         icon: 'repeat-outline',        warn: true },
  { name: 'movedSL',      label: 'Moved Stop Loss?',   sub: 'Did you move SL against plan?',  icon: 'trending-down-outline', warn: true },
  { name: 'movedTP',      label: 'Moved Take Profit?', sub: 'Did you change your TP?',        icon: 'flag-outline',          warn: true },
  { name: 'revengeTrade', label: 'Revenge Trade?',     sub: 'Trying to recover losses?',      icon: 'flame-outline',         warn: true },
  { name: 'newsTrade',    label: 'News Trade?',        sub: 'Around a news event?',           icon: 'newspaper-outline',     warn: false },
] as const;

// Suggested tags shown as quick-add chips on the Notes screen
export const SUGGESTED_TAGS = [
  'A+ Setup', 'FOMO', 'News', 'Clean Entry', 'Early Exit', 'Revenge Trade',
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
