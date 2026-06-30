import { apiGet, type ApiSuccess } from '../../../shared/api/client';
import type { AiConfig } from '../types';

export async function getAiConfig() {
  const response = await apiGet<ApiSuccess<AiConfig>>('/config/ai');
  return response.data;
}
