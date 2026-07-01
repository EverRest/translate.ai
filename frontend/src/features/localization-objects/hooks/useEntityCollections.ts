import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEntityCollection,
  deleteEntityCollection,
  importOpenApi,
  listEntityCollections,
  previewOpenApiImport,
} from '../api/entity-collections.api';

export function useEntityCollections(projectId: string | undefined) {
  return useQuery({
    queryKey: ['entity-collections', projectId],
    queryFn: () => listEntityCollections(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateEntityCollection(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; slug: string; description?: string }) =>
      createEntityCollection(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['entity-collections', projectId],
      });
    },
  });
}

export function useDeleteEntityCollection(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) =>
      deleteEntityCollection(projectId, collectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['entity-collections', projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['localization-objects', projectId],
      });
    },
  });
}

export function usePreviewOpenApiImport(
  projectId: string,
  collectionId: string | undefined,
) {
  return useMutation({
    mutationFn: (input: { spec: string; selectedTags?: string[] }) => {
      if (!collectionId) {
        throw new Error('Select a collection first');
      }
      return previewOpenApiImport(projectId, collectionId, input);
    },
  });
}

export function useImportOpenApi(
  projectId: string,
  collectionId: string | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      spec: string;
      selectedTags?: string[];
      materialize?: boolean;
    }) => {
      if (!collectionId) {
        throw new Error('Select a collection first');
      }
      return importOpenApi(projectId, collectionId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['localization-objects', projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['entity-collections', projectId],
      });
    },
  });
}
