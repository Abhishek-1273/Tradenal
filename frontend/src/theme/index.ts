import { createContext, useContext } from 'react';
import { darkColors, lightColors, Colors } from './colors';
import { typography } from './typography';
import { spacing, radii, shadows } from './spacing';

export { darkColors, lightColors, typography, spacing, radii, shadows };
export type { Colors };

export interface Theme {
  colors: Colors;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  isDark: boolean;
}

export const createTheme = (isDark: boolean): Theme => ({
  colors: isDark ? darkColors : lightColors,
  typography,
  spacing,
  radii,
  shadows,
  isDark,
});

export const ThemeContext = createContext<Theme>(createTheme(true));

export const useTheme = (): Theme => {
  return useContext(ThemeContext);
};

// React Native Paper theme adapter
export const getPaperTheme = (isDark: boolean) => ({
  dark: isDark,
  colors: {
    primary: isDark ? darkColors.primary : lightColors.primary,
    background: isDark ? darkColors.background : lightColors.background,
    card: isDark ? darkColors.surface : lightColors.surface,
    text: isDark ? darkColors.textPrimary : lightColors.textPrimary,
    border: isDark ? darkColors.border : lightColors.border,
    notification: isDark ? darkColors.primary : lightColors.primary,
    surface: isDark ? darkColors.surface : lightColors.surface,
    onSurface: isDark ? darkColors.textPrimary : lightColors.textPrimary,
    surfaceVariant: isDark ? darkColors.surfaceElevated : lightColors.surfaceElevated,
    onSurfaceVariant: isDark ? darkColors.textSecondary : lightColors.textSecondary,
    outline: isDark ? darkColors.border : lightColors.border,
    error: isDark ? darkColors.error : lightColors.error,
    onError: '#ffffff',
    elevation: {
      level0: 'transparent',
      level1: isDark ? darkColors.surface : lightColors.surface,
      level2: isDark ? darkColors.surfaceElevated : lightColors.surfaceElevated,
      level3: isDark ? darkColors.surfaceHighlight : lightColors.surfaceHighlight,
      level4: isDark ? darkColors.surfaceHighlight : lightColors.surfaceHighlight,
      level5: isDark ? darkColors.surfaceHighlight : lightColors.surfaceHighlight,
    },
  },
});
