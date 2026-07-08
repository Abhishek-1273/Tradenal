import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}) => {
  const { colors, radii, typography } = useTheme();

  const isDisabled = disabled || loading;

  const sizeStyles: Record<Size, { paddingVertical: number; paddingHorizontal: number; fontSize: number; height: number }> = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13, height: 36 },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15, height: 48 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 16, height: 56 },
  };

  const sz = sizeStyles[size];

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'primary': return [colors.primaryDark, colors.primary];
      case 'danger':  return [colors.error, colors.errorLight];
      case 'success': return [colors.success, colors.successLight];
      default: return [colors.surface, colors.surfaceElevated];
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return '#ffffff';
      case 'secondary':
        return colors.textPrimary;
      case 'ghost':
        return colors.primary;
      default:
        return colors.textPrimary;
    }
  };

  const containerStyle: ViewStyle = {
    width: fullWidth ? '100%' : undefined,
    opacity: isDisabled ? 0.5 : 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...style,
  };

  const content = (
    <View
      style={[
        styles.inner,
        {
          height: sz.height,
          paddingHorizontal: sz.paddingHorizontal,
          backgroundColor:
            variant === 'secondary'
              ? colors.surfaceElevated
              : variant === 'ghost'
              ? 'transparent'
              : undefined,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: variant === 'secondary' ? colors.border : undefined,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            numberOfLines={1}
            ellipsizeMode="clip"
            style={[
              styles.label,
              { fontSize: sz.fontSize, color: getTextColor(), fontWeight: '600', flexShrink: 1 },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </>
      )}
    </View>
  );

  if (variant === 'primary' || variant === 'danger' || variant === 'success') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={containerStyle}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: radii.lg }}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[containerStyle, { borderRadius: radii.lg }]}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    letterSpacing: 0.2,
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
