import React, { useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface FABProps {
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
  bottom?: number;
  right?: number;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  icon = 'add',
  style,
  bottom,
  right = 16,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const fabColor = isDark ? '#1E293B' : '#0F172A';

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          bottom: bottom ?? insets.bottom + 16,
          right,
          transform: [{ scale: scaleAnim }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          backgroundColor: fabColor,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.2)',
          borderWidth: 1,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        <Ionicons name={icon as any} size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
