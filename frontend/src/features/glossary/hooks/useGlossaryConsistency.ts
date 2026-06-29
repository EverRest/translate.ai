import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyGlossaryPreset,
  dismissTerminologyIssue,
  listGlossaryPresets,
  listTerminologyIssues,
  resolveTerminologyIssue,
  scanTerminology,
} from '../api/glossary-consistency.api';

export function useGlossaryPresets(projectId: string | undefined) {
  return useQuery({
    queryKey: ['glossary-presets', projectId],
    queryFn: () => listGlossaryPresets(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useApplyGlossaryPreset(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      presetId,
      mode,
    }: {
      presetId: string;
      mode?: 'merge' | 'replace_all_in_preset';
    }) => applyGlossaryPreset(projectId, presetId, mode),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['glossary', projectId] });
      void queryClient.invalidateQueries({
        queryKey: ['glossary-sets', projectId],
      });
    },
  });
}

export function useTerminologyIssues(
  projectId: string | undefined,
  pollWhileScanning = false,
) {
  return useQuery({
    queryKey: ['terminology-issues', projectId],
    queryFn: () => listTerminologyIssues(projectId!, 'open'),
    enabled: Boolean(projectId),
    refetchInterval: pollWhileScanning ? 3000 : false,
  });
}

export function useScanTerminology(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => scanTerminology(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['terminology-issues', projectId],
      });
    },
  });
}

export function useResolveTerminologyIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      canonicalValue,
      addToGlossary,
      retranslate,
    }: {
      issueId: string;
      canonicalValue: string;
      addToGlossary?: boolean;
      retranslate?: boolean;
    }) =>
      resolveTerminologyIssue(projectId, issueId, {
        canonicalValue,
        addToGlossary,
        retranslate,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['terminology-issues', projectId],
      });
      void queryClient.invalidateQueries({ queryKey: ['glossary', projectId] });
    },
  });
}

export function useDismissTerminologyIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issueId: string) =>
      dismissTerminologyIssue(projectId, issueId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['terminology-issues', projectId],
      });
    },
  });
}
