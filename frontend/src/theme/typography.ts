import { TextStyle } from 'react-native';

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};

export const fontWeights: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const lineHeights = {
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
};

export const typography = {
  // Display
  displayLg: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
    letterSpacing: -0.5,
  } as TextStyle,

  displayMd: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    letterSpacing: -0.5,
  } as TextStyle,

  // Headings
  h1: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['2xl'] * lineHeights.snug,
    letterSpacing: -0.3,
  } as TextStyle,

  h2: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.snug,
  } as TextStyle,

  h3: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.lg * lineHeights.snug,
  } as TextStyle,

  // Body
  bodyLg: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.md * lineHeights.normal,
  } as TextStyle,

  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.base * lineHeights.normal,
  } as TextStyle,

  bodySm: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.sm * lineHeights.normal,
  } as TextStyle,

  // Labels
  labelLg: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.1,
  } as TextStyle,

  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.1,
  } as TextStyle,

  labelSm: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.2,
  } as TextStyle,

  // Numeric / Data
  numeric: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  } as TextStyle,

  numericSm: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  // Caption
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.normal,
  } as TextStyle,
};
