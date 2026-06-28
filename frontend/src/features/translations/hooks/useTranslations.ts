import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { listTranslations } from '../api/translations.api';

export function useTranslations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['translations', projectId],
    queryFn: () => listTranslations(projectId!, 1, 500),
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
