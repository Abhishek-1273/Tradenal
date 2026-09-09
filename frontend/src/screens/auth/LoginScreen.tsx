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

  useEffect(() => {
    clearError();
  }, []);

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
      // Error handled via authStore.error
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Ambient Glow across entire screen width */}
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.22)', 'rgba(16, 185, 129, 0.08)', 'transparent']}
        style={[styles.ambientTopGlow, { height: 380 }]}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 20) + 16,
              paddingBottom: Math.max(insets.bottom, 20) + 16,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.centerContainer}>
            {/* Top Section: Brand & Welcome Header */}
            <View style={styles.topSection}>
              {/* Logo & Brand */}
              <View style={styles.brandRow}>
                <View style={[styles.logoHalo, { backgroundColor: colors.primary + '18' }]}>
                  <Image
                    source={require('../../../assets/icon.png')}
                    style={{ width: 48, height: 48, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                </View>

                <View style={[styles.terminalBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.terminalBadgeText, { color: colors.textSecondary }]}>v2.0 TERMINAL</Text>
                </View>
              </View>

              {/* Title & Tagline */}
              <View style={{ marginTop: 16 }}>
                <Text style={[typography.h1, { color: colors.textPrimary, letterSpacing: -0.6, fontSize: 26 }]}>
                  Welcome back
                </Text>
                <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4, lineHeight: 18 }}>
                  Sign in to your trading journal & performance dashboard
                </Text>
              </View>
            </View>

            {/* Form Section: Tightly Grouped Clean Inputs */}
            <View style={[styles.formSection, { marginTop: 22 }]}>
              {/* Error Banner */}
              {authError ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: colors.errorSubtle,
                      borderColor: colors.error + '50',
                      borderRadius: radii.lg,
                      marginBottom: 14,
                    },
                  ]}
                >
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text style={[typography.bodySm, { color: colors.error, marginLeft: 8, flex: 1, fontWeight: '600' }]}>
                    {authError}
                  </Text>
                </View>
              ) : null}

              {/* Email */}
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email Address"
                    placeholder="name@trading.com"
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
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textTertiary} />}
                    containerStyle={{ marginBottom: 12 }}
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
                    placeholder="Enter your password"
                    value={value}
                    onChangeText={(t) => {
                      onChange(t);
                      clearError();
                    }}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    isPassword
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />}
                    containerStyle={{ marginBottom: 6 }}
                  />
                )}
              />

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                activeOpacity={0.7}
                style={styles.forgotBtn}
              >
                <Text style={[typography.labelSm, { color: colors.primary, fontWeight: '700' }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

              {/* Submit Button */}
              <Button
                label={isPending ? 'Signing In...' : 'Sign In to Terminal'}
                onPress={handleSubmit(onSubmit)}
                loading={isPending}
                style={{ marginTop: 10 }}
              />
            </View>

            {/* Bottom Switcher: Clean and Close */}
            <View style={styles.bottomFooter}>
              <Text style={[typography.body, { color: colors.textTertiary, fontSize: 13 }]}>
                Don't have an account yet?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                <Text style={[typography.body, { color: colors.primary, fontWeight: '800', fontSize: 13 }]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  ambientTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  centerContainer: {
    width: '100%',
    paddingVertical: 10,
  },
  topSection: {
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoHalo: {
    padding: 6,
    borderRadius: 20,
  },
  logoBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  terminalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  terminalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    paddingVertical: 4,
  },
  bottomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 4,
  },
});
