import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await register({ name: data.name, email: data.email, password: data.password });
    } catch {}
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
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backBtn, { backgroundColor: colors.surfaceElevated }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.brand}>
            <LinearGradient
              colors={[colors.primaryDark, colors.primary]}
              style={[styles.logoBox, { borderRadius: radii.xl }]}
            >
              <Ionicons name="trending-up" size={28} color="#fff" />
            </LinearGradient>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radii['2xl'],
                borderColor: colors.border,
                borderWidth: 1,
                marginTop: spacing[6],
                padding: spacing[6],
              },
            ]}
          >
            <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing[1] }]}>
              Create Account
            </Text>
            <Text style={[typography.body, { color: colors.textTertiary, marginBottom: spacing[5] }]}>
              Start your trading journey today
            </Text>

            {authError && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: colors.errorSubtle, borderRadius: radii.md, marginBottom: spacing[4] },
                ]}
              >
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[typography.bodySm, { color: colors.error, marginLeft: 8, flex: 1 }]}>
                  {authError}
                </Text>
              </View>
            )}

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={value}
                  onChangeText={(t) => { onChange(t); clearError(); }}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  leftIcon={<Ionicons name="person-outline" size={18} color={colors.textTertiary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={emailRef}
                  label="Email"
                  placeholder="you@example.com"
                  value={value}
                  onChangeText={(t) => { onChange(t); clearError(); }}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passRef.current?.focus()}
                  leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textTertiary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={passRef}
                  label="Password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={value}
                  onChangeText={(t) => { onChange(t); clearError(); }}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  isPassword
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={confirmRef}
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  isPassword
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />}
                />
              )}
            />

            <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing[4] }]}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </Text>

            <Button
              label="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isPending}
            />
          </View>

          <View style={[styles.footer, { marginTop: spacing[6] }]}>
            <Text style={[typography.body, { color: colors.textTertiary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>
                Sign in
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
  gradientAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  header: { marginBottom: 8 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', marginTop: 8 },
  logoBox: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
