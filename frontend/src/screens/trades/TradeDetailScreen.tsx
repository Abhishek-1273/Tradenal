import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';
import { useTrade, useDeleteTrade, useToggleFavorite } from '../../hooks/useTrades';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { TradeDetailRouteProp, AppNavProp } from '../../navigation/types';
import {
  formatDate,
  formatDuration,
  getResultColor,
  getResultLabel,
  getSetupLabel,
  getSessionLabel,
  getEmotionBeforeLabel,
  getEmotionDuringLabel,
  getEmotionAfterLabel,
  getMistakeLabel,
  getDisciplineScoreColor,
  formatPnL,
  formatPrice,
} from '../../utils/formatters';
import { useAccountStore } from '../../store/account.store';
import { BASE_URL } from '../../api/client';
import { ImageViewerModal } from '../../components/common/ImageViewerModal';
import { DISCIPLINE_CHECKLIST_ITEMS } from '../../constants';

const { width: SW } = Dimensions.get('window');

const fontBase = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  includeFontPadding: false,
};

const getEmotionConfig = (emotion: string, colors: any): { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string } => {
  const configs: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
    // Before
    calm_patient: { icon: 'leaf', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    confident: { icon: 'shield-checkmark', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    fomo_chasing: { icon: 'flash', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    fearful_hesitant: { icon: 'warning', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    bored_forcing: { icon: 'bed', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    greedy_impulsive: { icon: 'wallet', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    fear: { icon: 'warning', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    greedy: { icon: 'wallet', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    fomo: { icon: 'alarm', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    calm: { icon: 'leaf', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    bored: { icon: 'bed', color: colors.textTertiary, bg: colors.surfaceHighlight },
    // During
    calm_detached: { icon: 'leaf', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    anxious_tick_watching: { icon: 'pulse', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    tempted_to_close: { icon: 'exit', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    tempted_to_move_sl: { icon: 'trending-down', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    tempted_to_add: { icon: 'add-circle', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    doubtful_overthinking: { icon: 'help-circle', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    anxious: { icon: 'alert-circle', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    doubtful: { icon: 'help-circle', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    confident_held: { icon: 'shield-checkmark', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    // After
    disciplined: { icon: 'checkmark-circle', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    neutral_objective: { icon: 'remove-circle', color: colors.textTertiary, bg: colors.surfaceHighlight },
    relieved_lucky: { icon: 'heart', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    frustrated_angry: { icon: 'flame', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    regretful: { icon: 'arrow-undo', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    revenge_urge: { icon: 'alert-circle', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    relieved: { icon: 'heart', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
    satisfied: { icon: 'checkmark-circle', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    neutral: { icon: 'remove-circle', color: colors.textTertiary, bg: colors.surfaceHighlight },
    frustrated: { icon: 'sad', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    angry: { icon: 'flame', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  };
  return configs[emotion] || { icon: 'happy', color: colors.textSecondary, bg: colors.surfaceHighlight };
};

export const TradeDetailScreen: React.FC = () => {
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const route = useRoute<TradeDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { data: trade, isLoading } = useTrade(route.params.tradeId);
  const { mutate: deleteTrade } = useDeleteTrade();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { activeAccount } = useAccountStore();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) return <LoadingOverlay fullScreen message="Loading trade details..." />;
  if (!trade) return null;

  const resultColor = getResultColor(trade.result, colors);
  const effectivePnL = trade.pnlAmount ?? trade.pnl;
  const isLoss = trade.result === 'loss' || (typeof effectivePnL === 'number' && effectivePnL < 0);
  const isWin = trade.result === 'win' || trade.result === 'partialWin' || (typeof effectivePnL === 'number' && effectivePnL > 0);
  const isBE = trade.result === 'breakeven' || (typeof effectivePnL === 'number' && effectivePnL === 0);

  const rawR = trade.rMultiple;
  const effectiveR =
    rawR !== undefined && rawR !== null && (rawR !== 0 || isBE)
      ? rawR
      : isLoss
      ? -1.0
      : isWin
      ? 1.0
      : 0;
  const isBuy = trade.tradeType.toLowerCase() === 'buy';

  const handleDelete = () => {
    Alert.alert('Delete Trade', 'This cannot be undone. Are you sure you want to delete this trade?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTrade(trade._id, { onSuccess: () => navigation.goBack() }),
      },
    ]);
  };

  // Per-trade discipline score
  const checklistItems = trade.checklist ?? [];
  const hasChecklist = checklistItems.length > 0;
  let disciplineScore = 100;
  if (hasChecklist) {
    disciplineScore = Math.round((checklistItems.length / 18) * 100);
  } else {
    if (!trade.followedPlan) disciplineScore -= 20;
    if (trade.revengeTrade) disciplineScore -= 20;
    if (trade.overtraded) disciplineScore -= 15;
    if (trade.movedSL) disciplineScore -= 15;
    if ((trade.riskReward ?? 0) < 1) disciplineScore -= 15;
    if ((trade.riskPercent ?? 0) > 3) disciplineScore -= 10;
    if (!trade.checkedHigherTimeframe) disciplineScore -= 5;
    if (!trade.waitedForConfirmation) disciplineScore -= 5;
    if (trade.sizedCorrectly === false) disciplineScore -= 5;
    if (trade.withinDailyLossLimit === false) disciplineScore -= 10;
    if (trade.singleTradeDominance === false) disciplineScore -= 5;
    disciplineScore = Math.max(0, disciplineScore);
  }

  const getDisciplineStatus = (score: number) => {
    if (score >= 90) return { label: 'Flawless Discipline', color: '#10B981' };
    if (score >= 75) return { label: 'Controlled Execution', color: '#3B82F6' };
    if (score >= 50) return { label: 'Rules Strained', color: '#F59E0B' };
    return { label: 'High Risk Trade', color: '#EF4444' };
  };
  const disciplineStatus = getDisciplineStatus(disciplineScore);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Dynamic Ambient Background Glow */}
      <LinearGradient
        colors={[resultColor + '20', 'transparent']}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + 10,
            paddingHorizontal: spacing[5],
            paddingBottom: 14,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={[
            styles.headerBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.headerPairText, { color: colors.textPrimary }]}>
              {trade.pair}
            </Text>
            <View
              style={[
                styles.headerDirectionPill,
                {
                  backgroundColor: isBuy ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                  borderColor: isBuy ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
                },
              ]}
            >
              <Ionicons
                name={isBuy ? 'trending-up' : 'trending-down'}
                size={11}
                color={isBuy ? '#10B981' : '#EF4444'}
              />
              <Text style={[styles.headerDirectionText, { color: isBuy ? '#10B981' : '#EF4444' }]}>
                {trade.tradeType.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {formatDate(trade.tradeDate, 'DD MMM YYYY')} • {getSessionLabel(trade.session)}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => toggleFavorite(trade._id)}
            activeOpacity={0.7}
            style={[
              styles.headerBtn,
              {
                backgroundColor: trade.isFavorite
                  ? 'rgba(245, 158, 11, 0.18)'
                  : isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                borderColor: trade.isFavorite
                  ? 'rgba(245, 158, 11, 0.4)'
                  : isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Ionicons
              name={trade.isFavorite ? 'star' : 'star-outline'}
              size={17}
              color={trade.isFavorite ? '#F59E0B' : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('EditTrade', { tradeId: trade._id })}
            activeOpacity={0.7}
            style={[
              styles.headerBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Ionicons name="pencil-sharp" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            activeOpacity={0.7}
            style={[
              styles.headerBtn,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.25)',
              },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: 18,
          paddingBottom: insets.bottom + 50,
        }}
      >
        {/* ── 1. Executive Trade Result Hero Card ────────────────────── */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: resultColor + '40',
              borderRadius: 22,
            },
          ]}
        >
          <LinearGradient
            colors={[resultColor + '18', resultColor + '04', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroInner}>
            {/* Top Row: P&L Display & Badges */}
            <View style={styles.heroTopRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.heroPnLLabel, { color: colors.textTertiary }]}>
                  REALIZED P&L
                </Text>
                <Text
                  style={[
                    styles.heroPnLAmount,
                    { color: resultColor },
                  ]}
                  numberOfLines={1}
                >
                  {typeof effectivePnL === 'number'
                    ? formatPnL(effectivePnL, activeAccount?.currency)
                    : '—'}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 7 }}>
                {/* Result Pill */}
                <View
                  style={[
                    styles.heroOutcomeBadge,
                    {
                      backgroundColor: resultColor + '20',
                      borderColor: resultColor + '50',
                    },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: resultColor }]} />
                  <Text style={[styles.heroOutcomeText, { color: resultColor }]}>
                    {getResultLabel(trade.result).toUpperCase()}
                  </Text>
                </View>

                {/* R-Multiple Pill */}
                <View
                  style={[
                    styles.heroRPill,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
                      borderColor: isDark ? 'rgba(255,255,255,0.14)' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.heroRLabel, { color: colors.textTertiary }]}>R:</Text>
                  <Text style={[styles.heroRValue, { color: resultColor }]}>
                    {effectiveR >= 0 ? '+' : ''}{effectiveR.toFixed(2)}R
                  </Text>
                </View>
              </View>
            </View>

            {/* Tag Pills Row: Setup, Plan Compliance, Session */}
            <View style={styles.heroTagsRow}>
              {trade.setup && (
                <View
                  style={[
                    styles.heroTag,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="layers-outline" size={12} color={colors.textSecondary} style={{ marginRight: 5 }} />
                  <Text style={[styles.heroTagText, { color: colors.textSecondary }]}>
                    {getSetupLabel(trade.setup)}
                  </Text>
                </View>
              )}

              {/* Plan Compliance Badge */}
              <View
                style={[
                  styles.heroTag,
                  {
                    backgroundColor: trade.followedPlan
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(239, 68, 68, 0.15)',
                    borderColor: trade.followedPlan
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.4)',
                  },
                ]}
              >
                <Ionicons
                  name={trade.followedPlan ? 'checkmark-circle' : 'close-circle'}
                  size={13}
                  color={trade.followedPlan ? '#10B981' : '#EF4444'}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.heroTagText,
                    { color: trade.followedPlan ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {trade.followedPlan ? 'Plan Respected' : 'Rule Broken'}
                </Text>
              </View>

              {trade.session && (
                <View
                  style={[
                    styles.heroTag,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="time-outline" size={12} color={colors.textTertiary} style={{ marginRight: 5 }} />
                  <Text style={[styles.heroTagText, { color: colors.textSecondary }]}>
                    {getSessionLabel(trade.session)}
                  </Text>
                </View>
              )}

              {trade.strategy && (
                <View
                  style={[
                    styles.heroTag,
                    {
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
                    },
                  ]}
                >
                  <Ionicons
                    name="git-network-outline"
                    size={12}
                    color={isDark ? '#60A5FA' : '#2563EB'}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.heroTagText,
                      {
                        color: isDark ? '#93C5FD' : '#1D4ED8',
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {trade.strategy}
                  </Text>
                </View>
              )}

              {trade.setup && (
                <View
                  style={[
                    styles.heroTag,
                    {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
                      borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : '#C7D2FE',
                    },
                  ]}
                >
                  <Ionicons name="flash-outline" size={12} color="#6366F1" style={{ marginRight: 5 }} />
                  <Text style={[styles.heroTagText, { color: isDark ? '#A5B4FC' : '#4F46E5', fontWeight: '700' }]}>
                    {trade.setup}
                  </Text>
                </View>
              )}

              {trade.confluences && trade.confluences.length > 0 && trade.confluences.map((conf) => (
                <View
                  key={conf}
                  style={[
                    styles.heroTag,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#A7F3D0',
                    },
                  ]}
                >
                  <Ionicons name="sparkles-outline" size={11} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={[styles.heroTagText, { color: isDark ? '#6EE7B7' : '#059669', fontSize: 11 }]}>
                    {conf}
                  </Text>
                </View>
              ))}
            </View>

            {/* 2x2 Explicit Grid: Row 1 & Row 2 */}
            <View style={styles.metricsGridContainer}>
              {/* Row 1: Risk : Reward & Risk */}
              <View style={styles.metricsGridRow}>
                <View style={[styles.metricTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                  <View style={styles.metricTileHeader}>
                    <Ionicons name="swap-vertical-outline" size={12} color={colors.textTertiary} style={{ marginRight: 5 }} />
                    <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>RISK : REWARD</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                    {trade.riskReward ? `1 : ${trade.riskReward.toFixed(2)}` : '—'}
                  </Text>
                </View>

                <View style={[styles.metricTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                  <View style={styles.metricTileHeader}>
                    <Ionicons name="shield-outline" size={12} color={colors.textTertiary} style={{ marginRight: 5 }} />
                    <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>RISK</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1}>
                    {trade.riskPercent != null ? `${trade.riskPercent}%` : '—'}
                  </Text>
                </View>
              </View>

              {/* Row 2: Lot Size & Duration */}
              <View style={styles.metricsGridRow}>
                <View style={[styles.metricTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                  <View style={styles.metricTileHeader}>
                    <Ionicons name="cube-outline" size={12} color={colors.textTertiary} style={{ marginRight: 5 }} />
                    <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>LOT SIZE</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                    {trade.lotSize ? `${trade.lotSize.toFixed(2)} Lots` : '—'}
                  </Text>
                </View>

                <View style={[styles.metricTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                  <View style={styles.metricTileHeader}>
                    <Ionicons name="hourglass-outline" size={12} color={colors.textTertiary} style={{ marginRight: 5 }} />
                    <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>DURATION</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                    {formatDuration(trade.tradeDurationMinutes)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── 2. Visual Price Action & Execution Ladder ────────────── */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            PRICE ACTION & EXECUTION
          </Text>
        </View>

        <View
          style={[
            styles.cardWrap,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 22,
            },
          ]}
        >
          {/* Price Ladder (Clean icons with no vertical line) */}
          <View style={styles.ladderContainer}>
            {/* 1. Take Profit Level */}
            <View style={styles.ladderStep}>
              <View style={[styles.ladderIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
                <Ionicons name="flag" size={15} color="#10B981" />
              </View>
              <View style={styles.ladderContent}>
                <View>
                  <Text style={[styles.ladderLevelName, { color: colors.textSecondary }]}>Take Profit (Target)</Text>
                  <Text style={[styles.ladderTargetDist, { color: '#10B981' }]}>Target Objective</Text>
                </View>
                <Text style={[styles.ladderPriceText, { color: trade.takeProfit != null ? '#10B981' : colors.textTertiary }]}>
                  {trade.takeProfit != null ? formatPrice(trade.takeProfit) : 'Not Set'}
                </Text>
              </View>
            </View>

            {/* 2. Actual Exit Price */}
            <View style={styles.ladderStep}>
              <View
                style={[
                  styles.ladderIconCircle,
                  {
                    backgroundColor: resultColor + '20',
                    borderColor: resultColor,
                  },
                ]}
              >
                <Ionicons name="exit-outline" size={15} color={resultColor} />
              </View>
              <View style={styles.ladderContent}>
                <View>
                  <Text style={[styles.ladderLevelName, { color: colors.textSecondary }]}>Exit Price (Closed)</Text>
                  <Text style={[styles.ladderTargetDist, { color: resultColor }]}>
                    {getResultLabel(trade.result)}
                  </Text>
                </View>
                <Text style={[styles.ladderPriceText, { color: trade.exitPrice != null ? colors.textPrimary : colors.textTertiary }]}>
                  {trade.exitPrice != null ? formatPrice(trade.exitPrice) : 'Not Set'}
                </Text>
              </View>
            </View>

            {/* 3. Entry Price */}
            <View style={styles.ladderStep}>
              <View style={[styles.ladderIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' }]}>
                <Ionicons name="log-in-outline" size={16} color="#3B82F6" />
              </View>
              <View style={styles.ladderContent}>
                <View>
                  <Text style={[styles.ladderLevelName, { color: colors.textSecondary }]}>Entry Price</Text>
                  <Text style={[styles.ladderTargetDist, { color: '#3B82F6' }]}>
                    {isBuy ? 'Long Fill' : 'Short Fill'}
                  </Text>
                </View>
                <Text style={[styles.ladderPriceText, { color: colors.textPrimary }]}>
                  {formatPrice(trade.entryPrice)}
                </Text>
              </View>
            </View>

            {/* 4. Stop Loss Level */}
            <View style={[styles.ladderStep, { marginBottom: 0 }]}>
              <View style={[styles.ladderIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
                <Ionicons name="shield-outline" size={15} color="#EF4444" />
              </View>
              <View style={styles.ladderContent}>
                <View>
                  <Text style={[styles.ladderLevelName, { color: colors.textSecondary }]}>Stop Loss</Text>
                  <Text style={[styles.ladderTargetDist, { color: '#EF4444' }]}>Capital Risk Guard</Text>
                </View>
                <Text style={[styles.ladderPriceText, { color: trade.stopLoss != null ? '#EF4444' : colors.textTertiary }]}>
                  {trade.stopLoss != null ? formatPrice(trade.stopLoss) : 'Not Set'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 3. Trade Screenshots Gallery ──────────────────────────── */}
        {trade.screenshots.length > 0 && (
          <View>
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                CHART SCREENSHOTS
              </Text>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="images-outline" size={12} color={colors.textSecondary} style={{ marginRight: 5 }} />
                <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>
                  {trade.screenshots.length} {trade.screenshots.length === 1 ? 'Image' : 'Images'}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -spacing[5] }}
              contentContainerStyle={{ paddingHorizontal: spacing[5], gap: 14 }}
            >
              {trade.screenshots.map((s, idx) => {
                const fullUrl = s.url.startsWith('/') ? `${BASE_URL.replace('/api', '')}${s.url}` : s.url;
                return (
                  <TouchableOpacity
                    key={s.publicId || idx}
                    activeOpacity={0.88}
                    onPress={() => setSelectedImage(fullUrl)}
                    style={[
                      styles.screenshotCard,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: fullUrl }}
                      style={styles.screenshotImage}
                      resizeMode="cover"
                    />
                    {/* Zoom pill overlay */}
                    <View style={styles.zoomOverlay}>
                      <Ionicons name="expand" size={13} color="#FFFFFF" />
                      <Text style={styles.zoomText}>View Full</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── 4. Psychology & Emotional State ───────────────────────── */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            PSYCHOLOGY & EMOTIONAL AUDIT
          </Text>
        </View>

        <View
          style={[
            styles.cardWrap,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 22,
            },
          ]}
        >
          {/* Emotions Triad: Before, During, After */}
          <View style={styles.emotionsRow}>
            {[
              {
                stage: 'BEFORE',
                val: trade.emotionBefore,
                label: trade.emotionBefore ? getEmotionBeforeLabel(trade.emotionBefore) : 'None',
              },
              {
                stage: 'DURING',
                val: trade.emotionDuring,
                label: trade.emotionDuring ? getEmotionDuringLabel(trade.emotionDuring) : 'None',
              },
              {
                stage: 'AFTER',
                val: trade.emotionAfter,
                label: trade.emotionAfter ? getEmotionAfterLabel(trade.emotionAfter) : 'None',
              },
            ].map((item) => {
              const config = getEmotionConfig(item.val || 'neutral', colors);
              return (
                <View
                  key={item.stage}
                  style={[
                    styles.emotionPhaseCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.emotionPhaseLabel, { color: colors.textTertiary }]}>
                    {item.stage}
                  </Text>
                  <View style={[styles.emotionIconBadge, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon} size={18} color={config.color} />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.emotionNameText, { color: colors.textPrimary }]}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Trade Discipline Score Banner */}
          <View
            style={[
              styles.disciplineScoreBanner,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.disciplineScoreTitle, { color: colors.textPrimary }]}>
                Discipline Execution Score
              </Text>
              <Text style={[styles.disciplineStatusText, { color: disciplineStatus.color }]}>
                {disciplineStatus.label}
              </Text>
              {/* Score Progress Bar */}
              <View
                style={[
                  styles.progressBarBg,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${disciplineScore}%`,
                      backgroundColor: getDisciplineScoreColor(disciplineScore, colors),
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.scorePill}>
              <Text
                style={[
                  styles.scoreNum,
                  { color: getDisciplineScoreColor(disciplineScore, colors) },
                ]}
              >
                {hasChecklist ? `${checklistItems.length}/18` : disciplineScore}
              </Text>
              <Text style={[styles.scoreMax, { color: colors.textTertiary }]}>
                {hasChecklist ? `(${disciplineScore}%)` : '/100'}
              </Text>
            </View>
          </View>

          {/* Discipline Rules Grid */}
          <View style={styles.disciplineGrid}>
            {(hasChecklist
              ? DISCIPLINE_CHECKLIST_ITEMS.map((item) => ({
                  label: item.label,
                  passed: checklistItems.includes(item.id),
                }))
              : [
                  { label: 'Followed Rules & Plan', passed: trade.followedPlan },
                  { label: 'No Revenge Trade', passed: !trade.revengeTrade },
                  { label: 'No Overtrading', passed: !trade.overtraded },
                  { label: 'Held Stop Loss', passed: !trade.movedSL },
                  { label: 'Proper Sizing', passed: trade.sizedCorrectly !== false },
                  { label: 'HTF Analysis Checked', passed: !!trade.checkedHigherTimeframe },
                  { label: 'Waited Confirmation', passed: !!trade.waitedForConfirmation },
                  { label: 'Daily Limit Respected', passed: trade.withinDailyLossLimit !== false },
                ]
            ).map((rule) => (
              <View
                key={rule.label}
                style={[
                  styles.rulePill,
                  {
                    backgroundColor: rule.passed
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(239, 68, 68, 0.08)',
                    borderColor: rule.passed
                      ? 'rgba(16, 185, 129, 0.22)'
                      : 'rgba(239, 68, 68, 0.22)',
                  },
                ]}
              >
                <Ionicons
                  name={rule.passed ? 'checkmark-circle' : 'close-circle'}
                  size={13}
                  color={rule.passed ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.ruleLabelText,
                    { color: rule.passed ? colors.textPrimary : '#EF4444' },
                  ]}
                  numberOfLines={1}
                >
                  {rule.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 5. Mistakes Identified (if any) ────────────────────────── */}
        {trade.mistakes.length > 0 && (
          <View>
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionTitle, { color: trade.mistakes.includes('none_flawless') ? '#10B981' : '#EF4444' }]}>
                {trade.mistakes.includes('none_flawless') ? 'PROCESS COMPLIANCE' : 'EXECUTION MISTAKES IDENTIFIED'}
              </Text>
            </View>

            <View
              style={[
                styles.cardWrap,
                {
                  backgroundColor: trade.mistakes.includes('none_flawless') ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.05)',
                  borderColor: trade.mistakes.includes('none_flawless') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                  borderRadius: 22,
                },
              ]}
            >
              {trade.mistakes.includes('none_flawless') ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="shield-checkmark" size={17} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981', marginBottom: 2 }}>
                      None / Flawless Process (Valid Loss)
                    </Text>
                    <Text style={{ fontSize: 11.5, color: colors.textSecondary, lineHeight: 16 }}>
                      Setup and execution followed 100% of rules; loss was within normal statistical variance.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {trade.mistakes
                    .filter((m) => m !== 'none_flawless')
                    .map((m) => {
                      const isCustom = m === 'custom';
                      const label = isCustom && trade.customMistake ? trade.customMistake : getMistakeLabel(m);
                      return (
                        <View
                          key={m}
                          style={[
                            styles.mistakeChip,
                            {
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                            },
                          ]}
                        >
                          <Ionicons name={isCustom ? 'construct-outline' : 'warning'} size={13} color="#EF4444" />
                          <Text style={[styles.mistakeText, { color: '#EF4444' }]}>
                            {label}
                          </Text>
                        </View>
                      );
                    })}
                  {trade.customMistake && !trade.mistakes.includes('custom') && (
                    <View
                      style={[
                        styles.mistakeChip,
                        {
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                        },
                      ]}
                    >
                      <Ionicons name="construct-outline" size={13} color="#EF4444" />
                      <Text style={[styles.mistakeText, { color: '#EF4444' }]}>
                        {trade.customMistake}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── 6. Reason for Entry & Thesis ──────────────────────────── */}
        {trade.reasonForEntry ? (
          <View>
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                ENTRY THESIS & CONFLUENCE
              </Text>
            </View>
            <View
              style={[
                styles.cardWrap,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: 22,
                },
              ]}
            >
              <View style={styles.thesisHeader}>
                <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
                <Text style={[styles.thesisHeaderText, { color: colors.textPrimary }]}>
                  Why this trade was taken
                </Text>
              </View>
              <Text style={[styles.journalBodyText, { color: colors.textSecondary }]}>
                {trade.reasonForEntry}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── 7. Trade Notes & Post-Trade Review ────────────────────── */}
        {trade.notes ? (
          <View>
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                POST-TRADE JOURNAL NOTES
              </Text>
            </View>
            <View
              style={[
                styles.cardWrap,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: 22,
                },
              ]}
            >
              <View style={styles.thesisHeader}>
                <Ionicons name="journal-outline" size={16} color="#3B82F6" />
                <Text style={[styles.thesisHeaderText, { color: colors.textPrimary }]}>
                  Trader Reflections
                </Text>
              </View>
              <Text style={[styles.journalBodyText, { color: colors.textSecondary }]}>
                {trade.notes}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── 8. Strategy Tags ──────────────────────────────────────── */}
        {trade.tags.length > 0 && (
          <View>
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                STRATEGY TAGS
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {trade.tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                      borderColor: 'rgba(59, 130, 246, 0.25)',
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: '#3B82F6' }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── 9. Trade Execution Timeline ───────────────────────────── */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            EXECUTION TIMELINE
          </Text>
        </View>

        <View
          style={[
            styles.cardWrap,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 22,
            },
          ]}
        >
          <TimelineItem
            icon="calendar-outline"
            iconColor="#3B82F6"
            title="Trade Date"
            subtitle={formatDate(trade.tradeDate, 'dddd, DD MMMM YYYY')}
          />
          {trade.entryTime && (
            <TimelineItem
              icon="log-in-outline"
              iconColor="#10B981"
              title="Order Opened"
              subtitle={dayjs(trade.entryTime).format('HH:mm:ss')}
            />
          )}
          {trade.exitTime && (
            <TimelineItem
              icon="log-out-outline"
              iconColor={resultColor}
              title="Order Closed"
              subtitle={dayjs(trade.exitTime).format('HH:mm:ss')}
            />
          )}
          <TimelineItem
            icon="document-text-outline"
            iconColor={colors.textTertiary}
            title="Journaled At"
            subtitle={formatDate(trade.createdAt, 'DD MMM YYYY, HH:mm')}
            isLast
          />
        </View>
      </ScrollView>

      {/* Fullscreen Image Previewer */}
      <ImageViewerModal
        visible={!!selectedImage}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </View>
  );
};

// ── Timeline Helper Component ───────────────────────────────────────────────
interface TimelineItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  isLast?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  isLast,
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.timelineRow,
        {
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={[styles.timelineIconCircle, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[styles.timelineTitle, { color: colors.textTertiary }]}>{title}</Text>
        <Text style={[styles.timelineSubtitle, { color: colors.textPrimary }]}>{subtitle}</Text>
      </View>
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 0,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerPairText: {
    ...fontBase,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerDirectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
  },
  headerDirectionText: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroInner: {
    padding: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroPnLLabel: {
    ...fontBase,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroPnLAmount: {
    ...fontBase,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  heroOutcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroOutcomeText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroRPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    gap: 4,
  },
  heroRLabel: {
    ...fontBase,
    fontSize: 10,
    fontWeight: '700',
  },
  heroRValue: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },
  heroTagText: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '600',
  },
  // ── 2x2 Guaranteed Metric Grid ──
  metricsGridContainer: {
    gap: 10,
  },
  metricsGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricTile: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  metricTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    ...fontBase,
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 13,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardWrap: {
    borderWidth: 1,
    padding: 22,
  },
  ladderContainer: {
    position: 'relative',
  },
  ladderTrack: {
    position: 'absolute',
    left: 20,
    top: 18,
    bottom: 18,
    width: 2,
    borderRadius: 1,
  },
  ladderStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  ladderIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ladderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 16,
  },
  ladderLevelName: {
    ...fontBase,
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  ladderTargetDist: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '600',
  },
  ladderPriceText: {
    ...fontBase,
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  countBadgeText: {
    ...fontBase,
    fontSize: 10.5,
    fontWeight: '700',
  },
  screenshotCard: {
    width: SW * 0.74,
    height: 210,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoomText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emotionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  emotionPhaseCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  emotionPhaseLabel: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  emotionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emotionNameText: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  disciplineScoreBanner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  disciplineScoreTitle: {
    ...fontBase,
    fontSize: 13.5,
    fontWeight: '700',
  },
  disciplineStatusText: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 3,
    marginBottom: 10,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '90%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 10,
  },
  scoreNum: {
    ...fontBase,
    fontSize: 26,
    fontWeight: '900',
  },
  scoreMax: {
    ...fontBase,
    fontSize: 12.5,
    fontWeight: '600',
  },
  disciplineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    minWidth: '47%',
  },
  ruleLabelText: {
    ...fontBase,
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  mistakeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    gap: 6,
  },
  mistakeText: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '700',
  },
  thesisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  thesisHeaderText: {
    ...fontBase,
    fontSize: 13.5,
    fontWeight: '700',
  },
  journalBodyText: {
    ...fontBase,
    fontSize: 13.5,
    lineHeight: 22,
    fontWeight: '500',
  },
  tagChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  tagText: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  timelineIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTitle: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '600',
  },
  timelineSubtitle: {
    ...fontBase,
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2,
  },
});
