import React from 'react';
import { View, Text, TextInput, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export interface GuidedTradeNotesProps {
  keyTakeaway: string;
  whatWentWell: string;
  whatToImprove: string;
  onKeyTakeawayChange: (val: string) => void;
  onWhatWentWellChange: (val: string) => void;
  onWhatToImproveChange: (val: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const GuidedTradeNotes: React.FC<GuidedTradeNotesProps> = ({
  keyTakeaway,
  whatWentWell,
  whatToImprove,
  onKeyTakeawayChange,
  onWhatWentWellChange,
  onWhatToImproveChange,
  style,
}) => {
  const { colors, typography, spacing, radii, isDark } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Section Header */}
      <View style={{ marginBottom: spacing[3] }}>
        <View style={styles.headerRow}>
          <Ionicons name="journal-outline" size={17} color={colors.primary} />
          <Text style={[typography.h3, { color: colors.textPrimary, fontSize: 16 }]}>
            Guided Post-Mortem & Reflection
          </Text>
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          Structured lessons to turn this trade into repeatable institutional edge.
        </Text>
      </View>

      {/* 1. Key Market Takeaway */}
      <View
        style={[
          styles.fieldCard,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            borderRadius: radii.lg,
            padding: spacing[3.5],
            marginBottom: spacing[3],
          },
        ]}
      >
        <View style={styles.promptHeader}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
            <Ionicons name="bulb-outline" size={14} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.labelSm, { color: colors.textPrimary, fontWeight: '700' }]}>
              Key Market Takeaway
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10.5 }]}>
              Macro structural behavior, liquidity sweeps, or order flow lesson.
            </Text>
          </View>
        </View>
        <TextInput
          style={[
            typography.body,
            styles.textArea,
            {
              color: colors.textPrimary,
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
              borderColor: colors.border,
              borderRadius: radii.md,
              padding: spacing[2.5],
            },
          ]}
          placeholder="e.g., London liquidity sweep cleanly led to New York expansion; respected 1H order block."
          placeholderTextColor={colors.textDisabled}
          multiline
          numberOfLines={3}
          value={keyTakeaway}
          onChangeText={onKeyTakeawayChange}
          maxLength={1500}
        />
        <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'right', marginTop: 4, fontSize: 10 }]}>
          {(keyTakeaway || '').length}/1500
        </Text>
      </View>

      {/* 2. What Went Well (Execution & Discipline) */}
      <View
        style={[
          styles.fieldCard,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            borderRadius: radii.lg,
            padding: spacing[3.5],
            marginBottom: spacing[3],
          },
        ]}
      >
        <View style={styles.promptHeader}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#F0FDF4' }]}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.labelSm, { color: colors.textPrimary, fontWeight: '700' }]}>
              What Went Well (Execution / Mindset)
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10.5 }]}>
              Rules respected, emotional detachment, and disciplined patience.
            </Text>
          </View>
        </View>
        <TextInput
          style={[
            typography.body,
            styles.textArea,
            {
              color: colors.textPrimary,
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
              borderColor: colors.border,
              borderRadius: radii.md,
              padding: spacing[2.5],
            },
          ]}
          placeholder="e.g., Waited patiently for 15M candle close; didn't panic or stare at tick-by-tick PnL."
          placeholderTextColor={colors.textDisabled}
          multiline
          numberOfLines={3}
          value={whatWentWell}
          onChangeText={onWhatWentWellChange}
          maxLength={1500}
        />
        <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'right', marginTop: 4, fontSize: 10 }]}>
          {(whatWentWell || '').length}/1500
        </Text>
      </View>

      {/* 3. What to Improve (Adjustment for Next Time) */}
      <View
        style={[
          styles.fieldCard,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            borderRadius: radii.lg,
            padding: spacing[3.5],
            marginBottom: spacing[2],
          },
        ]}
      >
        <View style={styles.promptHeader}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB' }]}>
            <Ionicons name="sparkles-outline" size={14} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.labelSm, { color: colors.textPrimary, fontWeight: '700' }]}>
              What to Improve (Adjustment)
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10.5 }]}>
              Friction points, entry timing tweaks, or trade management corrections.
            </Text>
          </View>
        </View>
        <TextInput
          style={[
            typography.body,
            styles.textArea,
            {
              color: colors.textPrimary,
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
              borderColor: colors.border,
              borderRadius: radii.md,
              padding: spacing[2.5],
            },
          ]}
          placeholder="e.g., Don't trail SL to breakeven before 1:1.5 RR is cleared; give the trade breathing room."
          placeholderTextColor={colors.textDisabled}
          multiline
          numberOfLines={3}
          value={whatToImprove}
          onChangeText={onWhatToImproveChange}
          maxLength={1500}
        />
        <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'right', marginTop: 4, fontSize: 10 }]}>
          {(whatToImprove || '').length}/1500
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  fieldCard: {
    borderWidth: 1,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    minHeight: 68,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
});
