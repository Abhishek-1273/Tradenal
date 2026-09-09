import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { useRegister } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthNavProp } from '../../navigation/types';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export const RegisterScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AuthNavProp>();
  const { mutateAsync: register, isPending } = useRegister();
  const { error: authError, clearError } = useAuthStore();
  const insets = useSafeAreaInsets();

  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    clearError();
  }, []);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const passwordVal = watch('password') || '';
  const hasMinLen = passwordVal.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await register({ name: data.name, email: data.email, password: data.password });
    } catch {
      // Error handled via authStore.error
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Ambient Top Glow */}
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.22)', 'rgba(6, 182, 212, 0.08)', 'transparent']}
        style={[styles.ambientTopGlow, { height: 360 }]}
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
          {/* Top Bar: Back Button & Terminal Badge */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              style={[styles.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={[styles.livePill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.livePillText, { color: colors.textSecondary }]}>NEW ACCOUNT</Text>
            </View>
          </View>

          {/* Brand Header */}
          <View style={styles.headerSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.logoHalo, { backgroundColor: colors.primary + '18' }]}>
                <Image
                  source={require('../../../assets/icon.png')}
                  style={{ width: 48, height: 48, borderRadius: 14 }}
                  resizeMode="cover"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[typography.h1, { color: colors.textPrimary, letterSpacing: -0.6, fontSize: 26 }]}>
                  Create Account
                </Text>
                <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 2 }}>
                  Join the disciplined trader network
                </Text>
              </View>
            </View>
          </View>

          {/* Form Section: Full-Width Clean Inputs */}
          <View style={[styles.formSection, { marginTop: spacing[4] }]}>
            {/* Error Banner */}
            {authError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.errorSubtle,
                    borderColor: colors.error + '40',
                    borderRadius: radii.lg,
                    marginBottom: spacing[3],
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={[typography.bodySm, { color: colors.error, marginLeft: 8, flex: 1, fontWeight: '600' }]}>
                  {authError}
                </Text>
              </View>
            ) : null}

            {/* Name */}
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="e.g. Alex Morgan"
                  value={value}
                  onChangeText={(t) => {
                    onChange(t);
                    clearError();
                  }}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  leftIcon={<Ionicons name="person-outline" size={18} color={colors.textTertiary} />}
                  containerStyle={{ marginBottom: spacing[3] }}
                />
              )}
            />

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={emailRef}
                  label="Email Address"
                  placeholder="you@example.com"
                  value={value}
                  onChangeText={(t) => {
                    onChange(t);
                    clearError();
                  }}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passRef.current?.focus()}
                  leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textTertiary} />}
                  containerStyle={{ marginBottom: spacing[3] }}
                />
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={passRef}
                  label="Password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  value={value}
                  onChangeText={(t) => {
                    onChange(t);
                    clearError();
                  }}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  isPassword
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />}
                  containerStyle={{ marginBottom: spacing[3] }}
                />
              )}
            />

            {/* Confirm Password */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={confirmRef}
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={value}
                  onChangeText={(t) => {
                    onChange(t);
                    clearError();
                  }}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  isPassword
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.textTertiary} />}
                  containerStyle={{ marginBottom: spacing[2] }}
                />
              )}
            />

            {/* Password strength checklist */}
            {passwordVal.length > 0 && (
              <View style={[styles.reqBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.reqTitle, { color: colors.textTertiary }]}>SECURITY CRITERIA:</Text>
                <View style={styles.criteriaPillsRow}>
                  <View style={[styles.criteriaPill, { backgroundColor: hasMinLen ? colors.successSubtle : colors.surface, borderColor: hasMinLen ? colors.success + '40' : colors.border }]}>
                    <Ionicons name={hasMinLen ? 'checkmark-circle' : 'ellipse-outline'} size={12} color={hasMinLen ? colors.success : colors.textTertiary} />
                    <Text style={[styles.reqText, { color: hasMinLen ? colors.success : colors.textTertiary }]}>8+ chars</Text>
                  </View>
                  <View style={[styles.criteriaPill, { backgroundColor: hasUpper ? colors.successSubtle : colors.surface, borderColor: hasUpper ? colors.success + '40' : colors.border }]}>
                    <Ionicons name={hasUpper ? 'checkmark-circle' : 'ellipse-outline'} size={12} color={hasUpper ? colors.success : colors.textTertiary} />
                    <Text style={[styles.reqText, { color: hasUpper ? colors.success : colors.textTertiary }]}>Uppercase (A-Z)</Text>
                  </View>
                  <View style={[styles.criteriaPill, { backgroundColor: hasNumber ? colors.successSubtle : colors.surface, borderColor: hasNumber ? colors.success + '40' : colors.border }]}>
                    <Ionicons name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'} size={12} color={hasNumber ? colors.success : colors.textTertiary} />
                    <Text style={[styles.reqText, { color: hasNumber ? colors.success : colors.textTertiary }]}>Number (0-9)</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Submit */}
            <Button
              label={isPending ? 'Creating Account...' : 'Register Account'}
              onPress={handleSubmit(onSubmit)}
              loading={isPending}
              style={{ marginTop: spacing[3] }}
            />
          </View>

          {/* Switch to Login */}
          <View style={[styles.footer, { marginTop: spacing[5] }]}>
            <Text style={[typography.body, { color: colors.textTertiary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>
                Sign In
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
  ambientTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  headerSection: {
    width: '100%',
  },
  logoHalo: {
    padding: 6,
    borderRadius: 20,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  reqBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  reqTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  criteriaPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  criteriaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  reqText: {
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
