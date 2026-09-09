import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../theme';

interface WinLossPieProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  showLegend?: boolean;
}

const fontBase = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  includeFontPadding: false,
};

export const WinLossPie: React.FC<WinLossPieProps> = ({
  data,
  size = 110,
}) => {
  const { colors, isDark } = useTheme();

  const wins = data?.find((d) => d.label.toLowerCase().includes('win'))?.value ?? 0;
  const losses = data?.find((d) => d.label.toLowerCase().includes('loss'))?.value ?? 0;
  const total = wins + losses;

  const radius = (size - 18) / 2;
  const circumference = 2 * Math.PI * radius;

  const winPercent = total > 0 ? wins / total : 0;
  const winStrokeLength = winPercent * circumference;
  const gap = total > 0 && wins > 0 && losses > 0 ? 6 : 0;

  return (
    <View style={styles.container}>
      {/* Donut Chart */}
      <View style={[styles.chartWrap, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {total === 0 ? (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}
                strokeWidth="9"
                fill="none"
              />
            ) : (
              <>
                {/* Background / Loss Track */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#EF4444"
                  strokeWidth="9"
                  fill="none"
                  strokeDasharray={`${circumference - winStrokeLength - gap} ${circumference}`}
                  strokeDashoffset={-winStrokeLength - gap / 2}
                  strokeLinecap="round"
                />
                {/* Win Arc */}
                {wins > 0 && (
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#10B981"
                    strokeWidth="9"
                    fill="none"
                    strokeDasharray={`${winStrokeLength - gap} ${circumference}`}
                    strokeDashoffset={-gap / 2}
                    strokeLinecap="round"
                  />
                )}
              </>
            )}
          </G>
        </Svg>

        {/* Center Text */}
        <View style={styles.centerText}>
          <Text style={[styles.totalNumber, { color: colors.textPrimary }]}>{total}</Text>
          <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>Trades</Text>
        </View>
      </View>

      {/* Breakdown Rows */}
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Wins</Text>
          <Text style={[styles.legendValue, { color: colors.textPrimary }]}>{wins}</Text>
        </View>

        <View style={[styles.legendRow, { marginTop: 6 }]}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Losses</Text>
          <Text style={[styles.legendValue, { color: colors.textPrimary }]}>{losses}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalNumber: {
    ...fontBase,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  totalLabel: {
    ...fontBase,
    fontSize: 10,
    fontWeight: '600',
    marginTop: -1,
  },
  legendContainer: {
    width: '100%',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 8,
  },
  legendLabel: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  legendValue: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '700',
  },
});
