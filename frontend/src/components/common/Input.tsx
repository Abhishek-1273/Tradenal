import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      isPassword = false,
      containerStyle,
      required,
      style,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const { colors, radii, typography, spacing } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const borderColor = error
      ? colors.error
      : isFocused
      ? colors.primary
      : colors.border;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <View style={styles.labelRow}>
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              {label}
              {required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.inputWrapper,
            {
              borderColor,
              borderRadius: radii.md,
              backgroundColor: colors.surfaceElevated,
              borderWidth: isFocused ? 1.5 : 1,
            },
          ]}
        >
          {leftIcon && <View style={[styles.iconLeft, { paddingLeft: spacing[3] }]}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              typography.body,
              {
                color: colors.textPrimary,
                paddingLeft: leftIcon ? spacing[2] : spacing[4],
                paddingRight: (rightIcon || isPassword) ? spacing[2] : spacing[4],
                flex: 1,
                height: 48,
              },
              style,
            ]}
            placeholderTextColor={colors.textDisabled}
            secureTextEntry={isPassword && !showPassword}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            selectionColor={colors.primary}
            {...rest}
          />

          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={[styles.iconRight, { paddingRight: spacing[3] }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}

          {rightIcon && !isPassword && (
            <View style={[styles.iconRight, { paddingRight: spacing[3] }]}>{rightIcon}</View>
          )}
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={13} color={colors.error} />
            <Text style={[typography.caption, { color: colors.error, marginLeft: 4 }]}>
              {error}
            </Text>
          </View>
        ) : hint ? (
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4, marginLeft: 2 }]}>
            {hint}
          </Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    paddingVertical: 0,
  },
  iconLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 2,
  },
});
