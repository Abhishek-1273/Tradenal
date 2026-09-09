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
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { useForgotPassword } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export const ForgotPasswordScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation();
  const { mutateAsync: forgotPassword, isPending } = useForgotPassword();
  const insets = useSafeAreaInsets();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(99,102,241,0.22)', 'rgba(6, 182, 212, 0.08)', 'transparent']}
        style={styles.ambientTopGlow}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + 12,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={[styles.livePill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.livePillText, { color: colors.textSecondary }]}>RECOVERY</Text>
            </View>
          </View>

          {sent ? (
            // Success state
            <View style={styles.successContainer}>
              <LinearGradient
                colors={colors.gradientSuccess as [string, string]}
                style={[styles.successIcon, { borderRadius: radii.full }]}
              >
                <Ionicons name="checkmark" size={36} color="#fff" />
              </LinearGradient>
              <Text style={[typography.h1, { color: colors.textPrimary, marginTop: spacing[4], textAlign: 'center', fontSize: 26 }]}>
                Check your email
              </Text>
              <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing[2], textAlign: 'center', lineHeight: 22 }]}>
                If that email is registered, you'll receive a password reset link shortly.
              </Text>
              <Button label="Back to Login" onPress={() => navigation.goBack()} style={{ marginTop: spacing[6], width: '100%' }} />
            </View>
          ) : (
            <View style={styles.contentWrap}>
              {/* Header */}
              <View style={styles.headerSection}>
                <View style={[styles.logoHalo, { backgroundColor: colors.primary + '18' }]}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={[styles.logoBox, { borderRadius: 16 }]}
                  >
                    <Ionicons name="key-outline" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <Text style={[typography.h1, { color: colors.textPrimary, marginTop: spacing[3], fontSize: 26 }]}>
                  Forgot Password?
                </Text>
                <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4, lineHeight: 20 }}>
                  Enter your email address to receive a secure password recovery link.
                </Text>
              </View>

              {/* Form */}
              <View style={[styles.formSection, { marginTop: spacing[5] }]}>
                {error ? (
                  <View style={[styles.errorBanner, { backgroundColor: colors.errorSubtle, borderColor: colors.error + '40', borderRadius: radii.lg, marginBottom: spacing[3] }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                    <Text style={[typography.bodySm, { color: colors.error, marginLeft: 8, flex: 1 }]}>{error}</Text>
                  </View>
                ) : null}

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Email Address"
                      placeholder="name@trading.com"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textTertiary} />}
                      containerStyle={{ marginBottom: spacing[4] }}
                    />
                  )}
                />

                <Button
                  label={isPending ? 'Sending Link...' : 'Send Reset Link'}
                  onPress={handleSubmit(onSubmit)}
                  loading={isPending}
                />
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  ambientTopGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 320, zIndex: 0 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  contentWrap: {
    width: '100%',
  },
  headerSection: {
    width: '100%',
  },
  logoHalo: {
    padding: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  logoBox: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  formSection: {
    width: '100%',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successIcon: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
});
