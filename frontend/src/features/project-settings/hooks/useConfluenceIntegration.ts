import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  disconnectConfluence,
  getConfluenceConnectUrl,
  getConfluenceIntegration,
  listConfluencePages,
  listConfluenceSpaces,
  triggerConfluenceSync,
  updateConfluenceConfig,
} from '../api/confluence.api';

export function useConfluenceIntegration(projectId: string) {
  return useQuery({
    queryKey: ['confluence-integration', projectId],
    queryFn: () => getConfluenceIntegration(projectId),
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
) {
  return useQuery({
    queryKey: ['confluence-pages', projectId, spaceId],
    queryFn: () => listConfluencePages(projectId, spaceId!),
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

export function useUpdateConfluenceConfig(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      pageIds: string[];
      spaceKey?: string;
      autoApply?: boolean;
    }) => updateConfluenceConfig(projectId, input),
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
