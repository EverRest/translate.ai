import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveTranslation,
  bulkApproveTranslations,
  listReviews,
  publishTranslation,
  rejectTranslation,
  updateTranslationValue,
} from '../api/approvals.api';
import type { ReviewStatusFilter } from '../types';

export function useProjectReviews(
  projectId: string | undefined,
  status: ReviewStatusFilter = 'pending',
) {
  return useQuery({
    queryKey: ['reviews', projectId, status],
    queryFn: () => listReviews(projectId!, 1, 50, status),
    enabled: Boolean(projectId),
    retry: false,
  });
}

function useInvalidateReviews(projectId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ['reviews', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useApproveTranslation(projectId: string) {
  const invalidate = useInvalidateReviews(projectId);

  return useMutation({
    mutationFn: (translationId: string) => approveTranslation(translationId),
    onSuccess: invalidate,
  });
}

export function useRejectTranslation(projectId: string) {
  const invalidate = useInvalidateReviews(projectId);

  return useMutation({
    mutationFn: ({
      translationId,
      comment,
    }: {
      translationId: string;
      comment?: string;
    }) => rejectTranslation(translationId, comment),
    onSuccess: invalidate,
  });
}

export function usePublishTranslation(projectId: string) {
  const invalidate = useInvalidateReviews(projectId);

  return useMutation({
    mutationFn: (translationId: string) => publishTranslation(translationId),
    onSuccess: invalidate,
  });
}

export function useUpdateTranslationValue(projectId: string) {
  const invalidate = useInvalidateReviews(projectId);

  return useMutation({
    mutationFn: ({
      translationId,
      value,
    }: {
      translationId: string;
      value: string;
    }) => updateTranslationValue(translationId, value),
    onSuccess: invalidate,
  });
}

export function useBulkApprove(projectId: string) {
  const invalidate = useInvalidateReviews(projectId);

  return useMutation({
    mutationFn: (translationIds: string[]) =>
      bulkApproveTranslations(projectId, translationIds),
    onSuccess: invalidate,
  });
}
