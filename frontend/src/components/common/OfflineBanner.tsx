import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '../../store/ui.store';
import { useTheme } from '../../theme';

export const OfflineBanner: React.FC = () => {
  const { isOffline } = useUIStore();
  const { colors, typography, spacing } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline ? 0 : -100,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [isOffline]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: colors.warning,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#000" />
      <Text style={[typography.label, { color: '#000', marginLeft: spacing[2] }]}>
        You're offline — trades will sync when reconnected
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});
