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
            {sent ? (
              // Success state
              <View style={styles.successContainer}>
                <LinearGradient
                  colors={colors.gradientSuccess as [string, string]}
                  style={[styles.successIcon, { borderRadius: radii.full }]}
                >
                  <Ionicons name="checkmark" size={36} color="#fff" />
                </LinearGradient>
                <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing[4], textAlign: 'center' }]}>
                  Check your email
                </Text>
                <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing[2], textAlign: 'center', lineHeight: 22 }]}>
                  If that email is registered, you'll receive a password reset link shortly.
                </Text>
                <Button label="Back to Login" onPress={() => navigation.goBack()} style={{ marginTop: spacing[6] }} />
              </View>
            ) : (
              <>
                <View style={[styles.iconWrap, { backgroundColor: colors.primarySubtle, borderRadius: radii.full }]}>
                  <Ionicons name="key-outline" size={28} color={colors.primary} />
                </View>
                <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing[4] }]}>
                  Forgot Password?
                </Text>
                <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing[2], marginBottom: spacing[5] }]}>
                  Enter your email and we'll send you a reset link.
                </Text>

                {error ? (
                  <View style={[styles.errorBanner, { backgroundColor: colors.errorSubtle, borderRadius: radii.md, marginBottom: spacing[4] }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                    <Text style={[typography.bodySm, { color: colors.error, marginLeft: 8 }]}>{error}</Text>
                  </View>
                ) : null}

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Email address"
                      placeholder="you@example.com"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textTertiary} />}
                    />
                  )}
                />

                <Button
                  label="Send Reset Link"
                  onPress={handleSubmit(onSubmit)}
                  loading={isPending}
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
