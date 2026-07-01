import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeConfluenceConnect,
  disconnectConfluence,
  getConfluenceConnectUrl,
  getConfluenceIntegration,
  getConfluencePendingSites,
  listConfluencePages,
  listConfluenceSpaces,
  triggerConfluenceSync,
  updateConfluenceConfig,
  type UpdateConfluenceConfigInput,
} from '../api/confluence.api';

export function useConfluenceIntegration(projectId: string) {
  return useQuery({
    queryKey: ['confluence-integration', projectId],
    queryFn: () => getConfluenceIntegration(projectId),
  });
}

export function useConfluencePendingSites(
  projectId: string,
  pendingToken: string | null,
) {
  return useQuery({
    queryKey: ['confluence-pending-sites', projectId, pendingToken],
    queryFn: () => getConfluencePendingSites(projectId, pendingToken!),
    enabled: Boolean(pendingToken),
  });
}

export function useConfluenceSpaces(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['confluence-spaces', projectId],
    queryFn: () => listConfluenceSpaces(projectId),
    enabled,
  });
}

export function useConfluencePages(
  projectId: string,
  spaceId: string | null,
  enabled: boolean,
  labelFilter?: string,
) {
  return useQuery({
    queryKey: ['confluence-pages', projectId, spaceId, labelFilter],
    queryFn: () => listConfluencePages(projectId, spaceId!, labelFilter),
    enabled: enabled && !!spaceId,
  });
}

export function useConfluenceConnect(projectId: string) {
  return useMutation({
    mutationFn: async () => {
      const url = await getConfluenceConnectUrl(projectId);
      window.location.href = url;
    },
  });
}

export function useCompleteConfluenceConnect(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { pendingToken: string; cloudId: string }) =>
      completeConfluenceConnect(projectId, input.pendingToken, input.cloudId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['confluence-integration', projectId],
      });
    },
  });
}

export function useUpdateConfluenceConfig(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateConfluenceConfigInput) =>
      updateConfluenceConfig(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['confluence-integration', projectId],
      });
    },
  });
}

export function useConfluenceSync(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (autoApply?: boolean) =>
      triggerConfluenceSync(projectId, autoApply),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['confluence-integration', projectId],
      });
    },
  });
}

export function useDisconnectConfluence(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectConfluence(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['confluence-integration', projectId],
      });
    },
  });
}
