import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { useAnalytics } from '../../hooks/useTrades';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { SegmentedRatioBar } from '../../components/common/SegmentedRatioBar';
import {
  getSetupLabel,
  getSessionLabel,
  getMistakeLabel,
  formatPnL,
} from '../../utils/formatters';
import { useAccountStore } from '../../store/account.store';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'setups',   label: 'Setups',   icon: 'layers-outline' },
  { key: 'pairs',    label: 'Pairs',    icon: 'stats-chart-outline' },
  { key: 'sessions', label: 'Sessions', icon: 'time-outline' },
] as const;
type Tab = typeof TABS[number]['key'];

const WIN_COLOR  = '#10B981';
const LOSS_COLOR = '#EF4444';

const fontBase = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  includeFontPadding: false,
};

export const AnalyticsScreen: React.FC = () => {
  const { colors, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useAnalytics();
  const { activeAccount } = useAccountStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const currency    = activeAccount?.currency ?? 'USD';
  const overall     = data?.overall;
  const totalTrades = overall?.totalTrades    ?? 0;
  const wins        = overall?.wins          ?? 0;
  const losses      = overall?.losses        ?? 0;
  const winRate     = Math.round(overall?.winRate ?? 0);
  const pf          = overall?.profitFactor   ?? 0;
  const netPnL      = overall?.netPnL         ?? 0;
  const netRR       = overall?.netRR          ?? 0;
  const avgWin      = overall?.avgWin         ?? 0;
  const avgLoss     = overall?.avgLoss        ?? 0;
  const maxWins     = overall?.longestWinStreak ?? 0;
  const maxLosses   = overall?.longestLossStreak ?? 0;
  const expectancy  = overall?.expectancy;
  const payoffRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  // ── Plan Compliance & Discipline Calculation ──────────────────────────────
  const followedTrades = data?.psychologyComparisons?.planFollowed?.trades ?? 0;
  const brokenTrades = data?.psychologyComparisons?.planBroken?.trades ?? 0;
  const planTotal = followedTrades + brokenTrades;
  const planCompliancePct = planTotal > 0
    ? Math.round((followedTrades / planTotal) * 100)
    : (totalTrades > 0 ? 100 : 0);

  // ── Smart Institutional Discipline & Performance Score (0 - 100) ─────────
  let traderScore = 0;
  if (totalTrades > 0) {
    // 1. Plan Discipline & Compliance (40 pts)
    const disciplinePts = Math.round((planCompliancePct / 100) * 40);

    // 2. Win Rate / Hit Rate Quality (30 pts): 50-60% is realistic benchmark
    const winRatePts = Math.round(Math.min(1, Math.max(0, winRate / 55)) * 30);

    // 3. Profit Factor & Edge (30 pts): PF >= 2.0 gets full 30, PF 1.2+ gets 20+
    const effectivePf = pf > 0 ? pf : (netRR >= 0 ? 1.4 : 0.8);
    const pfPts = Math.round(Math.min(1, Math.max(0, effectivePf / 2.0)) * 30);

    traderScore = Math.min(100, Math.max(20, disciplinePts + winRatePts + pfPts));
  }

  let grade = '–';
  let gradeTitle = 'Awaiting Trades';
  let gradeSub   = 'Log trades to calculate your discipline & execution score';
  let gradeColor = '#64748B';

  if (totalTrades > 0) {
    if (traderScore >= 85) {
      grade = 'A+';
      gradeTitle = 'Elite Discipline';
      gradeSub = 'Exceptional plan execution & strong risk control';
      gradeColor = '#10B981';
    } else if (traderScore >= 72) {
      grade = 'A';
      gradeTitle = 'Consistent Pro';
      gradeSub = 'Robust trading habits & steady execution discipline';
      gradeColor = '#3B82F6';
    } else if (traderScore >= 58) {
      grade = 'B+';
      gradeTitle = 'Disciplined Trader';
      gradeSub = 'Strong plan compliance. Keep managing downside risk';
      gradeColor = '#6366F1';
    } else if (traderScore >= 42) {
      grade = 'B';
      gradeTitle = 'Developing Edge';
      gradeSub = 'Focus on cutting emotional trades & respecting stops';
      gradeColor = '#F59E0B';
    } else {
      grade = 'C';
      gradeTitle = 'Needs Focus';
      gradeSub = 'Strict plan compliance needed to protect your capital';
      gradeColor = '#EF4444';
    }
  }

  const topPairs    = data?.byPair    ?? [];
  const topSetups   = data?.bySetup   ?? [];
  const topSessions = data?.bySession ?? [];

  const bestSessionObj = data?.bestSession
    ? topSessions.find((s) => s.session === data.bestSession)
    : topSessions.length > 0
    ? [...topSessions].sort((a, b) => (b.netRR ?? 0) - (a.netRR ?? 0))[0]
    : null;

  const bestSetupObj = data?.bestSetup
    ? topSetups.find((s) => s.setup === data.bestSetup)
    : topSetups.length > 0
    ? [...topSetups].sort((a, b) => (b.netRR ?? 0) - (a.netRR ?? 0))[0]
    : null;

  if (isLoading) return <LoadingOverlay visible message="Crunching your trading metrics..." />;

  const S = colors.surface;
  const B = colors.border;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingHorizontal: spacing[5],
          },
        ]}
      >
        <View>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Analytics</Text>
          <Text style={[styles.pageSub, { color: colors.textTertiary }]}>
            {totalTrades > 0 ? `${totalTrades} verified trades analysed` : 'No trades logged yet'}
          </Text>
        </View>

        {/* Currency & Account Pill */}
        <View
          style={[
            styles.accountPill,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
              borderColor: B,
            },
          ]}
        >
          <Ionicons name="wallet-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={[styles.accountPillText, { color: colors.textSecondary }]}>
            {currency}
          </Text>
        </View>
      </View>

      {/* ── Horizontal Tab Selector ────────────────────────────────── */}
      <View style={[styles.tabBarWrap, { paddingHorizontal: spacing[5] }]}>
        <View style={[styles.tabPillsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9', borderColor: B }]}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.75}
                style={[
                  styles.tabPill,
                  active && {
                    backgroundColor: colors.surface,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1.5 },
                    shadowOpacity: isDark ? 0.3 : 0.08,
                    shadowRadius: 3,
                    elevation: 2,
                  },
                ]}
              >
                <Ionicons
                  name={t.icon}
                  size={12}
                  color={active ? colors.primary : colors.textTertiary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color: active ? colors.textPrimary : colors.textTertiary,
                      fontWeight: active ? '700' : '500',
                    },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: 12,
          paddingBottom: insets.bottom + 120,
        }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.textSecondary} />}
      >
        {/* ── 1. Trader Discipline & Execution Score Hero Card ────────── */}
        <View style={[styles.gradeCard, { backgroundColor: S, borderColor: B }]}>
          <LinearGradient
            colors={[gradeColor + '18', gradeColor + '04', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Row: Score Display + Tier Badge + Status */}
          <View style={styles.gradeCardTopRow}>
            {/* Left: Prominent Score Display Box */}
            <View
              style={[
                styles.gradeBox,
                {
                  borderColor: gradeColor,
                  backgroundColor: isDark ? gradeColor + '18' : gradeColor + '12',
                },
              ]}
            >
              <Text style={[styles.gradeScoreNumber, { color: gradeColor }]}>
                {totalTrades > 0 ? traderScore : '—'}
              </Text>
              <Text style={[styles.gradeScoreLabel, { color: colors.textTertiary }]}>
                / 100
              </Text>
            </View>

            {/* Right: Grade Badge, Title & Summary */}
            <View style={styles.gradeInfo}>
              <View style={styles.gradeTitleRow}>
                <View
                  style={[
                    styles.gradeBadge,
                    {
                      backgroundColor: gradeColor + '1A',
                      borderColor: gradeColor + '40',
                    },
                  ]}
                >
                  <Ionicons name="shield-checkmark" size={12} color={gradeColor} style={{ marginRight: 5 }} />
                  <Text style={[styles.gradeBadgeText, { color: gradeColor }]}>{gradeTitle}</Text>
                </View>
                <View
                  style={[
                    styles.gradePill,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', borderColor: B },
                  ]}
                >
                  <Text style={[styles.gradePillText, { color: gradeColor, fontWeight: '800' }]}>
                    GRADE {grade}
                  </Text>
                </View>
              </View>

              <Text style={[styles.gradeSub, { color: colors.textSecondary }]}>{gradeSub}</Text>
            </View>
          </View>

          {/* Middle: Progress Bar showing Score Fill */}
          <View style={styles.scoreBarTrackWrap}>
            <View
              style={[
                styles.scoreBarTrack,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
              ]}
            >
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${totalTrades > 0 ? traderScore : 0}%`,
                    backgroundColor: gradeColor,
                  },
                ]}
              />
            </View>
          </View>

          {/* Bottom Row: 3 Clean Pillars (Plan Followed, Win Rate, Profit Factor) */}
          <View
            style={[
              styles.edgeIndicatorsRow,
              { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
            ]}
          >
            <View style={styles.edgeIndicatorItem}>
              <Text style={[styles.edgeIndicatorLabel, { color: colors.textTertiary }]}>PLAN RESPECTED</Text>
              <Text style={[styles.edgeIndicatorVal, { color: planCompliancePct >= 70 ? WIN_COLOR : colors.textPrimary }]}>
                {totalTrades > 0 ? `${planCompliancePct}%` : '—'}
              </Text>
            </View>

            <View style={[styles.edgeDivider, { backgroundColor: B }]} />

            <View style={styles.edgeIndicatorItem}>
              <Text style={[styles.edgeIndicatorLabel, { color: colors.textTertiary }]}>WIN RATE</Text>
              <Text style={[styles.edgeIndicatorVal, { color: winRate >= 50 ? WIN_COLOR : LOSS_COLOR }]}>
                {totalTrades > 0 ? `${winRate}%` : '—'}
              </Text>
            </View>

            <View style={[styles.edgeDivider, { backgroundColor: B }]} />

            <View style={styles.edgeIndicatorItem}>
              <Text style={[styles.edgeIndicatorLabel, { color: colors.textTertiary }]}>PROFIT FACTOR</Text>
              <Text style={[styles.edgeIndicatorVal, { color: pf >= 1 ? WIN_COLOR : LOSS_COLOR }]}>
                {totalTrades > 0 ? pf.toFixed(2) : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. Core Financial Metrics (2x2 Guaranteed Grid) ────────── */}
        <View style={styles.metricsGridContainer}>
          {/* Row 1: Net P&L and Win Rate */}
          <View style={styles.metricsGridRow}>
            {/* Tile 1: Net Realized P&L */}
            <View style={[styles.metricTile, { backgroundColor: S, borderColor: B }]}>
              <View style={styles.metricTileHeader}>
                <Ionicons name="trending-up-outline" size={13} color={colors.textTertiary} style={{ marginRight: 5 }} />
                <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>NET REALIZED P&L</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: totalTrades > 0 ? (netPnL >= 0 ? WIN_COLOR : LOSS_COLOR) : colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {totalTrades > 0 ? `${netPnL >= 0 ? '+' : ''}${formatPnL(netPnL, currency)}` : '$0.00'}
              </Text>
              <Text style={[styles.metricSub, { color: colors.textTertiary }]}>
                {totalTrades} trade{totalTrades === 1 ? '' : 's'} recorded
              </Text>
            </View>

            {/* Tile 2: Win Rate */}
            <View style={[styles.metricTile, { backgroundColor: S, borderColor: B }]}>
              <View style={styles.metricTileHeader}>
                <Ionicons name="pie-chart-outline" size={13} color={colors.textTertiary} style={{ marginRight: 5 }} />
                <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>WIN RATE</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: winRate >= 50 ? WIN_COLOR : LOSS_COLOR },
                ]}
              >
                {winRate}%
              </Text>
              <Text style={[styles.metricSub, { color: colors.textTertiary }]}>
                {wins}W / {losses}L ({totalTrades} Total)
              </Text>
            </View>
          </View>

          {/* Row 2: Profit Factor and Payoff Ratio */}
          <View style={styles.metricsGridRow}>
            {/* Tile 3: Profit Factor */}
            <View style={[styles.metricTile, { backgroundColor: S, borderColor: B }]}>
              <View style={styles.metricTileHeader}>
                <Ionicons name="speedometer-outline" size={13} color={colors.textTertiary} style={{ marginRight: 5 }} />
                <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>PROFIT FACTOR</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: pf >= 1.25 ? WIN_COLOR : pf >= 1.0 ? '#F59E0B' : LOSS_COLOR },
                ]}
              >
                {pf.toFixed(2)}
              </Text>
              <Text style={[styles.metricSub, { color: colors.textTertiary }]}>
                {pf >= 1.0 ? 'Positive Edge' : 'Negative Edge'}
              </Text>
            </View>

            {/* Tile 4: Payoff Ratio */}
            <View style={[styles.metricTile, { backgroundColor: S, borderColor: B }]}>
              <View style={styles.metricTileHeader}>
                <Ionicons name="swap-horizontal-outline" size={13} color={colors.textTertiary} style={{ marginRight: 5 }} />
                <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>PAYOFF RATIO</Text>
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {payoffRatio > 0 ? `${payoffRatio.toFixed(2)}x` : '—'}
              </Text>
              <Text style={[styles.metricSub, { color: colors.textTertiary }]}>
                Avg Win vs Avg Loss
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Key Edge Drivers (2x2 Guaranteed Grid) ─────────────── */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            KEY EDGE DRIVERS
          </Text>
        </View>

        <View style={styles.metricsGridContainer}>
          {/* Row 1: Top Asset & Top Setup */}
          <View style={styles.metricsGridRow}>
            {/* Tile 1: Top Asset */}
            <View style={[styles.metricTile, { backgroundColor: S, borderColor: B }]}>
              <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
                <Ionicons name="trophy" size={14} color="#F59E0B" />
              </View>
              <Text style={[styles.tileDriverLabel, { color: colors.textTertiary }]}>TOP ASSET</Text>
              <Text style={[styles.tileDriverValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {data?.bestPair?.toUpperCase() ?? '–'}
              </Text>
              <Text style={[styles.tileDriverSub, { color: '#10B981' }]}>Highest return asset</Text>
            </View>

            {/* Tile 2: Top Setup */}
            <View style={[styles.metricTile, { backgroundColor: S, borderColor: B }]}>
              <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
                <Ionicons name="flash" size={14} color="#10B981" />
              </View>
              <Text style={[styles.tileDriverLabel, { color: colors.textTertiary }]}>BEST SETUP</Text>
              <Text style={[styles.tileDriverValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {data?.bestSetup ? getSetupLabel(data.bestSetup) : '–'}
              </Text>
              <Text style={[styles.tileDriverSub, { color: '#10B981' }]}>Highest win rate</Text>
            </View>
          </View>

          {/* Row 2: Best Session & Primary Leak */}
          <View style={styles.metricsGridRow}>
            {/* Tile 3: Best Session */}
            <View style={[styles.metricTile, { backgroundColor: S, borderColor: B }]}>
              <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(96, 165, 250, 0.14)' }]}>
                <Ionicons name="time" size={14} color="#60A5FA" />
              </View>
              <Text style={[styles.tileDriverLabel, { color: colors.textTertiary }]}>BEST SESSION</Text>
              <Text style={[styles.tileDriverValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {data?.bestSession ? getSessionLabel(data.bestSession) : '–'}
              </Text>
              <Text style={[styles.tileDriverSub, { color: '#60A5FA' }]}>Optimal execution window</Text>
            </View>

            {/* Tile 4: Primary Leak */}
            <View style={[styles.metricTile, { backgroundColor: S, borderColor: B }]}>
              <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.14)' }]}>
                <Ionicons name="warning" size={14} color="#EF4444" />
              </View>
              <Text style={[styles.tileDriverLabel, { color: colors.textTertiary }]}>PRIMARY LEAK</Text>
              <Text style={[styles.tileDriverValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {data?.mostCommonMistake ? getMistakeLabel(data.mostCommonMistake) : 'None'}
              </Text>
              <Text style={[styles.tileDriverSub, { color: '#EF4444' }]}>Recurring mistake to cut</Text>
            </View>
          </View>
        </View>

        {/* ── 4. Active Tab Content ─────────────────────────────────── */}

        {/* ── Tab A: OVERVIEW ───────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <View style={{ marginTop: 22 }}>
            {/* Plan Discipline Comparison Card */}
            {data?.psychologyComparisons && (
              <View style={[styles.cardWrap, { backgroundColor: S, borderColor: B }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Ionicons name="checkmark-done-circle" size={16} color="#6366F1" />
                  </View>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Plan Discipline Impact</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
                      Execution performance: following vs breaking plan
                    </Text>
                  </View>
                </View>

                <View style={styles.comparisonGrid}>
                  {/* Plan Respected */}
                  <View
                    style={[
                      styles.comparisonBox,
                      {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                      },
                    ]}
                  >
                    <View style={styles.compBoxHeader}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={[styles.compBoxTitle, { color: '#10B981' }]} numberOfLines={1}>Plan Followed</Text>
                    </View>
                    <Text style={[styles.compReturnVal, { color: '#10B981' }]}>
                      {data.psychologyComparisons.planFollowed.netRR >= 0 ? '+' : ''}
                      {data.psychologyComparisons.planFollowed.netRR.toFixed(1)}R
                    </Text>
                    {data.psychologyComparisons.planFollowed.netPnL !== 0 && (
                      <Text
                        style={[
                          styles.compPnLVal,
                          { color: data.psychologyComparisons.planFollowed.netPnL >= 0 ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {formatPnL(data.psychologyComparisons.planFollowed.netPnL, currency)}
                      </Text>
                    )}
                    <View style={styles.compMetaRow}>
                      <View style={[styles.compMiniBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)' }]}>
                        <Text style={[styles.compMiniBadgeText, { color: '#10B981' }]}>
                          {data.psychologyComparisons.planFollowed.winRate}% Win
                        </Text>
                      </View>
                      <View style={[styles.compMiniBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }]}>
                        <Text style={[styles.compMiniBadgeText, { color: colors.textSecondary }]}>
                          {data.psychologyComparisons.planFollowed.trades} {data.psychologyComparisons.planFollowed.trades === 1 ? 'trd' : 'trds'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Plan Broken */}
                  <View
                    style={[
                      styles.comparisonBox,
                      {
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                      },
                    ]}
                  >
                    <View style={styles.compBoxHeader}>
                      <Ionicons name="close-circle" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={[styles.compBoxTitle, { color: '#EF4444' }]} numberOfLines={1}>Plan Broken</Text>
                    </View>
                    <Text style={[styles.compReturnVal, { color: '#EF4444' }]}>
                      {data.psychologyComparisons.planBroken.netRR >= 0 ? '+' : ''}
                      {data.psychologyComparisons.planBroken.netRR.toFixed(1)}R
                    </Text>
                    {data.psychologyComparisons.planBroken.netPnL !== 0 && (
                      <Text
                        style={[
                          styles.compPnLVal,
                          { color: data.psychologyComparisons.planBroken.netPnL >= 0 ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {formatPnL(data.psychologyComparisons.planBroken.netPnL, currency)}
                      </Text>
                    )}
                    <View style={styles.compMetaRow}>
                      <View style={[styles.compMiniBadge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.12)' }]}>
                        <Text style={[styles.compMiniBadgeText, { color: '#EF4444' }]}>
                          {data.psychologyComparisons.planBroken.winRate}% Win
                        </Text>
                      </View>
                      <View style={[styles.compMiniBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }]}>
                        <Text style={[styles.compMiniBadgeText, { color: colors.textSecondary }]}>
                          {data.psychologyComparisons.planBroken.trades} {data.psychologyComparisons.planBroken.trades === 1 ? 'trd' : 'trds'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Execution & Risk Statistics Card */}
            <View style={[styles.cardWrap, { backgroundColor: S, borderColor: B }]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="stats-chart" size={16} color="#10B981" />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Execution Benchmarks</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
                    Key mathematical payoff metrics
                  </Text>
                </View>
              </View>

              {[
                { label: 'Average Winning Trade', value: formatPnL(avgWin, currency), color: WIN_COLOR, icon: 'arrow-up-circle-outline' },
                { label: 'Average Losing Trade', value: formatPnL(Math.abs(avgLoss), currency), color: LOSS_COLOR, icon: 'arrow-down-circle-outline' },
                { label: 'Expected Value per Trade', value: expectancy != null ? `${expectancy >= 0 ? '+' : ''}${expectancy.toFixed(2)}R` : '—', color: (expectancy ?? 0) >= 0 ? WIN_COLOR : LOSS_COLOR, icon: 'calculator-outline' },
                { label: 'Max Winning Streak', value: `${maxWins} Consecutive Wins`, color: WIN_COLOR, icon: 'flame-outline' },
                { label: 'Max Losing Streak', value: `${maxLosses} Consecutive Losses`, color: LOSS_COLOR, icon: 'shield-outline' },
              ].map((row, i, arr) => (
                <View
                  key={row.label}
                  style={[
                    styles.benchmarkRow,
                    i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: B },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={row.icon as any} size={15} color={colors.textTertiary} style={{ marginRight: 8 }} />
                    <Text style={[styles.benchmarkLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                  </View>
                  <Text style={[styles.benchmarkValue, { color: row.color }]}>{row.value}</Text>
                </View>
              ))}
            </View>

            {/* Strategic Coaching Insights */}
            <View style={[styles.cardWrap, { backgroundColor: S, borderColor: B }]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="bulb" size={16} color="#F59E0B" />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Actionable Insights</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
                    Data-driven takeaways from your execution log
                  </Text>
                </View>
              </View>

              {[
                {
                  icon: 'time-outline' as const,
                  accent: '#3B82F6',
                  title: 'Session Edge',
                  badge: bestSessionObj
                    ? `${getSessionLabel(bestSessionObj.session).toUpperCase()} • ${bestSessionObj.winRate}% WIN`
                    : 'MARKET HOURS',
                  text: bestSessionObj
                    ? `Your highest edge is in the ${getSessionLabel(bestSessionObj.session)} session (${bestSessionObj.winRate}% win rate, ${bestSessionObj.netRR >= 0 ? '+' : ''}${bestSessionObj.netRR.toFixed(1)}R over ${bestSessionObj.totalTrades} trades). Concentrate your core risk here.`
                    : 'Tag your session (New York, London, Asian) when logging trades to discover which trading window yields your highest edge.',
                },
                {
                  icon: 'layers-outline' as const,
                  accent: '#10B981',
                  title: 'Setup Dominance',
                  badge: bestSetupObj
                    ? `${getSetupLabel(bestSetupObj.setup).toUpperCase()} • ${bestSetupObj.winRate}% WIN`
                    : 'CORE PLAYBOOK',
                  text: bestSetupObj
                    ? `"${getSetupLabel(bestSetupObj.setup)}" is your most profitable setup (${bestSetupObj.winRate}% win rate, ${bestSetupObj.netRR >= 0 ? '+' : ''}${bestSetupObj.netRR.toFixed(1)}R). Focus on executing A+ quality of this model and eliminate untested setups.`
                    : 'Tag setups like Breakout, Order Block, or FVG when entering trades to pinpoint your highest-expectancy playbook.',
                },
                {
                  icon: 'alert-circle-outline' as const,
                  accent: '#EF4444',
                  title: 'Risk Leak Priority',
                  badge: data?.mostCommonMistake
                    ? getMistakeLabel(data.mostCommonMistake).toUpperCase()
                    : 'DISCIPLINE GUARD',
                  text: data?.mostCommonMistake
                    ? `Primary performance leak: "${getMistakeLabel(data.mostCommonMistake)}". Eliminating this single mistake will protect your capital and raise your profit factor.`
                    : 'Zero recurring mistakes detected. Your execution discipline and plan compliance are strong!',
                },
              ].map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.025)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.insightHeaderRow}>
                    <View style={styles.insightHeaderLeft}>
                      <View style={[styles.insightIconBox, { backgroundColor: item.accent + '18' }]}>
                        <Ionicons name={item.icon as any} size={15} color={item.accent} />
                      </View>
                      <Text style={[styles.insightTitleText, { color: colors.textPrimary }]}>{item.title}</Text>
                    </View>
                    <View
                      style={[
                        styles.insightBadgePill,
                        {
                          backgroundColor: item.accent + '15',
                          borderColor: item.accent + '35',
                        },
                      ]}
                    >
                      <Text style={[styles.insightBadgeText, { color: item.accent }]} numberOfLines={1}>
                        {item.badge}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.insightBodyText, { color: colors.textSecondary }]}>
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Tab B: SETUPS ─────────────────────────────────────────── */}
        {activeTab === 'setups' && (
          <View style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                ALL SETUPS BREAKDOWN ({topSetups.length})
              </Text>
            </View>

            {topSetups.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: S, borderColor: B }]}>
                <Ionicons name="layers-outline" size={32} color={colors.textTertiary} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Setups Tagged</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  Tag setups like Order Block, FVG, or Breakout when logging trades to view individual setup profitability.
                </Text>
              </View>
            ) : (
              topSetups.map((s, idx) => {
                const isPos = s.netRR >= 0;
                const sWins = Math.round((s.winRate / 100) * s.totalTrades);
                const sLosses = Math.max(0, s.totalTrades - sWins);

                return (
                  <View key={s.setup ?? idx} style={[styles.breakdownCard, { backgroundColor: S, borderColor: B }]}>
                    {/* Top Row: Setup Name & Return */}
                    <View style={styles.breakdownHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={[styles.miniBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
                            <Text style={[styles.miniBadgeText, { color: colors.textTertiary }]}>#{idx + 1}</Text>
                          </View>
                          <Text style={[styles.breakdownTitle, { color: colors.textPrimary, marginLeft: 8 }]}>
                            {getSetupLabel(s.setup)}
                          </Text>
                        </View>
                        <Text style={[styles.breakdownSub, { color: colors.textTertiary, marginTop: 3 }]}>
                          {s.totalTrades} Trade{s.totalTrades === 1 ? '' : 's'} • {sWins}W / {sLosses}L
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.breakdownReturn, { color: isPos ? WIN_COLOR : LOSS_COLOR }]}>
                          {isPos ? '+' : ''}{s.netRR.toFixed(1)}R
                        </Text>
                        <Text style={[styles.breakdownPnL, { color: colors.textTertiary }]}>
                          {s.winRate}% Win Rate
                        </Text>
                      </View>
                    </View>

                    {/* Segmented Ratio Bar for this setup */}
                    <View style={{ marginTop: 12 }}>
                      <SegmentedRatioBar
                        greenCount={sWins}
                        redCount={sLosses}
                        greenLabel="Wins"
                        redLabel="Losses"
                        blockSize={11}
                        gap={4}
                        containerStyle={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                          borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                        }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── Tab C: PAIRS ──────────────────────────────────────────── */}
        {activeTab === 'pairs' && (
          <View style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                ALL PAIRS PERFORMANCE ({topPairs.length})
              </Text>
            </View>

            {topPairs.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: S, borderColor: B }]}>
                <Ionicons name="stats-chart-outline" size={32} color={colors.textTertiary} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Pair Data</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  Log trades across EURUSD, GBPUSD, or XAUUSD to see asset profitability and win rate benchmarks.
                </Text>
              </View>
            ) : (
              topPairs.map((p, idx) => {
                const isPos = (p.netPnL ?? 0) >= 0;

                return (
                  <View key={p.pair ?? idx} style={[styles.breakdownCard, { backgroundColor: S, borderColor: B }]}>
                    {/* Top Row: Pair Name & Return */}
                    <View style={styles.breakdownHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={[styles.pairTagBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF', borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE' }]}>
                            <Text style={[styles.pairTagText, { color: colors.primary }]}>{p.pair.toUpperCase()}</Text>
                          </View>
                        </View>
                        <Text style={[styles.breakdownSub, { color: colors.textTertiary, marginTop: 4 }]}>
                          {p.totalTrades} Trade{p.totalTrades === 1 ? '' : 's'} • {p.wins}W / {p.losses}L
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.breakdownReturn, { color: isPos ? WIN_COLOR : LOSS_COLOR }]}>
                          {formatPnL(p.netPnL ?? 0, currency)}
                        </Text>
                        <Text style={[styles.breakdownPnL, { color: p.netRR >= 0 ? WIN_COLOR : LOSS_COLOR }]}>
                          {p.netRR >= 0 ? '+' : ''}{p.netRR.toFixed(1)}R return
                        </Text>
                      </View>
                    </View>

                    {/* Segmented Ratio Bar for this pair */}
                    <View style={{ marginTop: 12 }}>
                      <SegmentedRatioBar
                        greenCount={p.wins}
                        redCount={p.losses}
                        greenLabel="Wins"
                        redLabel="Losses"
                        blockSize={11}
                        gap={4}
                        containerStyle={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                          borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                        }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── Tab D: SESSIONS ───────────────────────────────────────── */}
        {activeTab === 'sessions' && (
          <View style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                MARKET SESSION PERFORMANCE ({topSessions.length})
              </Text>
            </View>

            {topSessions.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: S, borderColor: B }]}>
                <Ionicons name="time-outline" size={32} color={colors.textTertiary} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Session Tags</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  Tag London, New York, or Asian session when entering trades to identify your highest-edge market hours.
                </Text>
              </View>
            ) : (
              topSessions.map((sess, idx) => {
                const isPos = sess.netRR >= 0;
                const sessWins = Math.round((sess.winRate / 100) * sess.totalTrades);
                const sessLosses = Math.max(0, sess.totalTrades - sessWins);

                return (
                  <View key={sess.session ?? idx} style={[styles.breakdownCard, { backgroundColor: S, borderColor: B }]}>
                    {/* Top Row: Session Name & Return */}
                    <View style={styles.breakdownHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={[styles.sessionTagBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' }]}>
                            <Ionicons name="time-outline" size={11} color="#10B981" style={{ marginRight: 4 }} />
                            <Text style={[styles.sessionTagText, { color: '#10B981' }]}>
                              {getSessionLabel(sess.session)}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.breakdownSub, { color: colors.textTertiary, marginTop: 4 }]}>
                          {sess.totalTrades} Trade{sess.totalTrades === 1 ? '' : 's'} • {sessWins}W / {sessLosses}L
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.breakdownReturn, { color: isPos ? WIN_COLOR : LOSS_COLOR }]}>
                          {isPos ? '+' : ''}{sess.netRR.toFixed(1)}R
                        </Text>
                        <Text style={[styles.breakdownPnL, { color: colors.textTertiary }]}>
                          {sess.winRate}% Win Rate
                        </Text>
                      </View>
                    </View>

                    {/* Segmented Ratio Bar for this session */}
                    <View style={{ marginTop: 12 }}>
                      <SegmentedRatioBar
                        greenCount={sessWins}
                        redCount={sessLosses}
                        greenLabel="Wins"
                        redLabel="Losses"
                        blockSize={11}
                        gap={4}
                        containerStyle={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                          borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                        }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  pageTitle: {
    ...fontBase,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pageSub: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  accountPillText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
  },
  tabBarWrap: {
    marginTop: 4,
    marginBottom: 8,
  },
  tabPillsContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 11,
  },
  tabPillText: {
    ...fontBase,
    fontSize: 11.5,
  },

  // ── Grade Hero Card ──
  gradeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  gradeCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeBox: {
    width: 66,
    height: 66,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  gradeScoreNumber: {
    ...fontBase,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 28,
  },
  gradeScoreLabel: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
  },
  gradeInfo: {
    flex: 1,
  },
  gradeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeBadgeText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  gradePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  gradePillText: {
    ...fontBase,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  gradeSub: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 15,
  },
  scoreBarTrackWrap: {
    marginTop: 12,
    marginBottom: 12,
  },
  scoreBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  edgeIndicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  edgeIndicatorItem: {
    flex: 1,
    alignItems: 'center',
  },
  edgeIndicatorLabel: {
    ...fontBase,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  edgeIndicatorVal: {
    ...fontBase,
    fontSize: 12.5,
    fontWeight: '800',
  },
  edgeDivider: {
    width: 1,
    height: 18,
  },

  // ── Guaranteed 2x2 Metrics Grid ──
  metricsGridContainer: {
    gap: 10,
    marginBottom: 12,
  },
  metricsGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricTile: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  metricTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    ...fontBase,
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  metricSub: {
    ...fontBase,
    fontSize: 10.5,
    fontWeight: '500',
  },

  // ── Key Edge Drivers ──
  sectionHeaderWrap: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    ...fontBase,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tileIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileDriverLabel: {
    ...fontBase,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tileDriverValue: {
    ...fontBase,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  tileDriverSub: {
    ...fontBase,
    fontSize: 10,
    fontWeight: '600',
  },

  // ── Cards & Breakdown Wraps ──
  cardWrap: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...fontBase,
    fontSize: 14,
    fontWeight: '800',
  },
  cardSubtitle: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },

  // Plan Discipline Comparison
  comparisonGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  comparisonBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  compBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compBoxTitle: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '800',
  },
  compReturnVal: {
    ...fontBase,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  compPnLVal: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  compMetaRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  compMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  compMiniBadgeText: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Execution Benchmarks
  benchmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  benchmarkLabel: {
    ...fontBase,
    fontSize: 12.5,
    fontWeight: '500',
  },
  benchmarkValue: {
    ...fontBase,
    fontSize: 13,
    fontWeight: '800',
  },

  // Insights
  insightCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  insightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  insightIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  insightTitleText: {
    ...fontBase,
    fontSize: 12.5,
    fontWeight: '800',
  },
  insightBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: '50%',
  },
  insightBadgeText: {
    ...fontBase,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  insightBodyText: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16.5,
  },

  // Breakdown Card (Setups, Pairs, Sessions)
  breakdownCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  miniBadgeText: {
    ...fontBase,
    fontSize: 10,
    fontWeight: '700',
  },
  breakdownTitle: {
    ...fontBase,
    fontSize: 14.5,
    fontWeight: '800',
  },
  breakdownSub: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
  },
  breakdownReturn: {
    ...fontBase,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  breakdownPnL: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  pairTagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  pairTagText: {
    ...fontBase,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sessionTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  sessionTagText: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...fontBase,
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
});
