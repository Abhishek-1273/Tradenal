import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api/accounts.api';
import { useAccountStore } from '../store/account.store';
import { CreateAccountPayload } from '../types';

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
};

export const useAccounts = () => {
  return useQuery({
    queryKey: accountKeys.lists(),
    queryFn: accountsApi.getAccounts,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAccount = (id: string) => {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountsApi.getAccountById(id),
    enabled: !!id,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  const { createAccount } = useAccountStore();

  return useMutation({
    mutationFn: (data: CreateAccountPayload) => createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
};

export const useUpdateAccount = (id: string) => {
  const queryClient = useQueryClient();
  const { updateAccount } = useAccountStore();

  return useMutation({
    mutationFn: (data: Partial<CreateAccountPayload> & { status?: string }) =>
      updateAccount(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(accountKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
};

export const useSetDefaultAccount = () => {
  const queryClient = useQueryClient();
  const { setDefaultAccount } = useAccountStore();

  return useMutation({
    mutationFn: (id: string) => setDefaultAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  const { deleteAccount } = useAccountStore();

  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
};
