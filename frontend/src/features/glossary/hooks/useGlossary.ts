import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  analyzeGlossary,
  approveGlossarySuggestion,
  createGlossaryTerm,
  deleteGlossaryTerm,
  listGlossarySuggestions,
  listGlossaryTerms,
  rejectGlossarySuggestion,
  updateGlossaryTerm,
} from '../api/glossary.api';
import type {
  CreateGlossaryTermInput,
  UpdateGlossaryTermInput,
} from '../types';

export function useGlossaryTerms(
  projectId: string | undefined,
  page = 1,
  limit = 50,
  search?: string,
) {
  return useQuery({
    queryKey: ['glossary', projectId, page, limit, search],
    queryFn: () => listGlossaryTerms(projectId!, page, limit, search),
    enabled: Boolean(projectId),
  });
}

export function useCreateGlossaryTerm(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGlossaryTermInput) =>
      createGlossaryTerm(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['glossary', projectId] });
    },
  });
}

export function useUpdateGlossaryTerm(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      termId,
      input,
    }: {
      termId: string;
      input: UpdateGlossaryTermInput;
    }) => updateGlossaryTerm(projectId, termId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['glossary', projectId] });
    },
  });
}

export function useDeleteGlossaryTerm(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (termId: string) => deleteGlossaryTerm(projectId, termId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['glossary', projectId] });
    },
  });
}

export function useGlossarySuggestions(
  projectId: string | undefined,
  pollWhileWaiting = false,
) {
  return useQuery({
    queryKey: ['glossary-suggestions', projectId],
    queryFn: () => listGlossarySuggestions(projectId!, 'pending'),
    enabled: Boolean(projectId),
    refetchInterval: pollWhileWaiting ? 3000 : false,
  });
}

export function useAnalyzeGlossary(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => analyzeGlossary(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['glossary-suggestions', projectId],
      });
    },
  });
}

export function useApproveGlossarySuggestion(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestionId: string) =>
      approveGlossarySuggestion(projectId, suggestionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['glossary', projectId] });
      void queryClient.invalidateQueries({
        queryKey: ['glossary-suggestions', projectId],
      });
    },
  });
}

export function useRejectGlossarySuggestion(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestionId: string) =>
      rejectGlossarySuggestion(projectId, suggestionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['glossary-suggestions', projectId],
      });
    },
  });
}
