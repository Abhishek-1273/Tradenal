import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { useResetPassword } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export const ResetPasswordScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const token = route.params?.token;

  const { mutateAsync: resetPassword, isPending } = useResetPassword();
  const insets = useSafeAreaInsets();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    setError('');
    try {
      await resetPassword({ token, password: data.password });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to reset password. The link may have expired.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(99,102,241,0.12)', 'transparent']}
        style={styles.gradientAccent}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.surfaceElevated }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii['2xl'], borderColor: colors.border, borderWidth: 1, marginTop: spacing[8], padding: spacing[6] }]}>
            {success ? (
              <View style={styles.successContainer}>
                <LinearGradient
                  colors={colors.gradientSuccess as [string, string]}
                  style={[styles.successIcon, { borderRadius: radii.full }]}
                >
                  <Ionicons name="checkmark" size={36} color="#fff" />
                </LinearGradient>
                <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing[4], textAlign: 'center' }]}>
                  Password Reset!
                </Text>
                <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing[2], textAlign: 'center', lineHeight: 22 }]}>
                  Your password has been successfully updated. You can now log in with your new credentials.
                </Text>
                <Button label="Back to Login" onPress={() => navigation.navigate('Login' as any)} style={{ marginTop: spacing[6] }} />
              </View>
            ) : (
              <>
                <View style={[styles.iconWrap, { backgroundColor: colors.primarySubtle, borderRadius: radii.full }]}>
                  <Ionicons name="lock-open-outline" size={28} color={colors.primary} />
                </View>
                <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing[4] }]}>
                  Reset Password
                </Text>
                <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing[2], marginBottom: spacing[5] }]}>
                  Please choose a secure new password for your account.
                </Text>

                {!token && (
                  <View style={[styles.errorBanner, { backgroundColor: colors.errorSubtle, borderRadius: radii.md, marginBottom: spacing[4] }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                    <Text style={[typography.bodySm, { color: colors.error, marginLeft: 8, flex: 1 }]}>
                      Missing or invalid reset token. Please request a new password reset link.
                    </Text>
                  </View>
                )}

                {error ? (
                  <View style={[styles.errorBanner, { backgroundColor: colors.errorSubtle, borderRadius: radii.md, marginBottom: spacing[4] }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                    <Text style={[typography.bodySm, { color: colors.error, marginLeft: 8, flex: 1 }]}>{error}</Text>
                  </View>
                ) : null}

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="New Password"
                      placeholder="••••••••"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      isPassword
                      error={errors.password?.message}
                      leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Confirm New Password"
                      placeholder="••••••••"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      isPassword
                      error={errors.confirmPassword?.message}
                      leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />}
                    />
                  )}
                />

                <Button
                  label="Reset Password"
                  onPress={handleSubmit(onSubmit)}
                  loading={isPending}
                  disabled={!token}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  gradientAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 240 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrap: {
    width: 60, height: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  successContainer: { alignItems: 'center' },
  successIcon: {
    width: 72, height: 72,
    alignItems: 'center', justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
  },
});
