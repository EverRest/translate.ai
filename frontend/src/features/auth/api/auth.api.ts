import { apiGet, apiPost, type ApiSuccess } from '../../../shared/api/client';
import type {
  LoginPayload,
  LoginResponse,
  MeResponse,
  RegisterPayload,
  RegisterResponse,
} from '../types';

export async function loginRequest(payload: LoginPayload) {
  const response = await apiPost<ApiSuccess<LoginResponse>>(
    '/auth/login',
    payload,
  );
  return response.data;
}

export async function registerRequest(payload: RegisterPayload) {
  const response = await apiPost<ApiSuccess<RegisterResponse>>(
    '/auth/register',
    payload,
  );
  return response.data;
}

export async function meRequest() {
  const response = await apiGet<ApiSuccess<MeResponse>>('/auth/me');
  return response.data;
}
