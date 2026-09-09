import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme';

const fontBase = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  includeFontPadding: false,
};

interface CalendarDayCellProps {
  day: number;
  isToday: boolean;
  isSelected: boolean;
  hasData: boolean;
  isPositive: boolean;
  isNeutral: boolean;
  tradeCount: number;
  netRR?: number;
  netPnL?: number;
  onPress: () => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  isToday,
  isSelected,
  hasData,
  isPositive,
  isNeutral,
  tradeCount,
  netRR,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  const statusColor = isNeutral ? '#F59E0B' : isPositive ? '#10B981' : '#EF4444';
  const statusBg = isNeutral
    ? isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.12)'
    : isPositive
    ? isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.12)'
    : isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.12)';

  const bg = isSelected
    ? colors.primary
    : hasData
    ? statusBg
    : 'transparent';

  const dayTextColor = isSelected
    ? (isDark ? '#0F172A' : '#FFFFFF')
    : hasData
    ? (isDark ? '#FFFFFF' : '#0F172A')
    : isToday
    ? colors.primary
    : colors.textSecondary;

  const returnTextColor = isSelected
    ? (isDark
        ? (isPositive ? '#047857' : isNeutral ? '#B45309' : '#B91C1C')
        : (isPositive ? '#34D399' : isNeutral ? '#FBBF24' : '#FB7185'))
    : statusColor;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.72} style={styles.touchable}>
      <View
        style={[
          styles.inner,
          {
            backgroundColor: bg,
            borderRadius: 10,
            borderWidth: isSelected
              ? 2
              : isToday
              ? 1.5
              : hasData
              ? 1
              : 0,
            borderColor: isSelected
              ? isDark ? '#FFFFFF' : '#0F172A'
              : isToday
              ? colors.primary
              : hasData
              ? isNeutral
                ? 'rgba(245, 158, 11, 0.35)'
                : isPositive
                ? 'rgba(16, 185, 129, 0.35)'
                : 'rgba(239, 68, 68, 0.35)'
              : 'transparent',
          },
        ]}
      >
        <Text style={[styles.dayText, { color: dayTextColor, fontWeight: isSelected || isToday || hasData ? '700' : '500' }]}>
          {day}
        </Text>

        {hasData && tradeCount > 0 && (
          <View style={styles.returnWrap}>
            <Text
              style={[
                styles.returnText,
                { color: returnTextColor },
              ]}
              numberOfLines={1}
            >
              {tradeCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '14.28%',
    aspectRatio: 0.82,
    padding: 2,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayText: {
    ...fontBase,
    fontSize: 12.5,
  },
  returnWrap: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  returnText: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '800',
  },
});
