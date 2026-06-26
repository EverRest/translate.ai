import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  cancelJob,
  createJob,
  getJob,
  listJobs,
  listProjectLanguages,
  retryJob,
} from '../api/jobs.api';
import type { CreateJobInput } from '../types';

export function useJobsList(page = 1, limit = 20, projectId?: string) {
  return useQuery({
    queryKey: ['jobs', page, limit, projectId],
    queryFn: () => listJobs(page, limit, projectId),
  });
}

export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'processing') {
        return 3000;
      }
      return false;
    },
  });
}

export function useProjectLanguages(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-languages', projectId],
    queryFn: () => listProjectLanguages(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateJob(options?: { onSuccessNavigate?: boolean }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: CreateJobInput) => createJob(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (options?.onSuccessNavigate !== false) {
        navigate(`/jobs/${data.jobId}`);
      }
    },
  });
}

export function useRetryJob(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => retryJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useCancelJob(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
