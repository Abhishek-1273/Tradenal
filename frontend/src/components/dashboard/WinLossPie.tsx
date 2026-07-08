import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryPie } from 'victory-native';
import { useTheme } from '../../theme';

interface WinLossPieProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  showLegend?: boolean;
}

export const WinLossPie: React.FC<WinLossPieProps> = ({
  data,
  size = 140,
  showLegend = true,
}) => {
  const { colors, typography, spacing } = useTheme();

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <View style={[styles.empty, { width: size, height: size }]}>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>No data</Text>
      </View>
    );
  }

  const chartData = data.map((d) => ({
    x: d.label,
    y: d.value,
    color: d.color,
  }));

  return (
    <View style={styles.row}>
      <View style={[styles.chartWrap, { width: size, height: size }]}>
        <VictoryPie
          data={chartData}
          width={size}
          height={size}
          padding={8}
          innerRadius={size * 0.28}
          colorScale={data.map((d) => d.color)}
          labels={() => null}
          style={{
            data: {
              stroke: colors.background,
              strokeWidth: 2,
            },
          }}
        />
        {/* Center label */}
        <View style={styles.centerLabel}>
          <Text style={[typography.numericSm, { color: colors.textPrimary }]}>
            {total}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            Trades
          </Text>
        </View>
      </View>

      {showLegend && (
        <View style={[styles.legend, { marginLeft: spacing[4] }]}>
          {data.map((item) => {
            const pct = ((item.value / total) * 100).toFixed(0);
            return (
              <View key={item.label} style={[styles.legendItem, { marginBottom: spacing[2] }]}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View>
                  <Text style={[typography.label, { color: colors.textPrimary }]}>
                    {item.value}{' '}
                    <Text style={{ color: colors.textTertiary }}>({pct}%)</Text>
                  </Text>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>
                    {item.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flex: 1,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
