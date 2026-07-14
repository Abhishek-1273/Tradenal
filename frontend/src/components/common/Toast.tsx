import React, { createContext, useContext, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors, typography, spacing, radii, shadows } = useTheme();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, toastType: ToastType = 'success') => {
    // Cancel any active timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setMessage(msg);
    setType(toastType);
    setVisible(true);

    // Animate In
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto Hide
    timerRef.current = setTimeout(() => {
      hideToast();
    }, 3000);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 15,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: colors.success + '15',
          border: colors.success + '40',
          text: colors.textPrimary,
          icon: 'checkmark-circle',
          iconColor: colors.success,
        };
      case 'error':
        return {
          bg: colors.error + '15',
          border: colors.error + '40',
          text: colors.textPrimary,
          icon: 'alert-circle',
          iconColor: colors.error,
        };
      case 'info':
      default:
        return {
          bg: colors.info ? (colors.info + '15') : (colors.primary + '15'),
          border: colors.info ? (colors.info + '40') : (colors.primary + '40'),
          text: colors.textPrimary,
          icon: 'information-circle',
          iconColor: colors.info || colors.primary,
        };
    }
  };

  const currentStyle = getToastStyle();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor: colors.surface,
              borderColor: currentStyle.border,
              borderRadius: radii.full,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              ...shadows.md,
            },
          ]}
        >
          {/* Subtle overlay background for distinct coloring */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: currentStyle.bg, borderRadius: radii.full }]} />
          
          <View style={styles.toastContent}>
            <Ionicons name={currentStyle.icon as any} size={20} color={currentStyle.iconColor} style={{ marginRight: spacing[2.5] }} />
            <Text style={[typography.bodySm, { color: currentStyle.text, fontWeight: '600', flexShrink: 1 }]}>
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    maxWidth: Dimensions.get('window').width * 0.85,
    borderWidth: 1.5,
    overflow: 'hidden',
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
