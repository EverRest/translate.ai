import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyGlossaryPreset,
  listDomainPresets,
} from '../api/domain-context.api';

export function useDomainPresets(projectId: string | undefined) {
  return useQuery({
    queryKey: ['domain-presets', projectId],
    queryFn: () => listDomainPresets(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useApplyGlossaryPreset(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (presetId: string) => applyGlossaryPreset(projectId, presetId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['glossary', projectId] });
    },
  });
}
