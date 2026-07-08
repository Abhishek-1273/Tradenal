import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../../theme';

interface LoadingOverlayProps {
  visible?: boolean;
  message?: string;
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible = true,
  message,
  fullScreen = false,
}) => {
  const { colors, typography, radii } = useTheme();

  if (!visible) return null;

  const content = (
    <View
      style={[
        styles.box,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
        },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text
          style={[
            typography.bodySm,
            { color: colors.textSecondary, marginTop: 12, textAlign: 'center' },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal transparent animationType="fade" visible={visible}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          {content}
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 8 }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

// Skeleton placeholder
export const Skeleton: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}> = ({ width = '100%', height = 16, borderRadius = 8, style }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surfaceHighlight,
          opacity: 0.7,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    padding: 28,
    alignItems: 'center',
    minWidth: 120,
  },
  inline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});
