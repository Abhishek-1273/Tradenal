import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { calculateExecutionGrade } from '../../utils/executionGrade';

export interface ExecutionGradeCardProps {
  checklist?: string[];
  mistakes?: string[];
  onNavigateToTab?: (tab?: any) => void;
  style?: StyleProp<ViewStyle>;
}

export const ExecutionGradeCard: React.FC<ExecutionGradeCardProps> = ({
  checklist,
  mistakes,
  onNavigateToTab,
  style,
}) => {
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const gradeResult = calculateExecutionGrade(checklist, mistakes, isDark);

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: gradeResult.bgColor,
          borderColor: gradeResult.borderColor,
          borderRadius: radii.lg,
          padding: spacing[3.5],
        },
        style,
      ]}
    >
      {/* Header Row: Locked Badge + Status Indicator */}
      <View style={styles.headerRow}>
        <View style={styles.badgeLeft}>
          <View
            style={[
              styles.lockIconBadge,
              {
                backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                borderColor: gradeResult.color + '40',
              },
            ]}
          >
            <Ionicons name="lock-closed" size={13} color={gradeResult.color} />
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
            style={[
              typography.label,
              {
                color: gradeResult.color,
                fontWeight: '800',
                fontSize: 12.5,
                letterSpacing: 0.1,
                flexShrink: 1,
              },
            ]}
          >
            {gradeResult.badgeText}
          </Text>
        </View>

        <View
          style={[
            styles.autoTag,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
            },
          ]}
        >
          <Text style={[styles.autoTagText, { color: colors.textTertiary }]}>
            AUTO-LOCKED
          </Text>
        </View>
      </View>

      {/* Diagnostic Breakdown: Rules Violated & Mistakes Tagged */}
      <View style={{ marginTop: spacing[2], marginBottom: onNavigateToTab ? spacing[2.5] : 0, gap: 4 }}>
        {gradeResult.violatedRules.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" style={{ marginTop: 1 }} />
            <Text
              style={[
                typography.caption,
                {
                  color: isDark ? '#FCA5A5' : '#B91C1C',
                  fontSize: 11.5,
                  lineHeight: 16,
                  flex: 1,
                },
              ]}
            >
              <Text style={{ fontWeight: '700' }}>Rules Violated: </Text>
              {gradeResult.violatedRules.join(', ')}
            </Text>
          </View>
        )}

        {gradeResult.mistakes.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <Ionicons name="close-circle" size={14} color="#F59E0B" style={{ marginTop: 1 }} />
            <Text
              style={[
                typography.caption,
                {
                  color: isDark ? '#FDE68A' : '#B45309',
                  fontSize: 11.5,
                  lineHeight: 16,
                  flex: 1,
                },
              ]}
            >
              <Text style={{ fontWeight: '700' }}>Mistakes Tagged: </Text>
              {gradeResult.mistakes.join(', ')}
            </Text>
          </View>
        )}

        {gradeResult.violatedRules.length === 0 && gradeResult.mistakes.length === 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text
              style={[
                typography.caption,
                {
                  color: isDark ? '#6EE7B7' : '#047857',
                  fontWeight: '600',
                  fontSize: 11.5,
                },
              ]}
            >
              Clean Execution • 0 Rules Violated • 0 Mistakes Tagged
            </Text>
          </View>
        )}
      </View>

      {/* Accountability Link: Review Rules in Tab 3 */}
      {onNavigateToTab && (
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={() => onNavigateToTab('Psychology')}
            activeOpacity={0.7}
            style={[
              styles.reviewLinkBtn,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
              },
            ]}
          >
            <Ionicons name="arrow-back-circle-outline" size={13.5} color={colors.primary} />
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', fontSize: 11 }]}>
              Review Rules in Tab 3 (Psychology)
            </Text>
            <Ionicons name="chevron-forward" size={11} color={colors.primary} style={{ opacity: 0.7 }} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 6,
  },
  lockIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    marginTop: -3,
    alignSelf: 'flex-start',
  },
  autoTagText: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 8,
    marginTop: 4,
  },
  reviewLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 6,
    borderWidth: 1,
  },
});
