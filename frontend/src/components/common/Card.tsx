import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  gradient?: boolean;
  gradientColors?: string[];
  padding?: number;
  noPadding?: boolean;
  glow?: 'primary' | 'success' | 'danger' | 'warning' | 'none';
  borderHighlight?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  gradient = true,
  gradientColors,
  padding,
  noPadding = false,
  glow = 'none',
  borderHighlight = false,
}) => {
  const { colors, radii, shadows, spacing } = useTheme();

  const defaultPadding = noPadding ? 0 : padding ?? spacing[4];

  const getGlowBorder = () => {
    switch (glow) {
      case 'primary': return colors.primaryGlow;
      case 'success': return colors.successGlow;
      case 'danger':  return colors.errorGlow;
      case 'warning': return colors.warningGlow;
      default: return borderHighlight ? colors.primarySubtle : colors.border;
    }
  };

  const cardStyle: ViewStyle = {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: getGlowBorder(),
    backgroundColor: colors.surface,
    ...shadows.md,
    ...style,
  };

  const innerStyle: ViewStyle = {
    padding: defaultPadding,
  };

  const background = gradient ? (
    <LinearGradient
      colors={(gradientColors ?? colors.gradientCard) as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, { borderRadius: radii.xl }]}
    />
  ) : (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: colors.surface, borderRadius: radii.xl },
      ]}
    />
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.82}
        style={cardStyle}
      >
        {background}
        <View style={innerStyle}>{children}</View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {background}
      <View style={innerStyle}>{children}</View>
    </View>
  );
};

