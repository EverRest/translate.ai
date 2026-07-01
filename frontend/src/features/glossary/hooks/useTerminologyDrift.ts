import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  countTerminologyDriftIssues,
  getTerminologyDriftKeyHints,
  listTerminologyDriftIssues,
  resolveTerminologyDriftIssue,
  scanTerminologyDrift,
} from '../api/terminology.api';

export function terminologyDriftQueryKey(projectId: string) {
  return ['terminology-drift', projectId] as const;
}

export function useTerminologyDriftIssues(
  projectId: string | undefined,
  pollWhileWaiting = false,
) {
  return useQuery({
    queryKey: [...terminologyDriftQueryKey(projectId ?? ''), 'issues'],
    queryFn: () => listTerminologyDriftIssues(projectId!, 'open'),
    enabled: Boolean(projectId),
    refetchInterval: pollWhileWaiting ? 3000 : false,
  });
}

export function useTerminologyDriftCount(projectId: string | undefined) {
  return useQuery({
    queryKey: [...terminologyDriftQueryKey(projectId ?? ''), 'count'],
    queryFn: () => countTerminologyDriftIssues(projectId!),
    enabled: Boolean(projectId),
    refetchInterval: 30000,
  });
}

export function useTerminologyDriftKeyHints(projectId: string | undefined) {
  return useQuery({
    queryKey: [...terminologyDriftQueryKey(projectId ?? ''), 'key-hints'],
    queryFn: () => getTerminologyDriftKeyHints(projectId!),
    enabled: Boolean(projectId),
    refetchInterval: 30000,
  });
}

export function useScanTerminologyDrift(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => scanTerminologyDrift(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: terminologyDriftQueryKey(projectId),
      });
    },
  });
}

export function useResolveTerminologyDriftIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      canonicalTranslation,
    }: {
      issueId: string;
      canonicalTranslation: string;
    }) =>
      resolveTerminologyDriftIssue(projectId, issueId, canonicalTranslation),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: terminologyDriftQueryKey(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: ['glossary', projectId] });
    },
  });
}

export async function pollTerminologyDriftCount(
  projectId: string,
  options?: { attempts?: number; intervalMs?: number },
): Promise<number> {
  const attempts = options?.attempts ?? 10;
  const intervalMs = options?.intervalMs ?? 2000;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const count = await countTerminologyDriftIssues(projectId);
    if (count > 0 || attempt === attempts - 1) {
      return count;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return 0;
}
