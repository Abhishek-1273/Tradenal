import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface StepNavigationBarProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  backLabel?: string;
  loading?: boolean;
  /** 'arrow' for step navigation, 'check' for the final save action */
  nextIcon?: 'arrow' | 'check';
}

export const StepNavigationBar: React.FC<StepNavigationBarProps> = ({
  onBack,
  onNext,
  nextLabel,
  backLabel = 'Back',
  loading = false,
  nextIcon = 'arrow',
}) => {
  const { colors, typography, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingHorizontal: spacing[5],
          paddingTop: spacing[3],
          paddingBottom: (insets.bottom > 0 ? insets.bottom : spacing[3]) + spacing[1],
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
      ]}
    >
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.75}
          style={[
            styles.backBtn,
            {
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceElevated,
              paddingHorizontal: spacing[4],
            },
          ]}
        >
          <Ionicons name="chevron-back" size={17} color={colors.textSecondary} />
          <Text numberOfLines={1} style={[typography.label, { color: colors.textSecondary, marginLeft: 3 }]}>
            {backLabel}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: spacing[1] }} />
      )}

      <TouchableOpacity
        onPress={onNext}
        disabled={loading}
        activeOpacity={0.85}
        style={[
          styles.nextBtn,
          {
            borderRadius: radii.lg,
            backgroundColor: colors.primary,
            marginLeft: spacing[3],
            paddingHorizontal: spacing[4],
            opacity: loading ? 0.7 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text
              numberOfLines={1}
              ellipsizeMode="clip"
              style={[typography.label, { color: '#fff', fontWeight: '700', flexShrink: 1 }]}
            >
              {nextLabel}
            </Text>
            <Ionicons
              name={nextIcon === 'check' ? 'checkmark' : 'chevron-forward'}
              size={17}
              color="#fff"
              style={{ marginLeft: 6 }}
            />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    flexShrink: 0,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
});
