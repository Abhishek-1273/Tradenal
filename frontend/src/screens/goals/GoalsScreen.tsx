import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';
import { statsKeys } from '../../hooks/useTrades';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AccountStatus } from '../../types';
import { formatPnL, formatBalance } from '../../utils/formatters';
import { useAccountStore } from '../../store/account.store';
import { useUpdateAccount } from '../../hooks/useAccounts';
import { statsApi } from '../../api/stats.api';
import { useToast } from '../../components/common/Toast';

// ─── Daily Rule Types ──────────────────────────────────────────────────────────
export interface DailyRule {
  id: string;
  title: string;
  description?: string;
  category: 'risk' | 'psychology' | 'setup' | 'timing' | 'custom';
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  isActive: boolean;
  createdAt: string;
}

const RULES_STORAGE_KEY = '@tradenal_daily_rules';
const RULES_LAST_DATE_KEY = '@tradenal_daily_rules_last_date';

const RULE_CATEGORY_META: Record<DailyRule['category'], { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  risk: { icon: 'shield-checkmark-outline', color: '#EF4444', label: 'Risk Management' },
  psychology: { icon: 'bulb-outline', color: '#8B5CF6', label: 'Psychology' },
  setup: { icon: 'layers-outline', color: '#3B82F6', label: 'Setup Quality' },
  timing: { icon: 'time-outline', color: '#F59E0B', label: 'Timing' },
  custom: { icon: 'create-outline', color: '#10B981', label: 'Custom' },
};

const PRESET_RULES: Omit<DailyRule, 'id' | 'createdAt'>[] = [
  {
    title: 'Strict "Max 2 Trades"',
    description: 'Max 2 trades per day. Close terminal once limit is reached.',
    category: 'risk',
    icon: 'ban-outline',
    color: '#EF4444',
    isActive: true,
  },
  {
    title: 'Max 1% Daily Risk',
    description: 'Strict 1% daily risk cap. Pre-calculate lot size before entry.',
    category: 'risk',
    icon: 'wallet-outline',
    color: '#F97316',
    isActive: true,
  },
  {
    title: 'Minimum 1:2 to 1:3 RR',
    description: 'Minimum 1:2 or 1:3 room required. Trail winners, no panic exits.',
    category: 'setup',
    icon: 'scale-outline',
    color: '#10B981',
    isActive: true,
  },
  {
    title: 'No Chasing (Limit Orders First)',
    description: 'Never chase running price. Let price come to your level or miss the move.',
    category: 'setup',
    icon: 'locate-outline',
    color: '#8B5CF6',
    isActive: true,
  },
  {
    title: 'High-Impact News Quarantine',
    description: 'No execution during CPI, NFP, or major news. Let spikes & slippage settle.',
    category: 'timing',
    icon: 'flash-outline',
    color: '#F59E0B',
    isActive: true,
  },
  {
    title: '"Cash Is A Position"',
    description: 'Zero-trade days are disciplined decisions, not failures. Wait for clean setups.',
    category: 'psychology',
    icon: 'cash-outline',
    color: '#06B6D4',
    isActive: true,
  },
  {
    title: 'A+ Confluence Filter Only',
    description: 'Trade only when HTF Trend Bias + Liquidity Sweep + Key POI align together.',
    category: 'setup',
    icon: 'filter-outline',
    color: '#6366F1',
    isActive: true,
  },
  {
    title: 'Price Action Over Indicators',
    description: 'Indicators are just scanners. Execute purely on candle reactions & sweeps.',
    category: 'setup',
    icon: 'eye-outline',
    color: '#14B8A6',
    isActive: true,
  },
  {
    title: 'Trade London & NY Sessions Only',
    description: 'New trade entries allowed only during London (12–3:30 PM) & NY (5:30–9 PM IST). No closing/holding time limit.',
    category: 'timing',
    icon: 'time-outline',
    color: '#D97706',
    isActive: true,
  },
  {
    title: 'Multi-Timeframe Hierarchy (4H→1H→15M)',
    description: 'Top-down flow: 4H trend bias → 1H swing structure → 15M/5M sweep confirmation.',
    category: 'setup',
    icon: 'layers-outline',
    color: '#8B5CF6',
    isActive: true,
  },
  {
    title: 'Breakeven Protection (SL to BE)',
    description: 'Move SL to entry at 1:1 or key swing break. Protect capital first.',
    category: 'risk',
    icon: 'lock-closed-outline',
    color: '#059669',
    isActive: true,
  },
  {
    title: 'No Widening Stop-Loss',
    description: 'Never move SL further away. Accept the invalidation, protect drawdown.',
    category: 'risk',
    icon: 'close-circle-outline',
    color: '#DC2626',
    isActive: true,
  },
  {
    title: 'Set & Forget (No Screen Staring)',
    description: 'Set SL/TP and walk away. Stop watching tick-by-tick P&L on your phone.',
    category: 'psychology',
    icon: 'eye-off-outline',
    color: '#64748B',
    isActive: true,
  },
  {
    title: 'Mandatory Trade Journaling',
    description: 'Log entry/exit charts, setup rationale, and emotions for every trade.',
    category: 'custom',
    icon: 'journal-outline',
    color: '#3B82F6',
    isActive: true,
  },
  {
    title: 'No Revenge Trading',
    description: 'Take mandatory 30-min break after any loss before considering next trade.',
    category: 'psychology',
    icon: 'pause-circle-outline',
    color: '#EF4444',
    isActive: true,
  },
  {
    title: 'Stop on 2 Consecutive Losses',
    description: 'Close terminal for the day after 2 consecutive stop-losses.',
    category: 'risk',
    icon: 'hand-left-outline',
    color: '#E11D48',
    isActive: true,
  },
  {
    title: 'Weekend Market Prep & Review',
    description: 'Review weekly trade statistics and mark key HTF levels before Monday.',
    category: 'custom',
    icon: 'calendar-outline',
    color: '#0284C7',
    isActive: true,
  },
  {
    title: 'Emotion-Free Position Sizing',
    description: 'If position size makes your heart race, lot size is too big. Reduce sizing.',
    category: 'psychology',
    icon: 'heart-outline',
    color: '#EC4899',
    isActive: true,
  },
];

