import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';
import { useCalendar, useCalendarDay } from '../../hooks/useTrades';
import { CalendarDay } from '../../types';
import { AppNavProp } from '../../navigation/types';
import { Skeleton } from '../../components/common/LoadingOverlay';
import { CalendarDayCell } from '../../components/calendar/CalendarDayCell';
import { TradeCard } from '../../components/trade/TradeCard';
import { EmptyState } from '../../components/common/EmptyState';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const NEUTRAL_EPSILON = 0.005;

export const CalendarScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const insets = useSafeAreaInsets();
  const now = dayjs();
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month() + 1);
  const [selectedDate, setSelectedDate] = useState(now.format('YYYY-MM-DD'));
  const { data, isLoading } = useCalendar(year, month);
  const { data: dayData, isLoading: isDayLoading } = useCalendarDay(selectedDate);

  const calendarMap: Record<string, CalendarDay> = {};
  (data?.calendar ?? []).forEach((d) => { calendarMap[d.date] = d; });

  const firstDay = dayjs(`${year}-${String(month).padStart(2,'0')}-01`);
  const daysInMonth = firstDay.daysInMonth();
  const startOffset = firstDay.day();
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthStats = useMemo(
    () => (data?.calendar ?? []).reduce(
      (acc, d) => ({ trades: acc.trades + d.trades, wins: acc.wins + d.wins, losses: acc.losses + d.losses, netRR: acc.netRR + d.netRR }),
      { trades: 0, wins: 0, losses: 0, netRR: 0 }
    ),
    [data]
  );

  const selectDate = (dateStr: string) => setSelectedDate(dateStr);

  const selectedDayTrades = dayData?.trades ?? [];
  const selectedDayStats = dayData?.stats;
  const selectedNetRR = selectedDayStats?.netRR ?? 0;
  const selectedIsCurrentMonth = dayjs(selectedDate).year() === year && dayjs(selectedDate).month() + 1 === month;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Text style={[typography.h2, { color: colors.textPrimary }]}>Calendar</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 80 }}>
        {/* Month nav */}
        <View style={[styles.monthNav, { marginBottom: spacing[4] }]}>
          <TouchableOpacity
            onPress={prevMonth}
            activeOpacity={0.75}
            style={[styles.navBtn, { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={19} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.monthLabelWrap}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{MONTHS[month - 1]}</Text>
            <Text style={[typography.label, { color: colors.textTertiary, marginTop: 1 }]}>{year}</Text>
          </View>

          <TouchableOpacity
            onPress={nextMonth}
            activeOpacity={0.75}
            style={[styles.navBtn, { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-forward" size={19} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Month summary */}
        <View style={[styles.summaryRow, { marginBottom: spacing[4] }]}>
          {[
            { label: 'Total Trades', value: monthStats.trades.toString(), icon: 'stats-chart-outline', color: colors.textPrimary },
            { label: 'Wins', value: monthStats.wins.toString(), icon: 'trophy-outline', color: colors.success },
            { label: 'Losses', value: monthStats.losses.toString(), icon: 'trending-down-outline', color: colors.error },
            { label: 'Net R', value: `${monthStats.netRR >= 0 ? '+' : ''}${monthStats.netRR.toFixed(1)}`, icon: 'analytics-outline', color: monthStats.netRR >= 0 ? colors.success : colors.error },
          ].map((s) => (
            <View key={s.label} style={[styles.summaryCard, { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border }]}>
              <Ionicons name={s.icon as any} size={14} color={s.color} style={{ marginBottom: 4 }} />
              <Text style={[typography.numericSm, { color: s.color }]}>{s.value}</Text>
              <Text numberOfLines={1} style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {isLoading ? (
          <Skeleton height={300} style={{ borderRadius: 18 }} />
        ) : (
          <View style={[styles.calGrid, { backgroundColor: colors.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', padding: spacing[3] }]}>
            {/* Day headers */}
            <View style={styles.dayHeaders}>
              {DAYS.map((d) => (
                <View key={d} style={styles.dayHeaderCell}>
                  <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center', fontWeight: '600' }]}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Calendar cells */}
            <View style={styles.cellGrid}>
              {Array.from({ length: totalCells }).map((_, i) => {
                const dayNum = i - startOffset + 1;
                const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                if (!isValid) {
                  return <View key={i} style={styles.blankCell} />;
                }
                const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
                const dayTradeData = calendarMap[dateStr];
                const isToday = dateStr === now.format('YYYY-MM-DD');
                const isSelected = dateStr === selectedDate;
                const hasData = !!dayTradeData && dayTradeData.trades > 0;
                const isNeutral = hasData && Math.abs(dayTradeData!.netRR) < NEUTRAL_EPSILON;
                const isPositive = hasData ? dayTradeData!.netRR >= 0 : true;

                return (
                  <CalendarDayCell
                    key={i}
                    day={dayNum}
                    isToday={isToday}
                    isSelected={isSelected}
                    hasData={hasData}
                    isPositive={isPositive}
                    isNeutral={isNeutral}
                    tradeCount={dayTradeData?.trades ?? 0}
                    onPress={() => selectDate(dateStr)}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Legend */}
        <View style={[styles.legend, { marginTop: spacing[3], marginBottom: spacing[5] }]}>
          {[
            { color: colors.successSubtle, borderColor: colors.success, label: 'Profit' },
            { color: colors.errorSubtle, borderColor: colors.error, label: 'Loss' },
            { color: colors.warningSubtle, borderColor: colors.warning, label: 'Break-even' },
            { color: 'transparent', borderColor: colors.primary, label: 'Today' },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color, borderColor: l.borderColor, borderWidth: 1, borderRadius: 3 }]} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>{l.label}</Text>
            </View>
          ))}
        </View>

        {/* Selected day section */}
        <View style={[styles.selectedDayHeader, { marginBottom: spacing[3] }]}>
          <View>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              {dayjs(selectedDate).format('dddd, D MMMM')}
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              {selectedDayTrades.length > 0
                ? `${selectedDayTrades.length} Trade${selectedDayTrades.length > 1 ? 's' : ''} • ${selectedNetRR >= 0 ? '+' : ''}${selectedNetRR.toFixed(1)}R`
                : selectedIsCurrentMonth ? 'No trades recorded' : ''}
            </Text>
          </View>
          {!dayjs(selectedDate).isSame(now, 'day') && (
            <TouchableOpacity
              onPress={() => selectDate(now.format('YYYY-MM-DD'))}
              style={[styles.todayBtn, { backgroundColor: colors.primarySubtle, borderRadius: radii.md }]}
            >
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>Today</Text>
            </TouchableOpacity>
          )}
        </View>

        {isDayLoading ? (
          <Skeleton height={100} style={{ borderRadius: 18 }} />
        ) : selectedDayTrades.length === 0 ? (
          <View style={[styles.emptyDayCard, { backgroundColor: colors.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border }]}>
            <Ionicons name="calendar-clear-outline" size={28} color={colors.textTertiary} style={{ marginBottom: spacing[2] }} />
            <Text style={[typography.bodySm, { color: colors.textTertiary }]}>No trades recorded for this day</Text>
          </View>
        ) : (
          selectedDayTrades.map((trade: any) => (
            <TradeCard
              key={trade._id}
              trade={trade}
              hideDate
              onPress={() => navigation.navigate('TradeDetail', { tradeId: trade._id })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  monthLabelWrap: { alignItems: 'center' },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  calGrid: {},
  dayHeaders: { flexDirection: 'row', marginBottom: 6 },
  dayHeaderCell: { flex: 1 },
  cellGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  blankCell: { width: '14.28%', aspectRatio: 0.92, padding: 2 },
  legend: { flexDirection: 'row', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 11, height: 11 },
  selectedDayHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  todayBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  emptyDayCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
});
