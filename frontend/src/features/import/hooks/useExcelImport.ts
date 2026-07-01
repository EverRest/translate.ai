import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deltaTranslateExcel,
  getExcelImportProfile,
  getExcelImportSession,
  previewExcelImport,
  saveExcelImportProfile,
} from '../api/excel.api';
import type { ExcelImportProfile } from '../types/excel.types';

export function useExcelImportProfile(projectId: string | undefined) {
  return useQuery({
    queryKey: ['excel-import-profile', projectId],
    queryFn: () => getExcelImportProfile(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useSaveExcelImportProfile(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: ExcelImportProfile) =>
      saveExcelImportProfile(projectId!, profile),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['excel-import-profile', projectId],
      });
    },
  });
}

export function usePreviewExcelImport(projectId: string | undefined) {
  return useMutation({
    mutationFn: ({
      file,
      parseRulesJson,
    }: {
      file: File;
      parseRulesJson?: string;
    }) => previewExcelImport(projectId!, file, parseRulesJson),
  });
}

export function useExcelImportSession(
  projectId: string | undefined,
  sessionId: string | null,
) {
  return useQuery({
    queryKey: ['excel-import-session', projectId, sessionId],
    queryFn: () => getExcelImportSession(projectId!, sessionId!),
    enabled: Boolean(projectId && sessionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === 'pending' ||
        status === 'parsing' ||
        status === 'translating' ||
        status === 'composing'
      ) {
        return 1500;
      }
      return false;
    },
  });
}

export function useDeltaTranslateExcel(projectId: string | undefined) {
  return useMutation({
    mutationFn: ({
      sessionId,
      languages,
    }: {
      sessionId: string;
      languages?: string[];
    }) => deltaTranslateExcel(projectId!, sessionId, languages),
  });
}
