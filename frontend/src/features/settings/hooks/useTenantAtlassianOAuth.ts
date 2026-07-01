import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPut,
  type ApiSuccess,
} from '../../../shared/api/client';

export type TenantAtlassianOAuth = {
  configured: boolean;
  clientId?: string;
  redirectUri?: string | null;
  scopes?: string | null;
  hasSecret?: boolean;
  updatedAt?: string;
};

export function useTenantAtlassianOAuth() {
  return useQuery({
    queryKey: ['tenant-atlassian-oauth'],
    queryFn: async () => {
      const response = await apiGet<ApiSuccess<TenantAtlassianOAuth>>(
        '/tenant/integrations/atlassian',
      );
      return response.data;
    },
  });
}

export function useUpsertTenantAtlassianOAuth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
      scopes?: string;
    }) => apiPut('/tenant/integrations/atlassian', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['tenant-atlassian-oauth'],
      });
    },
  });
}

export function useDeleteTenantAtlassianOAuth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete('/tenant/integrations/atlassian'),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['tenant-atlassian-oauth'],
      });
    },
  });
}
