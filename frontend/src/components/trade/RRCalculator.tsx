import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { calcRiskReward, calcRMultiple, calcPnL } from '../../utils/formatters';

interface RRCalculatorProps {
  tradeType: 'buy' | 'sell';
  entryPrice: string;
  stopLoss?: string;
  takeProfit?: string;
  exitPrice?: string;
  lotSize: string;
  riskPercent: string;
}

export const RRCalculator: React.FC<RRCalculatorProps> = ({
  tradeType, entryPrice, stopLoss, takeProfit, exitPrice, lotSize, riskPercent,
}) => {
  const { colors, typography, radii, spacing } = useTheme();

  const ep = parseFloat(entryPrice);
  const sl = parseFloat(stopLoss ?? '');
  const tp = parseFloat(takeProfit ?? '');
  const ex = parseFloat(exitPrice ?? '');
  const ls = parseFloat(lotSize);
  const rp = parseFloat(riskPercent);

  const hasMinimum = ep > 0 && sl > 0 && tp > 0;
  const hasExit = ex > 0;

  const rr = hasMinimum ? calcRiskReward(ep, sl, tp) : null;
  const rMul = hasMinimum && hasExit ? calcRMultiple(tradeType, ep, sl, ex) : null;

  const getRRColor = (val: number) => {
    if (val >= 2) return colors.success;
    if (val >= 1.5) return colors.successLight;
    if (val >= 1) return colors.warning;
    return colors.error;
  };

  if (!hasMinimum) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing[4],
          marginBottom: spacing[4],
        },
      ]}
    >
      <Text style={[typography.label, { color: colors.textTertiary, marginBottom: spacing[3] }]}>
        LIVE CALCULATION
      </Text>

      <View style={styles.row}>
        {/* Risk:Reward */}
        <View style={styles.metricBlock}>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>Risk:Reward</Text>
          <Text
            style={[
              typography.numeric,
              { color: getRRColor(rr ?? 0), fontSize: 28 },
            ]}
          >
            {rr !== null ? `1:${rr.toFixed(2)}` : '—'}
          </Text>
          {rr !== null && (
            <View
              style={[
                styles.rrBadge,
                {
                  backgroundColor: getRRColor(rr) + '20',
                  borderRadius: radii.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: getRRColor(rr), fontWeight: '600' },
                ]}
              >
                {rr >= 2 ? '🔥 Excellent' : rr >= 1.5 ? '✅ Good' : rr >= 1 ? '⚠️ Marginal' : '❌ Poor'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Right column */}
        <View style={styles.rightCol}>
          <View style={styles.metricRow}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>Risk %</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>
              {rp > 0 ? `${rp}%` : '—'}
            </Text>
          </View>

          <View style={[styles.metricRow, { marginTop: spacing[2] }]}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>R-Multiple</Text>
            <Text
              style={[
                typography.label,
                {
                  color:
                    rMul !== null
                      ? rMul >= 0
                        ? colors.success
                        : colors.error
                      : colors.textTertiary,
                },
              ]}
            >
              {rMul !== null ? `${rMul >= 0 ? '+' : ''}${rMul.toFixed(2)}R` : '—'}
            </Text>
          </View>

          <View style={[styles.metricRow, { marginTop: spacing[2] }]}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>Lot Size</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>
              {ls > 0 ? ls.toFixed(2) : '—'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  row: { flexDirection: 'row', alignItems: 'center' },
  metricBlock: { flex: 1 },
  rrBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  divider: {
    width: 1,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
  },
  rightCol: { flex: 1 },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
