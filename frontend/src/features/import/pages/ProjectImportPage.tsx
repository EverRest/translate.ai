import { useCallback, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useToast } from '../../../shared/ui/use-toast';
import type { Project } from '../../projects/types';
import { ColumnMappingFields } from '../components/ColumnMappingFields';
import { ExcelImportPanel } from '../components/ExcelImportPanel';
import {
  toParseRulesInput,
  type ColumnMapping,
} from '../utils/column-mapping.utils';
import {
  useApplyImportSession,
  useCreateImportSession,
  useImportPreview,
} from '../hooks/useImportSession';
import {
  IMPORT_ACTION_LABELS,
  type ImportDiffSummary,
  type ImportItemAction,
  type ImportSession,
} from '../types';

type WizardStep = 'upload' | 'preview' | 'done';
type ImportMode = 'confluence' | 'excel';

export function ProjectImportPage() {
  const toast = useToast();
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();

  const [importMode, setImportMode] = useState<ImportMode>('confluence');
  const [step, setStep] = useState<WizardStep>('upload');
  const [session, setSession] = useState<ImportSession | null>(null);
  const [pasteHtml, setPasteHtml] = useState('');
  const [actionFilter, setActionFilter] = useState<ImportItemAction | ''>('');
  const [page, setPage] = useState(1);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createSession = useCreateImportSession(projectId);
  const applySession = useApplyImportSession(projectId);
  const preview = useImportPreview(
    projectId,
    session?.id ?? null,
    page,
    actionFilter || undefined,
  );

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const created = await createSession.mutateAsync({
          file,
          parseRules: toParseRulesInput(columnMapping),
        });
        setSession(created);
        setStep('preview');
        setPage(1);
        toast.success('File parsed — review changes before applying.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Upload failed.');
      }
    },
    [createSession, toast, columnMapping],
  );

  const handlePaste = useCallback(async () => {
    if (!pasteHtml.trim()) {
      toast.error('Paste Confluence HTML table content first.');
      return;
    }
    try {
      const created = await createSession.mutateAsync({
        html: pasteHtml,
        parseRules: toParseRulesInput(columnMapping),
      });
      setSession(created);
      setStep('preview');
      setPage(1);
      toast.success('HTML parsed — review changes before applying.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Paste import failed.',
      );
    }
  }, [createSession, pasteHtml, toast, columnMapping]);

  const handleApply = async () => {
    if (!session) return;
    try {
      const applied = await applySession.mutateAsync({ sessionId: session.id });
      setSession(applied);
      setStep('done');
      toast.success('Import applied to project keys.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Apply failed.');
    }
  };

  const summary = session?.diffSummary as ImportDiffSummary | null;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white">Import translations</h2>
        <p className="mt-1 text-sm text-slate-400">
          Confluence documentation import or Excel round-trip for client
          exports.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setImportMode('confluence')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              importMode === 'confluence'
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Confluence
          </button>
          <button
            type="button"
            onClick={() => setImportMode('excel')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              importMode === 'excel'
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Excel round-trip
          </button>
        </div>
      </div>

      {importMode === 'excel' && projectId && (
        <ExcelImportPanel projectId={projectId} />
      )}

      {importMode === 'confluence' && step === 'upload' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-sm font-medium text-slate-200">Upload file</h3>
            <p className="mt-1 text-xs text-slate-500">
              Supported: .html, .csv, .zip (Confluence space export)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.csv,.zip"
              className="mt-4 block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-500"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            {createSession.isPending && (
              <p className="mt-3 text-sm text-sky-400">Parsing import…</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-sm font-medium text-slate-200">Paste HTML</h3>
            <p className="mt-1 text-xs text-slate-500">
              Copy a Confluence page table (Scope, Key, Default (EN), Hints)
            </p>
            <textarea
              value={pasteHtml}
              onChange={(event) => setPasteHtml(event.target.value)}
              rows={8}
              placeholder="<table>…</table>"
              className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200"
            />
            <button
              type="button"
              onClick={() => void handlePaste()}
              disabled={createSession.isPending}
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {createSession.isPending ? 'Parsing…' : 'Import pasted HTML'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 lg:col-span-2">
            <button
              type="button"
              onClick={() => setShowColumnMapping((v) => !v)}
              className="text-sm text-sky-400 hover:underline"
            >
              {showColumnMapping ? 'Hide' : 'Show'} column mapping (advanced)
            </button>
            {showColumnMapping && (
              <div className="mt-4">
                <ColumnMappingFields
                  value={columnMapping}
                  onChange={setColumnMapping}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {importMode === 'confluence' &&
        step === 'preview' &&
        session &&
        summary && (
          <div className="space-y-4">
            <DiffSummaryBar
              summary={summary}
              filename={session.originalFilename}
            />

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-400">
                Filter
                <select
                  value={actionFilter}
                  onChange={(event) => {
                    setActionFilter(
                      event.target.value as ImportItemAction | '',
                    );
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                >
                  <option value="">All actions</option>
                  {(
                    Object.keys(IMPORT_ACTION_LABELS) as ImportItemAction[]
                  ).map((action) => (
                    <option key={action} value={action}>
                      {IMPORT_ACTION_LABELS[action]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep('upload');
                  setSession(null);
                }}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={() => void handleApply()}
                disabled={applySession.isPending}
                className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {applySession.isPending ? 'Applying…' : 'Apply import'}
              </button>
            </div>

            <PreviewTable
              items={preview.data?.items ?? []}
              isLoading={preview.isLoading}
            />

            {preview.data && preview.data.meta.total > 50 && (
              <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {Math.ceil(preview.data.meta.total / 50)}
                </span>
                <button
                  type="button"
                  disabled={page * 50 >= preview.data.meta.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

      {importMode === 'confluence' && step === 'done' && session && (
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-6">
          <h3 className="text-lg font-medium text-emerald-300">
            Import complete
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            Keys from {session.originalFilename ?? 'import'} are now in the
            project. Hints appear in the Keys and Translations grids.
          </p>
          <button
            type="button"
            onClick={() => {
              setStep('upload');
              setSession(null);
              setPasteHtml('');
            }}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Import another file
          </button>
        </div>
      )}
    </section>
  );
}

function DiffSummaryBar({
  summary,
  filename,
}: {
  summary: ImportDiffSummary;
  filename: string | null;
}) {
  const chips: Array<{ label: string; count: number; className: string }> = [
    { label: 'Create', count: summary.create, className: 'text-emerald-400' },
    { label: 'Update', count: summary.update, className: 'text-sky-400' },
    {
      label: 'Unchanged',
      count: summary.unchanged,
      className: 'text-slate-400',
    },
    { label: 'Invalid', count: summary.invalid, className: 'text-amber-400' },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-sm text-slate-400">
        Preview for{' '}
        <span className="text-slate-200">{filename ?? 'import'}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-4">
        {chips.map((chip) => (
          <span key={chip.label} className={`text-sm ${chip.className}`}>
            {chip.label}: <strong>{chip.count}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewTable({
  items,
  isLoading,
}: {
  items: Array<{
    key: string;
    scope: string | null;
    sourceText: string;
    hints: string | null;
    action: ImportItemAction;
  }>;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading preview…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">No items match this filter.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900/80 text-left text-slate-400">
          <tr>
            <th className="px-3 py-2 font-medium">Action</th>
            <th className="px-3 py-2 font-medium">Scope</th>
            <th className="px-3 py-2 font-medium">Key</th>
            <th className="px-3 py-2 font-medium">Source</th>
            <th className="px-3 py-2 font-medium">Hints</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.key} className="border-t border-slate-800/80">
              <td className="px-3 py-2 text-slate-300">
                {IMPORT_ACTION_LABELS[item.action]}
              </td>
              <td className="px-3 py-2 text-slate-400">{item.scope ?? '—'}</td>
              <td className="px-3 py-2 font-mono text-xs text-slate-200">
                {item.key}
              </td>
              <td
                className="max-w-xs truncate px-3 py-2 text-slate-300"
                title={item.sourceText}
              >
                {item.sourceText}
              </td>
              <td
                className="max-w-xs truncate px-3 py-2 text-slate-400"
                title={item.hints ?? ''}
              >
                {item.hints ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
