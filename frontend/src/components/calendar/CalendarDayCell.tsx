import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface CalendarDayCellProps {
  day: number;
  isToday: boolean;
  isSelected: boolean;
  hasData: boolean;
  isPositive: boolean;
  isNeutral: boolean;
  tradeCount: number;
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
  onPress,
}) => {
  const { colors, typography, radii } = useTheme();

  const statusColor = isNeutral ? colors.warning : isPositive ? colors.success : colors.error;

  const bg = isSelected ? colors.primary : hasData ? statusColor + '1c' : 'transparent';

  const textColor = isSelected ? '#fff' : hasData ? statusColor : isToday ? colors.primary : colors.textSecondary;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
      <View
        style={[
          styles.inner,
          {
            backgroundColor: bg,
            borderRadius: radii.md,
            borderWidth: isToday && !isSelected ? 1.5 : 0,
            borderColor: colors.primary,
          },
        ]}
      >
        <Text style={[typography.labelSm, { color: textColor, fontWeight: isSelected || isToday ? '700' : '500' }]}>
          {day}
        </Text>
        {hasData && (
          <View style={styles.indicatorRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: isSelected ? '#fff' : statusColor },
              ]}
            />
            {tradeCount > 1 && (
              <Text style={[styles.count, { color: isSelected ? '#fff' : colors.textTertiary }]}>{tradeCount}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '14.28%',
    aspectRatio: 0.92,
    padding: 2,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  count: {
    fontSize: 8,
    marginLeft: 2,
    fontWeight: '600',
  },
});
