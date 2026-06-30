import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useProjectLanguages } from '../../project-settings/hooks/useProjectSettings';
import type { Project } from '../../projects/types';
import { useToast } from '../../../shared/ui/use-toast';
import { useExportProject } from '../hooks/useExportProject';
import {
  EXPORT_FORMAT_OPTIONS,
  EXPORT_STATUS_OPTIONS,
  type ExportFormat,
  type TranslationExportStatus,
} from '../types';

export function ProjectExportPage() {
  const toast = useToast();
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();

  const [format, setFormat] = useState<ExportFormat>('json');
  const [language, setLanguage] = useState('');
  const [status, setStatus] = useState<TranslationExportStatus>('published');

  const languages = useProjectLanguages(projectId);
  const exportProject = useExportProject(projectId);

  const handleDownload = async () => {
    try {
      const filename = await exportProject.mutateAsync({
        format,
        language: language || undefined,
        status,
      });
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed.');
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white">Export translations</h2>
        <p className="mt-1 text-sm text-slate-400">
          Download project translations as a file. Large exports (&gt;1000 rows)
          run in the background — the page polls until the file is ready.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Format</span>
            <select
              value={format}
              onChange={(event) =>
                setFormat(event.target.value as ExportFormat)
              }
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              {EXPORT_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Language</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={languages.isLoading}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 disabled:opacity-50"
            >
              <option value="">All languages</option>
              {(languages.data ?? []).map((item) => (
                <option key={item.id} value={item.code}>
                  {item.code}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Translation status</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as TranslationExportStatus)
              }
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              {EXPORT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={exportProject.isPending || !projectId}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {exportProject.isPending ? 'Exporting…' : 'Download'}
          </button>
          <p className="text-sm text-slate-500">
            Exports are recorded in audit logs.
          </p>
        </div>
      </div>
    </section>
  );
}
