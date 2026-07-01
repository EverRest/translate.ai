import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  copyProjectSettings,
  type CopyProjectSettingsInput,
} from '../api/projects.api';

export function useCopyProjectSettings(targetProjectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CopyProjectSettingsInput) =>
      copyProjectSettings(targetProjectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['project', targetProjectId],
      });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({
        queryKey: ['glossary', targetProjectId],
      });
    },
  });
}
