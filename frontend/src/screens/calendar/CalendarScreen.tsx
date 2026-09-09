import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
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
import { formatPnL } from '../../utils/formatters';
import { useAccountStore } from '../../store/account.store';

const fontBase = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  includeFontPadding: false,
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const NEUTRAL_EPSILON = 0.005;

export const CalendarScreen: React.FC = () => {
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const insets = useSafeAreaInsets();
  const activeAccount = useAccountStore((s) => s.activeAccount);
  const currency = activeAccount?.currency ?? 'USD';

  const now = dayjs();
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month() + 1);
  const [selectedDate, setSelectedDate] = useState(now.format('YYYY-MM-DD'));

  const { data, isLoading } = useCalendar(year, month);
  const { data: dayData, isLoading: isDayLoading } = useCalendarDay(selectedDate);

  const calendarMap: Record<string, CalendarDay> = {};
  (data?.calendar ?? []).forEach((d) => {
    calendarMap[d.date] = d;
  });

  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const daysInMonth = firstDay.daysInMonth();
  const startOffset = firstDay.day();
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setYear(now.year());
    setMonth(now.month() + 1);
    setSelectedDate(now.format('YYYY-MM-DD'));
  };

  const isViewingCurrentMonth = year === now.year() && month === now.month() + 1;

  // Monthly stats & day tallies
  const monthStats = useMemo(() => {
    const cal = data?.calendar ?? [];
    let trades = 0;
    let wins = 0;
    let losses = 0;
    let netRR = 0;
    let netPnL = 0;
    let greenDays = 0;
    let redDays = 0;

    cal.forEach((d) => {
      trades += d.trades;
      wins += d.wins;
      losses += d.losses;
      netRR += d.netRR;
      netPnL += d.netPnL ?? 0;
      if (d.trades > 0) {
        const pnl = d.netPnL ?? 0;
        const rr = d.netRR ?? 0;
        if (pnl > 0.01 || (Math.abs(pnl) <= 0.01 && rr > NEUTRAL_EPSILON) || (d.wins > 0 && d.losses === 0)) {
          greenDays++;
        } else if (pnl < -0.01 || (Math.abs(pnl) <= 0.01 && rr < -NEUTRAL_EPSILON) || (d.losses > 0 && d.wins === 0)) {
          redDays++;
        }
      }
    });

    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
    const totalActiveDays = greenDays + redDays;
    const greenDayPct = totalActiveDays > 0 ? (greenDays / totalActiveDays) * 100 : 0;
    const redDayPct = totalActiveDays > 0 ? (redDays / totalActiveDays) * 100 : 0;

    return {
      trades,
      wins,
      losses,
      netRR,
      netPnL,
      winRate,
      greenDays,
      redDays,
      greenDayPct,
      redDayPct,
      hasTrades: trades > 0,
    };
  }, [data]);

  const selectDate = (dateStr: string) => setSelectedDate(dateStr);

  const selectedDayTrades = dayData?.trades ?? [];
  const selectedDayStats = dayData?.stats;
  const selectedNetRR = selectedDayStats?.netRR ?? 0;
  const selectedNetPnL = selectedDayStats?.netPnL ?? 0;
  const selectedHasTrades = selectedDayTrades.length > 0;
  const selectedIsProfit = selectedNetRR >= 0;
  const selectedDayWins = (selectedDayTrades || []).filter((t: any) => (t.pnl ?? t.netPnL ?? t.rMultiple ?? 0) > 0).length;
  const selectedDayLosses = (selectedDayTrades || []).filter((t: any) => (t.pnl ?? t.netPnL ?? t.rMultiple ?? 0) < 0).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingHorizontal: spacing[5],
            paddingBottom: 10,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Calendar</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textTertiary }]}>
            Trade history & daily performance
          </Text>
        </View>

        {!isViewingCurrentMonth && (
          <TouchableOpacity
            onPress={goToToday}
            activeOpacity={0.75}
            style={[
              styles.todayNavBtn,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE',
              },
            ]}
          >
            <Ionicons name="today-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.todayNavBtnText, { color: colors.primary }]}>Current Month</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: 8,
          paddingBottom: insets.bottom + 120,
        }}
      >
        {/* ── Month Navigation Bar ──────────────────────────────────── */}
        <View
          style={[
            styles.monthNavCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 18,
            },
          ]}
        >
          <TouchableOpacity
            onPress={prevMonth}
            activeOpacity={0.7}
            style={[
              styles.navArrowBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.monthTitleWrap}>
            <Text style={[styles.monthTitleText, { color: colors.textPrimary }]}>
              {MONTHS[month - 1]} {year}
            </Text>
            <Text style={[styles.monthSubtitleText, { color: colors.textTertiary }]}>
              {monthStats.hasTrades
                ? `${monthStats.trades} trades logged • ${monthStats.greenDays} green days`
                : 'No trades recorded this month'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={nextMonth}
            activeOpacity={0.7}
            style={[
              styles.navArrowBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Executive Monthly Performance Summary ─────────────────── */}
        <View
          style={[
            styles.monthSummaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 20,
            },
          ]}
        >
          {/* Top Row: Net Return & Win Rate */}
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={[styles.summaryMetricLabel, { color: colors.textTertiary }]}>
                {MONTHS[month - 1].toUpperCase()} NET RETURN
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 3 }}>
                <Text
                  style={[
                    styles.summaryNetRR,
                    {
                      color: !monthStats.hasTrades
                        ? colors.textPrimary
                        : monthStats.netRR >= 0
                        ? '#10B981'
                        : '#EF4444',
                    },
                  ]}
                >
                  {monthStats.hasTrades
                    ? `${monthStats.netRR >= 0 ? '+' : ''}${monthStats.netRR.toFixed(1)}R`
                    : '0.0R'}
                </Text>
                {monthStats.hasTrades && monthStats.netPnL !== 0 && (
                  <Text style={[styles.summaryNetPnL, { color: colors.textTertiary }]}>
                    ({formatPnL(monthStats.netPnL, currency)})
                  </Text>
                )}
              </View>
            </View>

            <View
              style={[
                styles.winRateBadge,
                {
                  backgroundColor: !monthStats.hasTrades
                    ? isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'
                    : monthStats.winRate >= 50
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                  borderColor: !monthStats.hasTrades
                    ? colors.border
                    : monthStats.winRate >= 50
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)',
                },
              ]}
            >
              <Text
                style={[
                  styles.winRateBadgeText,
                  {
                    color: !monthStats.hasTrades
                      ? colors.textTertiary
                      : monthStats.winRate >= 50
                      ? '#10B981'
                      : '#EF4444',
                  },
                ]}
              >
                {monthStats.hasTrades ? `${monthStats.winRate}% WIN RATE` : 'NO DATA'}
              </Text>
            </View>
          </View>

          {/* Monthly Ratio Bar Track */}
          <View style={styles.ratioBarWrap}>
            <View
              style={[
                styles.ratioBarTrack,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                },
              ]}
            >
              {monthStats.hasTrades ? (
                <View style={styles.ratioBarFillRow}>
                  {monthStats.greenDayPct > 0 && (
                    <View
                      style={[
                        styles.ratioBarSegment,
                        {
                          backgroundColor: '#10B981',
                          flex: monthStats.greenDayPct,
                          borderTopLeftRadius: 3,
                          borderBottomLeftRadius: 3,
                          borderTopRightRadius: monthStats.redDayPct === 0 ? 3 : 0,
                          borderBottomRightRadius: monthStats.redDayPct === 0 ? 3 : 0,
                        },
                      ]}
                    />
                  )}
                  {monthStats.redDayPct > 0 && (
                    <View
                      style={[
                        styles.ratioBarSegment,
                        {
                          backgroundColor: '#EF4444',
                          flex: monthStats.redDayPct,
                          borderTopRightRadius: 3,
                          borderBottomRightRadius: 3,
                          borderTopLeftRadius: monthStats.greenDayPct === 0 ? 3 : 0,
                          borderBottomLeftRadius: monthStats.greenDayPct === 0 ? 3 : 0,
                        },
                      ]}
                    />
                  )}
                </View>
              ) : null}
            </View>

            {/* Sub-label for Ratio Bar */}
            <View style={styles.ratioLabelsRow}>
              <View style={styles.ratioLabelItem}>
                <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.greenStatsText}>
                  {monthStats.greenDays} Green Day{monthStats.greenDays === 1 ? '' : 's'} ({monthStats.wins} Wins)
                </Text>
              </View>

              <View style={styles.ratioLabelItem}>
                <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.redStatsText}>
                  {monthStats.redDays} Red Day{monthStats.redDays === 1 ? '' : 's'} ({monthStats.losses} Losses)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Calendar Grid ─────────────────────────────────────────── */}
        {isLoading ? (
          <Skeleton height={320} style={{ borderRadius: 20, marginBottom: 16 }} />
        ) : (
          <View
            style={[
              styles.calGridCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: 20,
              },
            ]}
          >
            {/* Day of Week Headers */}
            <View style={styles.dayHeadersRow}>
              {DAYS.map((d, index) => {
                const isWeekend = index === 0 || index === 6;
                return (
                  <View key={d} style={styles.dayHeaderCell}>
                    <Text
                      style={[
                        styles.dayHeaderText,
                        {
                          color: isWeekend
                            ? colors.textTertiary
                            : colors.textSecondary,
                          fontWeight: isWeekend ? '500' : '700',
                        },
                      ]}
                    >
                      {d.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Cells Grid */}
            <View style={styles.cellsGrid}>
              {Array.from({ length: totalCells }).map((_, i) => {
                const dayNum = i - startOffset + 1;
                const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                if (!isValid) {
                  return <View key={i} style={styles.blankCell} />;
                }
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayTradeData = calendarMap[dateStr];
                const isToday = dateStr === now.format('YYYY-MM-DD');
                const isSelected = dateStr === selectedDate;
                const hasData = !!dayTradeData && dayTradeData.trades > 0;
                const pnl = dayTradeData?.netPnL ?? 0;
                const rr = dayTradeData?.netRR ?? 0;
                const isPositive = hasData && (pnl > 0.01 || (Math.abs(pnl) <= 0.01 && rr > NEUTRAL_EPSILON) || (dayTradeData!.wins > 0 && dayTradeData!.losses === 0));
                const isLoss = hasData && (pnl < -0.01 || (Math.abs(pnl) <= 0.01 && rr < -NEUTRAL_EPSILON) || (dayTradeData!.losses > 0 && dayTradeData!.wins === 0));
                const isNeutral = hasData && !isPositive && !isLoss;

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
                    netRR={dayTradeData?.netRR}
                    netPnL={dayTradeData?.netPnL}
                    onPress={() => selectDate(dateStr)}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* ── Legend ────────────────────────────────────────────────── */}
        <View style={styles.legendRow}>
          {[
            { color: '#10B981', label: 'Profit Day' },
            { color: '#EF4444', label: 'Loss Day' },
            { color: '#F59E0B', label: 'Break Even' },
            { color: colors.primary, label: 'Selected / Today' },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: l.color }]} />
              <Text style={[styles.legendText, { color: colors.textTertiary }]}>{l.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Selected Day Section ──────────────────────────────────── */}
        <View style={styles.selectedDaySection}>
          <View style={styles.selectedDayHeader}>
            <View>
              <Text style={[styles.selectedDayDate, { color: colors.textPrimary }]}>
                {dayjs(selectedDate).format('dddd, D MMMM YYYY')}
              </Text>
              <Text style={[styles.selectedDaySub, { color: colors.textTertiary }]}>
                {selectedHasTrades
                  ? `${selectedDayTrades.length} Trade${selectedDayTrades.length > 1 ? 's' : ''} • ${selectedNetRR >= 0 ? '+' : ''}${selectedNetRR.toFixed(1)}R return`
                  : 'No trade executions logged on this day'}
              </Text>
            </View>

            {selectedHasTrades && (
              <View
                style={[
                  styles.dayOutcomePill,
                  {
                    backgroundColor: selectedIsProfit
                      ? 'rgba(16, 185, 129, 0.14)'
                      : 'rgba(239, 68, 68, 0.14)',
                    borderColor: selectedIsProfit
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayOutcomeText,
                    { color: selectedIsProfit ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {selectedIsProfit ? 'PROFITABLE' : 'LOSS DAY'}
                </Text>
              </View>
            )}
          </View>

          {/* Trade List or Empty Day Banner */}
          {isDayLoading ? (
            <Skeleton height={110} style={{ borderRadius: 18 }} />
          ) : selectedDayTrades.length === 0 ? (
            <View
              style={[
                styles.emptyDayCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: 18,
                },
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                  },
                ]}
              >
                <Ionicons name="calendar-clear-outline" size={24} color={colors.textTertiary} />
              </View>
              <Text style={[styles.emptyDayTitle, { color: colors.textPrimary }]}>
                No Trades on this Date
              </Text>
              <Text style={[styles.emptyDaySub, { color: colors.textTertiary }]}>
                Select an active day with colored return badges to inspect its trades.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddTrade')}
                activeOpacity={0.8}
                style={[
                  styles.emptyLogBtn,
                  {
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF',
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : '#C7D2FE',
                  },
                ]}
              >
                <Ionicons name="add-circle-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.emptyLogBtnText, { color: colors.primary }]}>Log Trade on This Date</Text>
              </TouchableOpacity>
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
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  pageTitle: {
    ...fontBase,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  todayNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  todayNavBtnText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
  },
  monthNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleWrap: {
    alignItems: 'center',
  },
  monthTitleText: {
    ...fontBase,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  monthSubtitleText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  monthSummaryCard: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryMetricLabel: {
    ...fontBase,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  summaryNetRR: {
    ...fontBase,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  summaryNetPnL: {
    ...fontBase,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  winRateBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  winRateBadgeText: {
    ...fontBase,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  ratioBarWrap: {
    marginTop: 4,
  },
  ratioBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  ratioBarFillRow: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  ratioBarSegment: {
    height: '100%',
  },
  ratioLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ratioLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  greenStatsText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  redStatsText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  calGridCard: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  dayHeadersRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    ...fontBase,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  cellsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  blankCell: {
    width: '14.28%',
    aspectRatio: 0.86,
    padding: 2.5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '600',
  },
  selectedDaySection: {
    marginTop: 6,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  selectedDayDate: {
    ...fontBase,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  selectedDaySub: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  dayOutcomePill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
  },
  dayOutcomeText: {
    ...fontBase,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  emptyDayCard: {
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyDayTitle: {
    ...fontBase,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyDaySub: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 3,
  },
  emptyLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    marginTop: 14,
  },
  emptyLogBtnText: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '700',
  },
});
