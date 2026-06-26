import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addProjectLanguage,
  createApiKey,
  createWebhook,
  deleteWebhook,
  listApiKeys,
  listProjectLanguages,
  listWebhooks,
  removeProjectLanguage,
  revokeApiKey,
  updateWebhook,
} from '../api/project-settings.api';

function projectSettingsQueryKey(projectId: string) {
  return ['project-settings', projectId] as const;
}

export function useProjectLanguages(projectId: string | undefined) {
  return useQuery({
    queryKey: [...projectSettingsQueryKey(projectId ?? ''), 'languages'],
    queryFn: () => listProjectLanguages(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useAddLanguage(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => addProjectLanguage(projectId, code),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectSettingsQueryKey(projectId),
      });
    },
  });
}

export function useRemoveLanguage(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (languageId: string) =>
      removeProjectLanguage(projectId, languageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectSettingsQueryKey(projectId),
      });
    },
  });
}

export function useApiKeys(projectId: string | undefined) {
  return useQuery({
    queryKey: [...projectSettingsQueryKey(projectId ?? ''), 'api-keys'],
    queryFn: () => listApiKeys(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateApiKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createApiKey(projectId, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectSettingsQueryKey(projectId),
      });
    },
  });
}

export function useRevokeApiKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (apiKeyId: string) => revokeApiKey(projectId, apiKeyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectSettingsQueryKey(projectId),
      });
    },
  });
}

export function useWebhooks(projectId: string | undefined) {
  return useQuery({
    queryKey: [...projectSettingsQueryKey(projectId ?? ''), 'webhooks'],
    queryFn: () => listWebhooks(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateWebhook(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { url: string; secret?: string; enabled?: boolean }) =>
      createWebhook(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectSettingsQueryKey(projectId),
      });
    },
  });
}

export function useUpdateWebhook(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      webhookId,
      input,
    }: {
      webhookId: string;
      input: { url?: string; enabled?: boolean };
    }) => updateWebhook(projectId, webhookId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectSettingsQueryKey(projectId),
      });
    },
  });
}

export function useDeleteWebhook(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookId: string) => deleteWebhook(projectId, webhookId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectSettingsQueryKey(projectId),
      });
    },
  });
}
