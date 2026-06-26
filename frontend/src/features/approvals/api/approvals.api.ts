import {
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccess,
} from '../../../shared/api/client';
import type { PaginatedData } from '../../../shared/api/types';
import type { ReviewItem, ReviewStatusFilter } from '../types';

export async function listReviews(
  projectId: string,
  page = 1,
  limit = 50,
  status: ReviewStatusFilter = 'pending',
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
  });

  const response = await apiGet<ApiSuccess<PaginatedData<ReviewItem>>>(
    `/projects/${projectId}/reviews?${params.toString()}`,
  );
  return response.data;
}

export async function approveTranslation(translationId: string) {
  const response = await apiPost<ApiSuccess<ReviewItem>>(
    `/translations/${translationId}/approve`,
  );
  return response.data;
}

export async function rejectTranslation(
  translationId: string,
  comment?: string,
) {
  const response = await apiPost<ApiSuccess<ReviewItem>, { comment?: string }>(
    `/translations/${translationId}/reject`,
    comment ? { comment } : {},
  );
  return response.data;
}

export async function publishTranslation(translationId: string) {
  const response = await apiPost<ApiSuccess<ReviewItem>>(
    `/translations/${translationId}/publish`,
  );
  return response.data;
}

export async function updateTranslationValue(
  translationId: string,
  value: string,
) {
  const response = await apiPatch<ApiSuccess<ReviewItem>, { value: string }>(
    `/translations/${translationId}`,
    { value },
  );
  return response.data;
}

export async function bulkApproveTranslations(
  projectId: string,
  translationIds: string[],
) {
  const response = await apiPost<
    ApiSuccess<{ approved: number }>,
    { translationIds: string[] }
  >(`/projects/${projectId}/reviews/bulk-approve`, { translationIds });
  return response.data;
}
