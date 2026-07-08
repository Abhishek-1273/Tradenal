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
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  gradient = false,
  gradientColors,
  padding,
  noPadding = false,
}) => {
  const { colors, radii, shadows, spacing } = useTheme();

  const defaultPadding = noPadding ? 0 : padding ?? spacing[4];

  const cardStyle: ViewStyle = {
    borderRadius: radii.xl,
    overflow: 'hidden',
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
        activeOpacity={0.85}
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
