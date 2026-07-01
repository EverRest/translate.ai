import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../../shared/ui/use-toast';
import { downloadExcelImport, excelDownloadUrl } from '../api/excel.api';
import {
  useDeltaTranslateExcel,
  useExcelImportProfile,
  useExcelImportSession,
  usePreviewExcelImport,
  useSaveExcelImportProfile,
} from '../hooks/useExcelImport';
import type {
  ExcelImportSession,
  ExcelImportStats,
  ExcelPreviewRow,
} from '../types/excel.types';

type ExcelStep = 'upload' | 'preview' | 'translating' | 'download';

export function ExcelImportPanel({ projectId }: { projectId: string }) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ExcelStep>('upload');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const profile = useExcelImportProfile(projectId);
  const saveProfile = useSaveExcelImportProfile(projectId);
  const preview = usePreviewExcelImport(projectId);
  const deltaTranslate = useDeltaTranslateExcel(projectId);
  const sessionQuery = useExcelImportSession(projectId, sessionId);

  const session = sessionQuery.data;
  const stats = session?.stats as ExcelImportStats | null;
  const sampleRows = (session?.sampleRows ?? []) as ExcelPreviewRow[];

  useEffect(() => {
    if (step === 'translating' && session?.status === 'download_ready') {
      setStep('download');
    }
  }, [step, session?.status]);

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const preset = profile.data?.preset ?? 'wiz_classic';
        const created = await preview.mutateAsync({
          file,
          parseRulesJson: JSON.stringify({ preset }),
        });
        setSessionId(created.id);
        setStep('preview');
        if (created.queued) {
          toast.success('Large file queued — parsing in background…');
        } else {
          toast.success(
            'Excel parsed — review empty cells before translating.',
          );
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Upload failed.');
      }
    },
    [preview, profile.data?.preset, toast],
  );

  const handleStartTranslate = async () => {
    if (!sessionId || !stats) return;
    try {
      await deltaTranslate.mutateAsync({
        sessionId,
        languages: stats.targetLanguages,
      });
      setStep('translating');
      toast.success('Translating empty cells…');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to start translation.',
      );
    }
  };

  const handleDownload = async () => {
    if (!sessionId) return;
    try {
      const blob = await downloadExcelImport(projectId, sessionId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download =
        session?.originalFilename?.replace(/\.xlsx?$/i, '-translated.xlsx') ??
        'translated-export.xlsx';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Download failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-200">
          Excel round-trip (Wiz Classic)
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Upload your client Excel export (Field ID, Scope, Key, EN, FR, ES…).
          We fill only blank target cells and return the same file layout for
          re-import.
        </p>
      </div>

      {step === 'upload' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-indigo-900/50 px-3 py-1 text-xs text-indigo-300">
              Preset: Wiz Classic
            </span>
            <button
              type="button"
              onClick={() =>
                void saveProfile.mutateAsync({
                  preset: 'wiz_classic',
                  columnMapping: profile.data?.columnMapping,
                })
              }
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Save as project default
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="mt-4 block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-500"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          {preview.isPending && (
            <p className="mt-3 text-sm text-sky-400">Parsing Excel…</p>
          )}
        </div>
      )}

      {step === 'preview' && session && stats && (
        <ExcelPreviewStep
          session={session}
          stats={stats}
          sampleRows={sampleRows}
          isParsing={
            session.status === 'parsing' || session.status === 'pending'
          }
          onStartTranslate={() => void handleStartTranslate()}
          isStarting={deltaTranslate.isPending}
          onReset={() => {
            setStep('upload');
            setSessionId(null);
          }}
        />
      )}

      {(step === 'translating' || step === 'download') && session && (
        <ExcelProgressStep
          session={session}
          onDownload={() => void handleDownload()}
          downloadUrl={excelDownloadUrl(projectId, session.id)}
          onReset={() => {
            setStep('upload');
            setSessionId(null);
          }}
        />
      )}
    </div>
  );
}

function ExcelPreviewStep({
  session,
  stats,
  sampleRows,
  isParsing,
  onStartTranslate,
  isStarting,
  onReset,
}: {
  session: ExcelImportSession;
  stats: ExcelImportStats;
  sampleRows: ExcelPreviewRow[];
  isParsing: boolean;
  onStartTranslate: () => void;
  isStarting: boolean;
  onReset: () => void;
}) {
  const totalEmpty = Object.values(stats.emptyCellsByLang).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-sm text-slate-400">
          File:{' '}
          <span className="text-slate-200">
            {session.originalFilename ?? 'upload'}
          </span>
        </p>
        <p className="mt-2 text-sm text-slate-300">
          {stats.validRows} rows ·{' '}
          <strong className="text-amber-300">{totalEmpty}</strong> empty cells
          to fill
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {Object.entries(stats.emptyCellsByLang).map(([lang, count]) => (
            <span key={lang} className="text-xs text-slate-400">
              {lang.toUpperCase()}:{' '}
              <span className="text-amber-300">{count}</span> empty
            </span>
          ))}
        </div>
      </div>

      {isParsing ? (
        <p className="text-sm text-sky-400">Parsing in background…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80 text-left text-slate-400">
                <tr>
                  <th className="px-3 py-2">Field ID</th>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">EN</th>
                  {stats.targetLanguages.map((lang) => (
                    <th key={lang} className="px-3 py-2">
                      {lang.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row) => (
                  <tr key={row.rowIndex} className="border-t border-slate-800">
                    <td className="px-3 py-2 font-mono text-xs text-slate-300">
                      {row.fieldId}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-200">
                      {row.key}
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {row.sourceText}
                    </td>
                    {stats.targetLanguages.map((lang) => (
                      <td
                        key={lang}
                        className={`px-3 py-2 ${
                          row.translations[lang]
                            ? 'text-slate-300'
                            : 'text-amber-400/80 italic'
                        }`}
                      >
                        {row.translations[lang] ?? '(empty)'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Start over
            </button>
            <button
              type="button"
              onClick={onStartTranslate}
              disabled={isStarting || totalEmpty === 0}
              className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isStarting ? 'Starting…' : `Translate ${totalEmpty} empty cells`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ExcelProgressStep({
  session,
  onDownload,
  onReset,
}: {
  session: ExcelImportSession;
  onDownload: () => void;
  downloadUrl: string;
  onReset: () => void;
}) {
  const statusLabel: Record<string, string> = {
    translating: 'AI translating empty cells…',
    composing: 'Merging translations into workbook…',
    download_ready: 'Ready to download',
    failed: 'Failed',
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      <p className="text-sm text-slate-300">
        {statusLabel[session.status] ?? session.status}
      </p>
      {session.translationJobId && session.status === 'translating' && (
        <p className="mt-1 text-xs text-slate-500">
          Job {session.translationJobId.slice(0, 8)}…
        </p>
      )}
      {session.errorMessage && (
        <p className="mt-2 text-sm text-red-400">{session.errorMessage}</p>
      )}
      {session.status === 'download_ready' && (
        <button
          type="button"
          onClick={onDownload}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Download completed Excel
        </button>
      )}
      {(session.status === 'download_ready' || session.status === 'failed') && (
        <button
          type="button"
          onClick={onReset}
          className="mt-3 ml-3 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Import another file
        </button>
      )}
    </div>
  );
}
