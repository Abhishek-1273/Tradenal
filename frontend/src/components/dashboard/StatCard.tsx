import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: string;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  highlight?: boolean;
  highlightColor?: string;
  style?: ViewStyle;
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  label,
  value,
  subValue,
  icon,
  iconColor,
  trend,
  trendValue,
  highlight = false,
  highlightColor,
  style,
  compact = false,
}) => {
  const { colors, typography, radii, spacing, shadows } = useTheme();

  const accentColor = highlightColor ?? colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: highlight ? accentColor + '40' : colors.border,
          padding: compact ? 10 : spacing[4],
          backgroundColor: colors.surface,
          ...shadows.sm,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={highlight ? [accentColor + '18', 'transparent'] : (colors.gradientCard as [string, string])}
        style={[StyleSheet.absoluteFill, { borderRadius: radii.xl }]}
        pointerEvents="none"
      />

      {/* Header row */}
      <View style={styles.header}>
        <Text
          style={[
            typography.labelSm,
            {
              color: colors.textTertiary,
              flex: 1,
              fontWeight: '700',
              fontSize: compact ? 9.5 : 11,
              letterSpacing: compact ? 0.3 : 0.6,
              marginRight: 4,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {label.toUpperCase()}
        </Text>
        {icon && (
          <View
            style={[
              styles.iconWrap,
              {
                width: compact ? 20 : 24,
                height: compact ? 20 : 24,
                backgroundColor: (iconColor ?? colors.primary) + '20',
                borderRadius: radii.sm,
              },
            ]}
          >
            <Ionicons
              name={icon as any}
              size={compact ? 11 : 13}
              color={iconColor ?? colors.primary}
            />
          </View>
        )}
      </View>

      {/* Value */}
      <Text
        style={[
          compact ? typography.numericSm : typography.numeric,
          {
            color: highlight ? accentColor : colors.textPrimary,
            marginTop: spacing[1.5],
            fontWeight: '800',
            letterSpacing: -0.3,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      {/* Sub-value / trend */}
      {(subValue || trend) && (
        <View style={[styles.footer, { marginTop: spacing[1] }]}>
          {trend && trendValue && (
            <View style={styles.trendRow}>
              <Ionicons
                name={
                  trend === 'up'
                    ? 'trending-up'
                    : trend === 'down'
                    ? 'trending-down'
                    : 'remove'
                }
                size={12}
                color={
                  trend === 'up'
                    ? colors.success
                    : trend === 'down'
                    ? colors.error
                    : colors.textTertiary
                }
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color:
                      trend === 'up'
                        ? colors.success
                        : trend === 'down'
                        ? colors.error
                        : colors.textTertiary,
                    marginLeft: 3,
                    fontWeight: '600',
                  },
                ]}
              >
                {trendValue}
              </Text>
            </View>
          )}
          {subValue && (
            <Text
              style={[typography.caption, { color: colors.textTertiary, fontWeight: '500' }]}
            >
              {subValue}
            </Text>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