export const GoalsScreen: React.FC = () => {
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { activeAccount } = useAccountStore();
  const updateAccountMutation = useUpdateAccount(activeAccount?._id || '');
  const { showToast } = useToast();

  // Tab state: 'targets' | 'rules'
  const [activeTab, setActiveTab] = useState<'targets' | 'rules'>('targets');

  // ─── Daily Rules state ──────────────────────────────────────────────────────
  const [rules, setRules] = useState<DailyRule[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [editingRule, setEditingRule] = useState<DailyRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    title: '',
    description: '',
    category: 'custom' as DailyRule['category'],
  });

  // Load rules from storage
  const loadRules = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(RULES_STORAGE_KEY);
      if (stored) {
        setRules(JSON.parse(stored));
      } else {
        // Initial setup: seed top 5 institutional rules (active by default)
        const defaultSeeded: DailyRule[] = PRESET_RULES.slice(0, 5).map((p, idx) => ({
          ...p,
          id: (Date.now() + idx).toString(),
          isActive: true,
          createdAt: new Date().toISOString(),
        }));
        await AsyncStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(defaultSeeded));
        setRules(defaultSeeded);
      }
    } catch (e) { /* ignore */ }
  }, []);

  const saveRules = useCallback(async (newRules: DailyRule[]) => {
    try {
      await AsyncStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(newRules));
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);

  const handleToggleRule = (id: string) => {
    const updated = rules.map((r) => {
      if (r.id === id) {
        const next = !r.isActive;
        showToast(next ? `Rule activated` : `Rule paused`, 'info');
        return { ...r, isActive: next };
      }
      return r;
    });
    setRules(updated);
    saveRules(updated);
  };

  const handleActivateAll = () => {
    const updated = rules.map((r) => ({ ...r, isActive: true }));
    setRules(updated);
    saveRules(updated);
    showToast('All rules applied', 'success');
  };

  const handlePauseAll = () => {
    const updated = rules.map((r) => ({ ...r, isActive: false }));
    setRules(updated);
    saveRules(updated);
    showToast('All rules paused', 'info');
  };

  const handleAddRule = () => {
    if (!ruleForm.title.trim()) { showToast('Please enter a rule title', 'error'); return; }
    const newRule: DailyRule = {
      id: Date.now().toString(),
      title: ruleForm.title.trim(),
      description: ruleForm.description.trim() || undefined,
      category: ruleForm.category,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const updated = editingRule
      ? rules.map((r) => r.id === editingRule.id ? { ...newRule, id: editingRule.id, createdAt: editingRule.createdAt } : r)
      : [...rules, newRule];
    setRules(updated);
    saveRules(updated);
    setShowRuleModal(false);
    setEditingRule(null);
    setRuleForm({ title: '', description: '', category: 'custom' });
    showToast(editingRule ? 'Rule updated' : 'Rule added', 'success');
  };

  const handleDeleteRule = (id: string) => {
    Alert.alert('Delete Rule', 'Are you sure you want to delete this rule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          const updated = rules.filter((r) => r.id !== id);
          setRules(updated);
          saveRules(updated);
        },
      },
    ]);
  };

  const handleEditRule = (rule: DailyRule) => {
    setEditingRule(rule);
    setRuleForm({ title: rule.title, description: rule.description || '', category: rule.category });
    setShowRuleModal(true);
  };

  const handleAddPresets = (preset: Omit<DailyRule, 'id' | 'createdAt'>) => {
    const alreadyExists = rules.some((r) => r.title === preset.title);
    if (alreadyExists) { showToast('Rule already exists', 'error'); return; }
    const newRule: DailyRule = { ...preset, id: Date.now().toString() + Math.random(), createdAt: new Date().toISOString() };
    const updated = [...rules, newRule];
    setRules(updated);
    saveRules(updated);
    showToast('Rule added', 'success');
  };

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

  // Targets Edit Modal state
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [targetsForm, setTargetsForm] = useState({
    profitTarget: '',
    maxDailyLoss: '',
    maxOverallLoss: '',
  });

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
    const isPrimaryColor = isLossLimit
      ? (percentage > 70 ? colors.error : percentage > 40 ? '#F97316' : '#F59E0B')
      : (achieved ? colors.success : (current < 0 ? colors.error : (isDark ? '#FFFFFF' : colors.primary)));

    return (
      <View style={{ marginBottom: spacing[4] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600', flex: 1, marginRight: 8 }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[typography.label, { color: isPrimaryColor, textAlign: 'right', fontWeight: '700' }]}>
            {format(current)} <Text style={{ color: colors.textTertiary, fontWeight: '400' }}>/ {format(target)}</Text>
          </Text>
        </View>

        <View style={{ height: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', borderRadius: radii.full, overflow: 'hidden' }}>
          <View
            style={{
              width: `${Math.min(Math.max(0, percentage), 100)}%`,
              height: '100%',
              backgroundColor: isPrimaryColor,
              borderRadius: radii.full,
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 11 }]}>
            {isLossLimit ? 'Risk limit utilized' : 'Target completed'}
          </Text>
          <Text style={[typography.caption, { color: isPrimaryColor, fontWeight: '700', fontSize: 11 }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      </View>
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border, paddingBottom: spacing[3], marginBottom: spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: status === 'active' || status === 'funded' ? colors.success : status === 'failed' ? colors.error : colors.textTertiary }} />
              <Text style={[typography.label, { color: colors.textPrimary, textTransform: 'capitalize', fontWeight: '700', fontSize: 14 }]}>
                {activeAccount.name || `${status} Account`}
              </Text>
            </View>
            <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: radii.sm }}>
              <Text style={[typography.caption, { color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '700', fontSize: 10 }]}>
                {getAccountLabel(accountType)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View style={{ width: '48%', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: radii.md, padding: spacing[3] }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: 3, fontSize: 10.5 }]}>STARTING BALANCE</Text>
              <Text style={[typography.label, { color: colors.textPrimary, fontSize: 16, fontWeight: '700' }]}>
                {formatBalance(startingBalance, currency)}
              </Text>
            </View>
            <View style={{ width: '48%', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: radii.md, padding: spacing[3] }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: 3, fontSize: 10.5 }]}>CURRENT BALANCE</Text>
              <Text style={[typography.label, { color: colors.textPrimary, fontSize: 16, fontWeight: '700' }]}>
                {formatBalance(currentBalance, currency)}
              </Text>
            </View>
            <View style={{ width: '48%', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: radii.md, padding: spacing[3] }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: 3, fontSize: 10.5 }]}>TOTAL P&L</Text>
              <Text style={[typography.label, { color: netPnL >= 0 ? colors.success : colors.error, fontSize: 16, fontWeight: '700' }]}>
                {formatPnL(netPnL, currency)}
              </Text>
            </View>
            <View style={{ width: '48%', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: radii.md, padding: spacing[3] }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: 3, fontSize: 10.5 }]}>TOTAL RETURN</Text>
              <Text style={[typography.label, { color: netPnL >= 0 ? colors.success : colors.error, fontSize: 16, fontWeight: '700' }]}>
                {netPnL >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
              </Text>
            </View>
          </View>
        </Card>

        {!hasTargets ? (
          /* Empty State targets */
          <Card style={{ minHeight: 220 }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: spacing[3] }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.primarySubtle,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: spacing[3],
              }}>
                <Ionicons name="shield-outline" size={32} color={colors.primary} />
              </View>
              <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing[2] }]}>
                Set your trading targets
              </Text>
              <Text style={[typography.body, { color: colors.textTertiary, textAlign: 'center', marginBottom: spacing[4], paddingHorizontal: spacing[3], lineHeight: 20 }]}>
                Add an optional profit goal and risk limits to track your account progress.
              </Text>
              <Button
                label="Set Account Targets"
                onPress={handleOpenTargetsModal}
                style={{ width: '80%', alignSelf: 'center' }}
              />
            </View>
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
                              color: isCurrentStatus ? (st === 'active' && isDark ? '#0F172A' : '#FFFFFF') : colors.textPrimary,
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
            {activeTab === 'targets' ? 'Account target rules tracking' : 'Your personal trading rules'}
          </Text>
        </View>
      </View>


      {/* Segment Selector Tab Row */}
      <View style={[styles.tabSelectorRow, { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
        {(['targets', 'rules'] as const).map((tab) => {
          const labels = { targets: 'Account Targets', rules: 'Daily Rules' };
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
              style={[
                styles.tabSelectorButton,
                {
                  backgroundColor: isActive ? (isDark ? '#FFFFFF' : '#0F172A') : colors.surfaceElevated,
                  borderRadius: radii.full,
                  paddingVertical: spacing[2.5],
                  shadowColor: isActive ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1.5 },
                  shadowOpacity: isActive ? (isDark ? 0.25 : 0.08) : 0,
                  shadowRadius: 2.5,
                  elevation: isActive ? 2 : 0,
                },
              ]}
            >
              {tab === 'rules' && rules.filter(r => r.isActive).length > 0 && (
                <View style={{
                  width: 7, height: 7, borderRadius: 3.5,
                  backgroundColor: isActive ? (isDark ? '#0F172A' : '#FFF') : '#10B981',
                  marginRight: 5,
                }} />
              )}
              <Text
                style={[
                  typography.label,
                  {
                    color: isActive ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                    fontSize: 13,
                  },
                ]}
                numberOfLines={1}
              >
                {labels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
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
          // ─── DAILY RULES TAB ───
          <View>
            {/* Header actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing[4] }}>
              <TouchableOpacity
                onPress={() => {
                  setEditingRule(null);
                  setRuleForm({ title: '', description: '', category: 'custom' });
                  setShowRuleModal(true);
                }}
                style={[
                  styles.rulesActionBtn,
                  { backgroundColor: isDark ? '#FFFFFF' : '#0F172A', flex: 1 },
                ]}
              >
                <Ionicons name="add" size={16} color={isDark ? '#0F172A' : '#FFFFFF'} />
                <Text style={[typography.label, { color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '700' }]}>Add Rule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPresetsModal(true)}
                style={[
                  styles.rulesActionBtn,
                  { backgroundColor: colors.primarySubtle, flex: 1 },
                ]}
              >
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                <Text style={[typography.label, { color: colors.primary, fontWeight: '700' }]}>Quick Add</Text>
              </TouchableOpacity>
            </View>

            {/* Stats summary */}
            {rules.length > 0 && (
              <Card style={{ marginBottom: spacing[4], padding: spacing[3] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[typography.numericSm, { color: colors.textPrimary, fontSize: 22, fontWeight: '700' }]}>
                      {rules.length}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>Total Rules</Text>
                  </View>
                  <View style={{ width: 1, height: 28, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[typography.numericSm, { color: '#10B981', fontSize: 22, fontWeight: '700' }]}>
                      {rules.filter(r => r.isActive).length}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>Active (Applied)</Text>
                  </View>
                  <View style={{ width: 1, height: 28, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[typography.numericSm, { color: colors.textTertiary, fontSize: 22, fontWeight: '700' }]}>
                      {rules.filter(r => !r.isActive).length}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>Paused</Text>
                  </View>
                </View>

                {/* Status info */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: spacing[3],
                  paddingTop: spacing[2.5],
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                }}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="#10B981" />
                  <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 11.5 }]}>
                    Active rules are monitored by AI Coach & trade journal audits
                  </Text>
                </View>

                {/* Action buttons: Apply All / Pause All */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing[2.5] }}>
                  <TouchableOpacity
                    onPress={handleActivateAll}
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0',
                      borderWidth: 1,
                      borderRadius: radii.lg,
                      paddingVertical: 9,
                    }}
                  >
                    <Ionicons name="flash-outline" size={15} color="#10B981" />
                    <Text style={[typography.caption, { color: '#10B981', fontWeight: '700', fontSize: 12 }]}>
                      Apply All
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePauseAll}
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      backgroundColor: isDark ? 'rgba(100, 116, 139, 0.12)' : '#F1F5F9',
                      borderColor: isDark ? 'rgba(100, 116, 139, 0.25)' : '#CBD5E1',
                      borderWidth: 1,
                      borderRadius: radii.lg,
                      paddingVertical: 9,
                    }}
                  >
                    <Ionicons name="pause-circle-outline" size={14} color={colors.textTertiary} />
                    <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700', fontSize: 12 }]}>
                      Pause All
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {/* Rules grouped by category */}
            {rules.length === 0 ? (
              <Card style={{ minHeight: 300, overflow: 'hidden' }}>
                <View style={{ flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[6] }}>
                  <View style={{
                    width: 72, height: 72, borderRadius: 36,
                    backgroundColor: colors.primarySubtle,
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: spacing[4],
                  }}>
                    <Ionicons name="shield-checkmark-outline" size={34} color={colors.primary} />
                  </View>
                  <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing[2] }]}>
                    No daily rules yet
                  </Text>
                  <Text style={[typography.body, { color: colors.textTertiary, textAlign: 'center', lineHeight: 20 }]}>
                    Define the rules you must follow every trading day to stay disciplined and consistent.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowPresetsModal(true)}
                    style={[
                      styles.rulesActionBtn,
                      { backgroundColor: colors.primarySubtle, marginTop: spacing[4], paddingHorizontal: spacing[5] },
                    ]}
                  >
                    <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                    <Text style={[typography.label, { color: colors.primary, fontWeight: '700' }]}>Add from presets</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : (
              (Object.keys(RULE_CATEGORY_META) as DailyRule['category'][]).map((category) => {
                const categoryRules = rules.filter((r) => r.category === category);
                if (categoryRules.length === 0) return null;
                const meta = RULE_CATEGORY_META[category];
                return (
                  <View key={category} style={{ marginBottom: spacing[4] }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing[2] }}>
                      <Ionicons name={meta.icon} size={15} color={meta.color} />
                      <Text style={[typography.label, { color: colors.textSecondary, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
                        {meta.label}
                      </Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border, marginLeft: 4 }} />
                    </View>
                    {categoryRules.map((rule) => {
                      const ruleColor = rule.color || meta.color;
                      const ruleIcon = rule.icon || meta.icon;
                      return (
                        <Card
                          key={rule.id}
                          style={StyleSheet.flatten([
                            styles.ruleCard,
                            {
                              opacity: rule.isActive ? 1 : 0.6,
                              borderLeftWidth: 3,
                              borderLeftColor: rule.isActive ? ruleColor : (isDark ? '#334155' : '#CBD5E1'),
                              marginBottom: spacing[2],
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                            },
                          ])}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {/* Rule Icon */}
                            <View style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              backgroundColor: rule.isActive ? (ruleColor + '18') : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Ionicons name={ruleIcon} size={18} color={rule.isActive ? ruleColor : colors.textTertiary} />
                            </View>

                            {/* Clean Title Only - No extra description clutter */}
                            <View style={{ flex: 1 }}>
                              <Text
                                numberOfLines={2}
                                style={[
                                  typography.label,
                                  {
                                    color: rule.isActive ? colors.textPrimary : colors.textTertiary,
                                    fontWeight: '600',
                                    fontSize: 14,
                                    lineHeight: 19,
                                  },
                                ]}
                              >
                                {rule.title}
                              </Text>
                            </View>

                            {/* Proper Native Switch */}
                            <Switch
                              value={rule.isActive}
                              onValueChange={() => handleToggleRule(rule.id)}
                              trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: '#10B981' }}
                              thumbColor="#FFFFFF"
                              ios_backgroundColor={isDark ? '#334155' : '#CBD5E1'}
                              style={{ transform: Platform.OS === 'ios' ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
                            />

                            {/* Actions */}
                            <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                              <TouchableOpacity
                                onPress={() => handleEditRule(rule)}
                                hitSlop={{ top: 8, bottom: 8, left: 6, right: 4 }}
                                style={{ padding: 4 }}
                              >
                                <Ionicons name="pencil-outline" size={15} color={colors.textTertiary} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeleteRule(rule.id)}
                                hitSlop={{ top: 8, bottom: 8, left: 4, right: 6 }}
                                style={{ padding: 4 }}
                              >
                                <Ionicons name="trash-outline" size={15} color={colors.error} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </Card>
                      );
                    })}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ─── Rule Add/Edit Modal ─── */}
      <Modal visible={showRuleModal} animationType="slide" onRequestClose={() => { setShowRuleModal(false); setEditingRule(null); }}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
          <View style={[styles.modalHeader, { paddingHorizontal: spacing[5], paddingBottom: spacing[4] }]}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{editingRule ? 'Edit Rule' : 'New Rule'}</Text>
            <TouchableOpacity onPress={() => { setShowRuleModal(false); setEditingRule(null); }}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5] }} keyboardShouldPersistTaps="handled">
            <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6 }]}>Rule Title *</Text>
            <TextInput
              value={ruleForm.title}
              onChangeText={(v) => setRuleForm((p) => ({ ...p, title: v }))}
              placeholder="e.g. No trading after 2 losses"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.ruleInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  marginBottom: spacing[4],
                },
              ]}
            />
            <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6 }]}>Description (optional)</Text>
            <TextInput
              value={ruleForm.description}
              onChangeText={(v) => setRuleForm((p) => ({ ...p, description: v }))}
              placeholder="Details or reasoning for this rule"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              style={[
                styles.ruleInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  height: 80,
                  textAlignVertical: 'top',
                  paddingTop: 12,
                  marginBottom: spacing[4],
                },
              ]}
            />
            <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 10 }]}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing[5] }}>
              {(Object.keys(RULE_CATEGORY_META) as DailyRule['category'][]).map((cat) => {
                const meta = RULE_CATEGORY_META[cat];
                const isSelected = ruleForm.category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setRuleForm((p) => ({ ...p, category: cat }))}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? meta.color + '22' : colors.surfaceElevated,
                        borderColor: isSelected ? meta.color : colors.border,
                      },
                    ]}
                  >
                    <Ionicons name={meta.icon} size={14} color={isSelected ? meta.color : colors.textSecondary} />
                    <Text style={[typography.caption, { color: isSelected ? meta.color : colors.textSecondary, fontWeight: isSelected ? '700' : '500' }]}>
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button
              label={editingRule ? 'Update Rule' : 'Add Rule'}
              onPress={handleAddRule}
              style={{ marginTop: spacing[2], marginBottom: spacing[6] }}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Presets Modal ─── */}
      <Modal visible={showPresetsModal} animationType="slide" onRequestClose={() => setShowPresetsModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
          <View style={[styles.modalHeader, { paddingHorizontal: spacing[5], paddingBottom: spacing[4] }]}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Preset Rules</Text>
            <TouchableOpacity onPress={() => setShowPresetsModal(false)}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={[typography.body, { color: colors.textTertiary, paddingHorizontal: spacing[5], marginBottom: spacing[3] }]}>
            Tap '+' to add a preset rule to your daily checklist.
          </Text>
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5] }}>
            {PRESET_RULES.map((preset, idx) => {
              const meta = RULE_CATEGORY_META[preset.category];
              const ruleColor = preset.color || meta.color;
              const ruleIcon = preset.icon || meta.icon;
              const alreadyAdded = rules.some((r) => r.title === preset.title);
              return (
                <Card key={idx} style={{ marginBottom: spacing[2], borderLeftWidth: 3, borderLeftColor: ruleColor }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: ruleColor + '18', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={ruleIcon} size={18} color={ruleColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.label, { color: colors.textPrimary, fontWeight: '600' }]}>{preset.title}</Text>
                      {preset.description && (
                        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2, lineHeight: 16 }]}>{preset.description}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleAddPresets(preset)}
                      disabled={alreadyAdded}
                      style={[
                        styles.presetAddBtn,
                        { backgroundColor: alreadyAdded ? colors.surfaceElevated : ruleColor + '22', borderColor: alreadyAdded ? colors.border : ruleColor },
                      ]}
                    >
                      <Ionicons name={alreadyAdded ? 'checkmark' : 'add'} size={18} color={alreadyAdded ? colors.textTertiary : ruleColor} />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
            <View style={{ height: spacing[6] }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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
  ruleCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  ruleToggle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  rulesActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  ruleInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  presetAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
