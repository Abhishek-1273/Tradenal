import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { useDashboard } from '../../hooks/useTrades';
import { AccountSelector } from '../../components/dashboard/AccountSelector';
import { SparklineArea } from '../../components/dashboard/SparklineArea';
import { EquityCurve } from '../../components/dashboard/EquityCurve';
import { WinLossPie } from '../../components/dashboard/WinLossPie';
import { DisciplineRing } from '../../components/dashboard/DisciplineRing';
import { JournalQuote } from '../../components/dashboard/JournalQuote';
import { FAB } from '../../components/common/FAB';
import { Skeleton } from '../../components/common/LoadingOverlay';
import { AppNavProp } from '../../navigation/types';
import { formatDuration } from '../../utils/formatters';
import { useAccountStore } from '../../store/account.store';

type Period = 'today' | 'week' | 'month' | 'all';
const PERIODS: { label: string; value: Period }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
];

const getGreeting = (name?: string): string => {
  const hour = new Date().getHours();
  const firstName = name ? name.trim().split(' ')[0] : 'Trader';
  let timeStr = 'Good morning';
  if (hour >= 12 && hour < 17) timeStr = 'Good afternoon';
  else if (hour >= 17) timeStr = 'Good evening';
  return `${timeStr}, ${firstName}`;
};

const getMarketSession = (): { session: string; isOpen: boolean } => {
  const d = new Date();
  const day = d.getUTCDay(); // 0 = Sun, 6 = Sat
  const utcHour = d.getUTCHours();

  if (day === 6 || (day === 0 && utcHour < 21) || (day === 5 && utcHour >= 22)) {
    return { session: 'MARKETS CLOSED', isOpen: false };
  }

  if (utcHour >= 12 && utcHour < 16) {
    return { session: 'LONDON / NY OVERLAP', isOpen: true };
  } else if (utcHour >= 12 && utcHour < 21) {
    return { session: 'NEW YORK SESSION', isOpen: true };
  } else if (utcHour >= 7 && utcHour < 16) {
    return { session: 'LONDON SESSION', isOpen: true };
  } else if (utcHour >= 0 && utcHour < 9) {
    return { session: 'TOKYO SESSION', isOpen: true };
  } else if (utcHour >= 21 || utcHour < 6) {
    return { session: 'SYDNEY SESSION', isOpen: true };
  }
  return { session: 'GLOBAL MARKET LIVE', isOpen: true };
};

