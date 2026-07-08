import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

interface Option {
  value: string;
  label: string;
  emoji?: string;
  color?: string;
}

interface SelectPillsProps {
  options: readonly Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  multiSelect?: boolean;
  selectedValues?: string[];
  onMultiChange?: (values: string[]) => void;
  columns?: 2 | 3 | 4;
  style?: ViewStyle;
}

export const SelectPills: React.FC<SelectPillsProps> = ({
  options, value, onChange, label, required,
  multiSelect, selectedValues, onMultiChange,
  columns = 3, style,
}) => {
  const { colors, typography, radii, spacing } = useTheme();

  const isSelected = (opt: string) =>
    multiSelect ? (selectedValues ?? []).includes(opt) : value === opt;

  const handlePress = (opt: string) => {
    if (multiSelect && onMultiChange) {
      const current = selectedValues ?? [];
      onMultiChange(
        current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt]
      );
    } else {
      onChange(opt);
    }
  };

  const colWidth = `${Math.floor(100 / columns) - 1}%` as any;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      <View style={styles.grid}>
        {options.map((opt) => {
          const selected = isSelected(opt.value);
          const accent = opt.color ?? colors.primary;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handlePress(opt.value)}
              activeOpacity={0.75}
              style={[
                styles.pill,
                {
                  width: colWidth,
                  backgroundColor: selected ? accent + '22' : colors.surfaceElevated,
                  borderColor: selected ? accent : colors.border,
                  borderWidth: selected ? 1.5 : 1,
                  borderRadius: radii.md,
                  padding: spacing[2.5],
                  marginBottom: spacing[2],
                },
              ]}
            >
              {opt.emoji && (
                <Text style={styles.emoji}>{opt.emoji}</Text>
              )}
              <Text
                style={[
                  typography.labelSm,
                  {
                    color: selected ? accent : colors.textSecondary,
                    textAlign: 'center',
                    marginTop: opt.emoji ? 3 : 0,
                  },
                ]}
                numberOfLines={2}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Simple toggle checkbox row
interface CheckRowProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  subtitle?: string;
  warnWhenOn?: boolean;
}

export const CheckRow: React.FC<CheckRowProps> = ({
  label, value, onChange, subtitle, warnWhenOn,
}) => {
  const { colors, typography, radii, spacing } = useTheme();
  const activeColor = warnWhenOn && value ? colors.warning : colors.primary;

  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      activeOpacity={0.8}
      style={[
        styles.checkRow,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: value ? activeColor + '60' : colors.border,
          padding: spacing[3],
          marginBottom: spacing[2],
        },
      ]}
    >
      <View style={styles.checkLeft}>
        <Text style={[typography.body, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle && (
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: value ? activeColor : 'transparent',
            borderColor: value ? activeColor : colors.border,
            borderRadius: radii.sm,
          },
        ]}
      >
        {value && (
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkLeft: { flex: 1, marginRight: 12 },
  checkbox: {
    width: 24, height: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
