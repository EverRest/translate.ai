import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTranslationKey,
  deleteTranslationKey,
  listTranslationKeys,
  updateTranslationKey,
} from '../api/translation-keys.api';
import type {
  CreateTranslationKeyInput,
  UpdateTranslationKeyInput,
} from '../types';

export function useTranslationKeys(
  projectId: string | undefined,
  page = 1,
  limit = 20,
  search = '',
) {
  return useQuery({
    queryKey: ['translation-keys', projectId, page, limit, search],
    queryFn: () => listTranslationKeys(projectId!, page, limit, search),
    enabled: Boolean(projectId),
  });
}

export function useCreateTranslationKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTranslationKeyInput) =>
      createTranslationKey(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['translation-keys', projectId],
      });
    },
  });
}

export function useUpdateTranslationKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      keyId,
      input,
    }: {
      keyId: string;
      input: UpdateTranslationKeyInput;
    }) => updateTranslationKey(projectId, keyId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['translation-keys', projectId],
      });
    },
  });
}

export function useDeleteTranslationKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string) => deleteTranslationKey(projectId, keyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['translation-keys', projectId],
      });
    },
  });
}
