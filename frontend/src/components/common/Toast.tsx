import React, { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
});

export const useToast = () => useContext(ToastContext);

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const { colors, typography, radii, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const getColors = () => {
    switch (toast.type) {
      case 'success': return { bg: colors.successSubtle, border: colors.success, icon: 'checkmark-circle', iconColor: colors.success };
      case 'error':   return { bg: colors.errorSubtle, border: colors.error, icon: 'alert-circle', iconColor: colors.error };
      case 'warning': return { bg: colors.warningSubtle, border: colors.warning, icon: 'warning', iconColor: colors.warning };
      default:        return { bg: colors.infoSubtle, border: colors.info, icon: 'information-circle', iconColor: colors.info };
    }
  };

  const { bg, border, icon, iconColor } = getColors();

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, speed: 20, bounciness: 6, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, toast.duration ?? 3000);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -80, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(toast.id));
  };

  return (
    <Animated.View
      style={[
        styles.toastItem,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: radii.lg,
          marginBottom: spacing[2],
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Ionicons name={icon as any} size={18} color={iconColor} />
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, flex: 1, marginHorizontal: spacing[3] },
        ]}
        numberOfLines={2}
      >
        {toast.message}
      </Text>
      <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev.slice(-2), { id, message, type, duration }]); // max 3 at once
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError   = useCallback((message: string) => showToast(message, 'error', 4000), [showToast]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError }}>
      {children}
      <View
        style={[
          styles.container,
          { top: insets.top + 60, paddingHorizontal: 16 },
        ]}
        pointerEvents="box-none"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
