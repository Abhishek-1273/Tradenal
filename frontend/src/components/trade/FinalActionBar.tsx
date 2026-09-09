import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export interface FinalActionBarProps {
  onBack: () => void;
  onSubmit: () => void;
  isPending?: boolean;
  submitLabel?: string;
  backLabel?: string;
  gradeBadge?: string;
  gradeColor?: string;
  isRiskBreached?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const FinalActionBar: React.FC<FinalActionBarProps> = ({
  onBack,
  onSubmit,
  isPending = false,
  submitLabel = 'Log Trade',
  backLabel = 'Back to Psychology',
  gradeBadge,
  gradeColor = '#10B981',
  isRiskBreached = false,
  style,
}) => {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderTopWidth: 1,
          paddingVertical: spacing[3.5],
          paddingHorizontal: spacing[5],
        },
        style,
      ]}
    >
      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        {/* Secondary: Back button */}
        <TouchableOpacity
          onPress={onBack}
          disabled={isPending}
          activeOpacity={0.7}
          style={[
            styles.backBtn,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              borderRadius: radii.md,
              paddingVertical: spacing[3],
              paddingHorizontal: spacing[4],
            },
          ]}
        >
          <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
          <Text style={[typography.labelSm, { color: colors.textSecondary, fontWeight: '600' }]}>
            {backLabel}
          </Text>
        </TouchableOpacity>

        {/* Primary: Save / Log Trade button */}
        <TouchableOpacity
          onPress={onSubmit}
          disabled={isPending}
          activeOpacity={0.85}
          style={[
            styles.submitBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.md,
              paddingVertical: spacing[3],
              paddingHorizontal: spacing[5],
            },
          ]}
        >
          {isPending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[typography.label, { color: '#FFFFFF', fontWeight: '700', marginLeft: 8 }]}>
                Saving...
              </Text>
            </View>
          ) : (
            <View style={styles.btnContent}>
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
              <Text style={[typography.label, { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.3 }]}>
                {submitLabel}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  submitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
