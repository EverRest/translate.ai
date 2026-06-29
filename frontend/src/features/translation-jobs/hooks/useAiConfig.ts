import { useQuery } from '@tanstack/react-query';
import { getAiConfig } from '../api/ai-config.api';

export function useAiConfig() {
  return useQuery({
    queryKey: ['ai-config'],
    queryFn: getAiConfig,
    staleTime: 5 * 60_000,
  });
}
