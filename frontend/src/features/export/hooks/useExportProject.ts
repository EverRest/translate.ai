import { useMutation } from '@tanstack/react-query';
import {
  downloadExportJob,
  requestProjectExport,
  getExportJob,
} from '../api/export.api';
import type { ExportProjectOptions } from '../types';
import { EXPORT_POLL_INTERVAL_MS, EXPORT_POLL_MAX_ATTEMPTS } from '../types';
import { pollUntil } from '../utils/poll-until';
import { triggerBrowserDownload } from '../utils/trigger-browser-download';

async function waitForCompletedExport(exportJobId: string) {
  return pollUntil(
    () => getExportJob(exportJobId),
    (job) => job.exportStatus === 'completed' || job.exportStatus === 'failed',
    {
      intervalMs: EXPORT_POLL_INTERVAL_MS,
      maxAttempts: EXPORT_POLL_MAX_ATTEMPTS,
    },
  );
}

export function useExportProject(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (options: ExportProjectOptions) => {
      if (!projectId) {
        throw new Error('Project is required');
      }

      const job = await requestProjectExport(projectId, options);

      if (job.exportStatus === 'failed') {
        throw new Error(job.errorMessage ?? 'Export failed');
      }

      const completedJob =
        job.exportStatus === 'completed'
          ? job
          : await waitForCompletedExport(job.id);

      if (completedJob.exportStatus === 'failed') {
        throw new Error(completedJob.errorMessage ?? 'Export failed');
      }

      const { blob, filename } = await downloadExportJob(completedJob.id);
      triggerBrowserDownload(blob, filename);
      return filename;
    },
  });
}
