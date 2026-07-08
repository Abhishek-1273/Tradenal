import React, { useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { useDashboard } from '../../hooks/useTrades';
import { StatCard } from '../../components/dashboard/StatCard';
import { EquityCurve } from '../../components/dashboard/EquityCurve';
import { WinLossPie } from '../../components/dashboard/WinLossPie';
import { DisciplineRing } from '../../components/dashboard/DisciplineRing';
import { Card } from '../../components/common/Card';
import { FAB } from '../../components/common/FAB';
import { Skeleton } from '../../components/common/LoadingOverlay';
import { EmptyState } from '../../components/common/EmptyState';
import { AppNavProp } from '../../navigation/types';
import { formatPercent, formatRR, formatDuration, formatPnL, getResultColor, formatProfitFactor, formatBalance } from '../../utils/formatters';
import { AccountSelector } from '../../components/dashboard/AccountSelector';
import { JournalQuote } from '../../components/dashboard/JournalQuote';
import { useAccountStore } from '../../store/account.store';

type Period = 'today' | 'week' | 'month' | 'all';
const PERIODS: { label: string; value: Period }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'All', value: 'all' },
];

export const DashboardScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { dashboardPeriod, setDashboardPeriod } = useUIStore();
  const { activeAccount } = useAccountStore();
  const { data, isLoading, refetch, isRefetching } = useDashboard();
  const [equityMode, setEquityMode] = React.useState<'r' | 'pnl'>('r');
  useEffect(() => {
    setDashboardPeriod('all');
  }, []);

  const handleAddTrade = useCallback(() => navigation.navigate('AddTrade'), [navigation]);

  const greeting = () => {
    const h = dayjs().hour();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = data?.stats;
  const hasData = (stats?.totalTrades ?? 0) > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['rgba(99,102,241,0.08)', 'transparent']} style={[styles.headerGradient, { paddingTop: insets.top + 8 }]} pointerEvents="none" />

      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: spacing[5], paddingBottom: spacing[4], alignItems: 'center' }]}>
        <View style={{ flex: 1, marginRight: spacing[3] }}>
          <AccountSelector />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => navigation.navigate('AIReview')} style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated, marginRight: spacing[2] }]}>
            <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 120 }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Period Selector */}
        <View style={[styles.row, { marginBottom: spacing[4], gap: 8 }]}>
          {PERIODS.map((p) => {
            const active = dashboardPeriod === p.value;
            return (
              <TouchableOpacity key={p.value} onPress={() => setDashboardPeriod(p.value)}
                style={[{ backgroundColor: active ? colors.primary : colors.surfaceElevated, borderRadius: radii.full, paddingHorizontal: spacing[4], paddingVertical: spacing[1.5] }]}>
                <Text style={[typography.label, { color: active ? '#fff' : colors.textTertiary }]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? <DashboardSkeleton /> : !hasData ? (
          <EmptyState icon="trending-up-outline" title="No trades yet" description="Tap the + button to log your first trade and start tracking your performance." action={{ label: 'Add First Trade', onPress: handleAddTrade }} />
        ) : (
          <>
            {/* Account Balance Card */}
            {(() => {
              const deposit = activeAccount?.startingBalance ?? 0;
              const pnl = stats?.netPnL ?? 0;
              const balance = activeAccount?.currentBalance ?? deposit;
              const pnlPct = deposit > 0 ? (pnl / deposit) * 100 : 0;
              const isProfit = pnl >= 0;
              const balColor = isProfit ? colors.success : colors.error;
              const currency = activeAccount?.currency ?? 'USD';
              return (
                <Card style={{ marginBottom: spacing[3] }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.8, color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 4 }}>
                        Account Balance
                      </Text>
                      <Text style={{ fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>
                        {formatBalance(balance, currency)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
                        <View style={{ backgroundColor: isProfit ? colors.successSubtle : colors.errorSubtle, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name={isProfit ? 'arrow-up' : 'arrow-down'} size={11} color={balColor} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: balColor }}>
                            {formatPnL(pnl, currency)}
                          </Text>
                        </View>
                        {deposit > 0 && (
                          <Text style={{ fontSize: 12, color: balColor, fontWeight: '600' }}>
                            ({isProfit ? '+' : ''}{pnlPct.toFixed(2)}%)
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 10, padding: 10 }}>
                        <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
                      </View>
                      {deposit > 0 && (
                        <>
                          <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 6, textAlign: 'right' }}>
                            Starting Balance
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>
                            {formatBalance(deposit, currency)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })()}

            <View style={[styles.row, { marginBottom: spacing[3], gap: 8 }]}>
              <StatCard label="Net R" value={`${(stats?.netRR ?? 0) >= 0 ? '+' : ''}${(stats?.netRR ?? 0).toFixed(2)}R`} icon="trending-up" iconColor={(stats?.netRR ?? 0) >= 0 ? colors.success : colors.error} highlight highlightColor={(stats?.netRR ?? 0) >= 0 ? colors.success : colors.error} style={{ flex: 1 }} />
              <StatCard label="Net P&L" value={formatPnL(stats?.netPnL, activeAccount?.currency)} icon="cash" iconColor={(stats?.netPnL ?? 0) >= 0 ? colors.success : colors.error} highlight highlightColor={(stats?.netPnL ?? 0) >= 0 ? colors.success : colors.error} style={{ flex: 1 }} />
            </View>

            <View style={[styles.row, { marginBottom: spacing[3], gap: 8 }]}>
              <StatCard label="Win Rate" value={formatPercent(stats?.winRate ?? 0)} icon="checkmark-circle" compact style={{ flex: 1 }} />
              <StatCard label="Trades" value={stats?.totalTrades ?? 0} icon="list" compact style={{ flex: 1 }} />
              <StatCard label="Avg RR" value={formatRR(stats?.avgRR)} icon="git-commit" compact style={{ flex: 1 }} />
            </View>
            <View style={[styles.row, { marginBottom: spacing[5], gap: 8 }]}>
              <StatCard label="Prof. Factor" value={formatProfitFactor(stats?.profitFactor)} icon="flash" compact style={{ flex: 1 }} />
              <StatCard label="Streak" value={`${Math.abs(stats?.currentStreak ?? 0)} ${(stats?.currentStreakType ?? 'win') === 'win' ? '🔥' : '❄️'}`} icon="flame" compact style={{ flex: 1 }} />
              <StatCard label="Avg Hold" value={formatDuration(stats?.avgHoldingTime)} icon="time" compact style={{ flex: 1 }} />
            </View>

            <Card style={{ marginBottom: spacing[4] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>P&L Heatmap</Text>
                  <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 8 }]}>
                    Tap a day to see details
                  </Text>
                </View>
                {/* Metric toggle */}
                <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceElevated, borderRadius: radii.full, padding: 3 }}>
                  {(['r', 'pnl'] as const).map((m) => {
                    const active = equityMode === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setEquityMode(m)}
                        style={{
                          backgroundColor: active ? colors.primary : 'transparent',
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: radii.full,
                        }}
                      >
                        <Text style={[typography.caption, { color: active ? '#fff' : colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' }]}>
                          {m === 'pnl' ? (activeAccount?.currency || 'USD') : 'R'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={{ marginTop: spacing[6] }}>
                <EquityCurve
                  data={data?.equityCurve ?? []}
                  height={180}
                  mode={equityMode}
                  currency={activeAccount?.currency}
                />
              </View>
            </Card>

            <View style={[styles.row, { marginBottom: spacing[4], gap: 8 }]}>
              <Card style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>Results</Text>
                <View style={{ marginTop: spacing[3] }}>
                  <WinLossPie data={data?.winLossData ?? []} size={100} showLegend={false} />
                  {(data?.winLossData ?? []).map((d) => (
                    <View key={d.label} style={[styles.row, { marginTop: spacing[1.5], alignItems: 'center' }]}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color, marginRight: 8 }} />
                      <Text style={[typography.caption, { color: colors.textTertiary, flex: 1 }]}>{d.label}</Text>
                      <Text style={[typography.label, { color: colors.textPrimary }]}>{d.value}</Text>
                    </View>
                  ))}
                </View>
              </Card>
              <Card style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>Discipline</Text>
                <View style={{ marginTop: spacing[3], alignItems: 'center' }}>
                  <DisciplineRing score={data?.disciplineScore ?? 0} size={100} />
                </View>
              </Card>
            </View>

            <Card style={{ marginBottom: spacing[4] }}>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[3] }]}>Performance Summary</Text>
              {[
                { label: 'Expectancy', value: `${(stats?.expectancy ?? 0).toFixed(2)}R` },
                { label: 'Avg Win', value: `+${(stats?.avgWin ?? 0).toFixed(2)}R` },
                { label: 'Avg Loss', value: `-${(stats?.avgLoss ?? 0).toFixed(2)}R` },
                { label: 'Best Streak', value: `${stats?.longestWinStreak ?? 0} wins` },
                { label: 'Worst Streak', value: `${stats?.longestLossStreak ?? 0} losses` },
              ].map((item, i, arr) => (
                <View key={item.label} style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[3], borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.border }]}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>{item.label}</Text>
                  <Text style={[typography.label, { color: colors.textPrimary }]}>{item.value}</Text>
                </View>
              ))}
            </Card>

            <JournalQuote />

            <View style={[styles.row, { marginBottom: spacing[4], gap: 8 }]}>
              {[
                { icon: 'sparkles-outline', label: 'AI Review', color: colors.primary, onPress: () => navigation.navigate('AIReview') },
                { icon: 'trophy-outline', label: 'Goals', color: colors.warning, onPress: () => navigation.navigate('Goals') },
              ].map((item) => (
                <TouchableOpacity key={item.label} onPress={item.onPress} activeOpacity={0.8}
                  style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border, borderWidth: 1, padding: spacing[4] }}>
                  <View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: item.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[2] }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <FAB onPress={handleAddTrade} />
    </View>
  );
};

const DashboardSkeleton: React.FC = () => {
  const { spacing } = useTheme();
  return (
    <View>
      <View style={[styles.row, { marginBottom: spacing[3], gap: 8 }]}>
        <Skeleton height={90} style={{ flex: 1, borderRadius: 14 }} />
        <Skeleton height={90} style={{ flex: 1, borderRadius: 14 }} />
      </View>
      <View style={[styles.row, { marginBottom: spacing[4], gap: 8 }]}>
        <Skeleton height={72} style={{ flex: 1, borderRadius: 14 }} />
        <Skeleton height={72} style={{ flex: 1, borderRadius: 14 }} />
        <Skeleton height={72} style={{ flex: 1, borderRadius: 14 }} />
      </View>
      <Skeleton height={220} style={{ borderRadius: 14, marginBottom: spacing[4] }} />
      <Skeleton height={180} style={{ borderRadius: 14, marginBottom: spacing[4] }} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200, zIndex: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingTop: 8 },
  row: { flexDirection: 'row' },
});
