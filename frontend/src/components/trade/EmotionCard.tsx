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
  const lower = label.toLowerCase();
  
  if (lower.includes('calm') || lower.includes('confident') || lower.includes('disciplined')) {
    return {
      bg: colors.success + '18',
      border: colors.success,
    };
  }
  if (lower.includes('neutral') || lower.includes('relieved') || lower.includes('bored') || lower.includes('hesitant') || lower.includes('doubtful')) {
    return {
      bg: colors.warning + '18',
      border: colors.warning,
    };
  }
  return {
    bg: colors.error + '18',
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
            borderRadius: radii.md,
            paddingVertical: spacing[2],
            paddingHorizontal: 2,
            minHeight: 62,
            justifyContent: 'center',
          },
        ]}
      >
        <Ionicons name={icon} size={19} color={activeColor} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.78}
          style={[
            typography.labelSm,
            {
              color: activeTextColor,
              marginTop: 4,
              fontSize: 10,
              lineHeight: 14,
              textAlign: 'center',
              width: '100%',
            },
          ]}
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
