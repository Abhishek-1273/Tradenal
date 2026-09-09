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
          backgroundColor: selected ? colors.surfaceHighlight : colors.surfaceElevated,
          borderColor: selected ? colors.textSecondary : colors.border,
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
          size={12}
          color={selected ? colors.textPrimary : colors.textTertiary}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.78}
        style={[
          typography.caption,
          {
            color: selected ? colors.textPrimary : colors.textSecondary,
            fontSize: 11,
            fontWeight: selected ? '700' : '500',
            flexShrink: 1,
            textAlign: 'center',
          },
        ]}
      >
        {label}
      </Text>
      {selected && (
        <Ionicons name="checkmark" size={12} color={colors.textPrimary} style={{ marginLeft: 3 }} />
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
