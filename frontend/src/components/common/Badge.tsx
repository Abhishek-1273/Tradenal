import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

type BadgeVariant = 'win' | 'loss' | 'breakeven' | 'partialWin' | 'buy' | 'sell' | 'primary' | 'neutral' | 'warning';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'sm',
  style,
  dot = false,
}) => {
  const { colors } = useTheme();

  const getColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'win':        return { bg: colors.successSubtle, text: colors.success };
      case 'loss':       return { bg: colors.errorSubtle, text: colors.error };
      case 'breakeven':  return { bg: colors.warningSubtle, text: colors.warning };
      case 'partialWin': return { bg: 'rgba(20,184,166,0.12)', text: colors.partialWin };
      case 'buy':        return { bg: colors.successSubtle, text: colors.success };
      case 'sell':       return { bg: colors.errorSubtle, text: colors.error };
      case 'primary':    return { bg: colors.primarySubtle, text: colors.primary };
      case 'warning':    return { bg: colors.warningSubtle, text: colors.warning };
      case 'neutral':
      default:           return { bg: colors.surfaceHighlight, text: colors.textSecondary };
    }
  };

  const { bg, text } = getColors();
  const isSmall = size === 'sm';

  const displayLabel = label
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 3 : 5,
          borderRadius: 999,
        },
        style,
      ]}
    >
      {dot && (
        <View style={[styles.dot, { backgroundColor: text }]} />
      )}
      <Text
        style={{
          color: text,
          fontSize: isSmall ? 11 : 13,
          fontWeight: '600',
          letterSpacing: 0.2,
        }}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },
});
