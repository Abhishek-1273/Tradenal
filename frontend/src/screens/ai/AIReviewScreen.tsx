import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';
import {
  useLatestReview, useReviews, useGenerateWeeklyReview,
  useGenerateMonthlyReview, usePatterns,
} from '../../hooks/useTrades';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/LoadingOverlay';
import {
  getDisciplineScoreColor, getDisciplineScoreLabel, formatPercent, formatProfitFactor,
} from '../../utils/formatters';

import { useAccountStore } from '../../store/account.store';

type ReviewTab = 'Weekly' | 'Monthly' | 'Patterns';

export const AIReviewScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ReviewTab>('Weekly');
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;

  const reviewType = activeTab === 'Weekly' ? 'weekly' : 'monthly';
  const { data: latestReview, isLoading } = useLatestReview(activeTab === 'Patterns' ? 'weekly' : reviewType, accountId);
  const { data: allReviews } = useReviews(activeTab === 'Patterns' ? 'weekly' : reviewType, 6, accountId);
  const { data: patterns, isLoading: patternsLoading } = usePatterns(30);
  const { mutateAsync: generateWeekly, isPending: genWeekly } = useGenerateWeeklyReview();
  const { mutateAsync: generateMonthly, isPending: genMonthly } = useGenerateMonthlyReview();

  const isGenerating = genWeekly || genMonthly;

  const handleGenerate = async () => {
    try {
      if (activeTab === 'Weekly') await generateWeekly(accountId);
      else await generateMonthly(accountId);
    } catch (e: any) {
      Alert.alert('Cannot Generate Review', e.message || 'Make sure you have trades in this period.');
    }
  };

  const scoreColor = getDisciplineScoreColor(latestReview?.metrics?.disciplineScore ?? 0, colors);

  const BulletSection = ({
    title, items, icon, color,
  }: { title: string; items: string[]; icon: string; color: string }) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={{ marginBottom: spacing[5] }}>
        <View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }]}>
          <View style={[{ width: 32, height: 32, borderRadius: 16, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing[2] }]}>
            <Ionicons name={icon as any} size={16} color={color} />
          </View>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>{title}</Text>
        </View>
        {items.map((item, i) => (
          <View key={i} style={[{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[2] }]}>
            <View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginTop: 8, marginRight: spacing[3], flexShrink: 0 }]} />
            <Text style={[typography.body, { color: colors.textSecondary, flex: 1, lineHeight: 23 }]}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const PatternCard = ({ pattern }: { pattern: any }) => {
    const impactColor = pattern.impact === 'positive' ? colors.success : pattern.impact === 'negative' ? colors.error : colors.warning;
    const impactIcon = pattern.impact === 'positive' ? 'trending-up' : pattern.impact === 'negative' ? 'trending-down' : 'remove';
    return (
      <View style={[{
        backgroundColor: colors.surface, borderRadius: radii.xl,
        borderWidth: 1, borderColor: impactColor + '30',
        borderLeftWidth: 4, borderLeftColor: impactColor,
        padding: spacing[4], marginBottom: spacing[3], overflow: 'hidden',
      }]}>
        <LinearGradient colors={[impactColor + '08', 'transparent']} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] }]}>
          <View style={{ flex: 1 }}>
            <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }]}>
              <Ionicons name={impactIcon as any} size={14} color={impactColor} />
              <Text style={[typography.label, { color: impactColor }]}>{pattern.type}</Text>
            </View>
            <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
              {pattern.description}
            </Text>
          </View>
          <View style={[{ backgroundColor: impactColor + '20', borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 4, marginLeft: spacing[3] }]}>
            <Text style={[typography.caption, { color: impactColor, fontWeight: '700' }]}>{pattern.frequency}x</Text>
          </View>
        </View>
        <View style={[{ backgroundColor: colors.surfaceElevated, borderRadius: radii.md, padding: spacing[3], marginTop: spacing[2] }]}>
          <View style={[{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }]}>
            <Ionicons name="bulb-outline" size={14} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={[typography.bodySm, { color: colors.textSecondary, flex: 1, lineHeight: 20 }]}>
              {pattern.suggestion}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const HistoryCard = ({ review }: { review: any }) => {
    const sc = getDisciplineScoreColor(review.metrics.disciplineScore, colors);
    return (
      <View style={[{
        backgroundColor: colors.surfaceElevated, borderRadius: radii.lg,
        padding: spacing[3], marginBottom: spacing[2],
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      }]}>
        <View>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{review.period.label}</Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 3 }]}>
            {review.metrics.tradeCount} trades · WR {formatPercent(review.metrics.winRate)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[typography.label, { color: review.metrics.netRR >= 0 ? colors.success : colors.error }]}>
            {review.metrics.netRR >= 0 ? '+' : ''}{review.metrics.netRR.toFixed(2)}R
          </Text>
          <Text style={[typography.caption, { color: sc }]}>
            {review.metrics.disciplineScore}/100
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(99,102,241,0.08)', 'transparent']}
        style={[styles.gradient]}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: spacing[5] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>AI Review</Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {openai_configured_label}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { paddingHorizontal: spacing[5], marginBottom: spacing[2] }]}>
        <View style={[{ flexDirection: 'row', backgroundColor: colors.surfaceElevated, borderRadius: radii.xl, padding: 4 }]}>
          {(['Weekly', 'Monthly', 'Patterns'] as ReviewTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[{
                flex: 1, paddingVertical: spacing[2.5], borderRadius: radii.lg,
                backgroundColor: activeTab === tab ? colors.primary : 'transparent',
                alignItems: 'center',
              }]}
            >
              <Text style={[typography.label, { color: activeTab === tab ? '#fff' : colors.textTertiary }]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 40 }]}
      >
        {/* ── PATTERNS TAB ── */}
        {activeTab === 'Patterns' && (
          <View style={{ paddingTop: spacing[2] }}>
            <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }]}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Detected Patterns</Text>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>Last 30 days</Text>
            </View>

            {patternsLoading ? (
              <>
                <Skeleton height={120} style={{ borderRadius: 14, marginBottom: spacing[3] }} />
                <Skeleton height={120} style={{ borderRadius: 14, marginBottom: spacing[3] }} />
                <Skeleton height={100} style={{ borderRadius: 14 }} />
              </>
            ) : !patterns || patterns.length === 0 ? (
              <Card>
                <View style={{ alignItems: 'center', padding: spacing[6] }}>
                  <Ionicons name="analytics-outline" size={48} color={colors.textTertiary} />
                  <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing[4], textAlign: 'center' }]}>
                    No patterns detected yet
                  </Text>
                  <Text style={[typography.body, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing[2], lineHeight: 22 }]}>
                    Log at least 3 trades with psychology data to detect behavioural patterns.
                  </Text>
                </View>
              </Card>
            ) : (
              <>
                {/* Pattern summary */}
                <View style={[{ flexDirection: 'row', gap: 8, marginBottom: spacing[4] }]}>
                  {[
                    { label: 'Positive', count: patterns.filter((p: any) => p.impact === 'positive').length, color: colors.success },
                    { label: 'Negative', count: patterns.filter((p: any) => p.impact === 'negative').length, color: colors.error },
                    { label: 'Neutral', count: patterns.filter((p: any) => p.impact === 'neutral').length, color: colors.warning },
                  ].map((s) => (
                    <View key={s.label} style={[{
                      flex: 1, backgroundColor: s.color + '15', borderRadius: radii.lg,
                      borderWidth: 1, borderColor: s.color + '30', padding: spacing[3],
                      alignItems: 'center',
                    }]}>
                      <Text style={[typography.numericSm, { color: s.color }]}>{s.count}</Text>
                      <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 3 }]}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Negative patterns first */}
                {patterns.filter((p: any) => p.impact === 'negative').map((p: any, i: number) => (
                  <PatternCard key={i} pattern={p} />
                ))}
                {patterns.filter((p: any) => p.impact === 'neutral').map((p: any, i: number) => (
                  <PatternCard key={i} pattern={p} />
                ))}
                {patterns.filter((p: any) => p.impact === 'positive').map((p: any, i: number) => (
                  <PatternCard key={i} pattern={p} />
                ))}
              </>
            )}
          </View>
        )}

        {/* ── WEEKLY / MONTHLY REVIEW TAB ── */}
        {activeTab !== 'Patterns' && (
          <View style={{ paddingTop: spacing[2] }}>
            {isLoading ? (
              <>
                <Skeleton height={200} style={{ borderRadius: 18, marginBottom: spacing[4] }} />
                <Skeleton height={180} style={{ borderRadius: 14, marginBottom: spacing[4] }} />
                <Skeleton height={160} style={{ borderRadius: 14 }} />
              </>
            ) : !latestReview ? (
              <Card>
                <View style={{ alignItems: 'center', padding: spacing[6] }}>
                  <LinearGradient
                    colors={[colors.primaryDark, colors.primary]}
                    style={[{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }]}
                  >
                    <Ionicons name="sparkles" size={36} color="#fff" />
                  </LinearGradient>
                  <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing[5], textAlign: 'center' }]}>
                    No {activeTab.toLowerCase()} review yet
                  </Text>
                  <Text style={[typography.body, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing[2], lineHeight: 22 }]}>
                    Generate an AI-powered analysis of your {activeTab.toLowerCase()} trading — psychology, performance, and actionable improvements.
                  </Text>
                  <View style={{ width: '100%', marginTop: spacing[5] }}>
                    <Button
                      label={`Generate ${activeTab} Review`}
                      onPress={handleGenerate}
                      loading={isGenerating}
                    />
                  </View>
                </View>
              </Card>
            ) : (
              <>
                {/* Hero metrics card */}
                <View style={[{
                  backgroundColor: colors.surface, borderRadius: radii['2xl'],
                  borderWidth: 1, borderColor: scoreColor + '30',
                  overflow: 'hidden', marginBottom: spacing[4],
                }]}>
                  <LinearGradient colors={[scoreColor + '14', 'transparent']} style={[{ padding: spacing[5] }]}>
                    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.caption, { color: colors.textTertiary }]}>
                          {latestReview.period.label}
                        </Text>
                        <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing[1] }]}>
                          {activeTab} Review
                        </Text>
                        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
                          Generated {dayjs(latestReview.generatedAt).format('DD MMM, HH:mm')}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[typography.displayMd, { color: scoreColor, fontSize: 48, lineHeight: 56 }]}>
                          {latestReview.metrics.disciplineScore}
                        </Text>
                        <Text style={[typography.label, { color: scoreColor }]}>
                          {getDisciplineScoreLabel(latestReview.metrics.disciplineScore)}
                        </Text>
                      </View>
                    </View>

                    {/* 4-metric row */}
                    <View style={[{
                      flexDirection: 'row', justifyContent: 'space-between',
                      marginTop: spacing[4], paddingTop: spacing[4],
                      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border + '80',
                    }]}>
                      {[
                        { label: 'Trades', value: latestReview.metrics.tradeCount.toString() },
                        { label: 'Win Rate', value: formatPercent(latestReview.metrics.winRate) },
                        { label: 'Net R', value: `${latestReview.metrics.netRR >= 0 ? '+' : ''}${latestReview.metrics.netRR.toFixed(2)}R` },
                        { label: 'Prof. Factor', value: formatProfitFactor(latestReview.metrics.profitFactor) },
                      ].map((m, i) => (
                        <View key={m.label} style={{ flex: 1, alignItems: 'center' }}>
                          <Text style={[typography.label, { color: colors.textPrimary }]}>{m.value}</Text>
                          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>{m.label}</Text>
                        </View>
                      ))}
                    </View>
                  </LinearGradient>
                </View>

                {/* Summary */}
                <Card style={{ marginBottom: spacing[4] }}>
                  <View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }]}>
                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                    <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: spacing[2] }]}>Summary</Text>
                  </View>
                  <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 24 }]}>
                    {latestReview.content.summary}
                  </Text>
                </Card>

                {/* Detailed sections */}
                <Card style={{ marginBottom: spacing[4] }}>
                  <BulletSection title="Biggest Mistakes" items={latestReview.content.biggestMistakes} icon="alert-circle" color={colors.error} />
                  <BulletSection title="Best Setups" items={latestReview.content.bestSetups} icon="checkmark-circle" color={colors.success} />
                  <BulletSection title="Weaknesses" items={latestReview.content.weaknesses} icon="trending-down" color={colors.warning} />
                  <BulletSection title="Action Items" items={latestReview.content.suggestions} icon="bulb" color={colors.primary} />
                  <BulletSection title="Improvement Focus" items={latestReview.content.improvementAreas} icon="fitness" color={colors.info} />
                  <BulletSection title="Strengths to Keep" items={latestReview.content.strengthsToKeep} icon="star" color={colors.success} />
                </Card>

                {/* Psychology insights */}
                {latestReview.content.psychologyInsights && (
                  <Card style={{ marginBottom: spacing[4] }}>
                    <View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }]}>
                      <Ionicons name="heart" size={18} color={colors.error} />
                      <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: spacing[2] }]}>Psychology</Text>
                    </View>
                    <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 24 }]}>
                      {latestReview.content.psychologyInsights}
                    </Text>
                  </Card>
                )}

                {/* Risk management */}
                {latestReview.content.riskManagementFeedback && (
                  <Card style={{ marginBottom: spacing[4] }}>
                    <View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }]}>
                      <Ionicons name="shield-checkmark" size={18} color={colors.warning} />
                      <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: spacing[2] }]}>Risk Management</Text>
                    </View>
                    <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 24 }]}>
                      {latestReview.content.riskManagementFeedback}
                    </Text>
                  </Card>
                )}

                {/* Regenerate button */}
                <Button
                  label={`Regenerate ${activeTab} Review`}
                  onPress={handleGenerate}
                  loading={isGenerating}
                  variant="secondary"
                  style={{ marginBottom: spacing[5] }}
                />

                {/* History */}
                {(allReviews ?? []).length > 1 && (
                  <View style={{ marginBottom: spacing[4] }}>
                    <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[3] }]}>
                      Review History
                    </Text>
                    {(allReviews ?? []).slice(1).map((r) => (
                      <HistoryCard key={r._id} review={r} />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const openai_configured_label = 'Powered by GPT-4o mini';

const styles = StyleSheet.create({
  root: { flex: 1 },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabBar: { paddingVertical: 8 },
});
