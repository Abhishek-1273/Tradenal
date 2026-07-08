import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { EquityCurvePoint } from '../../types';
import { formatPnL } from '../../utils/formatters';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

interface EquityCurveProps {
  data: EquityCurvePoint[];
  height?: number;
  mode?: 'r' | 'pnl';
  currency?: string;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DayBucket {
  date: string;
  delta: number;   // net R or PnL for that day
  tradeCount: number;
  finalCumulative: number;
}

interface WeekRow {
  weekLabel: string; // e.g. "Jun 30"
  days: (DayBucket | null)[]; // 7 slots Mon–Sun
}

export const EquityCurve: React.FC<EquityCurveProps> = ({
  data,
  height,
  mode = 'r',
  currency = 'USD',
}) => {
  const { colors, typography, spacing, radii } = useTheme();
  const [selectedDay, setSelectedDay] = useState<DayBucket | null>(null);

  // ── Build day buckets ────────────────────────────────────────────────────────
  const { weeks, summary } = useMemo(() => {
    if (!data || data.length < 1) return { weeks: [], summary: null };

    // Group data points by date, compute per-day delta
    const byDate = new Map<string, DayBucket>();
    for (let i = 0; i < data.length; i++) {
      const pt = data[i];
      const dateKey = pt.date.slice(0, 10); // YYYY-MM-DD
      const value = mode === 'pnl' ? (pt.cumulativePnL ?? 0) : pt.cumulativeRR;
      const prevValue = i > 0 ? (mode === 'pnl' ? (data[i - 1].cumulativePnL ?? 0) : data[i - 1].cumulativeRR) : 0;
      const delta = value - prevValue;

      if (byDate.has(dateKey)) {
        const existing = byDate.get(dateKey)!;
        existing.delta += delta;
        existing.tradeCount += 1;
        existing.finalCumulative = value;
      } else {
        byDate.set(dateKey, { date: dateKey, delta, tradeCount: 1, finalCumulative: value });
      }
    }

    const dates = Array.from(byDate.keys()).sort();
    if (dates.length === 0) return { weeks: [], summary: null };

    // Find the Monday of the first week and Sunday of the last week
    const firstDate = dayjs(dates[0]);
    const lastDate = dayjs(dates[dates.length - 1]);
    const startMonday = firstDate.startOf('isoWeek');
    const endSunday = lastDate.endOf('isoWeek');

    // Build week rows
    const weekRows: WeekRow[] = [];
    let cursor = startMonday;
    while (cursor.isBefore(endSunday) || cursor.isSame(endSunday, 'day')) {
      const weekLabel = cursor.format('MMM D');
      const days: (DayBucket | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const dayDate = cursor.add(d, 'day').format('YYYY-MM-DD');
        days.push(byDate.get(dayDate) ?? null);
      }
      weekRows.push({ weekLabel, days });
      cursor = cursor.add(7, 'day');
    }

    // Overall summary
    const last = data[data.length - 1];
    const totalCumulative = mode === 'pnl' ? (last.cumulativePnL ?? 0) : last.cumulativeRR;
    const profitDays = Array.from(byDate.values()).filter((b) => b.delta > 0).length;
    const lossDays = Array.from(byDate.values()).filter((b) => b.delta < 0).length;
    const bestDay = Array.from(byDate.values()).reduce((a, b) => (b.delta > a.delta ? b : a));
    const worstDay = Array.from(byDate.values()).reduce((a, b) => (b.delta < a.delta ? b : a));

    return {
      weeks: weekRows,
      summary: { totalCumulative, profitDays, lossDays, bestDay, worstDay, totalDays: byDate.size },
    };
  }, [data, mode]);

  if (!data || data.length < 1) {
    return (
      <View style={[styles.empty, { paddingVertical: spacing[8] }]}>
        <Text style={[typography.bodySm, { color: colors.textTertiary, textAlign: 'center' }]}>
          Not enough trades to show heatmap
        </Text>
      </View>
    );
  }

  // Compute max abs delta for intensity scaling
  const allDeltas = weeks.flatMap((w) => w.days.filter(Boolean).map((d) => Math.abs(d!.delta)));
  const maxDelta = Math.max(...allDeltas, 0.01);

  const getCellColor = (bucket: DayBucket | null): string => {
    if (!bucket || bucket.tradeCount === 0) return colors.surfaceElevated;
    const intensity = Math.min(Math.abs(bucket.delta) / maxDelta, 1);
    if (bucket.delta > 0) {
      // green with intensity
      const alpha = Math.round(40 + intensity * 180).toString(16).padStart(2, '0');
      return `${colors.success}${alpha}`;
    } else {
      const alpha = Math.round(40 + intensity * 180).toString(16).padStart(2, '0');
      return `${colors.error}${alpha}`;
    }
  };

  const formatValue = (v: number) =>
    mode === 'pnl' ? formatPnL(v, currency) : `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`;

  return (
    <View>
      {/* Day column headers */}
      <View style={styles.headerRow}>
        <View style={styles.weekLabelSlot} />
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={styles.dayCell}>
            <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center' }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Heatmap grid — scrollable if many weeks */}
      <ScrollView
        style={{ maxHeight: 260 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            <View style={styles.weekLabelSlot}>
              <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 9 }]} numberOfLines={1}>
                {week.weekLabel}
              </Text>
            </View>
            {week.days.map((bucket, di) => {
              const isSelected = selectedDay?.date === bucket?.date;
              return (
                <TouchableOpacity
                  key={di}
                  onPress={() => setSelectedDay(isSelected ? null : bucket)}
                  activeOpacity={0.7}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: getCellColor(bucket),
                      borderRadius: radii.sm,
                      borderWidth: isSelected ? 1.5 : 0,
                      borderColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {bucket && bucket.tradeCount > 0 && (
                    <Text style={{ fontSize: 8, color: colors.textPrimary, textAlign: 'center', fontWeight: '700' }}>
                      {bucket.tradeCount}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Selected day tooltip */}
      {selectedDay ? (
        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: colors.surfaceElevated,
              borderRadius: radii.lg,
              borderColor: colors.border,
              borderWidth: 1,
              marginTop: spacing[3],
              padding: spacing[3],
            },
          ]}
        >
          <View style={styles.tooltipRow}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {dayjs(selectedDay.date).format('ddd, MMM D YYYY')}
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {selectedDay.tradeCount} trade{selectedDay.tradeCount > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={[styles.tooltipRow, { marginTop: 4 }]}>
            <Text style={[typography.label, { color: colors.textPrimary }]}>Day P&L</Text>
            <Text
              style={[
                typography.label,
                { color: selectedDay.delta >= 0 ? colors.success : colors.error, fontWeight: '700' },
              ]}
            >
              {formatValue(selectedDay.delta)}
            </Text>
          </View>
          <View style={styles.tooltipRow}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>Cumulative</Text>
            <Text
              style={[
                typography.caption,
                { color: selectedDay.finalCumulative >= 0 ? colors.success : colors.error },
              ]}
            >
              {formatValue(selectedDay.finalCumulative)}
            </Text>
          </View>
        </View>
      ) : (
        /* Summary strip */
        summary && (
          <View
            style={[
              styles.summaryRow,
              {
                marginTop: spacing[3],
                backgroundColor: colors.surfaceElevated,
                borderRadius: radii.lg,
                padding: spacing[3],
              },
            ]}
          >
            <SumItem
              label="Total"
              value={formatValue(summary.totalCumulative)}
              color={summary.totalCumulative >= 0 ? colors.success : colors.error}
              typography={typography}
              colors={colors}
            />
            <SumItem label="Green Days" value={`${summary.profitDays}`} color={colors.success} typography={typography} colors={colors} />
            <SumItem label="Red Days" value={`${summary.lossDays}`} color={colors.error} typography={typography} colors={colors} />
            <SumItem
              label="Best Day"
              value={formatValue(summary.bestDay.delta)}
              color={colors.success}
              typography={typography}
              colors={colors}
            />
          </View>
        )
      )}

      {/* Legend */}
      <View style={[styles.legend, { marginTop: spacing[2] }]}>
        <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10 }]}>Less</Text>
        {[0.1, 0.3, 0.6, 0.85, 1.0].map((intensity) => (
          <View
            key={intensity}
            style={[
              styles.legendDot,
              {
                backgroundColor: `${colors.success}${Math.round(40 + intensity * 180).toString(16).padStart(2, '0')}`,
                borderRadius: 3,
              },
            ]}
          />
        ))}
        <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10 }]}>More</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.legendDot, { backgroundColor: colors.surfaceElevated, borderRadius: 3, borderWidth: 1, borderColor: colors.border }]} />
        <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10, marginLeft: 4 }]}>No trade</Text>
      </View>
    </View>
  );
};

const SumItem: React.FC<{
  label: string;
  value: string;
  color: string;
  typography: any;
  colors: any;
}> = ({ label, value, color, typography, colors }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 9, marginBottom: 2 }]}>{label}</Text>
    <Text style={[typography.label, { color, fontSize: 11, fontWeight: '700' }]}>{value}</Text>
  </View>
);

const CELL_SIZE = 34;
const CELL_GAP = 4;

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    marginBottom: CELL_GAP,
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: CELL_GAP,
    alignItems: 'center',
  },
  weekLabelSlot: {
    width: 32,
    marginRight: CELL_GAP,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginRight: CELL_GAP,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tooltip: {},
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
  },
});
