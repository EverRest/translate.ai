import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { listTranslations } from '../api/translations.api';

async function fetchAllTranslations(projectId: string) {
  const PAGE_SIZE = 2000;
  const first = await listTranslations(projectId, 1, PAGE_SIZE);
  const total = first.meta.total;
  if (total <= PAGE_SIZE) return first;

  const pages = Math.ceil(total / PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      listTranslations(projectId, i + 2, PAGE_SIZE),
    ),
  );
  return {
    ...first,
    items: [...first.items, ...rest.flatMap((r) => r.items)],
  };
}

export function useTranslations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['translations', projectId],
    queryFn: () => fetchAllTranslations(projectId!),
    enabled: Boolean(projectId),
    staleTime: 0,
  });
}

export function useRefetchTranslations(projectId: string) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: ['translations', projectId],
    });
  }, [queryClient, projectId]);
}
