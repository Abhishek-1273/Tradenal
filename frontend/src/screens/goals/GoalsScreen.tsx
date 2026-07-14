import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';
import { useRecentGoals, useGoal, useCreateGoal, statsKeys } from '../../hooks/useTrades';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/LoadingOverlay';
import { GoalWithProgress, AccountStatus } from '../../types';
import { formatPercent, getDisciplineScoreColor, formatPnL, formatBalance } from '../../utils/formatters';
import { useAccountStore } from '../../store/account.store';
import { useUpdateAccount } from '../../hooks/useAccounts';
import { statsApi } from '../../api/stats.api';
import { useToast } from '../../components/common/Toast';

const CURRENT_MONTH = dayjs().format('YYYY-MM');

export const GoalsScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();

  const { activeAccount } = useAccountStore();
  const updateAccountMutation = useUpdateAccount(activeAccount?._id || '');
  const { showToast } = useToast();

  // Tab state: 'targets' (Account targets) or 'goals' (Legacy monthly goals)
  const [activeTab, setActiveTab] = useState<'targets' | 'goals'>('targets');

  // Legacy Monthly Goals state
  const { data: goals, isLoading: goalsLoading } = useRecentGoals();
  const { data: currentGoal, isLoading: currentLoading } = useGoal(CURRENT_MONTH);
  const { mutateAsync: createGoal } = useCreateGoal();

  // Targets calculations queries
  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: statsKeys.dashboard('all', activeAccount?._id),
    queryFn: () => statsApi.getDashboard('all', activeAccount?._id),
    enabled: !!activeAccount,
  });

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: statsKeys.dashboard('today', activeAccount?._id),
    queryFn: () => statsApi.getDashboard('today', activeAccount?._id),
    enabled: !!activeAccount,
  });

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    month: CURRENT_MONTH,
    targetWinRate: '60',
    targetRR: '2.0',
    maxDailyTrades: '3',
    targetConsistency: '75',
    targetNetRR: '',
    targetTrades: '',
  });

  // Targets Edit Modal state
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [targetsForm, setTargetsForm] = useState({
    profitTarget: '',
    maxDailyLoss: '',
    maxOverallLoss: '',
  });

  // Custom Month Picker state
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleOpenTargetsModal = () => {
    if (!activeAccount) return;
    const isProp = activeAccount.accountType === 'propFirmChallenge' || activeAccount.accountType === 'fundedAccount';
    if (isProp) {
      setTargetsForm({
        profitTarget: String(activeAccount.propFirmRules?.profitTarget ?? ''),
        maxDailyLoss: String(activeAccount.propFirmRules?.maxDailyLoss ?? ''),
        maxOverallLoss: String(activeAccount.propFirmRules?.maxOverallLoss ?? ''),
      });
    } else {
      setTargetsForm({
        profitTarget: String(activeAccount.personalGoals?.monthlyTarget ?? ''),
        maxDailyLoss: String(activeAccount.personalGoals?.maxDailyLoss ?? ''),
        maxOverallLoss: String(activeAccount.personalGoals?.maxDrawdown ?? ''),
      });
    }
    setShowTargetsModal(true);
  };

  const handleSaveTargets = async () => {
    if (!activeAccount) return;
    const isProp = activeAccount.accountType === 'propFirmChallenge' || activeAccount.accountType === 'fundedAccount';
    try {
      if (isProp) {
        await updateAccountMutation.mutateAsync({
          propFirmRules: {
            profitTarget: targetsForm.profitTarget ? parseFloat(targetsForm.profitTarget) : undefined,
            maxDailyLoss: targetsForm.maxDailyLoss ? parseFloat(targetsForm.maxDailyLoss) : undefined,
            maxOverallLoss: targetsForm.maxOverallLoss ? parseFloat(targetsForm.maxOverallLoss) : undefined,
          },
        });
      } else {
        await updateAccountMutation.mutateAsync({
          personalGoals: {
            monthlyTarget: targetsForm.profitTarget ? parseFloat(targetsForm.profitTarget) : undefined,
            maxDailyLoss: targetsForm.maxDailyLoss ? parseFloat(targetsForm.maxDailyLoss) : undefined,
            maxDrawdown: targetsForm.maxOverallLoss ? parseFloat(targetsForm.maxOverallLoss) : undefined,
          },
        });
      }
      setShowTargetsModal(false);
      showToast('Account targets updated successfully', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save targets', 'error');
    }
  };

  const handleSelectMonth = (monthIndex: number) => {
    const formatted = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    setForm((p) => ({ ...p, month: formatted }));
    setShowMonthPicker(false);
  };

  const handleSaveGoal = async () => {
    try {
      await createGoal({
        month: form.month,
        targetRR: parseFloat(form.targetRR) || 2,
        targetWinRate: parseFloat(form.targetWinRate) || 60,
        maxDailyTrades: parseInt(form.maxDailyTrades) || 3,
        targetConsistency: parseFloat(form.targetConsistency) || 75,
        ...(form.targetNetRR ? { targetNetRR: parseFloat(form.targetNetRR) } : {}),
        ...(form.targetTrades ? { targetTrades: parseInt(form.targetTrades) } : {}),
      });
      setShowModal(false);
      showToast('Monthly goal saved successfully', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to save goal', 'error');
    }
  };

  const handleUpdateStatus = async (status: AccountStatus) => {
    if (!activeAccount) return;
    try {
      await updateAccountMutation.mutateAsync({ status });
      showToast(`Account status updated to ${status}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', 'error');
    }
  };

  // Progress Bar Helper
  const ProgressBar = ({
    label,
    current,
    target,
    percentage,
    format,
    achieved,
    isLossLimit = false,
  }: {
    label: string;
    current: number;
    target: number;
    percentage: number;
    format: (v: number) => string;
    achieved?: boolean;
    isLossLimit?: boolean;
  }) => {
    const isPrimaryColor = isLossLimit ? (percentage > 85 ? colors.error : percentage > 60 ? colors.warning : colors.success) : (achieved ? colors.success : colors.primary);

    return (
      <View style={{ marginBottom: spacing[4] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[1] }}>
          <Text style={[typography.body, { color: colors.textSecondary, flex: 1, marginRight: 8 }]} numberOfLines={1}>{label}</Text>
          <Text style={[typography.label, { color: isPrimaryColor, textAlign: 'right' }]}>
            {format(current)} <Text style={{ color: colors.textTertiary, fontWeight: '400' }}>/ {format(target)}</Text>
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: colors.surfaceHighlight, borderRadius: radii.full, overflow: 'hidden' }}>
          <View
            style={{
              width: `${Math.min(Math.max(0, percentage), 100)}%`,
              height: '100%',
              backgroundColor: isPrimaryColor,
              borderRadius: radii.full,
            }}
          />
        </View>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
          {Math.round(percentage)}% {isLossLimit ? 'limit utilized' : 'target completed'}
        </Text>
      </View>
    );
  };

  // Legacy Goal Card Render
  const GoalCard = ({ goalData, isCurrent }: { goalData: GoalWithProgress; isCurrent: boolean }) => {
    const { goal, progress, stats, tradeCount } = goalData;
    const allAchieved = [progress.winRate, progress.avgRR, progress.consistency].every((p) => p.achieved);

    const overallPct = Math.round(
      [progress.winRate, progress.avgRR, progress.consistency, progress.netRR, progress.trades]
        .filter(Boolean)
        .reduce((sum, p) => sum + (p?.percentage ?? 0), 0) /
      [progress.winRate, progress.avgRR, progress.consistency, progress.netRR, progress.trades].filter(
        Boolean
      ).length
    );

    return (
      <Card style={{ marginBottom: spacing[4], borderWidth: isCurrent ? 1 : 0, borderColor: colors.primary + '50' }}>
        {isCurrent && (
          <LinearGradient
            colors={['rgba(99,102,241,0.06)', 'transparent']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[4] }}>
          <View>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              {dayjs(goal.month + '-01').format('MMMM YYYY')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing[1] }}>
              {isCurrent && (
                <View style={{ backgroundColor: colors.primarySubtle, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>Current</Text>
                </View>
              )}
              {allAchieved && (
                <View style={{ backgroundColor: colors.successSubtle, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={[typography.caption, { color: colors.success, fontWeight: '700' }]}>🎉 Met!</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[typography.numericSm, { color: colors.primary, fontSize: 16 }]}>{overallPct}%</Text>
            </View>
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>{tradeCount} trades</Text>
          </View>
        </View>

        <ProgressBar
          label="Win Rate"
          current={progress.winRate.current}
          target={progress.winRate.target}
          percentage={progress.winRate.percentage}
          achieved={progress.winRate.achieved}
          format={(v) => formatPercent(v)}
        />
        <ProgressBar
          label="Avg Risk:Reward"
          current={progress.avgRR.current}
          target={progress.avgRR.target}
          percentage={progress.avgRR.percentage}
          achieved={progress.avgRR.achieved}
          format={(v) => `${v.toFixed(2)}R`}
        />
        <ProgressBar
          label="Discipline Score"
          current={progress.consistency.current}
          target={progress.consistency.target}
          percentage={progress.consistency.percentage}
          achieved={progress.consistency.achieved}
          format={(v) => `${Math.round(v)}/100`}
        />
      </Card>
    );
  };

  // Render Account targets (Prop Firm Rules / Personal Targets)
  const renderAccountTargets = () => {
    if (!activeAccount) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="wallet-outline" size={48} color={colors.textTertiary} />
          <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing[3] }]}>
            No active account selected
          </Text>
          <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing[2], textAlign: 'center' }]}>
            Please select or configure a trading account from the dashboard to track targets.
          </Text>
        </View>
      );
    }

    const { startingBalance, currentBalance = startingBalance, accountType, status } = activeAccount;
    const isProp = accountType === 'propFirmChallenge' || accountType === 'fundedAccount';
    const netPnL = allData?.stats?.netPnL ?? 0;
    const totalReturnPercent = startingBalance > 0 ? (netPnL / startingBalance) * 100 : 0;

    // Prop Challenge target calculations
    const profitTargetPercent = activeAccount.propFirmRules?.profitTarget ?? 0;
    const targetProfitAmount = startingBalance * (profitTargetPercent / 100);
    const profitProgressPercent = targetProfitAmount > 0 ? (netPnL / targetProfitAmount) * 100 : 0;

    const maxDailyLossPercent = activeAccount.propFirmRules?.maxDailyLoss || activeAccount.personalGoals?.maxDailyLoss || 0;
    const maxDailyLossAmount = startingBalance * (maxDailyLossPercent / 100);
    const todayPnL = todayData?.stats?.netPnL ?? 0;
    const todayLoss = todayPnL < 0 ? Math.abs(todayPnL) : 0;
    const dailyLossPercentUsed = maxDailyLossAmount > 0 ? (todayLoss / maxDailyLossAmount) * 100 : 0;

    const maxOverallLossPercent = activeAccount.propFirmRules?.maxOverallLoss || activeAccount.personalGoals?.maxDrawdown || 0;
    const maxOverallLossAmount = startingBalance * (maxOverallLossPercent / 100);
    const currentDrawdown = currentBalance < startingBalance ? startingBalance - currentBalance : 0;
    const overallLossPercentUsed = maxOverallLossAmount > 0 ? (currentDrawdown / maxOverallLossAmount) * 100 : 0;

    // Personal Target calculations
    const monthlyTarget = activeAccount.personalGoals?.monthlyTarget ?? 0;
    const monthlyProgressPercent = monthlyTarget > 0 ? (netPnL / monthlyTarget) * 100 : 0;

    const currency = activeAccount.currency || 'USD';
    const hasTargets = isProp
      ? (profitTargetPercent > 0 || maxDailyLossPercent > 0 || maxOverallLossPercent > 0)
      : (monthlyTarget > 0 || maxDailyLossPercent > 0 || maxOverallLossPercent > 0);

    const getAccountLabel = (type: string) => {
      switch (type) {
        case 'propFirmChallenge': return 'Prop Challenge';
        case 'fundedAccount': return 'Funded Account';
        case 'demo': return 'Demo Account';
        default: return 'Personal Portfolio';
      }
    };

    return (
      <View style={{ flex: 1 }}>
        {/* Account Summary Card */}
        <Card style={{ marginBottom: spacing[4], padding: spacing[4], backgroundColor: colors.surface }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingBottom: spacing[3], marginBottom: spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: status === 'active' || status === 'funded' ? colors.success : status === 'failed' ? colors.error : colors.textTertiary }} />
              <Text style={[typography.label, { color: colors.textPrimary, textTransform: 'capitalize', fontWeight: '700' }]}>{status} Account</Text>
            </View>
            <Text style={[typography.caption, { color: colors.textTertiary, textTransform: 'uppercase' }]}>{getAccountLabel(accountType)}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={{ width: '50%', marginBottom: spacing[3] }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: 2 }]}>STARTING BALANCE</Text>
              <Text style={[typography.label, { color: colors.textPrimary, fontSize: 16, fontWeight: '700' }]}>{formatBalance(startingBalance, currency)}</Text>
            </View>
            <View style={{ width: '50%', marginBottom: spacing[3], alignItems: 'flex-end' }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: 2 }]}>CURRENT BALANCE</Text>
              <Text style={[typography.label, { color: colors.textPrimary, fontSize: 16, fontWeight: '700' }]}>{formatBalance(currentBalance, currency)}</Text>
            </View>
            <View style={{ width: '50%' }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: 2 }]}>TOTAL P&L</Text>
              <Text style={[typography.label, { color: netPnL >= 0 ? colors.success : colors.error, fontSize: 16, fontWeight: '700' }]}>
                {formatPnL(netPnL, currency)}
              </Text>
            </View>
            <View style={{ width: '50%', alignItems: 'flex-end' }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: 2 }]}>TOTAL RETURN</Text>
              <Text style={[typography.label, { color: netPnL >= 0 ? colors.success : colors.error, fontSize: 16, fontWeight: '700' }]}>
                {netPnL >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
              </Text>
            </View>
          </View>
        </Card>

        {!hasTargets ? (
          /* Empty State targets */
          <Card style={{ padding: spacing[5], alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <Ionicons name="shield-outline" size={40} color={colors.textTertiary} style={{ marginBottom: spacing[3], alignSelf: "center" }} />
            <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing[2] }]}>
              Set your trading targets
            </Text>
            <Text style={[typography.body, { color: colors.textTertiary, textAlign: 'center', marginBottom: spacing[4], paddingHorizontal: spacing[3], lineHeight: 20 }]}>
              Add an optional profit goal and risk limits to track your account progress.
            </Text>
            <Button
              label="Set Account Targets"
              onPress={handleOpenTargetsModal}
              style={{ width: '80%', alignSelf: "center" }}
            />
          </Card>
        ) : (
          isProp ? (
            // ─── PROP FIRM / CHALLENGE RULE TARGETS ───
            <View>
              <Card style={{ marginBottom: spacing[4] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>
                    Prop Challenge Rules
                  </Text>
                  <TouchableOpacity onPress={handleOpenTargetsModal}>
                    <Text style={[typography.label, { color: colors.primary, fontWeight: '700' }]}>Edit Targets</Text>
                  </TouchableOpacity>
                </View>

                {/* Profit Target */}
                {profitTargetPercent > 0 && (
                  <ProgressBar
                    label="Profit Target"
                    current={netPnL}
                    target={targetProfitAmount}
                    percentage={profitProgressPercent}
                    achieved={netPnL >= targetProfitAmount}
                    format={(v) => formatPnL(v, currency)}
                  />
                )}

                {/* Max Daily Loss */}
                {maxDailyLossPercent > 0 && (
                  <ProgressBar
                    label="Max Daily Loss"
                    current={todayLoss}
                    target={maxDailyLossAmount}
                    percentage={dailyLossPercentUsed}
                    format={(v) => formatPnL(-v, currency)}
                    isLossLimit
                  />
                )}

                {/* Max Overall Drawdown */}
                {maxOverallLossPercent > 0 && (
                  <ProgressBar
                    label="Max Overall Loss"
                    current={currentDrawdown}
                    target={maxOverallLossAmount}
                    percentage={overallLossPercentUsed}
                    format={(v) => formatPnL(-v, currency)}
                    isLossLimit
                  />
                )}
              </Card>

              {/* Status updates for challenge */}
              <Card style={{ marginBottom: spacing[4] }}>
                <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[3] }]}>
                  Update Challenge Status
                </Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing[4] }]}>
                  Manually configure challenge progress status to archive or change account states.
                </Text>
                <View style={styles.statusButtonsContainer}>
                  {(['active', 'passed', 'failed', 'funded', 'archived'] as AccountStatus[]).map((st) => {
                    const isCurrentStatus = status === st;
                    const btnColor = st === 'passed' || st === 'funded' ? colors.success : st === 'failed' ? colors.error : colors.primary;
                    return (
                      <TouchableOpacity
                        key={st}
                        onPress={() => handleUpdateStatus(st)}
                        style={[
                          styles.statusButton,
                          {
                            backgroundColor: isCurrentStatus ? btnColor : colors.surfaceElevated,
                            borderColor: isCurrentStatus ? btnColor : colors.border,
                            borderRadius: radii.md,
                            paddingVertical: spacing[2],
                            paddingHorizontal: spacing[3],
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: isCurrentStatus ? '#fff' : colors.textPrimary,
                              fontWeight: '600',
                              textTransform: 'capitalize',
                            },
                          ]}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            </View>
          ) : (
            // ─── PERSONAL PORTFOLIO TARGETS ───
            <View>
              <Card style={{ marginBottom: spacing[4] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>
                    Personal Trading Goals
                  </Text>
                  <TouchableOpacity onPress={handleOpenTargetsModal}>
                    <Text style={[typography.label, { color: colors.primary, fontWeight: '700' }]}>Edit Targets</Text>
                  </TouchableOpacity>
                </View>

                {/* Monthly Profit Target */}
                {monthlyTarget > 0 && (
                  <ProgressBar
                    label="Monthly Target"
                    current={netPnL}
                    target={monthlyTarget}
                    percentage={monthlyProgressPercent}
                    achieved={netPnL >= monthlyTarget}
                    format={(v) => formatPnL(v, currency)}
                  />
                )}

                {/* Max Daily Loss */}
                {maxDailyLossPercent > 0 && (
                  <ProgressBar
                    label="Max Daily Loss"
                    current={todayLoss}
                    target={maxDailyLossAmount}
                    percentage={dailyLossPercentUsed}
                    format={(v) => formatPnL(-v, currency)}
                    isLossLimit
                  />
                )}

                {/* Max Drawdown */}
                {maxOverallLossPercent > 0 && (
                  <ProgressBar
                    label="Max Drawdown"
                    current={currentDrawdown}
                    target={maxOverallLossAmount}
                    percentage={overallLossPercentUsed}
                    format={(v) => formatPnL(-v, currency)}
                    isLossLimit
                  />
                )}
              </Card>
            </View>
          )
        )}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 12 : 4),
            paddingHorizontal: spacing[5],
            paddingBottom: spacing[3],
          },
        ]}
      >
        <View>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Targets & Goals</Text>
          <Text style={[typography.body, { color: colors.textTertiary }]}>
            {activeTab === 'targets' ? 'Account target rules tracking' : 'Monthly habits and targets'}
          </Text>
        </View>

        {activeTab === 'goals' && (
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={[
              styles.setGoalButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radii.full,
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[2],
              },
            ]}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={[typography.label, { color: '#fff' }]}>Set Goal</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segment Selector Tab Row */}
      <View style={[styles.tabSelectorRow, { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('targets')}
          style={[
            styles.tabSelectorButton,
            {
              backgroundColor: activeTab === 'targets' ? colors.primary : colors.surfaceElevated,
              borderRadius: radii.full,
              paddingVertical: spacing[2],
            },
          ]}
        >
          <Text style={[typography.label, { color: activeTab === 'targets' ? '#fff' : colors.textSecondary }]}>
            Account Targets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('goals')}
          style={[
            styles.tabSelectorButton,
            {
              backgroundColor: activeTab === 'goals' ? colors.primary : colors.surfaceElevated,
              borderRadius: radii.full,
              paddingVertical: spacing[2],
            },
          ]}
        >
          <Text style={[typography.label, { color: activeTab === 'goals' ? '#fff' : colors.textSecondary }]}>
            Habits & Goals
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 80 },
        ]}
      >
        {activeTab === 'targets' ? (
          (allLoading || todayLoading) ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            renderAccountTargets()
          )
        ) : (
          // ─── LEGACY MONTHLY HABITS AND GOALS TAB ───
          <View>
            {!currentLoading && !currentGoal && (
              <TouchableOpacity
                onPress={() => setShowModal(true)}
                style={[
                  styles.emptyGoalBox,
                  {
                    backgroundColor: colors.primarySubtle,
                    borderRadius: radii.xl,
                    borderColor: colors.primary + '40',
                    padding: spacing[5],
                    marginBottom: spacing[4],
                  },
                ]}
              >
                <Ionicons name="trophy-outline" size={32} color={colors.primary} />
                <Text style={[typography.h3, { color: colors.primary, marginTop: spacing[3] }]}>
                  Set {dayjs().format('MMMM')} Goal
                </Text>
                <Text style={[typography.body, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing[1] }]}>
                  Define your habits and win rate targets for this month.
                </Text>
              </TouchableOpacity>
            )}

            {goalsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (goals ?? []).length === 0 ? (
              <Card>
                <View style={{ alignItems: 'center', padding: spacing[6] }}>
                  <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center' }]}>
                    No habits set yet
                  </Text>
                  <Text style={[typography.body, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing[2] }]}>
                    Define monthly win rate and discipline habits targets to track.
                  </Text>
                </View>
              </Card>
            ) : (
              (goals ?? []).map((goalData) => {
                if (!goalData) return null;
                const isCurrent = goalData.goal.month === CURRENT_MONTH;
                return <GoalCard key={goalData.goal._id} goalData={goalData} isCurrent={isCurrent} />;
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Goal Creation Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
          <View style={[styles.modalHeader, { paddingHorizontal: spacing[5], paddingBottom: spacing[4] }]}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>New Goal</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5] }} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => setShowMonthPicker(true)} activeOpacity={0.7} style={{ marginBottom: spacing[4] }}>
              <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6 }]}>Month</Text>
              <View style={{
                height: 48,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing[3],
              }}>
                <Text style={[typography.body, { color: colors.textPrimary }]}>
                  {dayjs(form.month + '-01').format('MMMM YYYY')}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <Input
              label="Target Win Rate (%)"
              placeholder="60"
              value={form.targetWinRate}
              onChangeText={(v) => setForm((p) => ({ ...p, targetWinRate: v }))}
              keyboardType="numeric"
            />

            <Input
              label="Target Risk:Reward"
              placeholder="2.0"
              value={form.targetRR}
              onChangeText={(v) => setForm((p) => ({ ...p, targetRR: v }))}
              keyboardType="numeric"
            />

            <Input
              label="Max Daily Trades limit"
              placeholder="3"
              value={form.maxDailyTrades}
              onChangeText={(v) => setForm((p) => ({ ...p, maxDailyTrades: v }))}
              keyboardType="numeric"
            />

            <Input
              label="Target Discipline Score (0-100)"
              placeholder="75"
              value={form.targetConsistency}
              onChangeText={(v) => setForm((p) => ({ ...p, targetConsistency: v }))}
              keyboardType="numeric"
            />

            <Button
              label="Save Goal"
              onPress={handleSaveGoal}
              style={{ marginTop: spacing[4], marginBottom: spacing[6] }}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Account Targets Edit Modal */}
      <Modal
        visible={showTargetsModal}
        animationType="slide"
        onRequestClose={() => setShowTargetsModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
          <View style={[styles.modalHeader, { paddingHorizontal: spacing[5], paddingBottom: spacing[4] }]}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Account Targets</Text>
            <TouchableOpacity onPress={() => setShowTargetsModal(false)}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {activeAccount && (
            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5] }} keyboardShouldPersistTaps="handled">
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing[4] }]}>
                Configure target milestones and drawdown risk limits for the active account ({activeAccount.name}).
              </Text>

              {activeAccount.accountType === 'propFirmChallenge' || activeAccount.accountType === 'fundedAccount' ? (
                // Prop Firm inputs
                <>
                  <Input
                    label="Profit Target (%)"
                    placeholder="10"
                    value={targetsForm.profitTarget}
                    onChangeText={(v) => setTargetsForm((p) => ({ ...p, profitTarget: v }))}
                    keyboardType="numeric"
                    hint="Profit target to pass the challenge"
                  />
                  <Input
                    label="Max Daily Loss (%)"
                    placeholder="5"
                    value={targetsForm.maxDailyLoss}
                    onChangeText={(v) => setTargetsForm((p) => ({ ...p, maxDailyLoss: v }))}
                    keyboardType="numeric"
                    hint="Maximum drawdown limit per day"
                  />
                  <Input
                    label="Max Overall Loss (%)"
                    placeholder="10"
                    value={targetsForm.maxOverallLoss}
                    onChangeText={(v) => setTargetsForm((p) => ({ ...p, maxOverallLoss: v }))}
                    keyboardType="numeric"
                    hint="Maximum total trailing or overall drawdown limit"
                  />
                </>
              ) : (
                // Personal portfolio inputs
                <>
                  <Input
                    label="Monthly Profit Target ($ amount)"
                    placeholder="1000"
                    value={targetsForm.profitTarget}
                    onChangeText={(v) => setTargetsForm((p) => ({ ...p, profitTarget: v }))}
                    keyboardType="numeric"
                    hint="Target monetary gain per month"
                  />
                  <Input
                    label="Max Daily Loss (%)"
                    placeholder="2"
                    value={targetsForm.maxDailyLoss}
                    onChangeText={(v) => setTargetsForm((p) => ({ ...p, maxDailyLoss: v }))}
                    keyboardType="numeric"
                    hint="Daily max loss tolerance percentage"
                  />
                  <Input
                    label="Max Drawdown (%)"
                    placeholder="5"
                    value={targetsForm.maxOverallLoss}
                    onChangeText={(v) => setTargetsForm((p) => ({ ...p, maxOverallLoss: v }))}
                    keyboardType="numeric"
                    hint="Overall account drawdown limit percentage"
                  />
                </>
              )}

              <Button
                label="Save Targets"
                onPress={handleSaveTargets}
                style={{ marginTop: spacing[4], marginBottom: spacing[6] }}
              />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Custom Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing[5] }}>
          <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing[5] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Select Month & Year</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Year Selector */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: spacing[4] }}>
              <TouchableOpacity onPress={() => setSelectedYear((y) => y - 1)}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[typography.h2, { color: colors.textPrimary, fontSize: 20 }]}>{selectedYear}</Text>
              <TouchableOpacity onPress={() => setSelectedYear((y) => y + 1)}>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Months Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
              {MONTHS.map((m, idx) => {
                const isSelected = form.month === `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => handleSelectMonth(idx)}
                    style={{
                      width: '30%',
                      paddingVertical: spacing[2],
                      backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                      borderRadius: radii.md,
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={[typography.caption, { color: isSelected ? '#fff' : colors.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
                      {m.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
  setGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabSelectorButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingVertical: 8,
  },
  centerContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    borderWidth: 1,
    minWidth: '22%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGoalBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
