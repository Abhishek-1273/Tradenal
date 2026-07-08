import React, { useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface EmotionCardProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const EmotionCard: React.FC<EmotionCardProps> = ({ label, icon, selected, onPress, style }) => {
  const { colors, typography, radii, spacing } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={style}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale }],
            backgroundColor: selected ? colors.primarySubtle : colors.surfaceElevated,
            borderColor: selected ? colors.primary : colors.border,
            borderWidth: selected ? 1.5 : 1,
            borderRadius: radii.lg,
            paddingVertical: spacing[3],
          },
        ]}
      >
        <Ionicons name={icon} size={21} color={selected ? colors.primary : colors.textTertiary} />
        <Text
          numberOfLines={1}
          style={[typography.labelSm, { color: selected ? colors.primary : colors.textSecondary, marginTop: 6 }]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
