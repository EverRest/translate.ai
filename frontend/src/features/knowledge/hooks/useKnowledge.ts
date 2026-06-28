import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createKnowledgeSource,
  deleteKnowledgeSource,
  listKnowledgeSources,
  uploadKnowledgeFile,
} from '../api/knowledge.api';
import type { CreateKnowledgeSourceInput } from '../types';

export function useKnowledgeSources(
  projectId: string | undefined,
  pollWhilePending = false,
) {
  return useQuery({
    queryKey: ['knowledge-sources', projectId],
    queryFn: () => listKnowledgeSources(projectId!),
    enabled: Boolean(projectId),
    refetchInterval: pollWhilePending ? 3000 : false,
  });
}

export function useCreateKnowledgeSource(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateKnowledgeSourceInput) =>
      createKnowledgeSource(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['knowledge-sources', projectId],
      });
    },
  });
}

export function useUploadKnowledgeFile(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, name }: { file: File; name?: string }) =>
      uploadKnowledgeFile(projectId, file, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['knowledge-sources', projectId],
      });
    },
  });
}

export function useDeleteKnowledgeSource(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId: string) =>
      deleteKnowledgeSource(projectId, sourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['knowledge-sources', projectId],
      });
    },
  });
}
