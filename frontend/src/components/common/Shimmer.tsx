import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surfaceHighlight,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            colors.surfaceElevated + 'CC',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

// Preset shimmer layouts for common screen patterns
export const TradeCardShimmer: React.FC = () => {
  const { colors, spacing, radii } = useTheme();
  return (
    <View
      style={[
        styles.cardShimmer,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          borderColor: colors.border,
          borderWidth: 1,
          padding: spacing[4],
          marginBottom: spacing[3],
        },
      ]}
    >
      <View style={[styles.row, { marginBottom: spacing[3] }]}>
        <View style={{ flex: 1 }}>
          <Shimmer width={80} height={20} borderRadius={6} style={{ marginBottom: 8 }} />
          <Shimmer width={120} height={14} borderRadius={6} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Shimmer width={60} height={24} borderRadius={6} style={{ marginBottom: 8 }} />
          <Shimmer width={50} height={18} borderRadius={12} />
        </View>
      </View>
      <View style={[styles.row, { gap: spacing[4] }]}>
        <Shimmer width={50} height={14} borderRadius={6} />
        <Shimmer width={50} height={14} borderRadius={6} />
        <Shimmer width={60} height={14} borderRadius={6} />
        <Shimmer width={50} height={14} borderRadius={6} />
      </View>
    </View>
  );
};

export const DashboardShimmer: React.FC = () => {
  const { spacing } = useTheme();
  return (
    <View>
      <View style={[styles.row, { gap: spacing[3], marginBottom: spacing[3] }]}>
        <Shimmer height={90} style={{ flex: 1, borderRadius: 14 }} />
        <Shimmer height={90} style={{ flex: 1, borderRadius: 14 }} />
      </View>
      <View style={[styles.row, { gap: spacing[3], marginBottom: spacing[4] }]}>
        <Shimmer height={72} style={{ flex: 1, borderRadius: 14 }} />
        <Shimmer height={72} style={{ flex: 1, borderRadius: 14 }} />
        <Shimmer height={72} style={{ flex: 1, borderRadius: 14 }} />
      </View>
      <Shimmer height={220} style={{ borderRadius: 14, marginBottom: spacing[4] }} />
      <Shimmer height={180} style={{ borderRadius: 14, marginBottom: spacing[4] }} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardShimmer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row' },
});
