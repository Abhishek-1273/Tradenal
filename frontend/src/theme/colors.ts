export const palette = {
  // Ultra-rich obsidian blacks
  black: '#000000',
  gray950: '#07080D', // Deep midnight obsidian
  gray900: '#0E111A', // Rich card surface
  gray850: '#141824', // Elevated surface
  gray800: '#1B2030', // Highlight surface
  gray750: '#242B40', // Hover / chip surface
  gray700: '#2E3650', // Border subtle
  gray600: '#434D6B',
  gray500: '#647094',
  gray400: '#94A0C2',
  gray300: '#C2CCE4',
  gray200: '#E2E8F4',
  gray100: '#F1F4FA',
  white: '#FFFFFF',

  // Pro Brand - Electric Indigo / Violet
  indigo500: '#6366F1',
  indigo400: '#818CF8',
  indigo600: '#4F46E5',
  indigo300: '#A5B4FC',
  indigo900: '#1E1B4B',

  // Electric Emerald (Wins / Profit)
  green500: '#10B981',
  green400: '#34D399',
  green600: '#059669',
  green900: '#064E3B',

  // Crimson Scarlet (Losses / Risk)
  red500: '#F43F5E',
  red400: '#FB7185',
  red600: '#E11D48',
  red900: '#4C0519',

  // Amber Gold (Breakeven / Warnings / Challenges)
  amber500: '#F59E0B',
  amber400: '#FBBF24',
  amber600: '#D97706',
  amber900: '#451A03',

  // Tech Cyan & Blue
  blue500: '#3B82F6',
  blue400: '#60A5FA',
  blue600: '#2563EB',
  cyan500: '#06B6D4',
  cyan400: '#22D3EE',

  // Electric Purple
  purple500: '#A855F7',
  purple400: '#C084FC',
  purple600: '#9333EA',

  // Teal
  teal500: '#14B8A6',
  teal400: '#2DD4BF',
};

export const darkColors = {
  // Backgrounds - Modern Obsidian & Glass
  background: palette.gray950,
  surface: palette.gray900,
  surfaceElevated: palette.gray850,
  surfaceHighlight: palette.gray800,
  surfaceGlass: 'rgba(20, 24, 36, 0.75)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  borderGlow: 'rgba(255, 255, 255, 0.20)',

  // Text
  textPrimary: palette.white,
  textSecondary: palette.gray300,
  textTertiary: palette.gray400,
  textDisabled: palette.gray600,

  // Brand - B&W (White as primary in dark mode)
  primary: palette.white,
  primaryLight: palette.gray200,
  primaryDark: palette.gray300,
  primarySubtle: 'rgba(255, 255, 255, 0.08)',
  primaryGlow: 'rgba(255, 255, 255, 0.15)',

  // Semantic - Electric Emerald for Wins
  success: palette.green500,
  successLight: palette.green400,
  successSubtle: 'rgba(16, 185, 129, 0.14)',
  successGlow: 'rgba(16, 185, 129, 0.35)',

  // Semantic - Crimson Rose for Losses
  error: palette.red500,
  errorLight: palette.red400,
  errorSubtle: 'rgba(244, 63, 94, 0.14)',
  errorGlow: 'rgba(244, 63, 94, 0.35)',

  // Semantic - Amber Gold for Breakeven
  warning: palette.amber500,
  warningLight: palette.amber400,
  warningSubtle: 'rgba(245, 158, 11, 0.14)',
  warningGlow: 'rgba(245, 158, 11, 0.35)',

  info: palette.cyan500,
  infoLight: palette.cyan400,
  infoSubtle: 'rgba(6, 182, 212, 0.14)',

  // Trade specific
  win: palette.green500,
  loss: palette.red500,
  breakeven: palette.amber500,
  partialWin: palette.teal500,

  // Chart colors
  chartLine: palette.gray300,
  chartGrid: 'rgba(255, 255, 255, 0.05)',

  // Overlays
  overlay: 'rgba(4, 5, 8, 0.82)',
  overlayLight: 'rgba(4, 5, 8, 0.5)',

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: [palette.gray700, palette.gray600] as string[],
  gradientSuccess: [palette.green600, palette.green500] as string[],
  gradientDanger: [palette.red600, palette.red500] as string[],
  gradientSurface: [palette.gray900, palette.gray850] as string[],
  gradientCard: ['rgba(20, 24, 38, 0.85)', 'rgba(11, 14, 23, 0.95)'] as string[],
  gradientCardHover: ['rgba(27, 32, 50, 0.9)', 'rgba(16, 20, 32, 0.98)'] as string[],
  gradientHero: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)', 'transparent'] as string[],
  gradientGold: [palette.amber600, palette.amber500] as string[],
};

export const lightColors: typeof darkColors = {
  background: '#F6F8FC',
  surface: palette.white,
  surfaceElevated: '#FFFFFF',
  surfaceHighlight: '#EEF2F8',
  surfaceGlass: 'rgba(255, 255, 255, 0.9)',
  border: 'rgba(0, 0, 0, 0.08)',
  borderSubtle: 'rgba(0, 0, 0, 0.04)',
  borderGlow: 'rgba(99, 102, 241, 0.2)',

  textPrimary: '#0C0F17',
  textSecondary: '#475467',
  textTertiary: '#667085',
  textDisabled: '#98A2B3',

  primary: '#0C0F17',
  primaryLight: palette.gray700,
  primaryDark: palette.black,
  primarySubtle: 'rgba(0, 0, 0, 0.06)',
  primaryGlow: 'rgba(0, 0, 0, 0.12)',

  success: palette.green600,
  successLight: palette.green500,
  successSubtle: 'rgba(16, 185, 129, 0.1)',
  successGlow: 'rgba(16, 185, 129, 0.2)',

  error: palette.red600,
  errorLight: palette.red500,
  errorSubtle: 'rgba(244, 63, 94, 0.1)',
  errorGlow: 'rgba(244, 63, 94, 0.2)',

  warning: palette.amber600,
  warningLight: palette.amber500,
  warningSubtle: 'rgba(245, 158, 11, 0.1)',
  warningGlow: 'rgba(245, 158, 11, 0.2)',

  info: palette.blue600,
  infoLight: palette.blue500,
  infoSubtle: 'rgba(37, 99, 235, 0.1)',

  win: palette.green600,
  loss: palette.red600,
  breakeven: palette.amber600,
  partialWin: palette.teal500,

  chartLine: palette.indigo500,
  chartGrid: 'rgba(0, 0, 0, 0.05)',

  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',

  gradientPrimary: [palette.indigo600, palette.indigo500],
  gradientSuccess: [palette.green600, palette.green500],
  gradientDanger: [palette.red600, palette.red500],
  gradientSurface: [palette.white, '#F1F4FA'],
  gradientCard: ['rgba(255, 255, 255, 0.98)', 'rgba(246, 248, 252, 0.95)'],
  gradientCardHover: ['#FFFFFF', '#EEF2F8'],
  gradientHero: ['rgba(99, 102, 241, 0.12)', 'rgba(16, 185, 129, 0.04)', 'transparent'],
  gradientGold: [palette.amber600, palette.amber500],
};

export type Colors = typeof darkColors;
