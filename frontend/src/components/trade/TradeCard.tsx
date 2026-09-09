import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { Trade } from '../../types';
import { Badge } from '../common/Badge';
import {
  formatDate,
  getResultColor,
  getSetupLabel,
  getSessionLabel,
  formatDuration,
  formatPnL,
} from '../../utils/formatters';
import { useAccountStore } from '../../store/account.store';

interface TradeCardProps {
  trade: Trade;
  onPress: () => void;
  onFavorite?: () => void;
  style?: ViewStyle;
  hideDate?: boolean;
}

export const TradeCard: React.FC<TradeCardProps> = React.memo(({
  trade,
  onPress,
  onFavorite,
  style,
  hideDate = false,
}) => {
  const { colors, typography, radii, spacing, isDark } = useTheme();
  const activeAccount = useAccountStore((s) => s.activeAccount);

  const resultColor = getResultColor(trade.result, colors);
  const isWin = trade.result === 'win' || trade.result === 'partialWin';
  const isLoss = trade.result === 'loss';
  const rMultiple = trade.rMultiple;
  const currency = activeAccount?.currency ?? 'USD';

  const effectivePnL = trade.pnlAmount ?? trade.pnl;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing[3],
        },
        style,
      ]}
    >
      {/* Left Edge Indicator */}
      <View
        style={[
          styles.neonStripe,
          {
            backgroundColor: resultColor,
          },
        ]}
      />

      <View style={[styles.content, { padding: spacing[4] }]}>
        {/* Top Header Row */}
        <View style={styles.topRow}>
          {/* Pair & Direction */}
          <View style={styles.leftHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.pairText, { color: colors.textPrimary }]}>
                {trade.pair}
              </Text>
              <View style={[styles.directionBadge, { backgroundColor: trade.tradeType === 'buy' ? colors.successSubtle : colors.errorSubtle, borderColor: trade.tradeType === 'buy' ? colors.success + '40' : colors.error + '40' }]}>
                <Ionicons
                  name={trade.tradeType === 'buy' ? 'trending-up' : 'trending-down'}
                  size={11}
                  color={trade.tradeType === 'buy' ? colors.success : colors.error}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.directionText,
                    { color: trade.tradeType === 'buy' ? colors.success : colors.error },
                  ]}
                >
                  {trade.tradeType.toUpperCase()}
                </Text>
              </View>

              {/* Plan compliance badge beside BUY/SELL */}
              {trade.followedPlan ? (
                <View style={[styles.planBadge, { backgroundColor: colors.successSubtle, marginLeft: 6 }]}>
                  <Ionicons name="checkmark-sharp" size={10} color={colors.success} />
                  <Text style={[styles.planText, { color: colors.success }]}>Plan</Text>
                </View>
              ) : (
                <View style={[styles.planBadge, { backgroundColor: colors.errorSubtle, marginLeft: 6, borderColor: colors.error + '40', borderWidth: 1 }]}>
                  <Ionicons name="alert-circle" size={10} color={colors.error} />
                  <Text style={[styles.planText, { color: colors.error, fontWeight: '700' }]}>Rule Broken</Text>
                </View>
              )}
            </View>

            {/* Setup & Session badges */}
            <View style={styles.subTagRow}>
              {trade.strategy && (
                <View
                  style={[
                    styles.microChip,
                    {
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
                    },
                  ]}
                >
                  <Ionicons
                    name="git-network-outline"
                    size={10}
                    color={isDark ? '#60A5FA' : '#2563EB'}
                    style={{ marginRight: 3 }}
                  />
                  <Text
                    style={[
                      styles.microChipText,
                      {
                        color: isDark ? '#93C5FD' : '#1D4ED8',
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {trade.strategy}
                  </Text>
                </View>
              )}
              {trade.setup && (
                <View style={[styles.microChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Text style={[styles.microChipText, { color: colors.textSecondary }]}>
                    {getSetupLabel(trade.setup)}
                  </Text>
                </View>
              )}
              <View style={[styles.microChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={10} color={colors.textTertiary} style={{ marginRight: 3 }} />
                <Text style={[styles.microChipText, { color: colors.textTertiary }]}>
                  {getSessionLabel(trade.session)}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Metrics: Net R & PnL */}
          <View style={styles.rightMetrics}>
            {/* R-Multiple glowing chip */}
            <View
              style={[
                styles.rMultipleChip,
                {
                  backgroundColor: resultColor + '18',
                  borderColor: resultColor + '50',
                },
              ]}
            >
              <Text
                style={[
                  styles.rMultipleText,
                  { color: resultColor },
                ]}
              >
                {rMultiple !== undefined && rMultiple !== null
                  ? `${rMultiple >= 0 ? '+' : ''}${rMultiple.toFixed(2)}R`
                  : trade.result === 'win' || trade.result === 'partialWin'
                  ? '+1.00R'
                  : trade.result === 'loss'
                  ? '-1.00R'
                  : '0.00R'}
              </Text>
            </View>

            {/* Monetary PnL */}
            {typeof effectivePnL === 'number' && (
              <Text
                style={[
                  styles.pnlText,
                  { color: resultColor },
                ]}
                numberOfLines={1}
              >
                {formatPnL(effectivePnL, currency)}
              </Text>
            )}
          </View>
        </View>

        {/* Execution Stats Matrix */}
        <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>ENTRY</Text>
            <Text
              style={[styles.statValue, { color: colors.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {trade.entryPrice.toFixed(trade.entryPrice < 10 ? 5 : 2)}
            </Text>
          </View>

          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>EXIT</Text>
            <Text
              style={[styles.statValue, { color: trade.exitPrice ? colors.textPrimary : colors.textTertiary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {trade.exitPrice ? trade.exitPrice.toFixed(trade.exitPrice < 10 ? 5 : 2) : '—'}
            </Text>
          </View>

          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>SIZE</Text>
            <Text
              style={[styles.statValue, { color: colors.textSecondary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {trade.lotSize}L
            </Text>
          </View>

          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>HOLD TIME</Text>
            <Text
              style={[styles.statValue, { color: colors.textSecondary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatDuration(trade.tradeDurationMinutes)}
            </Text>
          </View>
        </View>

        {/* Card Footer: Date, Psychology & Tags */}
        <View style={styles.footerRow}>
          {/* Left: Date & Emotion */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
            {!hideDate && (
              <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                {formatDate(trade.tradeDate, 'DD MMM YYYY')}
              </Text>
            )}

            {trade.emotionBefore && (
              <View style={[styles.planBadge, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'capitalize' }}>
                  {trade.emotionBefore}
                </Text>
              </View>
            )}
          </View>

          {/* Right: Screenshots, Mistakes & Favorite */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {trade.screenshots.length > 0 && (
              <View style={[styles.metaPill, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="image" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
                <Text style={[styles.metaPillText, { color: colors.textSecondary }]}>
                  {trade.screenshots.length}
                </Text>
              </View>
            )}

            {trade.mistakes.length > 0 && (
              <View style={[styles.metaPill, { backgroundColor: colors.errorSubtle }]}>
                <Ionicons name="warning" size={11} color={colors.error} style={{ marginRight: 3 }} />
                <Text style={[styles.metaPillText, { color: colors.error }]}>
                  {trade.mistakes.length}
                </Text>
              </View>
            )}

            {onFavorite && (
              <TouchableOpacity
                onPress={onFavorite}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.favBtn}
              >
                <Ionicons
                  name={trade.isFavorite ? 'star' : 'star-outline'}
                  size={17}
                  color={trade.isFavorite ? colors.warning : colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

TradeCard.displayName = 'TradeCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  neonStripe: {
    width: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftHeader: {
    flex: 1,
  },
  pairText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  directionText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  microChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  microChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rightMetrics: {
    alignItems: 'flex-end',
  },
  rMultipleChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  rMultipleText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pnlText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  favBtn: {
    padding: 2,
  },
});
