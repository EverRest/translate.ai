import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pollUntil } from '../../export/utils/poll-until';
import {
  applyImportSession,
  getImportSession,
  pasteImportHtml,
  previewImportSession,
  uploadImportFile,
} from '../api/import.api';
import {
  IMPORT_POLL_INTERVAL_MS,
  IMPORT_POLL_MAX_ATTEMPTS,
  type ImportSession,
  type ImportSessionStatus,
} from '../types';

const TERMINAL_STATUSES: ImportSessionStatus[] = [
  'preview_ready',
  'completed',
  'failed',
];

async function waitForSessionStatus(
  projectId: string,
  sessionId: string,
  target: ImportSessionStatus[],
): Promise<ImportSession> {
  return pollUntil(
    () => getImportSession(projectId, sessionId),
    (session) => target.includes(session.status),
    {
      intervalMs: IMPORT_POLL_INTERVAL_MS,
      maxAttempts: IMPORT_POLL_MAX_ATTEMPTS,
    },
  );
}

export function useImportPreview(
  projectId: string | undefined,
  sessionId: string | null,
  page = 1,
  action?: string,
) {
  return useQuery({
    queryKey: ['import-preview', projectId, sessionId, page, action],
    enabled: Boolean(projectId && sessionId),
    queryFn: () =>
      previewImportSession(projectId!, sessionId!, page, 50, action),
  });
}

export function useCreateImportSession(projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { file?: File; html?: string }) => {
      if (!projectId) {
        throw new Error('Project is required');
      }

      let session =
        input.file !== undefined
          ? await uploadImportFile(projectId, input.file)
          : await pasteImportHtml(projectId, input.html ?? '');

      if (session.queued || session.status === 'parsing') {
        session = await waitForSessionStatus(projectId, session.id, [
          'preview_ready',
          'failed',
        ]);
      }

      if (session.status === 'failed') {
        throw new Error(session.errorMessage ?? 'Import parse failed');
      }

      return session;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['import-preview'] });
    },
  });
}

export function useApplyImportSession(projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      conflictStrategy = 'update',
    }: {
      sessionId: string;
      conflictStrategy?: 'skip' | 'update';
    }) => {
      if (!projectId) {
        throw new Error('Project is required');
      }

      const result = await applyImportSession(
        projectId,
        sessionId,
        conflictStrategy,
      );

      if (result.queued) {
        const session = await waitForSessionStatus(projectId, sessionId, [
          'completed',
          'failed',
        ]);
        if (session.status === 'failed') {
          throw new Error(session.errorMessage ?? 'Import apply failed');
        }
        return session;
      }

      return result.session!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['translation-keys'] });
      void queryClient.invalidateQueries({ queryKey: ['translations'] });
    },
  });
}

export function isImportSessionReady(status: ImportSessionStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
