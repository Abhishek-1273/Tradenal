import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useCalendarDay } from '../../hooks/useTrades';
import { TradeCard } from '../../components/trade/TradeCard';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { EmptyState } from '../../components/common/EmptyState';
import { CalendarDayRouteProp, AppNavProp } from '../../navigation/types';
import { formatDate, formatPercent } from '../../utils/formatters';
import dayjs from 'dayjs';

export const CalendarDayScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const route = useRoute<CalendarDayRouteProp>();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useCalendarDay(route.params.date);

  const trades = data?.trades ?? [];
  const stats = data?.stats;
  const netRR = stats?.netRR ?? 0;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <View style={[{ paddingTop: insets.top + 12, paddingHorizontal: spacing[5], paddingBottom: spacing[4], flexDirection: 'row', alignItems: 'center' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            {dayjs(route.params.date).format('dddd')}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {formatDate(route.params.date, 'DD MMMM YYYY')}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? <LoadingOverlay /> : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 32 }]}>
          {/* Day summary */}
          {stats && trades.length > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: netRR >= 0 ? colors.success + '40' : colors.error + '40', padding: spacing[4], marginBottom: spacing[4] }]}>
              <View style={styles.summaryRow}>
                {[
                  { label: 'Net R', value: `${netRR >= 0 ? '+' : ''}${netRR.toFixed(2)}R`, color: netRR >= 0 ? colors.success : colors.error },
                  { label: 'Win Rate', value: formatPercent(stats.winRate), color: colors.primary },
                  { label: 'Trades', value: stats.totalTrades.toString() },
                  { label: 'Avg RR', value: `${stats.avgRR.toFixed(2)}R` },
                ].map((m) => (
                  <View key={m.label} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[typography.numericSm, { color: m.color ?? colors.textPrimary }]}>{m.value}</Text>
                    <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {trades.length === 0 ? (
            <EmptyState icon="calendar-outline" title="No trades this day" />
          ) : (
            trades.map((trade: any) => (
              <TradeCard
                key={trade._id}
                trade={trade}
                onPress={() => navigation.navigate('TradeDetail', { tradeId: trade._id })}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {},
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