export const DashboardScreen: React.FC = () => {
  const { colors, spacing, isDark } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const setDarkMode = useUIStore((s) => s.setDarkMode);
  const dashboardPeriod = useUIStore((s) => s.dashboardPeriod);
  const setDashboardPeriod = useUIStore((s) => s.setDashboardPeriod);
  const activeAccount = useAccountStore((s) => s.activeAccount);

  const greeting = getGreeting(user?.name);
  const marketSession = getMarketSession();

  const { data, isLoading, refetch, isRefetching } = useDashboard();

  const handleAddTrade = useCallback(() => navigation.navigate('AddTrade'), [navigation]);

  const stats = data?.stats;
  const deposit = activeAccount?.startingBalance && activeAccount.startingBalance > 0
    ? activeAccount.startingBalance
    : 5000;

  const currentPeriodObj = PERIODS.find((p) => p.value === dashboardPeriod);
  const currentPeriodLabel = currentPeriodObj ? currentPeriodObj.label : 'This Month';

  // Real detection of trades in the selected period (Today, This Week, This Month, All Time)
  const hasTrades = (stats?.totalTrades ?? 0) > 0;
  const totalTrades = hasTrades ? (stats?.totalTrades ?? 0) : 0;
  const pnl = hasTrades ? (stats?.netPnL ?? 0) : 0;
  const isProfit = pnl >= 0;
  const absPnl = Math.abs(pnl);
  const pnlPct = hasTrades && deposit > 0 ? (absPnl / deposit) * 100 : 0;
  const pnlSign = hasTrades ? (isProfit ? '+' : '-') : '';
  const pnlDisplay = hasTrades
    ? `${pnlSign}$${absPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$0.00';
  const pnlPctDisplay = hasTrades ? `${pnlSign}${pnlPct.toFixed(1)}%` : '0.0%';
  const currentBalance = activeAccount?.currentBalance ?? (deposit + pnl);
  const balanceDisplay = `$${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const depositDisplay = `$${deposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const currency = activeAccount?.currency ?? 'USD';

  const winRate = hasTrades ? Math.round(stats?.winRate ?? 0) : 0;
  const expectancyDisplay = hasTrades
    ? `${(stats?.expectancyAmount ?? 0) >= 0 ? '+' : '-'}$${Math.abs(stats?.expectancyAmount ?? 0).toFixed(2)}`
    : '$0.00';
  const expectancyRR = hasTrades
    ? `${(stats?.expectancy ?? 0) >= 0 ? '+' : ''}${(stats?.expectancy ?? 0).toFixed(2)}R`
    : '0.00R';

  const profitFactorDisplay = hasTrades && stats?.profitFactor !== undefined
    ? stats.profitFactor.toFixed(2)
    : '0.00';
  const avgWinDisplay = hasTrades && stats?.avgWin !== undefined
    ? `+${stats.avgWin.toFixed(2)}R`
    : '+0.00R';
  const avgLossDisplay = hasTrades && stats?.avgLoss !== undefined
    ? `-${Math.abs(stats.avgLoss).toFixed(2)}R`
    : '-0.00R';
  const avgHoldDisplay = hasTrades && stats?.avgHoldingTime
    ? formatDuration(stats.avgHoldingTime)
    : '0m';

  const streak = hasTrades ? Math.abs(stats?.currentStreak ?? 0) : 0;
  const isWinStreak = (stats?.currentStreakType ?? 'win') === 'win';
  const avgRRDisplay = hasTrades && stats?.avgRR !== undefined
    ? `${stats.avgRR.toFixed(2)}R`
    : '0.00R';
  const netRRDisplay = hasTrades && stats?.netRR !== undefined
    ? `${stats.netRR >= 0 ? '+' : ''}${stats.netRR.toFixed(2)}R`
    : '0.00R';

  // Group trades on same calendar day for Sparkline when viewing month/week
  const sparklineData = React.useMemo(() => {
    const rawCurve = data?.equityCurve ?? [];
    if (rawCurve.length <= 1 || dashboardPeriod === 'today') {
      return rawCurve.map((p) => p.cumulativePnL ?? p.cumulativeRR * 100);
    }

    const byDate = new Map<string, number>();
    rawCurve.forEach((p) => {
      const dStr = p.date ? dayjs(p.date).format('YYYY-MM-DD') : p.date;
      byDate.set(dStr, p.cumulativePnL ?? p.cumulativeRR * 100);
    });

    return Array.from(byDate.values());
  }, [data?.equityCurve, dashboardPeriod]);


  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
      {/* ─── Top Header Bar: Greeting on left, Controls on right ─────── */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: Math.max(insets.top, 16) + 4,
            paddingHorizontal: spacing[5],
            backgroundColor: isDark ? colors.background : '#F8FAFC',
          },
        ]}
      >
        {/* Left: Personalized Trader Greeting & Live Market Session */}
        <View style={styles.headerLeftGreeting}>
          <Text
            style={[styles.userName, { color: colors.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {greeting}
          </Text>
          <View style={styles.sessionRow}>
            <View
              style={[
                styles.liveIndicatorDot,
                { backgroundColor: marketSession.isOpen ? '#10B981' : '#94A3B8' },
              ]}
            />
            <Text
              style={[styles.sessionBadgeText, { color: colors.textTertiary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {marketSession.session} • {dayjs().format('ddd, D MMM').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Right Controls: Theme Toggle and Account Switcher */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setDarkMode(!isDarkMode)}
            style={[
              styles.headerIconButton,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(99, 102, 241, 0.1)',
                borderColor: isDarkMode
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(99, 102, 241, 0.2)',
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons
              name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
              size={17}
              color={isDarkMode ? '#F59E0B' : '#6366F1'}
            />
          </TouchableOpacity>

          {/* Account Change Icon */}
          <AccountSelector
            variant="icon"
            iconColor="#10B981"
            buttonBgColor={isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'}
            buttonBorderColor={isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: spacing[5],
            paddingBottom: insets.bottom + 120,
          },
        ]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* ─── Mindset Quote Card (Prominently visible at top, fixed height) ───────────── */}
        <View style={{ marginTop: 6, marginBottom: 12 }}>
          <JournalQuote />
        </View>

        {/* ─── Timeframe Filter Pills ────────────────────────────────────── */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => {
            const active = dashboardPeriod === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                onPress={() => setDashboardPeriod(p.value)}
                activeOpacity={0.75}
                style={[
                  styles.periodCapsule,
                  active
                    ? {
                        backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                        elevation: 2,
                      }
                    : {
                        backgroundColor: 'transparent',
                      },
                ]}
              >
                <Text
                  style={[
                    styles.periodCapsuleText,
                    {
                      color: active
                        ? (isDark ? '#0F172A' : '#FFFFFF')
                        : colors.textTertiary,
                      fontWeight: active ? '700' : '500',
                    },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading && !data ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* ─── Hero Card: Total Realized P&L ─────────────────────────── */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: 20,
                },
              ]}
            >
              {/* Header: Label & Status Pill */}
              <View style={styles.heroTopRow}>
                <View style={styles.heroTitleRow}>
                  <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>
                    Account Balance
                  </Text>
                  <Ionicons
                    name="wallet-outline"
                    size={14}
                    color={colors.textTertiary}
                    style={{ marginLeft: 4 }}
                  />
                </View>

                <View
                  style={[
                    styles.profitableBadge,
                    {
                      backgroundColor: !hasTrades
                        ? (isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9')
                        : isProfit
                        ? (isDark ? 'rgba(16, 185, 129, 0.18)' : '#E6F8F0')
                        : (isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEF2F2'),
                      borderColor: !hasTrades
                        ? (isDark ? 'rgba(148, 163, 184, 0.25)' : '#CBD5E1')
                        : isProfit
                        ? (isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0')
                        : (isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'),
                    },
                  ]}
                >
                  <Ionicons
                    name={!hasTrades ? 'pause-circle-outline' : isProfit ? 'stats-chart' : 'trending-down'}
                    size={11}
                    color={!hasTrades ? (isDark ? '#94A3B8' : '#64748B') : isProfit ? '#10B981' : '#EF4444'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.profitableBadgeText,
                      { color: !hasTrades ? (isDark ? '#94A3B8' : '#64748B') : isProfit ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {!hasTrades ? 'No Trades' : isProfit ? 'Profitable' : 'Drawdown'}
                  </Text>
                </View>
              </View>

              {/* Big Balance Number (Remaining Capital) */}
              <Text style={[styles.bigBalance, { color: colors.textPrimary }]}>
                {balanceDisplay}
              </Text>

              {/* Performance Indicator Pill & Starting Balance info */}
              <View style={styles.perfRow}>
                <View
                  style={[
                    styles.perfPill,
                    {
                      backgroundColor: !hasTrades
                        ? (isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9')
                        : isProfit
                        ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7')
                        : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2'),
                    },
                  ]}
                >
                  <Ionicons
                    name={!hasTrades ? 'remove' : isProfit ? 'arrow-up' : 'arrow-down'}
                    size={11}
                    color={!hasTrades ? colors.textTertiary : isProfit ? '#10B981' : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.perfPillText,
                      { color: !hasTrades ? colors.textTertiary : isProfit ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {hasTrades ? `${pnlDisplay} (${pnlPctDisplay})` : '$0.00 (0%)'}
                  </Text>
                </View>

                <Text style={[styles.perfSubPeriod, { color: colors.textTertiary }]}>
                  Starting: {depositDisplay}
                </Text>
              </View>

              {/* Embedded Smooth Sparkline Area Chart */}
              <SparklineArea
                data={sparklineData}
                height={85}
                strokeColor={!hasTrades ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)') : isProfit ? '#10B981' : '#EF4444'}
                fillColor={!hasTrades ? 'transparent' : isProfit ? '#10B981' : '#EF4444'}
                tooltipText={hasTrades ? `${pnlSign}$${Math.round(absPnl).toLocaleString('en-US')}` : '$0'}
                isEmpty={!hasTrades}
              />

              {/* 3-Column Footer Stats */}
              <View
                style={[
                  styles.heroFooter,
                  {
                    borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                  },
                ]}
              >
                <View style={styles.heroFooterCol}>
                  <Text style={[styles.footerLabel, { color: colors.textTertiary }]}>Total Trades</Text>
                  <Text style={[styles.footerVal, { color: colors.textPrimary }]}>{totalTrades}</Text>
                </View>
                <View style={[styles.colDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]} />
                <View style={styles.heroFooterCol}>
                  <Text style={[styles.footerLabel, { color: colors.textTertiary }]}>Win Rate</Text>
                  <Text style={[styles.footerVal, { color: colors.textPrimary }]}>{winRate}%</Text>
                </View>
                <View style={[styles.colDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]} />
                <View style={styles.heroFooterCol}>
                  <Text style={[styles.footerLabel, { color: colors.textTertiary }]}>Expectancy</Text>
                  <Text style={[styles.footerVal, { color: colors.textPrimary }]}>{expectancyDisplay}</Text>
                </View>
              </View>
            </View>

            {/* ─── Two Medium Cards: Net P&L & Profit Factor ─────────────── */}
            <View style={[styles.row, { marginBottom: 12, gap: 10 }]}>
              {/* Left: Net P&L */}
              <View
                style={[
                  styles.mediumCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <View
                    style={[
                      styles.mediumIconBox,
                      {
                        marginBottom: 0,
                        backgroundColor: !hasTrades
                          ? (isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9')
                          : isProfit
                          ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                          : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
                      },
                    ]}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={16}
                      color={!hasTrades ? (isDark ? '#94A3B8' : '#64748B') : isProfit ? '#10B981' : '#EF4444'}
                    />
                  </View>
                  <Text style={[styles.mediumLabel, { color: colors.textTertiary }]}>Net P&L</Text>
                </View>
                <Text
                  style={[
                    styles.greenAmount,
                    { color: !hasTrades ? colors.textPrimary : isProfit ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {pnlDisplay}
                </Text>
                <Text
                  style={[
                    styles.greenSubText,
                    { color: !hasTrades ? colors.textTertiary : isProfit ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {pnlPctDisplay}
                </Text>
              </View>

              {/* Right: Profit Factor */}
              <View
                style={[
                  styles.mediumCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <View
                    style={[
                      styles.mediumIconBox,
                      {
                        marginBottom: 0,
                        backgroundColor: !hasTrades
                          ? (isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9')
                          : (stats?.profitFactor ?? 0) >= 1.0
                          ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                          : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
                      },
                    ]}
                  >
                    <Ionicons
                      name="trending-up-outline"
                      size={16}
                      color={
                        !hasTrades
                          ? (isDark ? '#94A3B8' : '#64748B')
                          : (stats?.profitFactor ?? 0) >= 1.0
                          ? '#10B981'
                          : '#EF4444'
                      }
                    />
                  </View>
                  <Text style={[styles.mediumLabel, { color: colors.textTertiary }]}>Profit Factor</Text>
                </View>
                <Text
                  style={[
                    styles.greenAmount,
                    {
                      color: !hasTrades
                        ? colors.textPrimary
                        : (stats?.profitFactor ?? 0) >= 1.0
                        ? '#10B981'
                        : '#EF4444',
                    },
                  ]}
                >
                  {profitFactorDisplay}
                </Text>
                <Text
                  style={[
                    styles.greenSubText,
                    {
                      color: !hasTrades
                        ? colors.textTertiary
                        : (stats?.profitFactor ?? 0) >= 1.0
                        ? '#10B981'
                        : colors.textTertiary,
                    },
                  ]}
                >
                  {hasTrades ? `${winRate}% Win Rate` : '0 trades logged'}
                </Text>
              </View>
            </View>

            {/* ─── 2x3 Key Metrics Grid (Closed Trades) ──────────────────── */}
            {/* Row 1 */}
            <View style={[styles.row, { marginBottom: 10, gap: 8 }]}>
              {/* Avg Win */}
              <View style={[styles.compactTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.miniCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
                  <Ionicons name="arrow-up-outline" size={13} color="#10B981" />
                </View>
                <Text style={[styles.compactLabel, { color: colors.textTertiary }]}>Avg Win (R)</Text>
                <Text style={[styles.compactVal, { color: !hasTrades ? colors.textPrimary : '#10B981' }]}>
                  {avgWinDisplay}
                </Text>
              </View>

              {/* Avg Loss */}
              <View style={[styles.compactTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.miniCircle, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}>
                  <Ionicons name="arrow-down-outline" size={13} color="#EF4444" />
                </View>
                <Text style={[styles.compactLabel, { color: colors.textTertiary }]}>Avg Loss (R)</Text>
                <Text style={[styles.compactVal, { color: !hasTrades ? colors.textPrimary : '#EF4444' }]}>
                  {avgLossDisplay}
                </Text>
              </View>

              {/* Avg R:R */}
              <View style={[styles.compactTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.miniCircle, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
                  <Ionicons name="scale-outline" size={13} color="#6366F1" />
                </View>
                <Text style={[styles.compactLabel, { color: colors.textTertiary }]}>Avg R:R</Text>
                <Text style={[styles.compactVal, { color: colors.textPrimary }]}>
                  {avgRRDisplay}
                </Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={[styles.row, { marginBottom: 16, gap: 8 }]}>
              {/* Win Streak */}
              <View style={[styles.compactTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.miniCircle, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
                  <Ionicons name="flame-outline" size={13} color="#F59E0B" />
                </View>
                <Text style={[styles.compactLabel, { color: colors.textTertiary }]}>Streak</Text>
                <Text style={[styles.compactVal, { color: colors.textPrimary }]}>
                  {hasTrades ? `${streak} ${isWinStreak ? 'Win' : 'Loss'}${streak !== 1 ? 's' : ''}` : '0'}
                </Text>
              </View>

              {/* Avg Hold Time */}
              <View style={[styles.compactTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.miniCircle, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
                  <Ionicons name="time-outline" size={13} color="#3B82F6" />
                </View>
                <Text style={[styles.compactLabel, { color: colors.textTertiary }]}>Avg Hold</Text>
                <Text style={[styles.compactVal, { color: colors.textPrimary }]}>
                  {avgHoldDisplay}
                </Text>
              </View>

              {/* Net R */}
              <View style={[styles.compactTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.miniCircle, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : '#ECFEFF' }]}>
                  <Ionicons name="ribbon-outline" size={13} color="#06B6D4" />
                </View>
                <Text style={[styles.compactLabel, { color: colors.textTertiary }]}>Net R</Text>
                <Text
                  style={[
                    styles.compactVal,
                    {
                      color: !hasTrades
                        ? colors.textPrimary
                        : (stats?.netRR ?? 0) >= 0
                        ? '#10B981'
                        : '#EF4444',
                    },
                  ]}
                >
                  {netRRDisplay}
                </Text>
              </View>
            </View>

            {/* ─── Detailed Equity Curve Card ────────────────────────────── */}
            <EquityCurve
              data={data?.equityCurve ?? []}
              currency={currency}
              hasTrades={hasTrades}
              periodLabel={currentPeriodLabel}
              wins={stats?.wins ?? 0}
              losses={stats?.losses ?? 0}
            />

            {/* ─── Side-by-side: Outcome & Discipline ─────────────────────── */}
            <View style={[styles.row, { marginBottom: 16, gap: 10 }]}>
              {/* Left: Trade Outcome */}
              <View
                style={[
                  styles.splitCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="timer-outline" size={15} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>Trade Outcome</Text>
                </View>
                <WinLossPie data={hasTrades ? (data?.winLossData ?? []) : []} size={106} />
              </View>

              {/* Right: Discipline Score */}
              <View
                style={[
                  styles.splitCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="shield-checkmark-outline" size={15} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>Discipline Score</Text>
                </View>
                <DisciplineRing
                  score={hasTrades ? (data?.disciplineScore ?? 0) : 0}
                  size={106}
                  hasTrades={hasTrades}
                />
              </View>
            </View>

            {/* ─── Expectancy & Streaks Card ─────────────────────────────── */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: 20,
                  padding: 18,
                },
              ]}
            >
              {/* Card Header Row: Title on left, Live Current Streak on right */}
              <View style={[styles.cardHeaderRow, { justifyContent: 'space-between', marginBottom: 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                    }}
                  >
                    <Ionicons name="flash-outline" size={15} color="#6366F1" />
                  </View>
                  <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>Expectancy & Streaks</Text>
                </View>

                {/* Live Current Streak Badge */}
                {hasTrades ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 3.5,
                      borderRadius: 8,
                      backgroundColor: isWinStreak
                        ? 'rgba(16, 185, 129, 0.14)'
                        : 'rgba(239, 68, 68, 0.14)',
                      borderWidth: 1,
                      borderColor: isWinStreak
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <Ionicons
                      name={isWinStreak ? 'flame' : 'alert-circle'}
                      size={12}
                      color={isWinStreak ? '#10B981' : '#EF4444'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: '800',
                        color: isWinStreak ? '#10B981' : '#EF4444',
                      }}
                    >
                      {streak} {isWinStreak ? 'WIN' : 'LOSS'} STREAK
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* 1. Mathematical Expectancy Hero Banner */}
              <View
                style={{
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: colors.textTertiary }}>
                    EXPECTED VALUE PER TRADE
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 3 }}>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '900',
                        color: !hasTrades
                          ? colors.textPrimary
                          : (stats?.expectancy ?? 0) >= 0
                          ? '#10B981'
                          : '#EF4444',
                      }}
                    >
                      {expectancyRR}
                    </Text>
                    {hasTrades && (
                      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginLeft: 6 }}>
                        ({expectancyDisplay})
                      </Text>
                    )}
                  </View>
                </View>

                {/* Expectancy Edge Badge */}
                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: !hasTrades
                      ? isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'
                      : (stats?.expectancy ?? 0) >= 0
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: '800',
                      color: !hasTrades
                        ? colors.textTertiary
                        : (stats?.expectancy ?? 0) >= 0
                        ? '#10B981'
                        : '#EF4444',
                    }}
                  >
                    {!hasTrades ? 'NO EDGE' : (stats?.expectancy ?? 0) >= 0 ? 'POSITIVE EDGE' : 'NEGATIVE EDGE'}
                  </Text>
                </View>
              </View>

              {/* 2. Side-by-Side: Avg Win Return vs Avg Loss Return (Payoff Ratio) */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                {/* Avg Win Return */}
                <View
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.04)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.15)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="arrow-up-circle" size={13} color="#10B981" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textTertiary }}>
                      AVG WIN RETURN
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: hasTrades ? '#10B981' : colors.textPrimary }}>
                    {avgWinDisplay}
                  </Text>
                </View>

                {/* Avg Loss Return */}
                <View
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.06)' : 'rgba(239, 68, 68, 0.04)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.15)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="arrow-down-circle" size={13} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textTertiary }}>
                      AVG LOSS RETURN
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: hasTrades ? '#EF4444' : colors.textPrimary }}>
                    {avgLossDisplay}
                  </Text>
                </View>
              </View>

              {/* 3. Streaks Records: Longest Win vs Longest Loss Streak */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Longest Win Streak */}
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                    }}
                  >
                    <Ionicons name="trophy-outline" size={14} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, fontWeight: '600', color: colors.textTertiary }}>
                      Best Win Streak
                    </Text>
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.textPrimary, marginTop: 1 }}>
                      {hasTrades ? `${stats?.longestWinStreak || 0} trades` : '0 trades'}
                    </Text>
                  </View>
                </View>

                {/* Longest Loss Streak */}
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                    }}
                  >
                    <Ionicons name="shield-outline" size={14} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, fontWeight: '600', color: colors.textTertiary }}>
                      Max Loss Streak
                    </Text>
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.textPrimary, marginTop: 1 }}>
                      {hasTrades ? `${stats?.longestLossStreak || 0} trades` : '0 trades'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ─── Bottom Action Tiles ───────────────────────────────────── */}
            <View style={[styles.row, { marginBottom: 16, gap: 12 }]}>
              {/* AI Coach Review */}
              <TouchableOpacity
                onPress={() => navigation.navigate('AIReview')}
                activeOpacity={0.75}
                style={[
                  styles.actionButtonTile,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.actionCardTop}>
                  <View
                    style={[
                      styles.actionIconBadge,
                      {
                        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.16)' : 'rgba(139, 92, 246, 0.1)',
                        borderColor: isDark ? 'rgba(139, 92, 246, 0.28)' : 'rgba(139, 92, 246, 0.2)',
                      },
                    ]}
                  >
                    <Ionicons name="sparkles" size={18} color="#8B5CF6" />
                  </View>
                  <View
                    style={[
                      styles.actionArrowCircle,
                      {
                        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="arrow-forward" size={13} color="#8B5CF6" />
                  </View>
                </View>

                <View style={styles.actionTextWrap}>
                  <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>AI Coach</Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textTertiary }]} numberOfLines={2}>
                    Review mistakes & trade insights
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Set Goals */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Goals')}
                activeOpacity={0.75}
                style={[
                  styles.actionButtonTile,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.actionCardTop}>
                  <View
                    style={[
                      styles.actionIconBadge,
                      {
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.1)',
                        borderColor: isDark ? 'rgba(245, 158, 11, 0.28)' : 'rgba(245, 158, 11, 0.2)',
                      },
                    ]}
                  >
                    <Ionicons name="document-text-outline" size={18} color="#F59E0B" />
                  </View>
                  <View
                    style={[
                      styles.actionArrowCircle,
                      {
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="arrow-forward" size={13} color="#F59E0B" />
                  </View>
                </View>

                <View style={styles.actionTextWrap}>
                  <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Set Rules</Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textTertiary }]} numberOfLines={2}>
                    Daily rules, targets & discipline
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Primary Trade Logging Floating Action Button */}
      <FAB onPress={handleAddTrade} />
    </View>
  );
};

const DashboardSkeleton: React.FC = () => {
  const { spacing } = useTheme();
  return (
    <View>
      <Skeleton height={200} style={{ borderRadius: 20, marginBottom: spacing[4] }} />
      <View style={[styles.row, { marginBottom: spacing[3], gap: 10 }]}>
        <Skeleton height={100} style={{ flex: 1, borderRadius: 16 }} />
        <Skeleton height={100} style={{ flex: 1, borderRadius: 16 }} />
      </View>
      <View style={[styles.row, { marginBottom: spacing[4], gap: 8 }]}>
        <Skeleton height={80} style={{ flex: 1, borderRadius: 14 }} />
        <Skeleton height={80} style={{ flex: 1, borderRadius: 14 }} />
        <Skeleton height={80} style={{ flex: 1, borderRadius: 14 }} />
      </View>
      <Skeleton height={220} style={{ borderRadius: 20, marginBottom: spacing[4] }} />
    </View>
  );
};

const fontBase = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  includeFontPadding: false,
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  headerLeftGreeting: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  avatarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...fontBase,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scroll: {
    paddingTop: 4,
  },
  greetingSub: {
    ...fontBase,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  userName: {
    ...fontBase,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  liveIndicatorDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    marginRight: 6,
  },
  sessionBadgeText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagline: {
    ...fontBase,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 3,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodCapsule: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
  },
  periodCapsuleText: {
    ...fontBase,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
  },
  heroCard: {
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLabel: {
    ...fontBase,
    fontSize: 13,
    fontWeight: '600',
  },
  profitableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  profitableBadgeText: {
    ...fontBase,
    fontSize: 10.5,
    fontWeight: '700',
  },
  bigBalance: {
    ...fontBase,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 38,
    marginTop: 8,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    gap: 6,
  },
  perfPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  perfPillText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
  },
  perfSubPeriod: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  heroFooterCol: {
    flex: 1,
    alignItems: 'center',
  },
  footerLabel: {
    ...fontBase,
    fontSize: 10.5,
    fontWeight: '500',
    marginBottom: 2,
  },
  footerVal: {
    ...fontBase,
    fontSize: 14,
    fontWeight: '800',
  },
  colDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
  mediumCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  mediumIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mediumLabel: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '500',
  },
  greenAmount: {
    ...fontBase,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  greenSubText: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 1,
  },
  redAmount: {
    ...fontBase,
    fontSize: 17,
    fontWeight: '800',
    color: '#EF4444',
    marginTop: 2,
  },
  redSubText: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 1,
  },
  compactTile: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  miniCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  compactLabel: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '600',
  },
  compactVal: {
    ...fontBase,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  splitCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeading: {
    ...fontBase,
    fontSize: 13.5,
    fontWeight: '700',
  },
  streaksGrid: {
    marginTop: 2,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakCol: {
    flex: 1,
  },
  streakLabel: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  streakVal: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '700',
  },
  greenValue: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  redValue: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  actionButtonTile: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 114,
  },
  actionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    marginTop: 14,
  },
  actionTitle: {
    ...fontBase,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 3,
  },
});
