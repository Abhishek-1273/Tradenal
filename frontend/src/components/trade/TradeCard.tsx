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
  formatRR,
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
}

export const TradeCard: React.FC<TradeCardProps> = ({
  trade,
  onPress,
  onFavorite,
  style,
}) => {
  const { colors, typography, radii, spacing } = useTheme();

  const resultColor = getResultColor(trade.result, colors);
  const isWin = trade.result === 'win' || trade.result === 'partialWin';
  const rMultiple = trade.rMultiple;

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
          overflow: 'hidden',
          marginBottom: spacing[3],
        },
        style,
      ]}
    >
      {/* Result accent stripe */}
      <View
        style={[
          styles.stripe,
          { backgroundColor: resultColor },
        ]}
      />

      <View style={[styles.content, { padding: spacing[4] }]}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.pairBlock}>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              {trade.pair}
            </Text>
            <View style={[styles.typeTag, { marginTop: 3 }]}>
              <Badge
                label={trade.tradeType}
                variant={trade.tradeType === 'buy' ? 'buy' : 'sell'}
                size="sm"
              />
              {trade.setup && (
                <Badge
                  label={getSetupLabel(trade.setup)}
                  variant="neutral"
                  size="sm"
                  style={{ marginLeft: spacing[1.5] }}
                />
              )}
            </View>
          </View>

          <View style={styles.rightBlock}>
            {/* R-Multiple */}
            <Text
              style={[
                typography.numericSm,
                { color: resultColor },
              ]}
            >
              {rMultiple !== undefined
                ? `${rMultiple >= 0 ? '+' : ''}${rMultiple.toFixed(2)}R`
                : '—'}
            </Text>
            {typeof trade.pnlAmount === 'number' && (
              <Text
                style={[
                  typography.caption,
                  { color: resultColor, fontWeight: '600', marginTop: 2 },
                ]}
              >
                {formatPnL(trade.pnlAmount, useAccountStore.getState().activeAccount?.currency)}
              </Text>
            )}
            <Badge
              label={trade.result}
              variant={trade.result as any}
              size="sm"
              style={{ marginTop: 4 }}
            />
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
          <StatItem
            label="Entry"
            value={trade.entryPrice.toFixed(trade.entryPrice < 10 ? 5 : 2)}
          />
          <StatItem label="RR" value={formatRR(trade.riskReward)} />
          <StatItem
            label="Session"
            value={getSessionLabel(trade.session)}
          />
          <StatItem
            label="Duration"
            value={formatDuration(trade.tradeDurationMinutes)}
          />
        </View>

        {/* Bottom row */}
        <View style={[styles.bottomRow, { marginTop: spacing[2] }]}>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {formatDate(trade.tradeDate, 'DD MMM YYYY')}
          </Text>

          <View style={styles.bottomRight}>
            {trade.mistakes.length > 0 && (
              <View style={[styles.mistakeTag, { backgroundColor: colors.errorSubtle, borderRadius: radii.sm }]}>
                <Ionicons name="warning-outline" size={11} color={colors.error} />
                <Text style={[typography.caption, { color: colors.error, marginLeft: 3 }]}>
                  {trade.mistakes.length} mistake{trade.mistakes.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {!trade.followedPlan && (
              <View style={[styles.mistakeTag, { backgroundColor: colors.warningSubtle, borderRadius: radii.sm, marginLeft: spacing[1.5] }]}>
                <Ionicons name="close-circle-outline" size={11} color={colors.warning} />
                <Text style={[typography.caption, { color: colors.warning, marginLeft: 3 }]}>
                  Off-plan
                </Text>
              </View>
            )}
            {trade.screenshots.length > 0 && (
              <View style={{ marginLeft: spacing[2] }}>
                <Ionicons name="image-outline" size={14} color={colors.textTertiary} />
              </View>
            )}
            {onFavorite && (
              <TouchableOpacity
                onPress={onFavorite}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginLeft: spacing[2] }}
              >
                <Ionicons
                  name={trade.isFavorite ? 'star' : 'star-outline'}
                  size={16}
                  color={trade.isFavorite ? colors.warning : colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.statItem}>
      <Text style={[typography.caption, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[typography.label, { color: colors.textSecondary, marginTop: 2 }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  stripe: {
    width: 4,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pairBlock: {},
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightBlock: {
    alignItems: 'flex-end',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mistakeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});
