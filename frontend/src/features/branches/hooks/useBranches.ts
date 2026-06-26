import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBranch,
  getBranchDiff,
  listBranches,
  mergeBranch,
  updateBranchTranslation,
} from '../api/branches.api';
import type { UpdateBranchTranslationInput } from '../types';

export function useBranches(projectId: string | undefined) {
  return useQuery({
    queryKey: ['branches', projectId],
    queryFn: () => listBranches(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useBranchDiff(
  projectId: string | undefined,
  branchId: string | undefined,
) {
  return useQuery({
    queryKey: ['branches', projectId, branchId, 'diff'],
    queryFn: () => getBranchDiff(projectId!, branchId!),
    enabled: Boolean(projectId && branchId),
  });
}

export function useCreateBranch(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createBranch(projectId, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches', projectId] });
    },
  });
}

export function useMergeBranch(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branchId: string) => mergeBranch(projectId, branchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches', projectId] });
    },
  });
}

export function useUpdateBranchTranslation(
  projectId: string,
  branchId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBranchTranslationInput) =>
      updateBranchTranslation(projectId, branchId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['branches', projectId, branchId, 'diff'],
      });
    },
  });
}
