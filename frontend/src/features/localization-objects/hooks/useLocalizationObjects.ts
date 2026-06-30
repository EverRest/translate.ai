import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyObjectTemplate,
  createLocalizationNode,
  createLocalizationObject,
  deleteLocalizationNode,
  deleteLocalizationObject,
  generateObjectStructure,
  getLocalizationObject,
  listLocalizationObjects,
  listObjectTemplates,
  materializeLocalizationObject,
  translateLocalizationObject,
  updateLocalizationNode,
  updateLocalizationObject,
} from '../api/localization-objects.api';
import type {
  CreateLocalizationNodeInput,
  CreateLocalizationObjectInput,
  UpdateLocalizationNodeInput,
  UpdateLocalizationObjectInput,
} from '../types';

export function useLocalizationObjects(
  projectId: string | undefined,
  page = 1,
  limit = 20,
  search?: string,
  collectionId?: string,
) {
  return useQuery({
    queryKey: ['localization-objects', projectId, page, limit, search, collectionId],
    queryFn: () =>
      listLocalizationObjects(projectId!, page, limit, search, collectionId),
    enabled: Boolean(projectId),
  });
}

export function useLocalizationObject(
  projectId: string | undefined,
  objectId: string | undefined,
  pollGeneration = false,
) {
  const isGenerating = pollGeneration;
  return useQuery({
    queryKey: ['localization-object', projectId, objectId],
    queryFn: () => getLocalizationObject(projectId!, objectId!),
    enabled: Boolean(projectId && objectId),
    refetchInterval: (query) => {
      const status = query.state.data?.generationStatus;
      if (status === 'queued' || status === 'generating') {
        return 2000;
      }
      return isGenerating ? 2000 : false;
    },
  });
}

export function useCreateLocalizationObject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLocalizationObjectInput) =>
      createLocalizationObject(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['localization-objects', projectId],
      });
    },
  });
}

export function useDeleteLocalizationObject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (objectId: string) =>
      deleteLocalizationObject(projectId, objectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['localization-objects', projectId],
      });
    },
  });
}

export function useUpdateLocalizationObject(
  projectId: string,
  objectId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLocalizationObjectInput) =>
      updateLocalizationObject(projectId, objectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['localization-object', projectId, objectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['localization-objects', projectId],
      });
    },
  });
}

export function useCreateLocalizationNode(projectId: string, objectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLocalizationNodeInput) =>
      createLocalizationNode(projectId, objectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['localization-object', projectId, objectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['localization-objects', projectId],
      });
    },
  });
}

export function useUpdateLocalizationNode(projectId: string, objectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      nodeId,
      input,
    }: {
      nodeId: string;
      input: UpdateLocalizationNodeInput;
    }) => updateLocalizationNode(projectId, objectId, nodeId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['localization-object', projectId, objectId],
      });
    },
  });
}

export function useDeleteLocalizationNode(projectId: string, objectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) =>
      deleteLocalizationNode(projectId, objectId, nodeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['localization-object', projectId, objectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['localization-objects', projectId],
      });
    },
  });
}

export function useMaterializeLocalizationObject(
  projectId: string,
  objectId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: { prune?: boolean }) =>
      materializeLocalizationObject(projectId, objectId, options),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['localization-object', projectId, objectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['localization-objects', projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['translation-keys', projectId],
      });
    },
  });
}

export function useTranslateLocalizationObject(
  projectId: string,
  objectId: string,
) {
  return useMutation({
    mutationFn: (languages: string[]) =>
      translateLocalizationObject(projectId, objectId, languages),
  });
}

export function useObjectTemplates(projectId: string | undefined) {
  return useQuery({
    queryKey: ['localization-object-templates', projectId],
    queryFn: () => listObjectTemplates(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useGenerateObjectStructure(
  projectId: string,
  objectId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateObjectStructure(projectId, objectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['localization-object', projectId, objectId],
      });
    },
  });
}

export function useApplyObjectTemplate(projectId: string, objectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      applyObjectTemplate(projectId, objectId, templateId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['localization-object', projectId, objectId],
      });
    },
  });
}
