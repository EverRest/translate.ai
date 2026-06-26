import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  archiveProject,
  createProject,
  getProject,
  listProjects,
  updateProject,
} from '../api/projects.api';
import type { CreateProjectInput, UpdateProjectInput } from '../types';

export function useProjectsList(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['projects', page, limit],
    queryFn: () => listProjects(page, limit),
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/projects/${project.id}`);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: UpdateProjectInput;
    }) => updateProject(projectId, input),
    onSuccess: (_, { projectId }) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (projectId: string) => archiveProject(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/projects');
    },
  });
}
