import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';
import { useTrade, useDeleteTrade, useToggleFavorite } from '../../hooks/useTrades';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { TradeDetailRouteProp, AppNavProp } from '../../navigation/types';
import {
  formatDate, formatDuration, getResultColor, getSetupLabel,
  getSessionLabel, getEmotionEmoji, getMistakeLabel, getDisciplineScoreColor, formatPnL
} from '../../utils/formatters';
import { useAccountStore } from '../../store/account.store';

const { width: SW } = Dimensions.get('window');

export const TradeDetailScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const route = useRoute<TradeDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { data: trade, isLoading } = useTrade(route.params.tradeId);
  const { mutate: deleteTrade } = useDeleteTrade();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { activeAccount } = useAccountStore();

  if (isLoading) return <LoadingOverlay fullScreen message="Loading trade..." />;
  if (!trade) return null;

  const resultColor = getResultColor(trade.result, colors);
  const rMultiple = trade.rMultiple ?? 0;

  const handleDelete = () => {
    Alert.alert('Delete Trade', 'This cannot be undone. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deleteTrade(trade._id, { onSuccess: () => navigation.goBack() }),
      },
    ]);
  };

  // Per-trade discipline score
  let disciplineScore = 100;
  if (!trade.followedPlan) disciplineScore -= 20;
  if (trade.revengeTrade) disciplineScore -= 20;
  if (trade.overtraded) disciplineScore -= 15;
  if (trade.movedSL) disciplineScore -= 15;
  if ((trade.riskReward ?? 0) < 1) disciplineScore -= 15;
  if ((trade.riskPercent ?? 0) > 3) disciplineScore -= 10;
  disciplineScore = Math.max(0, disciplineScore);

  const InfoRow = ({
    label, value, valueColor, last,
  }: { label: string; value: string; valueColor?: string; last?: boolean }) => (
    <View style={[{
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: spacing[3],
      borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    }]}>
      <Text style={[typography.body, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[typography.label, { color: valueColor ?? colors.textPrimary }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      {/* Gradient header */}
      <LinearGradient
        colors={[resultColor + '15', 'transparent']}
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: 240, zIndex: 0 }]}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={[{
        paddingTop: insets.top + 12, paddingHorizontal: spacing[5], paddingBottom: spacing[4],
        flexDirection: 'row', alignItems: 'center', zIndex: 1,
      }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{trade.pair}</Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {formatDate(trade.tradeDate, 'DD MMM YYYY')}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <TouchableOpacity
            onPress={() => toggleFavorite(trade._id)}
            style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}
          >
            <Ionicons
              name={trade.isFavorite ? 'star' : 'star-outline'}
              size={18}
              color={trade.isFavorite ? colors.warning : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditTrade', { tradeId: trade._id })}
            style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.errorSubtle, alignItems: 'center', justifyContent: 'center' }]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 32 }]}
      >
        {/* ── Hero card ── */}
        <View style={[{
          backgroundColor: colors.surface, borderRadius: radii['2xl'],
          borderWidth: 1, borderColor: resultColor + '40',
          overflow: 'hidden', marginBottom: spacing[4],
        }]}>
          <LinearGradient colors={[resultColor + '18', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={{ padding: spacing[5] }}>
            {/* Top row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <Badge label={trade.tradeType} variant={trade.tradeType as any} />
                  <Badge label={trade.result} variant={trade.result as any} />
                  {trade.setup && <Badge label={getSetupLabel(trade.setup)} variant="neutral" />}
                </View>
                <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing[2] }]}>
                  {getSessionLabel(trade.session)} Session
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.displayMd, { color: resultColor, fontSize: 30, lineHeight: 48 }]}>
                  {rMultiple >= 0 ? '+' : ''}{rMultiple.toFixed(2)}
                </Text>
                <Text style={[typography.label, { color: colors.textTertiary }]}>R-Multiple</Text>
                {typeof trade.pnlAmount === 'number' && (
                  <Text style={[typography.body, { color: resultColor, marginTop: 4, fontWeight: '600' }]}>
                    {formatPnL(trade.pnlAmount, activeAccount?.currency)}
                  </Text>
                )}
              </View>
            </View>

            {/* Metrics row */}
            <View style={[{
              flexDirection: 'row', justifyContent: 'space-between',
              marginTop: spacing[5], paddingTop: spacing[4],
              borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
            }]}>
              {[
                { label: 'RR', value: trade.riskReward ? `1:${trade.riskReward.toFixed(2)}` : '—' },
                { label: 'Risk', value: `${trade.riskPercent}%` },
                { label: 'Lots', value: trade.lotSize.toFixed(2) },
                { label: 'Duration', value: formatDuration(trade.tradeDurationMinutes) },
              ].map((m) => (
                <View key={m.label} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>{m.label}</Text>
                  <Text style={[typography.label, { color: colors.textPrimary, marginTop: 4 }]}>{m.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Screenshots ── */}
        {trade.screenshots.length > 0 && (
          <View style={{ marginBottom: spacing[4] }}>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[3] }]}>
              Screenshots
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing[5] }}>
              <View style={{ paddingHorizontal: spacing[5], flexDirection: 'row', gap: spacing[3] }}>
                {trade.screenshots.map((s) => (
                  <View key={s.publicId} style={[{
                    width: SW * 0.72, height: 190, borderRadius: radii.xl, overflow: 'hidden',
                  }]}>
                    <Image source={{ uri: s.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={[{
                      position: 'absolute', bottom: 8, left: 8,
                      backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
                    }]}>
                      <Text style={[typography.caption, { color: '#fff', textTransform: 'capitalize' }]}>{s.type}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Price levels ── */}
        <Card style={{ marginBottom: spacing[4] }}>
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[2] }]}>Price Levels</Text>
          <InfoRow label="Entry Price" value={trade.entryPrice.toString()} />
          <InfoRow
            label="Stop Loss"
            value={trade.stopLoss != null ? trade.stopLoss.toString() : 'Not Set'}
            valueColor={trade.stopLoss != null ? colors.error : colors.textTertiary}
          />
          <InfoRow
            label="Take Profit"
            value={trade.takeProfit != null ? trade.takeProfit.toString() : 'Not Set'}
            valueColor={trade.takeProfit != null ? colors.success : colors.textTertiary}
          />
          {trade.exitPrice !== undefined && (
            <InfoRow label="Exit Price" value={trade.exitPrice.toString()} valueColor={resultColor} last />
          )}
        </Card>

        {/* ── Psychology ── */}
        <Card style={{ marginBottom: spacing[4] }}>
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[2] }]}>Psychology</Text>

          {trade.emotionBefore && (
            <InfoRow
              label="Before Trade"
              value={`${getEmotionEmoji(trade.emotionBefore)} ${trade.emotionBefore.charAt(0).toUpperCase() + trade.emotionBefore.slice(1)}`}
            />
          )}
          {trade.emotionAfter && (
            <InfoRow
              label="After Trade"
              value={`${getEmotionEmoji(trade.emotionAfter)} ${trade.emotionAfter.charAt(0).toUpperCase() + trade.emotionAfter.slice(1)}`}
            />
          )}

          {/* Discipline checks */}
          <View style={{ marginTop: spacing[2] }}>
            {[
              { label: 'Followed Plan', value: trade.followedPlan, positive: true },
              { label: 'Revenge Trade', value: trade.revengeTrade, positive: false },
              { label: 'Overtraded', value: trade.overtraded, positive: false },
              { label: 'Moved Stop Loss', value: trade.movedSL, positive: false },
              { label: 'Moved Take Profit', value: trade.movedTP, positive: false },
              { label: 'News Trade', value: trade.newsTrade, positive: null },
            ].map((item, i, arr) => (
              <View
                key={item.label}
                style={[{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: spacing[2.5],
                  borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: colors.border,
                }]}
              >
                <Text style={[typography.body, { color: colors.textSecondary }]}>{item.label}</Text>
                <View style={[{
                  borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 4,
                  backgroundColor: item.value
                    ? item.positive === null ? colors.infoSubtle : item.positive ? colors.successSubtle : colors.errorSubtle
                    : colors.surfaceHighlight,
                }]}>
                  <Text style={[typography.caption, {
                    fontWeight: '700',
                    color: item.value
                      ? item.positive === null ? colors.info : item.positive ? colors.success : colors.error
                      : colors.textTertiary,
                  }]}>
                    {item.value ? 'YES' : 'NO'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Trade discipline score */}
          <View style={[{
            marginTop: spacing[4], padding: spacing[3],
            backgroundColor: colors.surfaceElevated, borderRadius: radii.lg,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          }]}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Trade Discipline Score</Text>
            <Text style={[typography.numericSm, { color: getDisciplineScoreColor(disciplineScore, colors) }]}>
              {disciplineScore}/100
            </Text>
          </View>
        </Card>

        {/* ── Mistakes ── */}
        {trade.mistakes.length > 0 && (
          <Card style={{ marginBottom: spacing[4] }}>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[3] }]}>Mistakes</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {trade.mistakes.map((m) => (
                <View key={m} style={[{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: colors.errorSubtle, borderRadius: radii.sm,
                  paddingHorizontal: 10, paddingVertical: 6,
                }]}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[typography.caption, { color: colors.error, marginLeft: 5, fontWeight: '600' }]}>
                    {getMistakeLabel(m)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* ── Reason for entry ── */}
        {trade.reasonForEntry && (
          <Card style={{ marginBottom: spacing[4] }}>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[3] }]}>Reason for Entry</Text>
            <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 24 }]}>
              {trade.reasonForEntry}
            </Text>
          </Card>
        )}

        {/* ── Notes ── */}
        {trade.notes && (
          <Card style={{ marginBottom: spacing[4] }}>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[3] }]}>Notes</Text>
            <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 24 }]}>
              {trade.notes}
            </Text>
          </Card>
        )}

        {/* ── Tags ── */}
        {trade.tags.length > 0 && (
          <View style={{ marginBottom: spacing[4] }}>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[3] }]}>Tags</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {trade.tags.map((tag) => (
                <View key={tag} style={[{
                  backgroundColor: colors.primarySubtle, borderRadius: radii.full,
                  paddingHorizontal: 12, paddingVertical: 6,
                }]}>
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Timeline ── */}
        <Card style={{ marginBottom: spacing[4] }}>
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[2] }]}>Timeline</Text>
          <InfoRow label="Trade Date" value={formatDate(trade.tradeDate, 'DD MMM YYYY')} />
          {trade.entryTime && (
            <InfoRow label="Entry Time" value={dayjs(trade.entryTime).format('HH:mm')} />
          )}
          {trade.exitTime && (
            <InfoRow label="Exit Time" value={dayjs(trade.exitTime).format('HH:mm')} />
          )}
          <InfoRow label="Logged" value={formatDate(trade.createdAt, 'DD MMM YYYY, HH:mm')} last />
        </Card>
      </ScrollView>
    </View>
  );
};
