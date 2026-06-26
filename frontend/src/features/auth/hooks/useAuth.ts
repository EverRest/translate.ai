import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/types';
import { loginRequest, meRequest, registerRequest } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import type { LoginPayload, RegisterPayload } from '../types';

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const storedUser = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: meRequest,
    enabled: Boolean(accessToken),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data && accessToken) {
      setSession(accessToken, meQuery.data);
    }
  }, [meQuery.data, accessToken, setSession]);

  useEffect(() => {
    if (meQuery.error && isUnauthorizedError(meQuery.error)) {
      clearSession();
    }
  }, [meQuery.error, clearSession]);

  return {
    accessToken,
    user: meQuery.data ?? storedUser,
    isAuthenticated: Boolean(accessToken),
    isLoading: Boolean(accessToken) && meQuery.isLoading,
    logout: clearSession,
  };
}

export function useLoginForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const token = await loginRequest(payload);
      setSession(token.accessToken, {
        id: '',
        email: payload.email,
        role: '',
        tenantId: '',
      });
      const profile = await meRequest();
      setSession(token.accessToken, profile);
    },
    onSuccess: () => navigate('/'),
  });
}

export function useRegisterForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const data = await registerRequest(payload);
      setSession(data.accessToken, {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        tenantId: data.tenant.id,
        tenant: {
          id: data.tenant.id,
          name: data.tenant.name,
          slug: data.tenant.slug,
        },
      });
    },
    onSuccess: () => navigate('/'),
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);

  return () => {
    clearSession();
    queryClient.clear();
    navigate('/login');
  };
}
