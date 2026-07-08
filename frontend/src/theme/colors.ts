export const palette = {
  // Core blacks
  black: '#000000',
  gray950: '#0A0A0B',
  gray900: '#111114',
  gray850: '#18181C',
  gray800: '#1E1E24',
  gray750: '#26262E',
  gray700: '#2E2E38',
  gray600: '#3E3E4E',
  gray500: '#5E5E72',
  gray400: '#8E8EA0',
  gray300: '#B4B4C8',
  gray200: '#D4D4E0',
  gray100: '#EBEBF0',
  white: '#FFFFFF',

  // Brand
  indigo500: '#6366F1',
  indigo400: '#818CF8',
  indigo600: '#4F46E5',
  indigo300: '#A5B4FC',

  // Semantic
  green500: '#22C55E',
  green400: '#4ADE80',
  green600: '#16A34A',
  green900: '#052E16',

  red500: '#EF4444',
  red400: '#F87171',
  red600: '#DC2626',
  red900: '#450A0A',

  amber500: '#F59E0B',
  amber400: '#FBBF24',
  amber600: '#D97706',
  amber900: '#451A03',

  blue500: '#3B82F6',
  blue400: '#60A5FA',
  blue600: '#2563EB',

  purple500: '#A855F7',
  purple400: '#C084FC',

  teal500: '#14B8A6',
  teal400: '#2DD4BF',

  cyan500: '#06B6D4',
};

export const darkColors = {
  // Backgrounds
  background: palette.gray950,
  surface: palette.gray900,
  surfaceElevated: palette.gray850,
  surfaceHighlight: palette.gray800,
  border: palette.gray750,
  borderSubtle: palette.gray700,

  // Text
  textPrimary: palette.white,
  textSecondary: palette.gray300,
  textTertiary: palette.gray400,
  textDisabled: palette.gray500,

  // Brand
  primary: palette.indigo500,
  primaryLight: palette.indigo400,
  primaryDark: palette.indigo600,
  primarySubtle: 'rgba(99, 102, 241, 0.12)',

  // Semantic
  success: palette.green500,
  successLight: palette.green400,
  successSubtle: 'rgba(34, 197, 94, 0.12)',

  error: palette.red500,
  errorLight: palette.red400,
  errorSubtle: 'rgba(239, 68, 68, 0.12)',

  warning: palette.amber500,
  warningLight: palette.amber400,
  warningSubtle: 'rgba(245, 158, 11, 0.12)',

  info: palette.blue500,
  infoLight: palette.blue400,
  infoSubtle: 'rgba(59, 130, 246, 0.12)',

  // Trade specific
  win: palette.green500,
  loss: palette.red500,
  breakeven: palette.amber500,
  partialWin: palette.teal500,

  // Chart colors
  chartLine: palette.indigo400,
  chartGrid: palette.gray800,

  // Overlays
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: [palette.indigo600, palette.indigo500] as string[],
  gradientSuccess: [palette.green600, palette.green500] as string[],
  gradientDanger: [palette.red600, palette.red500] as string[],
  gradientSurface: [palette.gray900, palette.gray850] as string[],
  gradientCard: ['rgba(30,30,36,0.9)', 'rgba(18,18,22,0.95)'] as string[],
};

export const lightColors: typeof darkColors = {
  background: palette.gray100,
  surface: palette.white,
  surfaceElevated: palette.gray100,
  surfaceHighlight: palette.gray200,
  border: palette.gray200,
  borderSubtle: palette.gray300,

  textPrimary: palette.gray950,
  textSecondary: palette.gray600,
  textTertiary: palette.gray500,
  textDisabled: palette.gray400,

  primary: palette.indigo500,
  primaryLight: palette.indigo400,
  primaryDark: palette.indigo600,
  primarySubtle: 'rgba(99, 102, 241, 0.1)',

  success: palette.green600,
  successLight: palette.green500,
  successSubtle: 'rgba(22, 163, 74, 0.1)',

  error: palette.red600,
  errorLight: palette.red500,
  errorSubtle: 'rgba(220, 38, 38, 0.1)',

  warning: palette.amber600,
  warningLight: palette.amber500,
  warningSubtle: 'rgba(217, 119, 6, 0.1)',

  info: palette.blue600,
  infoLight: palette.blue500,
  infoSubtle: 'rgba(37, 99, 235, 0.1)',

  win: palette.green600,
  loss: palette.red600,
  breakeven: palette.amber600,
  partialWin: palette.teal500,

  chartLine: palette.indigo500,
  chartGrid: palette.gray200,

  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.2)',

  gradientPrimary: [palette.indigo600, palette.indigo500],
  gradientSuccess: [palette.green600, palette.green500],
  gradientDanger: [palette.red600, palette.red500],
  gradientSurface: [palette.white, palette.gray100],
  gradientCard: ['rgba(255,255,255,0.95)', 'rgba(240,240,245,0.9)'],
};

export type Colors = typeof darkColors;
