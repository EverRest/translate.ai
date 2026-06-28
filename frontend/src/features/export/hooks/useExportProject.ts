import { useMutation } from '@tanstack/react-query';
import { downloadProjectExport } from '../api/export.api';
import type { ExportProjectOptions } from '../types';
import { triggerBrowserDownload } from '../utils/trigger-browser-download';

export function useExportProject(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (options: ExportProjectOptions) => {
      if (!projectId) {
        throw new Error('Project is required');
      }
      const { blob, filename } = await downloadProjectExport(
        projectId,
        options,
      );
      triggerBrowserDownload(blob, filename);
      return filename;
    },
  });
}
