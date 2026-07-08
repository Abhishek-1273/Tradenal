import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

interface AnimatedStatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: string;
  iconColor?: string;
  highlight?: boolean;
  highlightColor?: string;
  style?: ViewStyle;
  compact?: boolean;
  animateIn?: boolean;
  delay?: number;
}

export const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  iconColor,
  highlight = false,
  highlightColor,
  style,
  compact = false,
  animateIn = true,
  delay = 0,
}) => {
  const { colors, typography, radii, spacing } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const accentColor = highlightColor ?? colors.primary;

  useEffect(() => {
    if (!animateIn) {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      scaleAnim.setValue(1);
      return;
    }

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          speed: 20,
          bounciness: 4,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 20,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: highlight ? accentColor + '40' : colors.border,
          padding: compact ? spacing[3] : spacing[4],
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
        style,
      ]}
    >
      {highlight && (
        <LinearGradient
          colors={[accentColor + '18', 'transparent']}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.xl }]}
          pointerEvents="none"
        />
      )}

      <View style={styles.header}>
        <Text
          style={[typography.labelSm, { color: colors.textTertiary, flex: 1 }]}
          numberOfLines={1}
        >
          {label.toUpperCase()}
        </Text>
        {icon && (
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: (iconColor ?? colors.primary) + '20' },
            ]}
          >
            <Ionicons
              name={icon as any}
              size={14}
              color={iconColor ?? colors.primary}
            />
          </View>
        )}
      </View>

      <Text
        style={[
          compact ? typography.numericSm : typography.numeric,
          {
            color: highlight ? accentColor : colors.textPrimary,
            marginTop: spacing[1.5],
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      {subValue && (
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginTop: spacing[1] },
          ]}
        >
          {subValue}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
