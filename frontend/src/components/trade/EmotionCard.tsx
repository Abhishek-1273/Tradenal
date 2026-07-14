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

const getEmotionColors = (label: string, colors: any) => {
  const successLabels = ['Calm', 'Confident', 'Confident & Held', 'Satisfied', 'Proud', 'Happy'];
  const warningLabels = ['Excited', 'Doubtful', 'Tempted Add', 'Impatient', 'Neutral', 'Relieved', 'Greedy'];
  
  const cleanLabel = label.trim();
  if (successLabels.includes(cleanLabel)) {
    return {
      bg: colors.success + '15',
      border: colors.success,
    };
  }
  if (warningLabels.includes(cleanLabel)) {
    return {
      bg: colors.warning + '15',
      border: colors.warning,
    };
  }
  return {
    bg: colors.error + '15',
    border: colors.error,
  };
};

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

  const emotionColors = getEmotionColors(label, colors);
  const activeBg = selected ? emotionColors.bg : colors.surfaceElevated;
  const activeBorder = selected ? emotionColors.border : colors.border;
  const activeColor = selected ? emotionColors.border : colors.textTertiary;
  const activeTextColor = selected ? emotionColors.border : colors.textSecondary;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={style}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale }],
            backgroundColor: activeBg,
            borderColor: activeBorder,
            borderWidth: selected ? 1.5 : 1,
            borderRadius: radii.lg,
            paddingVertical: spacing[3],
          },
        ]}
      >
        <Ionicons name={icon} size={21} color={activeColor} />
        <Text
          numberOfLines={1}
          style={[typography.labelSm, { color: activeTextColor, marginTop: 6 }]}
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
