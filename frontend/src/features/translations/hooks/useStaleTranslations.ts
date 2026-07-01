import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getStaleTranslationKeyHints,
  getStaleTranslationSummary,
} from '../api/stale-translations.api';

export function staleTranslationsQueryKey(projectId: string) {
  return ['stale-translations', projectId] as const;
}

export function useStaleTranslationSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: [...staleTranslationsQueryKey(projectId ?? ''), 'summary'],
    queryFn: () => getStaleTranslationSummary(projectId!),
    enabled: Boolean(projectId),
    refetchInterval: 30000,
  });
}

export function useStaleTranslationKeyHints(projectId: string | undefined) {
  return useQuery({
    queryKey: [...staleTranslationsQueryKey(projectId ?? ''), 'key-hints'],
    queryFn: () => getStaleTranslationKeyHints(projectId!),
    enabled: Boolean(projectId),
    refetchInterval: 30000,
  });
}

export function useInvalidateStaleTranslations(projectId: string) {
  const queryClient = useQueryClient();
  return () =>
    void queryClient.invalidateQueries({
      queryKey: staleTranslationsQueryKey(projectId),
    });
}
