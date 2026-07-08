import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { getErrorMessage } from '../api/client';
import { User, UserSettings } from '../types';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export const useMe = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogin = () => {
  const { login } = useAuthStore();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
  });
};

export const useRegister = () => {
  const { register } = useAuthStore();
  return useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      register(name, email, password),
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: { token: string; password: string }) => authApi.resetPassword(data),
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
  });
};

export const useUpdateSettings = () => {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation<User, Error, Partial<UserSettings>>({
    mutationFn: (settings) => authApi.updateSettings(settings),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
};

export const useDeleteAccount = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (password) => authApi.deleteAccount(password),
    onSuccess: async () => {
      await logout();
      queryClient.clear();
    },
  });
};
