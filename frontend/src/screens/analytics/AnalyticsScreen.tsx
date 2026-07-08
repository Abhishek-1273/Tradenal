import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { useAnalytics, useDisciplineScore } from '../../hooks/useTrades';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/dashboard/StatCard';
import { Skeleton } from '../../components/common/LoadingOverlay';
import { EmptyState } from '../../components/common/EmptyState';
import { BarChart } from '../../components/charts/BarChart';
import { LineChart } from '../../components/charts/LineChart';
import { HorizontalBarChart } from '../../components/charts/HorizontalBarChart';
import { PsychologyChart } from '../../components/charts/PsychologyChart';
import {
  formatPercent, getDisciplineScoreColor, getDisciplineScoreLabel,
  getSetupLabel, getSessionLabel, getMistakeLabel, formatProfitFactor, formatPnL
} from '../../utils/formatters';
import { useAccountStore } from '../../store/account.store';

const { width: SW } = Dimensions.get('window');

type Tab = 'Overview' | 'Pairs' | 'Psychology' | 'Discipline';

const TABS: Tab[] = ['Overview', 'Pairs', 'Psychology', 'Discipline'];

export const AnalyticsScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const { data, isLoading } = useAnalytics();
  const { data: disciplineData, isLoading: disciplineLoading } = useDisciplineScore('all');
  const { activeAccount } = useAccountStore();
  const [selectedPair, setSelectedPair] = useState<any | null>(null);

  const overviewFadeAnim = useRef(new Animated.Value(0)).current;
  const overviewSlideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (activeTab === 'Overview') {
      overviewFadeAnim.setValue(0);
      overviewSlideAnim.setValue(15);
      Animated.parallel([
        Animated.timing(overviewFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(overviewSlideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeTab]);

  const planFollowedAnim = useRef(new Animated.Value(0)).current;
  const revengeTradeAnim = useRef(new Animated.Value(0)).current;
  const overtradingAnim = useRef(new Animated.Value(0)).current;
  const movedSLAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeTab === 'Psychology') {
      planFollowedAnim.setValue(0);
      revengeTradeAnim.setValue(0);
      overtradingAnim.setValue(0);
      movedSLAnim.setValue(0);

      Animated.stagger(100, [
        Animated.timing(planFollowedAnim, {
          toValue: disciplineData?.breakdown?.planFollowed ?? 0,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(revengeTradeAnim, {
          toValue: disciplineData?.breakdown?.noRevengeTrade ?? 0,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(overtradingAnim, {
          toValue: disciplineData?.breakdown?.noOvertrading ?? 0,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(movedSLAnim, {
          toValue: disciplineData?.breakdown?.noMovedSL ?? 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [activeTab, disciplineData]);

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  const dispPlanAnim = useRef(new Animated.Value(0)).current;
  const dispRevengeAnim = useRef(new Animated.Value(0)).current;
  const dispOvertradeAnim = useRef(new Animated.Value(0)).current;
  const dispMovedSLAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeTab === 'Discipline') {
      scoreAnim.setValue(0);
      dispPlanAnim.setValue(0);
      dispRevengeAnim.setValue(0);
      dispOvertradeAnim.setValue(0);
      dispMovedSLAnim.setValue(0);

      const id = scoreAnim.addListener(({ value }) => {
        setDisplayScore(Math.floor(value));
      });

      Animated.parallel([
        Animated.timing(scoreAnim, {
          toValue: disciplineData?.score ?? 0,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.stagger(100, [
          Animated.timing(dispPlanAnim, {
            toValue: disciplineData?.breakdown?.planFollowed ?? 0,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(dispRevengeAnim, {
            toValue: disciplineData?.breakdown?.noRevengeTrade ?? 0,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(dispOvertradeAnim, {
            toValue: disciplineData?.breakdown?.noOvertrading ?? 0,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(dispMovedSLAnim, {
            toValue: disciplineData?.breakdown?.noMovedSL ?? 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
      ]).start();

      return () => {
        scoreAnim.removeListener(id);
      };
    }
  }, [activeTab, disciplineData]);

  const overall = data?.overall;
  const hasData = (overall?.totalTrades ?? 0) > 0;

  const sortedPairsByNetR = [...(data?.byPair ?? [])].sort((a, b) => b.netRR - a.netRR);
  const bestPairItem = sortedPairsByNetR[0];
  const worstPairItem = sortedPairsByNetR[sortedPairsByNetR.length - 1];

  const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <View
      style={[
        styles.sectionHeader,
        {
          marginBottom: spacing[3],
          flexDirection: 'column',
          alignItems: 'flex-start',
        },
      ]}
    >
      <Text style={[typography.h3, { color: colors.textPrimary }]}>
        {title}
      </Text>

      {subtitle && (
        <Text
          style={[
            typography.caption,
            {
              color: colors.textTertiary,
              marginTop: spacing[1],
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );

  const disciplineExplanation = () => {
    if (!disciplineData?.breakdown) return null;
    const { planFollowed, noRevengeTrade, noOvertrading, noMovedSL } = disciplineData.breakdown;
    const categories = [
      { name: 'Plan Adherence', score: planFollowed, tip: 'You are struggling to stick to your trading setups. Try writing out your entry rules checklist before clicking buy/sell.' },
      { name: 'Revenge Trading', score: noRevengeTrade, tip: 'You have taken revenge trades after losses. Force yourself to close the terminal for 2 hours after any hit stop loss.' },
      { name: 'Overtrading', score: noOvertrading, tip: 'You are trading too frequently. Set a hard daily limit (e.g. max 3 trades) and shut down when reached.' },
      { name: 'Respecting Stop Loss', score: noMovedSL, tip: 'You are moving your stop losses during live trades. Set your stop loss at entry and do not touch it.' },
    ];

    const lowest = [...categories].sort((a, b) => a.score - b.score)[0];
    if (lowest && lowest.score < 90) {
      return {
        category: lowest.name,
        score: lowest.score,
        tip: lowest.tip,
      };
    }
    return {
      category: 'Consistent Discipline',
      score: 100,
      tip: 'Excellent work! You are keeping rules clean and executing flawlessly. Keep maintaining this institutional patience.',
    };
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: spacing[5] }]}>
        <Text style={[typography.h2, { color: colors.textPrimary }]}>Analytics</Text>
        <Text style={[typography.body, { color: colors.textTertiary }]}>All-time performance</Text>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabScroll, { paddingHorizontal: spacing[5] }]}
        contentContainerStyle={[
          styles.tabScrollContent,
          { paddingRight: spacing[10] },
        ]}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.75}
            style={[
              styles.tabBtn,
              {
                backgroundColor: activeTab === tab ? colors.primary : colors.surfaceElevated,
                borderRadius: radii.full,
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[2],
                marginRight: spacing[2],
              },
            ]}
          >
            <Text numberOfLines={1} style={[typography.label, { color: activeTab === tab ? '#fff' : colors.textTertiary }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 80 }]}
      >
        {isLoading ? (
          <AnalyticsSkeleton />
        ) : !hasData ? (
          <EmptyState
            icon="bar-chart-outline"
            title="No data yet"
            description="Log trades to see your performance analytics."
          />
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'Overview' && (
              <Animated.View style={{ opacity: overviewFadeAnim, transform: [{ translateY: overviewSlideAnim }] }}>
                {/* Net Performance Summary */}
                <View style={[styles.statsGrid, { marginBottom: spacing[4] }]}>
                  <StatCard
                    label="Net R"
                    value={`${(overall?.netRR ?? 0) >= 0 ? '+' : ''}${(overall?.netRR ?? 0).toFixed(2)}R`}
                    icon="trending-up"
                    iconColor={(overall?.netRR ?? 0) >= 0 ? colors.success : colors.error}
                    highlight
                    highlightColor={(overall?.netRR ?? 0) >= 0 ? colors.success : colors.error}
                    style={styles.halfCard}
                  />
                  <StatCard
                    label="Net P&L"
                    value={formatPnL(overall?.netPnL, activeAccount?.currency)}
                    icon="cash"
                    iconColor={(overall?.netPnL ?? 0) >= 0 ? colors.success : colors.error}
                    highlight
                    highlightColor={(overall?.netPnL ?? 0) >= 0 ? colors.success : colors.error}
                    style={styles.halfCard}
                  />
                </View>

                {/* Key Stats */}
                <View style={[styles.statsGrid, { marginBottom: spacing[4] }]}>
                  <StatCard
                    label="Win Rate"
                    value={formatPercent(overall?.winRate ?? 0)}
                    icon="checkmark-circle"
                    iconColor={colors.primary}
                    highlight
                    highlightColor={colors.primary}
                    style={styles.halfCard}
                  />
                  <StatCard
                    label="Profit Factor"
                    value={formatProfitFactor(overall?.profitFactor)}
                    icon="flash"
                    iconColor={(overall?.profitFactor ?? 0) >= 1.5 ? colors.success : colors.warning}
                    highlight
                    highlightColor={(overall?.profitFactor ?? 0) >= 1.5 ? colors.success : colors.warning}
                    style={styles.halfCard}
                  />
                </View>

                <View style={[styles.statsGrid, { marginBottom: spacing[4] }]}>
                  <StatCard label="Expectancy" value={`${(overall?.expectancy ?? 0).toFixed(2)}R`} compact style={styles.thirdCard} />
                  <StatCard label="Avg Win" value={`+${(overall?.avgWin ?? 0).toFixed(2)}R`} compact style={styles.thirdCard} iconColor={colors.success} />
                  <StatCard label="Avg Loss" value={`-${(overall?.avgLoss ?? 0).toFixed(2)}R`} compact style={styles.thirdCard} iconColor={colors.error} />
                </View>

                <View style={[styles.statsGrid, { marginBottom: spacing[5] }]}>
                  <StatCard label="Best Streak" value={`${overall?.longestWinStreak ?? 0}W`} compact style={styles.halfCard} iconColor={colors.success} icon="trending-up" />
                  <StatCard label="Worst Streak" value={`${overall?.longestLossStreak ?? 0}L`} compact style={styles.halfCard} iconColor={colors.error} icon="trending-down" />
                </View>

                {/* Monthly performance */}
                {(data?.monthlyPerformance?.length ?? 0) > 0 && (
                  <Card style={{ marginBottom: spacing[4] }}>
                    <SectionTitle title="Monthly Net R" subtitle="Last 6 months" />
                    <BarChart
                      data={(data?.monthlyPerformance ?? []).map((m) => ({
                        x: m.month.split(' ')[0],
                        y: m.netRR,
                      }))}
                      height={200}
                      tickFormat={(t) => `${t >= 0 ? '+' : ''}${t.toFixed(1)}R`}
                    />
                  </Card>
                )}

                {/* Weekly Win Rate */}
                {(data?.weeklyPerformance?.filter((w) => w.trades > 0).length ?? 0) > 1 && (
                  <Card style={{ marginBottom: spacing[4] }}>
                    <SectionTitle title="Weekly Win Rate" subtitle="Last 8 weeks" />
                    <LineChart
                      data={(data?.weeklyPerformance ?? [])
                        .filter((w) => w.trades > 0)
                        .map((w, i) => ({
                          x: i + 1,
                          y: w.winRate,
                          label: w.week,
                        }))}
                      height={160}
                      color={colors.primary}
                      xTickFormat={(t) => {
                        const weeks = (data?.weeklyPerformance ?? []).filter((w) => w.trades > 0);
                        return weeks[t - 1]?.week ?? '';
                      }}
                      yTickFormat={(t) => `${t}%`}
                    />
                  </Card>
                )}

                {/* Session breakdown */}
                <Card style={{ marginBottom: spacing[4] }}>
                  <SectionTitle title="By Session" />
                  <HorizontalBarChart
                    data={(data?.bySession ?? [])
                      .filter((s) => s.totalTrades > 0)
                      .sort((a, b) => b.winRate - a.winRate)
                      .map((s) => ({
                        label: getSessionLabel(s.session),
                        value: s.winRate,
                        subLabel: `${s.totalTrades} trades`,
                        color: s.winRate >= 50 ? colors.success : colors.error,
                      }))}
                    valueFormat={(v) => `${v.toFixed(0)}%`}
                  />
                  {/* Session net RR */}
                  <View style={[{ marginTop: spacing[4] }]}>
                    <Text style={[typography.label, { color: colors.textTertiary, marginBottom: spacing[3] }]}>
                      NET R BY SESSION
                    </Text>
                    <HorizontalBarChart
                      data={(data?.bySession ?? [])
                        .filter((s) => s.totalTrades > 0)
                        .sort((a, b) => b.netRR - a.netRR)
                        .map((s) => ({
                          label: getSessionLabel(s.session),
                          value: s.netRR,
                          subLabel: `WR ${formatPercent(s.winRate)}`,
                        }))}
                      valueFormat={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`}
                    />
                  </View>
                </Card>

                {/* Setup breakdown */}
                {(data?.bySetup?.filter((s) => s.totalTrades > 0).length ?? 0) > 0 && (
                  <Card style={{ marginBottom: spacing[4] }}>
                    <SectionTitle title="By Setup" />
                    <HorizontalBarChart
                      data={(data?.bySetup ?? [])
                        .filter((s) => s.totalTrades > 0)
                        .sort((a, b) => b.netRR - a.netRR)
                        .map((s) => ({
                          label: getSetupLabel(s.setup),
                          value: s.netRR,
                          subLabel: `${s.totalTrades}t · WR ${formatPercent(s.winRate)}`,
                        }))}
                      valueFormat={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`}
                    />
                  </Card>
                )}

                {/* Key insights */}
                <Card style={{ marginBottom: spacing[4], padding: spacing[4] }}>
                  <SectionTitle title="Key Insights" subtitle="Intelligent analytics summary of your habits" />
                  {[
                    {
                      label: 'Best Performing Asset',
                      subtitle: 'Highest net profit by currency pair',
                      value: data?.bestPair ?? '—',
                      color: colors.success,
                      bg: colors.success + '15',
                      icon: 'trophy-outline',
                    },
                    {
                      label: 'Worst Performing Asset',
                      subtitle: 'Largest drag on overall account performance',
                      value: data?.worstPair ?? '—',
                      color: colors.error,
                      bg: colors.error + '15',
                      icon: 'trending-down-outline',
                    },
                    {
                      label: 'Most Reliable Setup',
                      subtitle: 'Highest success rate strategic setup',
                      value: data?.bestSetup ? getSetupLabel(data.bestSetup) : '—',
                      color: colors.primary,
                      bg: colors.primary + '15',
                      icon: 'sparkles-outline',
                    },
                    {
                      label: 'Optimal Trading Session',
                      subtitle: 'Time window with the highest profitability',
                      value: data?.bestSession ? getSessionLabel(data.bestSession) : '—',
                      color: colors.info,
                      bg: colors.info + '15',
                      icon: 'time-outline',
                    },
                    {
                      label: 'Primary Leakage Area',
                      subtitle: 'Most frequent trading error to eliminate',
                      value: data?.mostCommonMistake ? getMistakeLabel(data.mostCommonMistake) : '—',
                      color: colors.warning,
                      bg: colors.warning + '15',
                      icon: 'alert-circle-outline',
                    },
                  ].map((item, i, arr) => (
                    <View
                      key={item.label}
                      style={{
                        paddingVertical: spacing[3],
                        borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing[3] }}>
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: item.bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: spacing[3],
                        }}>
                          <Ionicons name={item.icon as any} size={18} color={item.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.label, { color: colors.textPrimary }]}>{item.label}</Text>
                          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]} numberOfLines={1}>{item.subtitle}</Text>
                        </View>
                      </View>
                      <Text style={[typography.label, { color: item.color, textAlign: 'right', fontWeight: '700' }]}>{item.value}</Text>
                    </View>
                  ))}
                </Card>
              </Animated.View>
            )}

            {/* ── PAIRS TAB ── */}
            {activeTab === 'Pairs' && (
              <View>
                {(data?.byPair?.length ?? 0) === 0 ? (
                  <EmptyState icon="swap-horizontal-outline" title="No pair data yet" />
                ) : (
                  <>
                    {/* Best/Worst Pair Hero Cards */}
                    <View style={[styles.statsGrid, { marginBottom: spacing[4] }]}>
                      <Card style={{ ...styles.halfCard, borderColor: colors.success + '40', borderWidth: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Ionicons name="trophy-outline" size={16} color={colors.success} style={{ marginRight: 6 }} />
                          <Text style={[typography.caption, { color: colors.textTertiary }]}>Best Pair</Text>
                        </View>
                        <Text style={[typography.h3, { color: colors.success }]}>{bestPairItem?.pair ?? '—'}</Text>
                        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                          Net: {bestPairItem ? `${bestPairItem.netRR >= 0 ? '+' : ''}${bestPairItem.netRR.toFixed(2)}R` : '—'}
                        </Text>
                      </Card>

                      <Card style={{ ...styles.halfCard, borderColor: colors.error + '40', borderWidth: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Ionicons name="trending-down-outline" size={16} color={colors.error} style={{ marginRight: 6 }} />
                          <Text style={[typography.caption, { color: colors.textTertiary }]}>Worst Pair</Text>
                        </View>
                        <Text style={[typography.h3, { color: colors.error }]}>{worstPairItem?.pair ?? '—'}</Text>
                        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                          Net: {worstPairItem ? `${worstPairItem.netRR >= 0 ? '+' : ''}${worstPairItem.netRR.toFixed(2)}R` : '—'}
                        </Text>
                      </Card>
                    </View>

                    {/* Ranked Pair Cards */}
                    <Card style={{ marginBottom: spacing[4] }}>
                      <SectionTitle title="Ranked Pairs" subtitle="Sorted by Net Profit/Loss" />
                      {sortedPairsByNetR.slice(0, 3).map((p, idx) => (
                        <TouchableOpacity
                          key={p.pair}
                          onPress={() => setSelectedPair(p)}
                          activeOpacity={0.8}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: spacing[3],
                            borderBottomWidth: idx < Math.min(3, sortedPairsByNetR.length) - 1 ? StyleSheet.hairlineWidth : 0,
                            borderBottomColor: colors.border,
                          }}
                        >
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[typography.label, { color: colors.textPrimary }]}>{p.pair}</Text>
                            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>{p.totalTrades} trades • WR {formatPercent(p.winRate)}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[typography.label, { color: (p.netPnL ?? 0) >= 0 ? colors.success : colors.error }]}>
                              {formatPnL(p.netPnL, activeAccount?.currency)}
                            </Text>
                            <Text style={[typography.caption, { color: p.netRR >= 0 ? colors.success : colors.error, marginTop: 2, textAlign: 'right' }]}>
                              {p.netRR >= 0 ? '+' : ''}{p.netRR.toFixed(2)}R
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </Card>

                    <Card style={{ marginBottom: spacing[4] }}>
                      <SectionTitle title="Win Rate by Pair" />
                      <HorizontalBarChart
                        data={(data?.byPair ?? [])
                          .sort((a, b) => b.winRate - a.winRate)
                          .map((p) => ({
                            label: p.pair,
                            value: p.winRate,
                            subLabel: `${p.totalTrades} trades`,
                            color: p.winRate >= 50 ? colors.success : colors.error,
                          }))}
                        valueFormat={(v) => `${v.toFixed(0)}%`}
                        maxBars={10}
                      />
                    </Card>

                    <Card style={{ marginBottom: spacing[4] }}>
                      <SectionTitle title="Net R by Pair" />
                      <HorizontalBarChart
                        data={(data?.byPair ?? [])
                          .sort((a, b) => b.netRR - a.netRR)
                          .map((p) => ({
                            label: p.pair,
                            value: p.netRR,
                            subLabel: `WR ${formatPercent(p.winRate)}`,
                          }))}
                        valueFormat={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`}
                        maxBars={10}
                      />
                    </Card>

                    {/* Full pair table */}
                    <Card style={{ marginBottom: spacing[4] }}>
                      <SectionTitle title="Full Pair Stats" subtitle="Tap on a pair to view full stats details" />
                      <View style={styles.tableHeader}>
                        {['Pair', 'Trades', 'WR', 'Net P&L', 'Net R'].map((h) => (
                          <Text
                            key={h}
                            style={[typography.labelSm, { color: colors.textTertiary, flex: 1, textAlign: h === 'Pair' ? 'left' : 'right' }]}
                          >
                            {h}
                          </Text>
                        ))}
                      </View>
                      {(data?.byPair ?? [])
                        .sort((a, b) => b.totalTrades - a.totalTrades)
                        .map((p, i) => (
                          <TouchableOpacity
                            key={p.pair}
                            onPress={() => setSelectedPair(p)}
                            activeOpacity={0.7}
                            style={[
                              styles.tableRow,
                              {
                                paddingVertical: spacing[3],
                                borderTopWidth: StyleSheet.hairlineWidth,
                                borderTopColor: colors.border,
                              },
                            ]}
                          >
                            <Text style={[typography.label, { color: colors.textPrimary, flex: 1 }]}>{p.pair}</Text>
                            <Text style={[typography.body, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>{p.totalTrades}</Text>
                            <Text style={[typography.label, { color: p.winRate >= 50 ? colors.success : colors.error, flex: 1, textAlign: 'right' }]}>{formatPercent(p.winRate)}</Text>
                            <Text style={[typography.label, { color: (p.netPnL ?? 0) >= 0 ? colors.success : colors.error, flex: 1, textAlign: 'right' }]}>{formatPnL(p.netPnL, activeAccount?.currency)}</Text>
                            <Text style={[typography.label, { color: p.netRR >= 0 ? colors.success : colors.error, flex: 1, textAlign: 'right' }]}>{p.netRR >= 0 ? '+' : ''}{p.netRR.toFixed(2)}R</Text>
                          </TouchableOpacity>
                        ))}
                    </Card>
                  </>
                )}
              </View>
            )}

            {/* ── PSYCHOLOGY TAB ── */}
            {activeTab === 'Psychology' && (
              <View>
                {/* Emotion analysis */}
                <Card style={{ marginBottom: spacing[4] }}>
                  <SectionTitle
                    title="Emotion Before Trade"
                    subtitle="Win rate per emotional state"
                  />
                  <PsychologyChart data={data?.emotionBreakdown ?? []} />
                </Card>

                {/* Discipline behaviour */}
                 <Card style={{ marginBottom: spacing[4], padding: spacing[4] }}>
                   <SectionTitle title="Discipline Behaviour" subtitle="Plan adherence rate & rules consistency" />
 
                   {/* Category progress bars */}
                   <View style={{ marginBottom: spacing[4] }}>
                     {[
                       { label: 'Followed Plan', rawValue: disciplineData?.breakdown?.planFollowed ?? 0, anim: planFollowedAnim, icon: 'document-text-outline', color: colors.primary },
                       { label: 'No Revenge Trade', rawValue: disciplineData?.breakdown?.noRevengeTrade ?? 0, anim: revengeTradeAnim, icon: 'flame-outline', color: colors.warning },
                       { label: 'No Overtrading', rawValue: disciplineData?.breakdown?.noOvertrading ?? 0, anim: overtradingAnim, icon: 'warning-outline', color: colors.info },
                       { label: 'No Moved SL', rawValue: disciplineData?.breakdown?.noMovedSL ?? 0, anim: movedSLAnim, icon: 'shield-checkmark-outline', color: colors.success },
                     ].map((item) => {
                       const widthPercent = item.anim.interpolate({
                         inputRange: [0, 100],
                         outputRange: ['0%', '100%'],
                       });

                       const getDisciplineStatus = (val: number) => {
                         if (val >= 90) return { text: 'Excellent', color: colors.success };
                         if (val >= 75) return { text: 'Strong', color: colors.primary };
                         if (val >= 60) return { text: 'Needs Attention', color: colors.warning };
                         return { text: 'Critical Focus', color: colors.error };
                       };

                       const status = getDisciplineStatus(item.rawValue);

                       return (
                         <View key={item.label} style={{ marginBottom: spacing[4] }}>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                               <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: item.color + '12', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                 <Ionicons name={item.icon as any} size={14} color={item.color} />
                               </View>
                               <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>{item.label}</Text>
                             </View>
                             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                               <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: status.color + '12' }}>
                                 <Text style={[typography.caption, { color: status.color, fontWeight: '700', fontSize: 10 }]}>{status.text.toUpperCase()}</Text>
                               </View>
                               <Text style={[typography.label, { color: item.color, width: 38, textAlign: 'right' }]}>{item.rawValue}%</Text>
                             </View>
                           </View>
                           <View style={{ height: 8, backgroundColor: colors.surfaceHighlight, borderRadius: 4, overflow: 'hidden' }}>
                             <Animated.View style={{ width: widthPercent, height: '100%', backgroundColor: item.color, borderRadius: 4 }} />
                           </View>
                         </View>
                       );
                     })}
                   </View>

                  {/* Behaviour bars - calculated from mistake breakdown */}
                  {(data?.mistakesBreakdown?.length ?? 0) > 0 && (
                    <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing[4] }}>
                      <Text style={[typography.label, { color: colors.textTertiary, marginBottom: spacing[3] }]}>
                        MISTAKE FREQUENCY
                      </Text>
                      <HorizontalBarChart
                        data={(data?.mistakesBreakdown ?? []).map((m) => ({
                          label: getMistakeLabel(m.mistake),
                          value: m.count,
                          color: colors.error,
                        }))}
                        valueFormat={(v) => `${v}x`}
                        maxBars={8}
                        colorFn={(_, i) => {
                          const intensity = 1 - i * 0.1;
                          return colors.error + Math.round(intensity * 255).toString(16).padStart(2, '0');
                        }}
                      />
                    </View>
                  )}
                </Card>

                {/* Psychology Performance Comparisons */}
                {data?.psychologyComparisons && (
                  <View style={{ marginBottom: spacing[4] }}>
                    <SectionTitle title="Comparative Performance" subtitle="Adhering to plan vs breaking rules" />

                     {/* Plan Followed vs Plan Broken */}
                     <Card style={{ marginBottom: spacing[4], padding: spacing[4] }}>
                       <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3], gap: 8 }}>
                         <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
                         <Text style={[typography.label, { color: colors.textPrimary }]}>PLAN ADHERENCE COMPARISON</Text>
                       </View>
                       <View style={{ flexDirection: 'row', gap: 12 }}>
                         {/* Plan Followed */}
                         <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, padding: spacing[3.5], borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.success }}>
                           <Text style={[typography.caption, { color: colors.textTertiary, fontWeight: '600' }]}>Followed Plan</Text>
                           <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 4 }]}>
                             {data.psychologyComparisons.planFollowed.trades} trades
                           </Text>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                             <Text style={[typography.caption, { color: colors.textSecondary }]}>Net R</Text>
                             <Text style={[typography.labelSm, { color: data.psychologyComparisons.planFollowed.netRR >= 0 ? colors.success : colors.error, fontWeight: '700' }]}>
                               {data.psychologyComparisons.planFollowed.netRR >= 0 ? '+' : ''}{data.psychologyComparisons.planFollowed.netRR.toFixed(1)}R
                             </Text>
                           </View>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                             <Text style={[typography.caption, { color: colors.textSecondary }]}>Win Rate</Text>
                             <Text style={[typography.labelSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                               {formatPercent(data.psychologyComparisons.planFollowed.winRate)}
                             </Text>
                           </View>
                         </View>
 
                         {/* Plan Broken */}
                         <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, padding: spacing[3.5], borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.error }}>
                           <Text style={[typography.caption, { color: colors.textTertiary, fontWeight: '600' }]}>Broken Plan</Text>
                           <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 4 }]}>
                             {data.psychologyComparisons.planBroken.trades} trades
                           </Text>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                             <Text style={[typography.caption, { color: colors.textSecondary }]}>Net R</Text>
                             <Text style={[typography.labelSm, { color: data.psychologyComparisons.planBroken.netRR >= 0 ? colors.success : colors.error, fontWeight: '700' }]}>
                               {data.psychologyComparisons.planBroken.netRR >= 0 ? '+' : ''}{data.psychologyComparisons.planBroken.netRR.toFixed(1)}R
                             </Text>
                           </View>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                             <Text style={[typography.caption, { color: colors.textSecondary }]}>Win Rate</Text>
                             <Text style={[typography.labelSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                               {formatPercent(data.psychologyComparisons.planBroken.winRate)}
                             </Text>
                           </View>
                         </View>
                       </View>

                       {/* Dynamic math insight */}
                       {(() => {
                         const followedNetR = data.psychologyComparisons.planFollowed.netRR;
                         const brokenNetR = data.psychologyComparisons.planBroken.netRR;
                         const followedCount = data.psychologyComparisons.planFollowed.trades;
                         const brokenCount = data.psychologyComparisons.planBroken.trades;
                         const diffR = followedNetR - brokenNetR;
                         const avgFollowedR = followedCount > 0 ? followedNetR / followedCount : 0;
                         const avgBrokenR = brokenCount > 0 ? brokenNetR / brokenCount : 0;
                         const avgDiffR = avgFollowedR - avgBrokenR;

                         return (
                           <View style={{ marginTop: spacing[3], padding: spacing[3], backgroundColor: colors.primary + '08', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                             <Ionicons name="analytics-outline" size={16} color={colors.primary} />
                             <Text style={[typography.caption, { color: colors.textSecondary, flex: 1, lineHeight: 16 }]}>
                               {diffR > 0
                                 ? `Following your plan generates +${diffR.toFixed(1)}R more than deviating. Each disciplined trade yields +${avgDiffR.toFixed(1)}R extra on average.`
                                 : `Your disciplined trades and broken trades perform similarly. Review if your trading plan rules are fully optimized.`}
                             </Text>
                           </View>
                         );
                       })()}
                     </Card>
 
                     {/* Revenge vs Standard */}
                     <Card style={{ marginBottom: spacing[4], padding: spacing[4] }}>
                       <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3], gap: 8 }}>
                         <Ionicons name="flame-outline" size={18} color={colors.warning} />
                         <Text style={[typography.label, { color: colors.textPrimary }]}>REVENGE TRADING IMPACT</Text>
                       </View>
                       <View style={{ flexDirection: 'row', gap: 12 }}>
                         {/* Standard Trades */}
                         <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, padding: spacing[3.5], borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.primary }}>
                           <Text style={[typography.caption, { color: colors.textTertiary, fontWeight: '600' }]}>Standard Trades</Text>
                           <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 4 }]}>
                             {data.psychologyComparisons.standard.trades} trades
                           </Text>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                             <Text style={[typography.caption, { color: colors.textSecondary }]}>Net R</Text>
                             <Text style={[typography.labelSm, { color: data.psychologyComparisons.standard.netRR >= 0 ? colors.success : colors.error, fontWeight: '700' }]}>
                               {data.psychologyComparisons.standard.netRR >= 0 ? '+' : ''}{data.psychologyComparisons.standard.netRR.toFixed(1)}R
                             </Text>
                           </View>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                             <Text style={[typography.caption, { color: colors.textSecondary }]}>Win Rate</Text>
                             <Text style={[typography.labelSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                               {formatPercent(data.psychologyComparisons.standard.winRate)}
                             </Text>
                           </View>
                         </View>
 
                         {/* Revenge Trades */}
                         <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, padding: spacing[3.5], borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.warning }}>
                           <Text style={[typography.caption, { color: colors.textTertiary, fontWeight: '600' }]}>Revenge Trades</Text>
                           <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 4 }]}>
                             {data.psychologyComparisons.revenge.trades} trades
                           </Text>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                             <Text style={[typography.caption, { color: colors.textSecondary }]}>Net R</Text>
                             <Text style={[typography.labelSm, { color: data.psychologyComparisons.revenge.netRR >= 0 ? colors.success : colors.error, fontWeight: '700' }]}>
                               {data.psychologyComparisons.revenge.netRR >= 0 ? '+' : ''}{data.psychologyComparisons.revenge.netRR.toFixed(1)}R
                             </Text>
                           </View>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                             <Text style={[typography.caption, { color: colors.textSecondary }]}>Win Rate</Text>
                             <Text style={[typography.labelSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                               {formatPercent(data.psychologyComparisons.revenge.winRate)}
                             </Text>
                           </View>
                         </View>
                       </View>

                       {/* Dynamic revenge trading math insight */}
                       {(() => {
                         const stdNetR = data.psychologyComparisons.standard.netRR;
                         const revNetR = data.psychologyComparisons.revenge.netRR;
                         const stdCount = data.psychologyComparisons.standard.trades;
                         const revCount = data.psychologyComparisons.revenge.trades;
                         const avgStdR = stdCount > 0 ? stdNetR / stdCount : 0;
                         const avgRevR = revCount > 0 ? revNetR / revCount : 0;

                         return (
                           <View style={{ marginTop: spacing[3], padding: spacing[3], backgroundColor: colors.warning + '08', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                             <Ionicons name="shield-outline" size={16} color={colors.warning} />
                             <Text style={[typography.caption, { color: colors.textSecondary, flex: 1, lineHeight: 16 }]}>
                               {revCount > 0
                                 ? `Revenge trading has cost you ${Math.abs(revNetR).toFixed(1)}R. Standard trades yield +${avgStdR.toFixed(1)}R on average, compared to ${avgRevR.toFixed(1)}R for revenge trades.`
                                 : `No revenge trades logged. Keeping a cool head prevents unnecessary account drawdowns.`}
                             </Text>
                           </View>
                         );
                       })()}
                     </Card>
                   </View>
                 )}

                {/* Emotion after correlation */}
                {(data?.emotionBreakdown?.length ?? 0) > 0 && (
                  <Card style={{ marginBottom: spacing[4] }}>
                    <SectionTitle title="Emotion Impact" subtitle="How state affects trading" />

                    <View style={[{ padding: spacing[3], backgroundColor: colors.surfaceElevated, borderRadius: 12, marginBottom: spacing[3] }]}>
                      <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                        {(() => {
                          const sorted = [...(data?.emotionBreakdown ?? [])].sort((a, b) => b.winRate - a.winRate);
                          const best = sorted[0];
                          const worst = sorted[sorted.length - 1];
                          if (!best || !worst) return 'Log more trades with emotion tracking to see insights.';
                          return `Your best win rate (${formatPercent(best.winRate)}) occurs when feeling ${best.emotion}. ` +
                            `Avoid trading when ${worst.emotion} — your win rate drops to ${formatPercent(worst.winRate)}.`;
                        })()}
                      </Text>
                    </View>

                    {/* Win rate comparison bars */}
                    {(data?.emotionBreakdown ?? [])
                      .sort((a, b) => b.winRate - a.winRate)
                      .map((e) => (
                        <View key={e.emotion} style={[{ marginBottom: spacing[3] }]}>
                          <View style={[{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }]}>
                            <Text style={[typography.body, { color: colors.textSecondary }]}>
                              {e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1)}
                            </Text>
                            <Text style={[typography.label, {
                              color: e.winRate >= 60 ? colors.success : e.winRate >= 50 ? colors.warning : colors.error,
                            }]}>
                              {formatPercent(e.winRate)} · {e.count} trades
                            </Text>
                          </View>
                          <View style={[{ height: 8, backgroundColor: colors.surfaceHighlight, borderRadius: 4, overflow: 'hidden' }]}>
                            <View style={[{
                              width: `${e.winRate}%`,
                              height: '100%',
                              backgroundColor: e.winRate >= 60 ? colors.success : e.winRate >= 50 ? colors.warning : colors.error,
                              borderRadius: 4,
                            }]} />
                          </View>
                        </View>
                      ))}
                  </Card>
                )}

                {/* Mistake impact */}
                {(data?.mistakesBreakdown?.length ?? 0) > 0 && (
                  <Card style={{ marginBottom: spacing[4] }}>
                    <SectionTitle title="Top Mistakes" subtitle="Most frequent errors costing you R" />
                    {(data?.mistakesBreakdown ?? []).slice(0, 6).map((m, i) => (
                      <View
                        key={m.mistake}
                        style={[
                          styles.insightRow,
                          {
                            paddingVertical: spacing[3],
                            borderBottomWidth: i < 5 ? StyleSheet.hairlineWidth : 0,
                            borderBottomColor: colors.border,
                          },
                        ]}
                      >
                        <View style={[{ flexDirection: 'row', alignItems: 'center', flex: 1 }]}>
                          <Text style={[typography.label, { color: colors.textTertiary, width: 24 }]}>
                            {i + 1}.
                          </Text>
                          <Text style={[typography.body, { color: colors.textSecondary }]}>
                            {getMistakeLabel(m.mistake)}
                          </Text>
                        </View>
                        <View style={[{
                          backgroundColor: colors.errorSubtle,
                          borderRadius: 6,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                        }]}>
                          <Text style={[typography.label, { color: colors.error }]}>{m.count}x</Text>
                        </View>
                      </View>
                    ))}
                  </Card>
                )}
              </View>
            )}

            {/* ── DISCIPLINE TAB ── */}
            {activeTab === 'Discipline' && (
              <View>
                {/* Current score hero */}
                <View style={[{
                  backgroundColor: colors.surface,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: getDisciplineScoreColor(disciplineData?.score ?? 0, colors) + '40',
                  overflow: 'hidden',
                  marginBottom: spacing[4],
                }]}>
                  <LinearGradient
                    colors={[getDisciplineScoreColor(disciplineData?.score ?? 0, colors) + '12', 'transparent']}
                    style={[{ padding: spacing[5] }]}
                  >
                     <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                       <View style={{ flex: 1 }}>
                         <Text style={[typography.caption, { color: colors.textTertiary, letterSpacing: 1 }]}>DISCIPLINE SCORE</Text>
                         <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing[1] }]}>All Time</Text>
                       </View>
                       <View style={{ alignItems: 'flex-end' }}>
                         <Text style={[typography.displayMd, {
                           color: getDisciplineScoreColor(disciplineData?.score ?? 0, colors),
                           fontSize: 56,
                           lineHeight: 64,
                           fontWeight: '800',
                         }]}>
                           {displayScore}
                         </Text>
                         <Text style={[typography.label, {
                           color: getDisciplineScoreColor(disciplineData?.score ?? 0, colors),
                           fontWeight: '700',
                         }]}>
                           {getDisciplineScoreLabel(disciplineData?.score ?? 0)}
                         </Text>
                       </View>
                     </View>

                     {/* Motivational Message */}
                     <View style={{ marginTop: spacing[4], padding: spacing[3], backgroundColor: colors.surfaceElevated, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                       <Text style={[typography.caption, { color: colors.textSecondary, fontStyle: 'italic', lineHeight: 18 }]}>
                         {(() => {
                           const score = disciplineData?.score ?? 0;
                           if (score >= 90) return "Exceptional trading discipline. You are executing like a machine.";
                           if (score >= 80) return "Great consistency. Clean up small errors to hit the elite level.";
                           if (score >= 70) return "Consistently trading, but rule lapses are holding back your profit potential.";
                           if (score >= 60) return "High behavioral deviation. Slow down and review your setups.";
                           return "Critical trading leaks detected. You are gambling, not trading. Reset immediately.";
                         })()}
                       </Text>
                     </View>
 
                     {/* Category breakdown */}
                     {disciplineData?.breakdown && (
                       <View style={[{ marginTop: spacing[5], gap: spacing[4] }]}>
                         {[
                           { label: 'Plan Followed', value: disciplineData.breakdown.planFollowed, anim: dispPlanAnim, icon: 'document-text-outline', weight: '20pts', color: colors.primary },
                           { label: 'No Revenge Trading', value: disciplineData.breakdown.noRevengeTrade, anim: dispRevengeAnim, icon: 'flame-outline', weight: '20pts', color: colors.warning },
                           { label: 'No Overtrading', value: disciplineData.breakdown.noOvertrading, anim: dispOvertradeAnim, icon: 'warning-outline', weight: '15pts', color: colors.info },
                           { label: 'SL Respected', value: disciplineData.breakdown.noMovedSL, anim: dispMovedSLAnim, icon: 'shield-checkmark-outline', weight: '5pts', color: colors.success },
                         ].map((item) => {
                           const barColor = item.value >= 80 ? colors.success : item.value >= 60 ? colors.warning : colors.error;
                           const widthPercent = item.anim.interpolate({
                             inputRange: [0, 100],
                             outputRange: ['0%', '100%'],
                           });

                           return (
                             <View key={item.label}>
                               <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }]}>
                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                   <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: item.color + '15', alignItems: 'center', justifyContent: 'center' }}>
                                     <Ionicons name={item.icon as any} size={12} color={item.color} />
                                   </View>
                                   <Text style={[typography.body, { color: colors.textSecondary }]}>
                                     {item.label}
                                   </Text>
                                 </View>
                                 <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                                   <Text style={[typography.caption, { color: colors.textTertiary }]}>{item.weight}</Text>
                                   <Text style={[typography.label, { color: barColor, width: 42, textAlign: 'right' }]}>
                                     {item.value}%
                                   </Text>
                                 </View>
                               </View>
                               <View style={[{ height: 6, backgroundColor: colors.surfaceHighlight, borderRadius: 3, overflow: 'hidden' }]}>
                                 <Animated.View style={[{ width: widthPercent, height: '100%', backgroundColor: barColor, borderRadius: 3 }]} />
                               </View>
                             </View>
                           );
                         })}
                       </View>
                     )}
                   </LinearGradient>
                 </View>

                {/* Score analysis explanation insight card */}
                {(() => {
                  const expl = disciplineExplanation();
                  if (!expl) return null;
                  return (
                    <Card style={{ marginBottom: spacing[4], borderColor: expl.score < 80 ? colors.warning + '50' : colors.primary + '50', borderWidth: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] }}>
                        <Ionicons name="bulb-outline" size={20} color={expl.score < 80 ? colors.warning : colors.primary} style={{ marginRight: 8 }} />
                        <Text style={[typography.label, { color: colors.textPrimary }]}>Discipline Insight</Text>
                      </View>
                      <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                        Your lowest discipline category is <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{expl.category} ({expl.score}%)</Text>.
                      </Text>
                      <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing[2], lineHeight: 18 }]}>
                        {expl.tip}
                      </Text>
                    </Card>
                  );
                })()}

                {/* Scoring rubric */}
                <Card style={{ marginBottom: spacing[4] }}>
                  <SectionTitle title="Scoring Breakdown" subtitle="How your score is calculated" />
                  {[
                    { item: 'Followed Plan', pts: 20, desc: 'Executed strategy without deviation' },
                    { item: 'No Revenge Trade', pts: 20, desc: 'Avoided emotional recovery trades' },
                    { item: 'No Overtrading', pts: 15, desc: 'Stayed within daily trade limits' },
                    { item: 'RR Quality (≥1.5)', pts: 15, desc: 'Maintained acceptable risk:reward' },
                    { item: 'Risk Management', pts: 15, desc: 'Kept risk ≤2% per trade' },
                    { item: 'Emotion Control', pts: 10, desc: 'Traded with calm/confident state' },
                    { item: 'SL Respected', pts: 5, desc: 'Never moved SL against plan' },
                  ].map((row, i, arr) => (
                    <View
                      key={row.item}
                      style={[
                        styles.insightRow,
                        {
                          paddingVertical: spacing[3],
                          borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                          borderBottomColor: colors.border,
                          alignItems: 'flex-start',
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.label, { color: colors.textPrimary }]}>{row.item}</Text>
                        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 3 }]}>{row.desc}</Text>
                      </View>
                      <View style={[{
                        backgroundColor: colors.primarySubtle,
                        borderRadius: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        marginLeft: spacing[3],
                      }]}>
                        <Text style={[typography.label, { color: colors.primary }]}>+{row.pts}pts</Text>
                      </View>
                    </View>
                  ))}
                </Card>

                {/* Score ranges */}
                <Card style={{ marginBottom: spacing[4] }}>
                  <SectionTitle title="Score Ranges" />
                  {[
                    { range: '90–100', label: 'Elite', desc: 'Exceptional discipline, near-perfect execution', color: colors.success },
                    { range: '80–89', label: 'Excellent', desc: 'Strong discipline with minor lapses', color: colors.successLight },
                    { range: '70–79', label: 'Good', desc: 'Consistent but room for improvement', color: colors.warning },
                    { range: '60–69', label: 'Average', desc: 'Notable discipline issues to address', color: colors.warningLight },
                    { range: '<60', label: 'Poor', desc: 'Significant behavioural problems', color: colors.error },
                  ].map((row, i, arr) => (
                    <View
                      key={row.range}
                      style={[
                        styles.insightRow,
                        {
                          paddingVertical: spacing[3],
                          borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                          borderBottomColor: colors.border,
                          alignItems: 'flex-start',
                        },
                      ]}
                    >
                      <View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color, marginTop: 6, marginRight: spacing[3] }]} />
                      <View style={{ flex: 1 }}>
                        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                          <Text style={[typography.label, { color: row.color }]}>{row.label}</Text>
                          <Text style={[typography.caption, { color: colors.textTertiary }]}>{row.range}</Text>
                        </View>
                        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 3 }]}>{row.desc}</Text>
                      </View>
                    </View>
                  ))}
                </Card>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Pair Detail Modal */}
      <Modal
        visible={!!selectedPair}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPair(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setSelectedPair(null)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>{selectedPair?.pair} Performance</Text>
              <TouchableOpacity onPress={() => setSelectedPair(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedPair && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
                <View style={[styles.statsGrid, { marginTop: spacing[4], marginBottom: spacing[4] }]}>
                  <Card style={{ ...styles.halfCard, backgroundColor: colors.surface }}>
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>Net P&L</Text>
                    <Text style={[typography.h3, { color: (selectedPair.netPnL ?? 0) >= 0 ? colors.success : colors.error, marginTop: 4 }]}>
                      {formatPnL(selectedPair.netPnL ?? 0, activeAccount?.currency)}
                    </Text>
                  </Card>
                  <Card style={{ ...styles.halfCard, backgroundColor: colors.surface }}>
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>Net R-Multiple</Text>
                    <Text style={[typography.h3, { color: selectedPair.netRR >= 0 ? colors.success : colors.error, marginTop: 4 }]}>
                      {selectedPair.netRR >= 0 ? '+' : ''}{selectedPair.netRR.toFixed(2)}R
                    </Text>
                  </Card>
                </View>

                {[
                  { label: 'Total Trades', value: selectedPair.totalTrades.toString() },
                  { label: 'Win Rate', value: formatPercent(selectedPair.winRate), color: selectedPair.winRate >= 50 ? colors.success : colors.error },
                  { label: 'Avg Win', value: `+${selectedPair.avgWin.toFixed(2)}R`, color: colors.success },
                  { label: 'Avg Loss', value: `-${selectedPair.avgLoss.toFixed(2)}R`, color: colors.error },
                  { label: 'Avg Win Amount', value: formatPnL(selectedPair.avgWinAmount ?? 0, activeAccount?.currency), color: colors.success },
                  { label: 'Avg Loss Amount', value: formatPnL(selectedPair.avgLossAmount ?? 0, activeAccount?.currency), color: colors.error },
                  { label: 'Profit Factor', value: formatProfitFactor(selectedPair.profitFactor) },
                  { label: 'Expectancy', value: `${selectedPair.expectancy.toFixed(2)}R` },
                  { label: 'Wins / Losses / BE', value: `${selectedPair.wins} / ${selectedPair.losses} / ${selectedPair.breakEvens}` },
                  { label: 'Streaks', value: `${selectedPair.longestWinStreak} Wins / ${selectedPair.longestLossStreak} Losses` },
                ].map((item, index) => (
                  <View
                    key={item.label}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: spacing[3],
                      borderBottomWidth: index < 9 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: colors.border
                    }}
                  >
                    <Text style={[typography.body, { color: colors.textSecondary }]}>{item.label}</Text>
                    <Text style={[typography.label, { color: item.color || colors.textPrimary }]}>{item.value}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const AnalyticsSkeleton: React.FC = () => {
  const { spacing } = useTheme();
  return (
    <View style={{ paddingTop: spacing[4] }}>
      <View style={[styles.statsGrid, { marginBottom: spacing[3], gap: 8 }]}>
        <Skeleton height={90} style={{ flex: 1, borderRadius: 14 }} />
        <Skeleton height={90} style={{ flex: 1, borderRadius: 14 }} />
      </View>
      <Skeleton height={220} style={{ borderRadius: 14, marginBottom: spacing[4] }} />
      <Skeleton height={180} style={{ borderRadius: 14, marginBottom: spacing[4] }} />
      <Skeleton height={160} style={{ borderRadius: 14, marginBottom: spacing[4] }} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 12 },
  tabScroll: { flexGrow: 0, height: 52 },
  tabScrollContent: { alignItems: 'center', paddingVertical: 8 },
  tabBtn: { height: 36, justifyContent: 'center', flexShrink: 0 },
  scroll: { paddingTop: 8 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  halfCard: { flex: 1 },
  thirdCard: { flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableHeader: { flexDirection: 'row', paddingBottom: 8 },
  tableRow: { flexDirection: 'row', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
});
