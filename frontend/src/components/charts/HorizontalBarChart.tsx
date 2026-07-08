import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface HBarItem {
  label: string;
  value: number;
  maxValue?: number;
  subLabel?: string;
  color?: string;
}

interface HorizontalBarChartProps {
  data: HBarItem[];
  title?: string;
  valueFormat?: (v: number) => string;
  style?: ViewStyle;
  showValue?: boolean;
  maxBars?: number;
  colorFn?: (item: HBarItem, index: number) => string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  title,
  valueFormat,
  style,
  showValue = true,
  maxBars = 8,
  colorFn,
}) => {
  const { colors, typography, spacing, radii } = useTheme();

  const displayed = data.slice(0, maxBars);
  const globalMax = Math.max(...displayed.map((d) => Math.abs(d.value)));

  return (
    <View style={style}>
      {title && (
        <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[3] }]}>
          {title}
        </Text>
      )}
      {displayed.map((item, index) => {
        const ratio = globalMax > 0 ? Math.abs(item.value) / globalMax : 0;
        const barColor =
          item.color ??
          (colorFn ? colorFn(item, index) : item.value >= 0 ? colors.success : colors.error);

        return (
          <View key={item.label} style={[styles.row, { marginBottom: spacing[3] }]}>
            {/* Label */}
            <View style={styles.labelCol}>
              <Text
                style={[typography.label, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {item.subLabel && (
                <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                  {item.subLabel}
                </Text>
              )}
            </View>

            {/* Bar */}
            <View style={[styles.barTrack, { backgroundColor: colors.surfaceHighlight, borderRadius: radii.sm }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${ratio * 100}%`,
                    backgroundColor: barColor,
                    borderRadius: radii.sm,
                    opacity: 0.85,
                  },
                ]}
              />
            </View>

            {/* Value */}
            {showValue && (
              <Text
                style={[
                  typography.label,
                  { color: barColor, width: 52, textAlign: 'right' },
                ]}
              >
                {valueFormat ? valueFormat(item.value) : item.value.toFixed(1)}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labelCol: {
    width: 80,
  },
  barTrack: {
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
});
