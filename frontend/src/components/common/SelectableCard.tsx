import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface SelectableCardProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
  color?: string;
  subtitle?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const SelectableCard: React.FC<SelectableCardProps> = ({
  label,
  icon,
  selected,
  onPress,
  color,
  subtitle,
  size = 'md',
  style,
}) => {
  const { colors, typography, radii, spacing } = useTheme();
  const accent = color ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: selected ? accent + '14' : colors.surfaceElevated,
          borderColor: selected ? accent : colors.border,
          borderWidth: selected ? 1.5 : 1,
          borderRadius: radii.lg,
          paddingVertical: size === 'sm' ? spacing[2.5] : spacing[3],
          paddingHorizontal: spacing[2],
        },
        style,
      ]}
    >
      {selected && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark-circle" size={14} color={accent} />
        </View>
      )}
      <Ionicons
        name={icon}
        size={size === 'sm' ? 17 : 21}
        color={selected ? accent : colors.textTertiary}
      />
      <Text
        numberOfLines={2}
        style={[
          typography.labelSm,
          {
            color: selected ? accent : colors.textSecondary,
            marginTop: 5,
            textAlign: 'center',
          },
        ]}
      >
        {label}
      </Text>
      {subtitle && (
        <Text
          numberOfLines={1}
          style={[typography.caption, { color: colors.textTertiary, marginTop: 1, textAlign: 'center' }]}
        >
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
});
