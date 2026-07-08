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
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { useLogin } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthNavProp } from '../../navigation/types';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export const LoginScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AuthNavProp>();
  const { mutateAsync: login, isPending } = useLogin();
  const { error: authError, clearError } = useAuthStore();
  const passwordRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await login(data);
    } catch {
      // Error shown via authError
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Background gradient accent */}
      <LinearGradient
        colors={['rgba(99,102,241,0.15)', 'transparent']}
        style={styles.gradientAccent}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand */}
          <View style={styles.brand}>
            <LinearGradient
              colors={[colors.primaryDark, colors.primary]}
              style={[styles.logoBox, { borderRadius: radii.xl }]}
            >
              <Ionicons name="trending-up" size={32} color="#fff" />
            </LinearGradient>
            <Text style={[typography.displayMd, { color: colors.textPrimary, marginTop: spacing[4] }]}>
              Tradenal
            </Text>
            <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing[1] }]}>
              Track. Analyse. Improve.
            </Text>
          </View>

          {/* Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radii['2xl'],
                borderColor: colors.border,
                borderWidth: 1,
                marginTop: spacing[8],
                padding: spacing[6],
              },
            ]}
          >
            <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing[5] }]}>
              Welcome back
            </Text>

            {/* Auth Error */}
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

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={value}
                  onChangeText={(t) => { onChange(t); clearError(); }}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textTertiary} />}
                />
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={passwordRef}
                  label="Password"
                  placeholder="Your password"
                  value={value}
                  onChangeText={(t) => { onChange(t); clearError(); }}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  isPassword
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />}
                />
              )}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
            >
              <Text style={[typography.label, { color: colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Submit */}
            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isPending}
              style={{ marginTop: spacing[2] }}
            />
          </View>

          {/* Register link */}
          <View style={[styles.footer, { marginTop: spacing[6] }]}>
            <Text style={[typography.body, { color: colors.textTertiary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>
                Create one
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
    height: 300,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  brand: {
    alignItems: 'center',
  },
  logoBox: {
    width: 72,
    height: 72,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
