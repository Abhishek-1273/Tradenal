import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { calcRiskReward, calcRMultiple } from '../../utils/formatters';
import { useAccountStore } from '../../store/account.store';
import { calculateRiskCapAudit } from '../../utils/riskCap';

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
  tradeType,
  entryPrice,
  stopLoss,
  takeProfit,
  exitPrice,
  lotSize,
  riskPercent,
}) => {
  const { colors, typography, radii, spacing } = useTheme();
  const { activeAccount } = useAccountStore();
  const riskAudit = calculateRiskCapAudit(activeAccount, riskPercent);

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

  if (!hasMinimum) return null;

  const getRRColor = (val: number) => {
    if (val >= 2.5) return colors.success;
    if (val >= 1.5) return '#34D399';
    if (val >= 1) return colors.warning;
    return colors.error;
  };

  const rrVal = rr ?? 0;
  const rrColor = getRRColor(rrVal);

  // Proportional bar widths: risk is always 1, reward is rr
  // Total ratio = 1 + Math.max(rrVal, 0.5)
  const totalRatio = 1 + Math.min(Math.max(rrVal, 0.5), 6);
  const riskFlex = 1 / totalRatio;
  const rewardFlex = Math.min(Math.max(rrVal, 0.5), 6) / totalRatio;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: rrColor + '40',
          padding: spacing[4],
          marginBottom: spacing[4],
        },
      ]}
    >
      <LinearGradient
        colors={[rrColor + '12', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: radii.xl }]}
      />

      {/* Header */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="speedometer" size={14} color={rrColor} style={{ marginRight: 5 }} />
          <Text style={[styles.headerTitle, { color: colors.textTertiary }]}>
            LIVE RISK:REWARD ENGINE
          </Text>
        </View>

        <View
          style={[
            styles.rrBadge,
            {
              backgroundColor: rrColor + '18',
              borderColor: rrColor + '40',
            },
          ]}
        >
          <Text style={[styles.rrBadgeText, { color: rrColor }]}>
            {rrVal >= 2.5
              ? '🔥 High Expectancy'
              : rrVal >= 1.5
              ? '✅ Favorable'
              : rrVal >= 1
              ? '⚠️ 1:1 Marginal'
              : '❌ Negative Asymmetry'}
          </Text>
        </View>
      </View>

      {/* Numbers Row */}
      <View style={[styles.row, { marginTop: spacing[3], alignItems: 'baseline' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.ratioNumber, { color: colors.textPrimary }]}>
            1 : <Text style={{ color: rrColor }}>{rrVal.toFixed(2)}</Text>
          </Text>
          <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>
            Risking 1R to gain {rrVal.toFixed(2)}R
          </Text>
        </View>

        {/* Secondary metrics */}
        <View style={styles.metricsBox}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>RISK %</Text>
            <Text
              style={[
                styles.metricValue,
                { color: riskAudit.isViolated ? '#EF4444' : colors.textPrimary },
              ]}
            >
              {rp > 0 ? `${rp}%` : '—'}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>LOTS</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              {ls > 0 ? ls.toFixed(2) : '—'}
            </Text>
          </View>
          {rMul !== null && (
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>RESULT</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: rMul >= 0 ? colors.success : colors.error },
                ]}
              >
                {rMul >= 0 ? '+' : ''}{rMul.toFixed(2)}R
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Dynamic Account Risk Cap Indicator (Tab 2) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: riskAudit.isViolated ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.08)',
          borderColor: riskAudit.isViolated ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.25)',
          borderWidth: 1,
          borderRadius: radii.sm,
          paddingVertical: 5,
          paddingHorizontal: 10,
          marginTop: spacing[2.5],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
          <Ionicons
            name={riskAudit.isViolated ? 'alert-circle' : 'shield-checkmark'}
            size={14}
            color={riskAudit.isViolated ? '#EF4444' : '#10B981'}
          />
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: riskAudit.isViolated ? '#EF4444' : colors.textSecondary,
              flex: 1,
            }}
          >
            {riskAudit.isViolated
              ? `Exceeds ≤ 1% Cap (${riskAudit.currencySymbol}${riskAudit.maxOnePercentRisk.toFixed(0)} Max)`
              : `≤ 1% Risk Cap: Max ${riskAudit.currencySymbol}${riskAudit.maxOnePercentRisk.toFixed(0)} (${riskAudit.currencySymbol}${riskAudit.accountBalance.toLocaleString()} acc)`}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2.5,
            borderRadius: 6,
            backgroundColor: riskAudit.isViolated ? 'rgba(239, 68, 68, 0.16)' : 'rgba(16, 185, 129, 0.16)',
            borderColor: riskAudit.isViolated ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
            borderWidth: 0.5,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: riskAudit.isViolated ? '#EF4444' : '#10B981',
              letterSpacing: 0.3,
            }}
          >
            {riskAudit.isViolated ? 'BREACH' : 'COMPLIANT'}
          </Text>
        </View>
      </View>

      {/* Proportional Risk / Reward Visual Bar */}
      <View style={{ marginTop: spacing[3] }}>
        <View style={styles.barTrack}>
          {/* Risk Zone (Red) */}
          <View style={[styles.riskBar, { flex: riskFlex, backgroundColor: colors.error }]}>
            <Text style={styles.barLabel}>1R RISK</Text>
          </View>
          {/* Divider Needle */}
          <View style={styles.barNeedle} />
          {/* Reward Zone (Green) */}
          <View style={[styles.rewardBar, { flex: rewardFlex, backgroundColor: colors.success }]}>
            <Text style={styles.barLabel}>{rrVal.toFixed(1)}R REWARD</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  rrBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  rrBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratioNumber: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricsBox: {
    flexDirection: 'row',
    gap: 12,
  },
  metricItem: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  barTrack: {
    flexDirection: 'row',
    height: 22,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  riskBar: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  rewardBar: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  barNeedle: {
    width: 2,
    backgroundColor: '#FFFFFF',
    height: '100%',
  },
  barLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
