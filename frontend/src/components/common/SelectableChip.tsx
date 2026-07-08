import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface SelectableChipProps {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const SelectableChip: React.FC<SelectableChipProps> = ({ label, icon, selected, onPress, style }) => {
  const { colors, typography, radii, spacing } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primarySubtle : colors.surfaceElevated,
          borderColor: selected ? colors.primary : colors.border,
          borderRadius: radii.full,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
        },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={13}
          color={selected ? colors.primary : colors.textTertiary}
          style={{ marginRight: 5 }}
        />
      )}
      <Text numberOfLines={1} style={[typography.labelSm, { color: selected ? colors.primary : colors.textSecondary }]}>
        {label}
      </Text>
      {selected && (
        <Ionicons name="checkmark" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
