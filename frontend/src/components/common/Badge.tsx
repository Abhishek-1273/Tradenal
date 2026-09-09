import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

type BadgeVariant = 'win' | 'loss' | 'breakeven' | 'partialWin' | 'buy' | 'sell' | 'primary' | 'neutral' | 'warning' | 'info';

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

  const getColors = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case 'win':
        return { bg: colors.successSubtle, text: colors.successLight, border: colors.success + '40' };
      case 'loss':
        return { bg: colors.errorSubtle, text: colors.errorLight, border: colors.error + '40' };
      case 'breakeven':
        return { bg: colors.warningSubtle, text: colors.warningLight, border: colors.warning + '40' };
      case 'partialWin':
        return { bg: 'rgba(20,184,166,0.14)', text: colors.partialWin, border: 'rgba(20,184,166,0.35)' };
      case 'buy':
        return { bg: 'rgba(16, 185, 129, 0.16)', text: colors.successLight, border: colors.success + '50' };
      case 'sell':
        return { bg: 'rgba(244, 63, 94, 0.16)', text: colors.errorLight, border: colors.error + '50' };
      case 'primary':
        return { bg: colors.primarySubtle, text: colors.primaryLight, border: colors.primary + '40' };
      case 'warning':
        return { bg: colors.warningSubtle, text: colors.warningLight, border: colors.warning + '40' };
      case 'info':
        return { bg: colors.infoSubtle, text: colors.infoLight, border: colors.info + '40' };
      case 'neutral':
      default:
        return { bg: colors.surfaceHighlight, text: colors.textSecondary, border: colors.border };
    }
  };

  const { bg, text, border } = getColors();
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
          borderColor: border,
          borderWidth: 1,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 3.5 : 5.5,
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
          fontSize: isSmall ? 10.5 : 12.5,
          fontWeight: '700',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
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
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
});

