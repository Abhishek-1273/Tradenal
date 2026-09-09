// Tradenal - Dashboard Equity Curve & Calendar Analytics
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, ScrollView } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';
import { EquityCurvePoint } from '../../types';
import { SegmentedRatioBar } from '../common/SegmentedRatioBar';

interface EquityCurveProps {
  data: EquityCurvePoint[];
  height?: number;
  mode?: 'r' | 'pnl';
  currency?: string;
  hasTrades?: boolean;
  periodLabel?: string;
  wins?: number;
  losses?: number;
}

function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const prev = points[i - 1] || current;
    const nextNext = points[i + 2] || next;

    const cp1x = current.x + (next.x - prev.x) * 0.2;
    const cp1y = current.y + (next.y - prev.y) * 0.2;
    const cp2x = next.x - (nextNext.x - current.x) * 0.2;
    const cp2y = next.y - (nextNext.y - current.y) * 0.2;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }

  return path;
}

const fontBase = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  includeFontPadding: false,
};

export const EquityCurve: React.FC<EquityCurveProps> = ({
  data,
  height = 175,
  hasTrades = true,
  periodLabel = 'This Month',
  wins,
  losses,
}) => {
  const { colors, isDark } = useTheme();

  const screenWidth = Dimensions.get('window').width;
  const svgWidth = screenWidth - 68;
  const svgHeight = height;

  const leftMargin = 38;
  const rightMargin = 16;
  const topMargin = 22;
  const bottomMargin = 20;

  const chartWidth = Math.max(svgWidth - leftMargin - rightMargin, 80);
  const chartHeight = Math.max(svgHeight - topMargin - bottomMargin, 60);

  // When viewing This Month (or non-Today periods), aggregate multiple trades on the same date into a single daily net point
  const chartData = useMemo(() => {
    if (!data || data.length <= 1) return data;
    if (periodLabel === 'Today') return data; // On Today, keep intra-day trade steps

    const byDate = new Map<string, EquityCurvePoint>();
    data.forEach((pt) => {
      const dStr = pt.date ? dayjs(pt.date).format('YYYY-MM-DD') : pt.date;
      // Each subsequent trade on the same date updates to that day's final cumulative balance
      byDate.set(dStr, {
        ...pt,
        date: dStr,
      });
    });

    return Array.from(byDate.values());
  }, [data, periodLabel]);

  const hasData = Boolean(
    hasTrades &&
    chartData &&
    chartData.length >= 1 &&
    chartData.some((d) => (d.cumulativePnL ?? d.cumulativeRR) !== 0)
  );

  // Parse points or fallback to flat zero baseline
  const rawPoints = useMemo(() => {
    if (hasData) {
      const mapped = chartData.map((d, i) => ({
        val: d.cumulativePnL !== undefined ? d.cumulativePnL : d.cumulativeRR * 100,
        date: d.date,
        idx: i,
        tradeNumber: d.tradeNumber,
      }));

      // Prepend a zero-origin starting point for smooth visualization
      if (mapped.length === 1) {
        return [
          { val: 0, date: 'Start', idx: 0, tradeNumber: 0 },
          { val: mapped[0].val, date: mapped[0].date, idx: 1, tradeNumber: mapped[0].tradeNumber },
        ];
      }
      return mapped;
    }

    // Flat zero baseline when no trades
    return [
      { val: 0, date: 'Start', idx: 0, tradeNumber: 0 },
      { val: 0, date: 'P1', idx: 1, tradeNumber: 0 },
      { val: 0, date: 'P2', idx: 2, tradeNumber: 0 },
      { val: 0, date: 'P3', idx: 3, tradeNumber: 0 },
      { val: 0, date: 'End', idx: 4, tradeNumber: 0 },
    ];
  }, [chartData, hasData]);

  const maxVal = hasData ? Math.max(1000, Math.max(...rawPoints.map((p) => p.val))) : 1000;
  const minVal = hasData ? Math.min(-1000, Math.min(...rawPoints.map((p) => p.val))) : -1000;
  const range = maxVal - minVal || 1;

  const getY = (val: number) => {
    return topMargin + chartHeight - ((val - minVal) / range) * chartHeight;
  };

  const zeroY = getY(0);

  const coords = rawPoints.map((pt, i) => {
    const x = leftMargin + (i / (rawPoints.length - 1)) * chartWidth;
    const y = getY(pt.val);
    return { x, y, val: pt.val, date: pt.date, tradeNumber: pt.tradeNumber };
  });

  const lastCoord = coords[coords.length - 1];
  const isProfit = lastCoord.val >= 0;

  const linePath = createSmoothPath(coords);
  const areaPath = hasData
    ? `${linePath} L ${lastCoord.x.toFixed(1)} ${zeroY.toFixed(1)} L ${coords[0].x.toFixed(1)} ${zeroY.toFixed(1)} Z`
    : '';

  // Smart X-Axis labels synchronized with active period
  const xLabels = useMemo(() => {
    if (hasData && chartData.length >= 1) {
      if (periodLabel === 'Today') {
        return [
          { x: leftMargin, text: 'Open' },
          { x: leftMargin + chartWidth * 0.5, text: `T${chartData.length}` },
          { x: leftMargin + chartWidth, text: 'Close' },
        ];
      }

      if (periodLabel === 'This Week') {
        const step = Math.max(1, Math.floor((chartData.length - 1) / Math.min(chartData.length - 1, 4)));
        const indices = Array.from(new Set([0, step, step * 2, step * 3, chartData.length - 1].filter((i) => i < chartData.length)));
        return indices.map((idx) => ({
          x: leftMargin + (idx / Math.max(chartData.length - 1, 1)) * chartWidth,
          text: dayjs(chartData[idx].date).format('ddd'),
        }));
      }

      if (chartData.length >= 5) {
        const step = Math.floor((chartData.length - 1) / 4);
        return [0, step, step * 2, step * 3, chartData.length - 1].map((idx) => ({
          x: leftMargin + (idx / (chartData.length - 1)) * chartWidth,
          text: dayjs(chartData[idx].date).format('MMM D'),
        }));
      }

      return chartData.map((d, idx) => ({
        x: leftMargin + (idx / Math.max(chartData.length - 1, 1)) * chartWidth,
        text: dayjs(d.date).format('MMM D'),
      }));
    }

    // Zero-state clean interval labels
    if (periodLabel === 'Today') {
      return [
        { x: leftMargin, text: 'Open' },
        { x: leftMargin + chartWidth * 0.33, text: 'Midday' },
        { x: leftMargin + chartWidth * 0.66, text: 'Afternoon' },
        { x: leftMargin + chartWidth, text: 'Close' },
      ];
    }
    if (periodLabel === 'This Week') {
      return [
        { x: leftMargin, text: 'Mon' },
        { x: leftMargin + chartWidth * 0.25, text: 'Tue' },
        { x: leftMargin + chartWidth * 0.5, text: 'Wed' },
        { x: leftMargin + chartWidth * 0.75, text: 'Thu' },
        { x: leftMargin + chartWidth, text: 'Fri' },
      ];
    }
    if (periodLabel === 'All Time') {
      return [
        { x: leftMargin, text: 'Start' },
        { x: leftMargin + chartWidth * 0.5, text: 'Mid' },
        { x: leftMargin + chartWidth, text: 'Now' },
      ];
    }

    return [
      { x: leftMargin, text: 'W1' },
      { x: leftMargin + chartWidth * 0.25, text: 'W2' },
      { x: leftMargin + chartWidth * 0.5, text: 'W3' },
      { x: leftMargin + chartWidth * 0.75, text: 'W4' },
      { x: leftMargin + chartWidth, text: 'End' },
    ];
  }, [chartData, hasData, leftMargin, chartWidth, periodLabel]);

  const tooltipText = hasData
    ? `${lastCoord.val >= 0 ? '+' : '-'}$${Math.round(Math.abs(lastCoord.val)).toLocaleString()}`
    : '$0';
  const tooltipWidth = Math.max(tooltipText.length * 8 + 16, 52);
  const tooltipHeight = 22;
  const tooltipX = Math.min(Math.max(lastCoord.x - tooltipWidth + 6, leftMargin), svgWidth - tooltipWidth);
  const tooltipY = Math.max(lastCoord.y - tooltipHeight - 6, 2);

  const strokeColor = hasData
    ? isProfit
      ? '#10B981'
      : '#EF4444'
    : isDark
      ? 'rgba(255,255,255,0.2)'
      : 'rgba(0,0,0,0.18)';

  // ─── Extract Individual Trade Deltas & Dates ──────────────────────────────
  const tradeDeltas = useMemo(() => {
    if (!hasData || !data || data.length === 0) return [];
    let prev = 0;
    return data.map((d, i) => {
      const val =
        d.cumulativePnL !== undefined && d.cumulativePnL !== 0
          ? d.cumulativePnL
          : (d.cumulativeRR ?? 0) * 100;
      const delta = val - prev;
      prev = val;
      return {
        tradeNumber: d.tradeNumber ?? i + 1,
        date: d.date,
        delta,
        isWin: delta > 0,
        isLoss: delta < 0,
        isBE: delta === 0,
        cumulative: val,
      };
    });
  }, [data, hasData]);

  // ─── 1. This Week: Breakdown by Full 7-Day Calendar Week (Sun - Sat) ───────────
  const weeklyDayBreakdown = useMemo(() => {
    const today = dayjs();
    const todayStr = today.format('YYYY-MM-DD');

    // Find active date reference or fallback to today
    const validDates = tradeDeltas
      .map((t) => t.date)
      .filter(Boolean)
      .map((d) => dayjs(d))
      .filter((d) => d.isValid());

    const refDate = validDates.length > 0 ? validDates[validDates.length - 1] : today;
    const startOfWeek = refDate.startOf('week'); // Sunday
    const endOfWeek = refDate.endOf('week'); // Saturday
    const rangeText = `${startOfWeek.format('MMM D')} – ${endOfWeek.format('MMM D, YYYY')}`;

    // Map trades by date string
    const dateMap: { [dateStr: string]: { pnl: number; trades: number; wins: number; losses: number } } = {};
    tradeDeltas.forEach((t) => {
      if (!t.date) return;
      const dObj = dayjs(t.date);
      if (!dObj.isValid()) return;
      const dStr = dObj.format('YYYY-MM-DD');
      if (!dateMap[dStr]) {
        dateMap[dStr] = { pnl: 0, trades: 0, wins: 0, losses: 0 };
      }
      dateMap[dStr].pnl += t.delta;
      dateMap[dStr].trades += 1;
      if (t.isWin) dateMap[dStr].wins += 1;
      if (t.isLoss) dateMap[dStr].losses += 1;
    });

    const days = [];
    let weekTotalPnL = 0;
    let weekTotalTrades = 0;

    for (let i = 0; i < 7; i++) {
      const dayDate = startOfWeek.add(i, 'day');
      const dStr = dayDate.format('YYYY-MM-DD');
      const dName = dayDate.format('ddd'); // Sun, Mon, Tue...
      const dayNum = dayDate.date();
      const isToday = dStr === todayStr;
      const dayData = dateMap[dStr];

      const hasTrade = Boolean(dayData && dayData.trades > 0);
      const pnl = dayData ? dayData.pnl : 0;
      const trades = dayData ? dayData.trades : 0;
      const isWin = pnl > 0;
      const isLoss = pnl < 0;
      const isBE = pnl === 0 && hasTrade;

      if (hasTrade) {
        weekTotalPnL += pnl;
        weekTotalTrades += trades;
      }

      days.push({
        dayName: dName,
        dayNum,
        dateStr: dStr,
        isToday,
        hasTrade,
        pnl,
        trades,
        isWin,
        isLoss,
        isBE,
      });
    }

    const greenDays = days.filter((d) => d.hasTrade && d.isWin).length;
    const redDays = days.filter((d) => d.hasTrade && d.isLoss).length;
    const totalActiveDays = greenDays + redDays;

    return {
      rangeText,
      days,
      greenDays,
      redDays,
      totalActiveDays,
      weekTotalPnL,
      weekTotalTrades,
    };
  }, [tradeDeltas]);

  // ─── 2. This Month: Weekly Breakdown by Calendar Weeks (Mon - Sun, 7 Days) ──
  const monthlyWeekBreakdown = useMemo(() => {
    const todayStr = dayjs().format('YYYY-MM-DD');

    // Build the daily P&L map from tradeDeltas
    const dayPnlMap: { [dateStr: string]: { pnl: number; trades: number; wins: number; losses: number } } = {};
    tradeDeltas.forEach((t) => {
      if (!t.date) return;
      const dObj = dayjs(t.date);
      if (!dObj.isValid()) return;
      const dStr = dObj.format('YYYY-MM-DD');
      if (!dayPnlMap[dStr]) {
        dayPnlMap[dStr] = { pnl: 0, trades: 0, wins: 0, losses: 0 };
      }
      dayPnlMap[dStr].pnl += t.delta;
      dayPnlMap[dStr].trades += 1;
      if (t.isWin) dayPnlMap[dStr].wins += 1;
      if (t.isLoss) dayPnlMap[dStr].losses += 1;
    });

    const now = dayjs();
    const validDates = tradeDeltas
      .map((t) => t.date)
      .filter(Boolean)
      .map((d) => dayjs(d))
      .filter((d) => d.isValid());

    const refMonth = validDates.length > 0 ? validDates[validDates.length - 1] : now;
    const totalDays = refMonth.daysInMonth();
    const monthAbbr = refMonth.format('MMM');

    // Helper: Mon = 0, Tue = 1, Wed = 2, Thu = 3, Fri = 4, Sat = 5, Sun = 6
    const getMonIndex = (dObj: dayjs.Dayjs) => (dObj.day() + 6) % 7;

    interface WeekDayBox {
      col: number; // 0..6
      dayNum: number | null;
      dateStr: string | null;
      status: 'green' | 'red' | 'be' | 'empty' | 'outside';
      isToday: boolean;
      pnl: number;
      trades: number;
    }

    interface WeekRow {
      key: string;
      label: string;
      range: string;
      pnl: number;
      trades: number;
      wins: number;
      losses: number;
      days: WeekDayBox[];
    }

    const weeks: WeekRow[] = [];
    let currentStart = 1;
    let weekIndex = 1;

    while (currentStart <= totalDays) {
      const sDate = refMonth.date(currentStart);
      const sMonIdx = getMonIndex(sDate);
      // Days remaining until Sunday of this calendar week
      const daysUntilSunday = 6 - sMonIdx;
      const currentEnd = Math.min(currentStart + daysUntilSunday, totalDays);
      const eDate = refMonth.date(currentEnd);

      const rangeStr =
        currentStart === currentEnd
          ? `${monthAbbr} ${currentStart}`
          : `${monthAbbr} ${currentStart}–${currentEnd}`;

      // Build 7 slots for this week (Mon to Sun)
      const dayBoxes: WeekDayBox[] = [];
      let weekPnl = 0;
      let weekTrades = 0;
      let weekWins = 0;
      let weekLosses = 0;

      for (let col = 0; col < 7; col++) {
        if (col < sMonIdx || col > getMonIndex(eDate)) {
          // Outside this month's days
          dayBoxes.push({
            col,
            dayNum: null,
            dateStr: null,
            status: 'outside',
            isToday: false,
            pnl: 0,
            trades: 0,
          });
        } else {
          // Inside month
          const dayNum = currentStart + (col - sMonIdx);
          const dayDate = refMonth.date(dayNum);
          const dStr = dayDate.format('YYYY-MM-DD');
          const isToday = dStr === todayStr;
          const dayData = dayPnlMap[dStr];

          if (dayData && dayData.trades > 0) {
            weekPnl += dayData.pnl;
            weekTrades += dayData.trades;
            weekWins += dayData.wins;
            weekLosses += dayData.losses;

            const status = dayData.pnl > 0 ? 'green' : dayData.pnl < 0 ? 'red' : 'be';
            dayBoxes.push({
              col,
              dayNum,
              dateStr: dStr,
              status,
              isToday,
              pnl: dayData.pnl,
              trades: dayData.trades,
            });
          } else {
            dayBoxes.push({
              col,
              dayNum,
              dateStr: dStr,
              status: 'empty',
              isToday,
              pnl: 0,
              trades: 0,
            });
          }
        }
      }

      weeks.push({
        key: `W${weekIndex}`,
        label: `Week ${weekIndex}`,
        range: rangeStr,
        pnl: weekPnl,
        trades: weekTrades,
        wins: weekWins,
        losses: weekLosses,
        days: dayBoxes,
      });

      weekIndex++;
      currentStart = currentEnd + 1;
    }

    const greenWeeks = weeks.filter((w) => w.pnl > 0).length;
    const redWeeks = weeks.filter((w) => w.pnl < 0).length;

    return {
      weeks,
      greenWeeks,
      redWeeks,
    };
  }, [tradeDeltas]);

  // Daily Stats for Month (Green Days vs Red Days)
  const monthDayStats = useMemo(() => {
    const dayMap: { [dateStr: string]: number } = {};
    tradeDeltas.forEach((t) => {
      const dStr = dayjs(t.date).format('YYYY-MM-DD');
      dayMap[dStr] = (dayMap[dStr] || 0) + t.delta;
    });
    const days = Object.values(dayMap);
    const greenDays = days.filter((p) => p > 0).length;
    const redDays = days.filter((p) => p < 0).length;
    const beDays = days.filter((p) => p === 0).length;
    return {
      greenDays,
      redDays,
      beDays,
      totalActiveDays: days.length,
    };
  }, [tradeDeltas]);

  // ─── 3. All Time: Multi-Month Historical Breakdown ─────────────────────────
  const allTimeMonthBreakdown = useMemo(() => {
    const monthMap: {
      [key: string]: {
        monthName: string;
        pnl: number;
        trades: number;
        wins: number;
        losses: number;
        dayMap: { [day: number]: { pnl: number; trades: number } };
      };
    } = {};

    tradeDeltas.forEach((t) => {
      const dObj = dayjs(t.date);
      if (!dObj.isValid()) return;
      const mKey = dObj.format('YYYY-MM');
      const mName = dObj.format('MMMM YYYY');
      const dNum = dObj.date(); // 1..31

      if (!monthMap[mKey]) {
        monthMap[mKey] = {
          monthName: mName,
          pnl: 0,
          trades: 0,
          wins: 0,
          losses: 0,
          dayMap: {},
        };
      }
      monthMap[mKey].pnl += t.delta;
      monthMap[mKey].trades += 1;
      if (t.isWin) monthMap[mKey].wins += 1;
      if (t.isLoss) monthMap[mKey].losses += 1;

      if (!monthMap[mKey].dayMap[dNum]) {
        monthMap[mKey].dayMap[dNum] = { pnl: 0, trades: 0 };
      }
      monthMap[mKey].dayMap[dNum].pnl += t.delta;
      monthMap[mKey].dayMap[dNum].trades += 1;
    });

    const list = Object.keys(monthMap)
      .sort()
      .map((k) => {
        const item = monthMap[k];
        const daysInMonth = dayjs(`${k}-01`).daysInMonth();
        const currentYearMonth = dayjs().format('YYYY-MM');
        const currentDayNum = dayjs().date();
        const isCurrentMonth = k === currentYearMonth;
        const days: Array<{
          day: number;
          status: 'green' | 'red' | 'be' | 'empty';
          pnl: number;
          trades: number;
          isToday: boolean;
        }> = [];

        for (let d = 1; d <= daysInMonth; d++) {
          const dData = item.dayMap[d];
          const isToday = isCurrentMonth && d === currentDayNum;

          if (!dData || dData.trades === 0) {
            days.push({ day: d, status: 'empty', pnl: 0, trades: 0, isToday });
          } else if (dData.pnl > 0) {
            days.push({ day: d, status: 'green', pnl: dData.pnl, trades: dData.trades, isToday });
          } else if (dData.pnl < 0) {
            days.push({ day: d, status: 'red', pnl: dData.pnl, trades: dData.trades, isToday });
          } else {
            days.push({ day: d, status: 'be', pnl: 0, trades: dData.trades, isToday });
          }
        }

        return {
          key: k,
          monthName: item.monthName,
          pnl: item.pnl,
          trades: item.trades,
          wins: item.wins,
          losses: item.losses,
          daysInMonth,
          days,
        };
      });

    const greenMonths = list.filter((m) => m.pnl > 0).length;
    const redMonths = list.filter((m) => m.pnl < 0).length;

    return {
      months: list,
      greenMonths,
      redMonths,
    };
  }, [tradeDeltas]);

  // ─── 4. Today: Intraday Trades Summary ────────────────────────────────────
  const todayTrades = tradeDeltas;
  const todayWins = wins !== undefined ? wins : todayTrades.filter((t) => t.isWin).length;
  const todayLosses = losses !== undefined ? losses : todayTrades.filter((t) => t.isLoss).length;
  const todayTotal = todayWins + todayLosses;
  const todayWinRate = todayTotal > 0 ? Math.round((todayWins / todayTotal) * 100) : 0;

  return (
    <>
      {/* ─── Card 1: Dedicated Equity Curve Chart ────────────────────────── */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Top Header: Title on left, clean Period badge on right */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
            <Ionicons name="trending-up" size={18} color="#6366F1" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Equity Curve</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Trajectory over trades</Text>
          </View>
        </View>

        {/* Dynamic Period Indicator Badge */}
        <View
          style={[
            styles.periodBadge,
            {
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
              borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE',
            },
          ]}
        >
          <Ionicons name="time-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.periodBadgeText, { color: colors.primary }]}>
            {periodLabel}
          </Text>
        </View>
      </View>

      {/* Main SVG Area Chart */}
      <View style={{ height: svgHeight, marginTop: 12 }}>
        <Svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <Defs>
            <LinearGradient id="equityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={isProfit ? '#10B981' : '#EF4444'} stopOpacity="0.32" />
              <Stop offset="80%" stopColor={isProfit ? '#10B981' : '#EF4444'} stopOpacity="0.05" />
              <Stop offset="100%" stopColor={isProfit ? '#10B981' : '#EF4444'} stopOpacity="0.00" />
            </LinearGradient>
          </Defs>

          {/* Grid Lines and Y-Axis Labels */}
          {[
            { label: '8K', val: 8000 },
            { label: '4K', val: 4000 },
            { label: '0', val: 0 },
            { label: '-4K', val: -4000 },
          ].map((grid) => {
            const y = getY(grid.val);
            const isZero = grid.val === 0;
            return (
              <React.Fragment key={grid.label}>
                <SvgText
                  x={leftMargin - 10}
                  y={y + 3.5}
                  fill={colors.textTertiary}
                  fontSize="9.5"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {grid.label}
                </SvgText>
                <Line
                  x1={leftMargin}
                  y1={y}
                  x2={leftMargin + chartWidth}
                  y2={y}
                  stroke={
                    isZero
                      ? isDark
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(0,0,0,0.14)'
                      : isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.05)'
                  }
                  strokeWidth={isZero ? '1.2' : '1'}
                  strokeDasharray={isZero ? undefined : '3, 3'}
                />
              </React.Fragment>
            );
          })}

          {/* Area Fill if trades present */}
          {hasData && <Path d={areaPath} fill="url(#equityGrad)" />}

          {/* Stroke Line */}
          <Path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={hasData ? undefined : '4, 4'}
          />

          {/* Glowing dot on last point */}
          {hasData && (
            <>
              <Circle cx={lastCoord.x} cy={lastCoord.y} r="6" fill={strokeColor} opacity="0.3" />
              <Circle
                cx={lastCoord.x}
                cy={lastCoord.y}
                r="3.5"
                fill={isDark ? '#FFFFFF' : '#0F172A'}
                stroke={strokeColor}
                strokeWidth="2"
              />
            </>
          )}

          {/* Floating Tooltip with exact cumulative value */}
          <Rect
            x={tooltipX}
            y={tooltipY}
            width={tooltipWidth}
            height={tooltipHeight}
            rx={11}
            ry={11}
            fill={isDark ? '#1E293B' : '#0F172A'}
          />
          <SvgText
            x={tooltipX + tooltipWidth / 2}
            y={tooltipY + 15}
            fill="#FFFFFF"
            fontSize="10.5"
            fontWeight="700"
            textAnchor="middle"
          >
            {tooltipText}
          </SvgText>

          {/* X-Axis Labels */}
          {xLabels.map((lbl, idx) => (
            <SvgText
              key={idx}
              x={lbl.x}
              y={svgHeight - 4}
              fill={colors.textTertiary}
              fontSize="9.5"
              fontWeight="500"
              textAnchor={idx === 0 ? 'start' : idx === xLabels.length - 1 ? 'end' : 'middle'}
            >
              {lbl.text}
            </SvgText>
          ))}
        </Svg>
      </View>
    </View>

    {/* ─── Card 2: Dedicated Performance & Segmented Ratio Bar Box ─────── */}
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* PnL Top Summary Header */}
        <View style={styles.pnlRow}>
          <View>
            <Text style={[styles.subHead, { color: colors.textTertiary }]}>{periodLabel.toUpperCase()}</Text>
            <Text style={[styles.boldTitle, { color: colors.textPrimary }]}>
              {periodLabel === 'Today' ? 'Today P&L' : `${periodLabel} P&L`}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={[
                styles.pnlValue,
                {
                  color: hasData
                    ? isProfit
                      ? '#10B981'
                      : '#EF4444'
                    : isDark
                      ? '#94A3B8'
                      : '#64748B',
                },
              ]}
            >
              {hasData
                ? `${isProfit ? '+' : '-'}$${Math.abs(lastCoord.val).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : '$0.00'}
            </Text>
            <Text style={[styles.pnlSubText, { color: colors.textTertiary }]}>
              {hasData ? `${data.length} trade${data.length === 1 ? '' : 's'} recorded` : 'No trades taken'}
            </Text>
          </View>
        </View>

        {/* ── Case 1: TODAY (NO ratio bar! Clean Intraday Trade Feed) ─────────── */}
        {periodLabel === 'Today' && (
          <View style={styles.todaySection}>
            <View style={styles.todayStatsRow}>
              <View style={[styles.todayStatChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                <Ionicons name="bar-chart-outline" size={12} color={colors.textSecondary} style={{ marginRight: 5 }} />
                <Text style={[styles.todayStatLabel, { color: colors.textSecondary }]}>Win Rate: </Text>
                <Text style={[styles.todayStatVal, { color: todayWinRate >= 50 ? '#10B981' : '#EF4444' }]}>
                  {todayWinRate}% ({todayWins}W / {todayLosses}L)
                </Text>
              </View>
            </View>

            {/* Individual Trade Badges for Today */}
            {todayTrades.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.todayTradesScroll}
              >
                {todayTrades.map((t, i) => (
                  <View
                    key={i}
                    style={[
                      styles.todayTradePill,
                      {
                        backgroundColor: t.isWin
                          ? 'rgba(16, 185, 129, 0.12)'
                          : t.isLoss
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(245, 158, 11, 0.12)',
                        borderColor: t.isWin
                          ? 'rgba(16, 185, 129, 0.3)'
                          : t.isLoss
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(245, 158, 11, 0.3)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={t.isWin ? 'trending-up' : t.isLoss ? 'trending-down' : 'remove-outline'}
                      size={11}
                      color={t.isWin ? '#10B981' : t.isLoss ? '#EF4444' : '#F59E0B'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.todayTradeNum, { color: colors.textSecondary }]}>
                      T{t.tradeNumber}:
                    </Text>
                    <Text
                      style={[
                        styles.todayTradePnL,
                        { color: t.isWin ? '#10B981' : t.isLoss ? '#EF4444' : '#F59E0B' },
                      ]}
                    >
                      {t.delta >= 0 ? '+' : '-'}${Math.abs(t.delta).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyHintText, { color: colors.textTertiary }]}>
                No intraday trades executed yet today.
              </Text>
            )}
          </View>
        )}

        {/* ── Case 2: THIS WEEK (Full 7-Day Calendar Week: Sun to Sat) ─────────── */}
        {periodLabel === 'This Week' && (
          <View style={styles.weekSection}>
            {/* Header with Title and Week Date Range badge */}
            <View style={styles.weekHeaderTop}>
              <Text style={[styles.sectionMiniHeading, { color: colors.textTertiary, marginBottom: 0 }]}>
                WEEKLY BREAKDOWN
              </Text>
              <View
                style={[
                  styles.weekDateBadge,
                  {
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.2)',
                  },
                ]}
              >
                <Text style={[styles.weekDateBadgeText, { color: colors.primary }]}>
                  {weeklyDayBreakdown.rangeText}
                </Text>
              </View>
            </View>

            {/* 7 Proper Day Boxes (Sun to Sat) */}
            <View style={styles.dayColumnsRow}>
              {weeklyDayBreakdown.days.map((d) => {
                return (
                  <View key={d.dateStr} style={styles.dayColumnItem}>
                    {/* Day name label (e.g. SUN, MON) */}
                    <Text
                      style={[
                        styles.dayColLabel,
                        { color: d.isToday ? '#6366F1' : colors.textTertiary },
                      ]}
                    >
                      {d.dayName}
                    </Text>

                    {/* Proper Day Card Box */}
                    <View
                      style={[
                        styles.dayColBox,
                        {
                          backgroundColor: d.hasTrade
                            ? d.isWin
                              ? '#10B981'
                              : d.isLoss
                              ? '#EF4444'
                              : '#F59E0B'
                            : isDark
                            ? 'rgba(255,255,255,0.03)'
                            : '#F8FAFC',
                          borderColor: d.isToday
                            ? '#6366F1'
                            : d.hasTrade
                            ? 'transparent'
                            : isDark
                            ? 'rgba(255,255,255,0.1)'
                            : '#CBD5E1',
                          borderWidth: d.isToday ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayColDateNum,
                          {
                            color: d.hasTrade
                              ? '#FFFFFF'
                              : d.isToday
                              ? '#6366F1'
                              : colors.textSecondary,
                            fontWeight: d.isToday || d.hasTrade ? '800' : '600',
                          },
                        ]}
                      >
                        {d.dayNum}
                      </Text>
                    </View>

                    {/* Day P&L or empty dash (—) */}
                    <Text
                      style={[
                        styles.dayColPnL,
                        {
                          color: d.hasTrade
                            ? d.isWin
                              ? '#10B981'
                              : d.isLoss
                              ? '#EF4444'
                              : colors.textPrimary
                            : colors.textTertiary,
                          fontWeight: d.hasTrade ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {d.hasTrade ? `${d.pnl >= 0 ? '+' : '-'}$${Math.round(Math.abs(d.pnl))}` : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Case 3: THIS MONTH (Weekly Breakdown with Full 7-Day Mon-Sun Calendar Weeks) ─ */}
        {periodLabel === 'This Month' && (
          <View style={styles.monthSection}>
            <Text style={[styles.sectionMiniHeading, { color: colors.textTertiary, marginBottom: 8 }]}>
              MONTHLY BREAKDOWN BY WEEKS
            </Text>

            {/* Day Column Headers: M T W T F S S aligned right over the 7 boxes */}
            <View style={[styles.weekRatioRow, { marginBottom: 6 }]}>
              <View style={{ width: 82 }} />
              <View style={styles.weekDaysMiddle}>
                <View style={styles.weekDaysBoxesRow}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayInitial, idx) => (
                    <View key={idx} style={styles.weekDayHeaderBox}>
                      <Text style={[styles.weekDayHeaderLabel, { color: colors.textTertiary }]}>
                        {dayInitial}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ width: 72 }} />
            </View>

            {monthlyWeekBreakdown.weeks.map((w) => {
              const hasWTrades = w.trades > 0;
              const isWProfitable = w.pnl >= 0;

              return (
                <View
                  key={w.key}
                  style={styles.weekRatioRow}
                >
                  {/* Left: Week Label & Calendar Range */}
                  <View style={{ width: 82 }}>
                    <Text style={[styles.weekLabelText, { color: colors.textPrimary }]}>{w.label}</Text>
                    <Text style={[styles.weekRangeText, { color: colors.textTertiary }]}>{w.range}</Text>
                  </View>

                  {/* Middle: 7 Day Boxes (Mon to Sun, with alignment) */}
                  <View style={styles.weekDaysMiddle}>
                    <View style={styles.weekDaysBoxesRow}>
                      {w.days.map((d, dIdx) => {
                        if (d.status === 'outside') {
                          return (
                            <View
                              key={`w-out-${dIdx}`}
                              style={[
                                styles.weekDayBox,
                                styles.outsideMonthBox,
                                {
                                  borderColor: isDark ? 'rgba(255,255,255,0.22)' : '#94A3B8',
                                },
                              ]}
                            />
                          );
                        }

                        return (
                          <View
                            key={`w-d-${dIdx}`}
                            style={[
                              styles.weekDayBox,
                              {
                                backgroundColor:
                                  d.status === 'green'
                                    ? '#10B981'
                                    : d.status === 'red'
                                    ? '#EF4444'
                                    : d.status === 'be'
                                    ? '#F59E0B'
                                    : isDark
                                    ? 'rgba(255,255,255,0.08)'
                                    : '#E2E8F0',
                                borderColor:
                                  d.isToday
                                    ? '#6366F1'
                                    : d.status === 'empty'
                                    ? isDark
                                      ? 'rgba(255,255,255,0.16)'
                                      : '#CBD5E1'
                                    : 'transparent',
                                borderWidth: d.isToday ? 1.4 : d.status === 'empty' ? 1 : 0,
                              },
                            ]}
                          />
                        );
                      })}
                    </View>
                  </View>

                  {/* Right: Net PnL of that week (shows only profit or loss) */}
                  <View style={{ width: 72, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text
                      style={[
                        styles.weekPnLText,
                        {
                          color: hasWTrades
                            ? isWProfitable
                              ? '#10B981'
                              : '#EF4444'
                            : colors.textTertiary,
                          fontSize: 12.5,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {hasWTrades ? `${isWProfitable ? '+' : '-'}$${Math.round(Math.abs(w.pnl)).toLocaleString()}` : '—'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Case 4: ALL TIME (Multi-Month History Ratio Bars: Month 1, Month 2...) ─ */}
        {periodLabel === 'All Time' && (
          <View style={styles.allTimeSection}>
            <Text style={[styles.sectionMiniHeading, { color: colors.textTertiary }]}>
              HISTORICAL BREAKDOWN BY MONTHS
            </Text>

            {allTimeMonthBreakdown.months.length > 0 ? (
              allTimeMonthBreakdown.months.map((m) => {
                const total = m.wins + m.losses;
                const gPct = total > 0 ? (m.wins / total) * 100 : 0;
                const isMProfit = m.pnl >= 0;

                const row1Days = m.days.slice(0, 16);
                const row2Days = m.days.slice(16);

                return (
                  <View key={m.key} style={styles.monthRatioRow}>
                    {/* Left: Month Name & Trade Count */}
                    <View style={{ width: 88, justifyContent: 'center' }}>
                      <Text
                        style={[styles.monthNameText, { color: colors.textPrimary }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {m.monthName}
                      </Text>
                      <Text style={[styles.monthTradesCount, { color: colors.textTertiary }]}>
                        {m.trades} {m.trades === 1 ? 'trade' : 'trades'}
                      </Text>
                    </View>

                    {/* Middle: Month Days Boxes (Exact days in month, empty if no trade) */}
                    <View style={styles.monthDaysMiddle}>
                      <View style={styles.monthDaysRow}>
                        {row1Days.map((d) => (
                          <View
                            key={`d-${d.day}`}
                            style={[
                              styles.monthDayBox,
                              {
                                backgroundColor:
                                  d.status === 'green'
                                    ? '#10B981'
                                    : d.status === 'red'
                                    ? '#EF4444'
                                    : d.status === 'be'
                                    ? '#F59E0B'
                                    : isDark
                                    ? 'rgba(255,255,255,0.06)'
                                    : '#EDF2F7',
                                borderColor:
                                  d.isToday
                                    ? '#6366F1'
                                    : d.status === 'empty'
                                    ? isDark
                                      ? 'rgba(255,255,255,0.12)'
                                      : '#CBD5E1'
                                    : 'transparent',
                                borderWidth: d.isToday ? 1.4 : d.status === 'empty' ? 0.75 : 0,
                              },
                            ]}
                          />
                        ))}
                      </View>
                      {row2Days.length > 0 && (
                        <View style={[styles.monthDaysRow, { marginTop: 3 }]}>
                          {row2Days.map((d) => (
                            <View
                              key={`d-${d.day}`}
                              style={[
                                styles.monthDayBox,
                                {
                                  backgroundColor:
                                    d.status === 'green'
                                      ? '#10B981'
                                      : d.status === 'red'
                                      ? '#EF4444'
                                      : d.status === 'be'
                                      ? '#F59E0B'
                                      : isDark
                                      ? 'rgba(255,255,255,0.06)'
                                      : '#EDF2F7',
                                  borderColor:
                                    d.isToday
                                      ? '#6366F1'
                                      : d.status === 'empty'
                                      ? isDark
                                        ? 'rgba(255,255,255,0.12)'
                                        : '#CBD5E1'
                                      : 'transparent',
                                  borderWidth: d.isToday ? 1.4 : d.status === 'empty' ? 0.75 : 0,
                                },
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Right: Month Net P&L */}
                    <View style={{ width: 68, alignItems: 'flex-end', justifyContent: 'center' }}>
                      <Text
                        style={[
                          styles.monthPnLText,
                          { color: isMProfit ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {isMProfit ? '+' : '-'}${Math.round(Math.abs(m.pnl)).toLocaleString()}
                      </Text>
                      <Text style={[styles.monthWinPct, { color: colors.textTertiary }]}>
                        {total > 0 ? `${Math.round(gPct)}% win` : '0%'}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={[styles.emptyHintText, { color: colors.textTertiary }]}>
                No multi-month historical data recorded yet.
              </Text>
            )}
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...fontBase,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  periodBadgeText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
  },
  bottomStrip: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pnlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subHead: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  boldTitle: {
    ...fontBase,
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 1,
  },
  pnlValue: {
    ...fontBase,
    fontSize: 14,
    fontWeight: '700',
  },
  pnlSubText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  // ── Today Styles ──
  todaySection: {
    marginTop: 2,
  },
  todayStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  todayStatLabel: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '600',
  },
  todayStatVal: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '800',
  },
  todayTradesScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  todayTradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  todayTradeNum: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  todayTradePnL: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyHintText: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  // ── Week Styles ──
  weekSection: {
    marginTop: 4,
  },
  weekHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  weekDateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  weekDateBadgeText: {
    ...fontBase,
    fontSize: 10,
    fontWeight: '700',
  },
  dayColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 4.5,
  },
  dayColumnItem: {
    flex: 1,
    alignItems: 'center',
  },
  dayColLabel: {
    ...fontBase,
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  dayColBox: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  dayColDateNum: {
    ...fontBase,
    fontSize: 12.5,
  },
  dayColPnL: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '700',
  },
  // ── Month Styles ──
  monthSection: {
    marginTop: 4,
  },
  sectionMiniHeading: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  weekRatioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
    marginBottom: 4,
  },
  weekLabelText: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '700',
  },
  weekRangeText: {
    ...fontBase,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  weekBarTrackWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  weekBarTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
    width: '100%',
  },
  weekPnLText: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '800',
  },
  weekDaysMiddle: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDaysBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
  },
  weekDayBox: {
    width: 12,
    height: 12,
    borderRadius: 2.5,
  },
  outsideMonthBox: {
    borderStyle: 'dashed',
    borderWidth: 0.8,
    backgroundColor: 'transparent',
    opacity: 0.6,
  },
  weekDayHeaderBox: {
    width: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayHeaderLabel: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '700',
  },
  // ── All Time Styles ──
  allTimeSection: {
    marginTop: 4,
  },
  monthRatioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNameText: {
    ...fontBase,
    fontSize: 12.5,
    fontWeight: '700',
  },
  monthTradesCount: {
    ...fontBase,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  monthDaysMiddle: {
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  monthDayBox: {
    width: 6.4,
    height: 6.4,
    borderRadius: 1.5,
  },
  monthPnLText: {
    ...fontBase,
    fontSize: 12.5,
    fontWeight: '800',
  },
  monthWinPct: {
    ...fontBase,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  // ── Shared Ratio Segment Styles ──
  ratioBarFillRow: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  ratioBarSegment: {
    height: '100%',
  },
  ratioStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratioStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  greenDaysText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  redDaysText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
});
