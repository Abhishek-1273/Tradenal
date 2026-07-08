import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface DisciplineRowProps {
  label: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: boolean;
  onChange: (v: boolean) => void;
  warnWhenOn?: boolean;
}

export const DisciplineRow: React.FC<DisciplineRowProps> = ({
  label,
  subtitle,
  icon,
  value,
  onChange,
  warnWhenOn,
}) => {
  const { colors, typography, radii, spacing } = useTheme();
  const activeColor = warnWhenOn ? colors.warning : colors.success;

  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      activeOpacity={0.8}
      style={[
        styles.row,
        {
          backgroundColor: value ? activeColor + '12' : colors.surfaceElevated,
          borderColor: value ? activeColor + '60' : colors.border,
          borderRadius: radii.md,
          paddingVertical: spacing[2.5],
          paddingHorizontal: spacing[3],
          marginBottom: spacing[2],
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: value ? activeColor + '20' : colors.surfaceHighlight, marginRight: spacing[3] },
        ]}
      >
        <Ionicons name={icon} size={16} color={value ? activeColor : colors.textTertiary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[typography.labelSm, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle && (
          <Text numberOfLines={1} style={[typography.caption, { color: colors.textTertiary, marginTop: 1 }]}>
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
          },
        ]}
      >
        {value && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
