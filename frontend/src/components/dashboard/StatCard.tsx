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

export const StatCard: React.FC<StatCardProps> = ({
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
  const { colors, typography, radii, spacing } = useTheme();

  const accentColor = highlightColor ?? colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: highlight ? accentColor + '40' : colors.border,
          padding: compact ? spacing[3] : spacing[4],
        },
        style,
      ]}
    >
      {highlight && (
        <LinearGradient
          colors={[accentColor + '18', 'transparent']}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.xl }]}
          pointerEvents="none"
        />
      )}

      {/* Header row */}
      <View style={styles.header}>
        <Text
          style={[
            typography.labelSm,
            { color: colors.textTertiary, flex: 1 },
          ]}
          numberOfLines={1}
        >
          {label.toUpperCase()}
        </Text>
        {icon && (
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: (iconColor ?? colors.primary) + '20' },
            ]}
          >
            <Ionicons
              name={icon as any}
              size={14}
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
                  },
                ]}
              >
                {trendValue}
              </Text>
            </View>
          )}
          {subValue && (
            <Text
              style={[typography.caption, { color: colors.textTertiary }]}
            >
              {subValue}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

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
    borderRadius: 8,
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
