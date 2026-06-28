import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../../../features/auth/store/auth.store';
import { useToast } from '../../../shared/ui/use-toast';
import type {
  BulkActionDef,
  GridFetchParams,
  GridRef,
} from '../../../shared/ui/DataGrid';
import { DataGrid, RowMenu } from '../../../shared/ui/DataGrid';
import { cancelJob, createJob } from '../../translation-jobs/api/jobs.api';
import { useProjectLanguages } from '../../project-settings/hooks/useProjectSettings';
import {
  bulkImportKeys,
  listTranslationKeys,
} from '../../translation-keys/api/translation-keys.api';
import { useDeleteTranslationKey, useRefetchTranslationKeys } from '../../translation-keys/hooks/useTranslationKeys';
import type { Project } from '../../projects/types';
import { deleteAllTranslations } from '../api/translations.api';
import { useTranslations, useRefetchTranslations } from '../hooks/useTranslations';
import type { Translation } from '../types';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';

const CHUNK_SIZE = 100;
const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────
type KeyRow = { keyId: string; key: string; sourceText: string };

// ─── SSE hook ────────────────────────────────────────────────────────────────
function useJobSSE(
  jobId: string | null,
  projectId: string,
  onTranslation: (t: Translation) => void,
  onComplete: () => void,
  onError: (msg: string) => void,
) {
  useEffect(() => {
    if (!jobId) return;
    const token = useAuthStore.getState().accessToken ?? '';
    const url = `${baseUrl}/jobs/${jobId}/stream?projectId=${projectId}&token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      type SsePayload =
        | { type: 'translation'; key: string; sourceText: string; language: string; value: string; status: string }
        | { type: 'done'; jobStatus: string }
        | { type: 'error'; message: string };
      const data = JSON.parse(e.data as string) as SsePayload;
      if (data.type === 'translation') {
        onTranslation({
          id: '',
          key: data.key,
          sourceText: data.sourceText,
          language: data.language,
          value: data.value,
          status: data.status,
          provider: null,
          version: 1,
        });
      } else if (data.type === 'done') {
        es.close();
        if (data.jobStatus === 'completed') onComplete();
        else onError('Translation failed. Check if the AI model is available.');
      } else if (data.type === 'error') {
        es.close();
        onError(data.message);
      }
    };
    es.onerror = () => {
      es.close();
      onError('Could not reach the translation service.');
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);
}

// ─── TranslateModal ───────────────────────────────────────────────────────────
type Language = { id: string; code: string; isDefault: boolean };

function TranslateModal({
  languages,
  isTranslating,
  onConfirm,
  onClose,
}: {
  languages: Language[];
  isTranslating: boolean;
  onConfirm: (langs: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(languages.map((l) => l.code)));
  const allChecked = selected.size === languages.length;

  const toggle = (code: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
        <div className="border-b border-slate-700 px-6 py-4">
          <h2 className="text-base font-semibold text-white">Translate all keys</h2>
          <p className="mt-1 text-sm text-slate-400">Select target languages to translate into</p>
        </div>

        <div className="px-6 py-3">
          <label className="flex cursor-pointer items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={() => setSelected(allChecked ? new Set() : new Set(languages.map((l) => l.code)))}
              className="h-4 w-4 accent-sky-500"
            />
            <span className="text-sm font-medium text-slate-300">Select all</span>
          </label>
          <div className="my-2 border-t border-slate-700/60" />
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {languages.map((l) => (
              <label key={l.code} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-700/50">
                <input
                  type="checkbox"
                  checked={selected.has(l.code)}
                  onChange={() => toggle(l.code)}
                  className="h-4 w-4 accent-sky-500"
                />
                <span className="flex-1 text-sm text-slate-200">{l.code.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selected.size === 0 || isTranslating}
            onClick={() => onConfirm(Array.from(selected))}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            Translate {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BulkMenu ────────────────────────────────────────────────────────────────
function BulkMenu({
  onTranslateAll,
  onImport,
  onExport,
  onDeleteAll,
  isImporting,
  isTranslating,
  hasRows,
}: {
  onTranslateAll: () => void;
  onImport: () => void;
  onExport: () => void;
  onDeleteAll: () => void;
  isImporting: boolean;
  isTranslating: boolean;
  hasRows: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:border-slate-400 hover:text-white"
      >
        Actions
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
          <button
            type="button"
            disabled={isTranslating || !hasRows}
            onClick={() => { close(); onTranslateAll(); }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-sky-400 hover:bg-slate-700 disabled:opacity-50"
          >
            {isTranslating ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Translating…
              </>
            ) : '⚡ Translate all'}
          </button>
          <div className="my-1 border-t border-slate-700" />
          <button
            type="button"
            disabled={isImporting}
            onClick={() => { close(); onImport(); }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            ↑ Import Excel
          </button>
          <button
            type="button"
            disabled={!hasRows}
            onClick={() => { close(); onExport(); }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            ↓ Export Excel
          </button>
          <div className="my-1 border-t border-slate-700" />
          <button
            type="button"
            onClick={() => { close(); onDeleteAll(); }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-slate-700"
          >
            ✕ Delete all translations
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TranslationCell ─────────────────────────────────────────────────────────
function TranslationCell({ translation }: { translation: Translation }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(translation.value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setLocalValue(translation.value), [translation.value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const statusDot: Record<string, string> = {
    draft: 'bg-slate-500',
    review: 'bg-amber-500',
    approved: 'bg-emerald-500',
    published: 'bg-sky-500',
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false); }}
        className="w-full rounded border border-sky-600 bg-slate-800 px-2 py-1 text-sm text-white outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-slate-700/40"
      title={`${localValue} (${translation.status}) — click to edit`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[translation.status] ?? 'bg-slate-500'}`} />
      <span className="truncate text-sm text-slate-200">{localValue}</span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ProjectTranslationsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();

  const toast = useToast();
  const confirm = useConfirm();
  const refetchTranslations = useRefetchTranslations(projectId ?? '');
  const refetchKeys = useRefetchTranslationKeys(projectId ?? '');

  const { data: langData } = useProjectLanguages(projectId);
  const { data: translationsData } = useTranslations(projectId);
  const deleteKey = useDeleteTranslationKey(projectId ?? '');

  const languages = useMemo(() => (langData ?? []).filter((l) => !l.isDefault), [langData]);
  const defaultLang = useMemo(() => langData?.find((l) => l.isDefault), [langData]);

  // ── gridRef ───────────────────────────────────────────────────────────────
  const gridRef = useRef<GridRef | null>(null);

  // ── Live translations (SSE) ───────────────────────────────────────────────
  const [translatingKeys, setTranslatingKeys] = useState<Set<string>>(new Set());
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const activeToastRef = useRef<string | null>(null);
  const [liveTranslations, setLiveTranslations] = useState<Map<string, Translation>>(new Map());

  const handleSseTranslation = useCallback((t: Translation) => {
    setLiveTranslations((prev) => {
      const next = new Map(prev);
      next.set(`${t.key}:${t.language}`, t);
      return next;
    });
  }, []);

  // ── byKey lookup map ─────────────────────────────────────────────────────
  const byKey = useMemo(() => {
    const allTranslations = translationsData?.items ?? [];
    const map = new Map<string, Record<string, Translation>>();
    for (const t of allTranslations) {
      if (!map.has(t.key)) map.set(t.key, {});
      map.get(t.key)![t.language] = t;
    }
    for (const [pairKey, t] of liveTranslations) {
      const [key] = pairKey.split(':');
      if (!map.has(key)) map.set(key, {});
      map.get(key)![t.language] = t;
    }
    return map;
  }, [translationsData, liveTranslations]);

  // ── translate modal ───────────────────────────────────────────────────────
  const [translateModalOpen, setTranslateModalOpen] = useState(false);

  // ── startJob ──────────────────────────────────────────────────────────────
  const startJob = useCallback(
    async (keyNames: string[], keyIds: string[], label: string, targetLangs?: string[]) => {
      if (!projectId) return;
      const langs = targetLangs ?? languages.map((l) => l.code);
      if (langs.length === 0) {
        toast.error('No target languages configured. Add languages in Settings.');
        return;
      }
      const toastId = toast.loading(label);
      activeToastRef.current = toastId;
      setTranslatingKeys(new Set(keyIds));
      try {
        const job = await createJob({ projectId, languages: langs, keys: keyNames });
        setActiveJobId(job.jobId);
      } catch (err) {
        toast.update(toastId, err instanceof Error ? err.message : 'Failed to start translation job.', 'error');
        activeToastRef.current = null;
        setTranslatingKeys(new Set());
      }
    },
    [projectId, languages, toast],
  );

  // ── handleDeleteRow ───────────────────────────────────────────────────────
  const handleDeleteRow = useCallback(
    async (row: KeyRow) => {
      if (!await confirm({ title: `Delete key "${row.key}"?`, description: 'All translations for this key will be removed.', danger: true, confirmLabel: 'Delete' })) return;
      deleteKey.mutate(row.keyId, {
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete key.'),
        onSuccess: () => gridRef.current?.refetch(),
      });
    },
    [deleteKey, toast],
  );

  // ── SSE callbacks ─────────────────────────────────────────────────────────
  const handleComplete = useCallback(async () => {
    await refetchTranslations();
    setLiveTranslations(new Map());
    setTranslatingKeys(new Set());
    if (activeToastRef.current) {
      toast.update(activeToastRef.current, 'Translation complete ✓', 'success');
      activeToastRef.current = null;
    }
    setActiveJobId(null);
  }, [refetchTranslations, toast]);

  const handleError = useCallback((msg: string) => {
    setLiveTranslations(new Map());
    setTranslatingKeys(new Set());
    if (activeToastRef.current) {
      toast.update(activeToastRef.current, msg, 'error');
      activeToastRef.current = null;
    }
    setActiveJobId(null);
  }, [toast]);

  useJobSSE(activeJobId, projectId ?? '', handleSseTranslation, handleComplete, handleError);

  // ── handleCancelJob ───────────────────────────────────────────────────────
  const handleCancelJob = useCallback(async () => {
    if (!activeJobId) return;
    try {
      await cancelJob(activeJobId);
      setTranslatingKeys(new Set());
      if (activeToastRef.current) {
        toast.update(activeToastRef.current, 'Translation cancelled', 'error');
        activeToastRef.current = null;
      }
      setActiveJobId(null);
    } catch {
      toast.error('Failed to cancel job.');
    }
  }, [activeJobId, toast]);

  // ── columns ────────────────────────────────────────────────────────────────
  // Capture stable refs for callbacks used inside render fns
  const startJobRef = useRef(startJob);
  startJobRef.current = startJob;
  const handleDeleteRowRef = useRef(handleDeleteRow);
  handleDeleteRowRef.current = handleDeleteRow;
  const translatingKeysRef = useRef(translatingKeys);
  translatingKeysRef.current = translatingKeys;
  const deleteKeyRef = useRef(deleteKey);
  deleteKeyRef.current = deleteKey;

  const columns = useMemo(() => {
    return [
      {
        key: 'key',
        header: 'Key',
        width: 192,
        sortable: true,
        sortValue: (row: KeyRow) => row.key,
        filterable: true,
        filterValue: (row: KeyRow) => row.key,
        render: (row: KeyRow) => (
          <span className="truncate font-mono text-xs text-slate-300" title={row.key}>
            {row.key}
          </span>
        ),
      },
      {
        key: 'sourceText',
        header: defaultLang?.code.toUpperCase() ?? 'Source',
        width: 224,
        sortable: true,
        sortValue: (row: KeyRow) => row.sourceText,
        filterable: true,
        filterValue: (row: KeyRow) => row.sourceText,
        render: (row: KeyRow) => (
          <span className="truncate text-sm text-slate-200" title={row.sourceText}>
            {row.sourceText}
          </span>
        ),
      },
      ...languages.map((lang) => ({
        key: `lang_${lang.code}`,
        header: lang.code.toUpperCase(),
        width: 192,
        sortable: true,
        sortValue: (row: KeyRow) => byKey.get(row.key)?.[lang.code]?.value ?? '',
        filterable: true,
        filterValue: (row: KeyRow) => byKey.get(row.key)?.[lang.code]?.value ?? '',
        render: (row: KeyRow) => {
          const langMap = byKey.get(row.key);
          const t = langMap?.[lang.code];
          const isTranslating = translatingKeys.has(row.keyId);
          if (isTranslating && !t) {
            return (
              <span className="flex items-center gap-1.5 text-xs text-sky-500">
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                translating…
              </span>
            );
          }
          if (t) return <TranslationCell translation={t} />;
          return <span className="text-xs text-slate-600">—</span>;
        },
      })),
      {
        key: '_actions',
        header: '',
        width: 32,
        sortable: false,
        noPadding: true,
        overflow: 'visible',
        sticky: 'right',
        render: (row: KeyRow) => (
          <RowMenu items={[
            {
              label: 'Translate',
              onClick: () => void startJobRef.current([row.key], [row.keyId], `Translating "${row.key}"…`),
            },
            {
              label: 'Delete',
              variant: 'danger',
              onClick: () => void handleDeleteRowRef.current(row),
            },
          ]} />
        ),
      },
    ];
  }, [defaultLang, languages, byKey, translatingKeys, deleteKey.isPending, deleteKey.variables]);

  // ── fetchFn ───────────────────────────────────────────────────────────────
  const fetchFn = useCallback(async (params: GridFetchParams) => {
    const pg = Math.floor(params.offset / CHUNK_SIZE) + 1;
    const data = await listTranslationKeys(projectId!, pg, CHUNK_SIZE, params.search);
    return {
      items: data.items.map((k) => ({ keyId: k.id, key: k.key, sourceText: k.sourceText ?? '' })),
      total: data.meta.total,
    };
  }, [projectId]);

  // ── bulkActions ───────────────────────────────────────────────────────────
  const bulkActions = useMemo((): BulkActionDef<KeyRow>[] => [
    {
      key: 'translate',
      label: 'Translate selected',
      variant: 'primary',
      onAction: ({ selectedRows, clearSelection }) => {
        void startJobRef.current(
          selectedRows.map((r) => r.key),
          selectedRows.map((r) => r.keyId),
          `Translating ${selectedRows.length} key${selectedRows.length === 1 ? '' : 's'}…`,
        );
        clearSelection();
      },
    },
    {
      key: 'delete',
      label: 'Delete selected',
      variant: 'danger',
      onAction: async ({ selectedRows, clearSelection, refetch }) => {
        if (!await confirm({ title: `Delete ${selectedRows.length} key${selectedRows.length === 1 ? '' : 's'}?`, description: 'All translations for these keys will be removed.', danger: true, confirmLabel: 'Delete' })) return;
        if (!projectId) return;
        for (const row of selectedRows) {
          await deleteKey.mutateAsync(row.keyId).catch(() => undefined);
        }
        clearSelection();
        refetch();
      },
    },
  ], [projectId, deleteKey]);

  // ── handleDeleteAll ───────────────────────────────────────────────────────
  const handleDeleteAll = useCallback(async () => {
    if (!projectId) return;
    if (!await confirm({ title: 'Delete all translations?', description: 'All translations for this project will be permanently removed. This cannot be undone.', danger: true, confirmLabel: 'Delete all' })) return;
    const toastId = toast.loading('Deleting all translations…');
    try {
      const result = await deleteAllTranslations(projectId);
      toast.update(toastId, `Deleted ${result.deleted} translations`, 'success');
      setLiveTranslations(new Map());
      await refetchTranslations();
      gridRef.current?.refetch();
    } catch (err) {
      toast.update(toastId, err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  }, [projectId, toast, refetchTranslations]);

  // ── Import / Export ───────────────────────────────────────────────────────
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    e.target.value = '';
    setIsImporting(true);
    const toastId = toast.loading('Parsing Excel file…');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const sheetRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
      const keys = sheetRows
        .filter((r) => (r['Type'] ?? r['type'] ?? '').toString().toLowerCase() === 'title')
        .map((r) => ({
          key: (r['Field Id'] ?? r['field_id'] ?? r['FieldId'] ?? '').toString().trim(),
          sourceText: (r['Field'] ?? r['field'] ?? '').toString().trim(),
        }))
        .filter((k) => k.key && k.sourceText);
      if (keys.length === 0) {
        toast.update(toastId, 'No valid title rows found in file.', 'error');
        return;
      }
      toast.update(toastId, `Importing ${keys.length} keys…`, 'loading');
      const result = await bulkImportKeys(projectId, keys);
      toast.update(toastId, `Imported ${result.created} of ${result.total} keys`, 'success');
      await Promise.all([refetchKeys(), refetchTranslations()]);
      gridRef.current?.refetch();
    } catch (err) {
      toast.update(toastId, err instanceof Error ? err.message : 'Import failed.', 'error');
    } finally {
      setIsImporting(false);
    }
  }, [projectId, toast, refetchKeys, refetchTranslations]);

  const handleExport = useCallback(() => {
    const langCodes = languages.map((l) => l.code);
    const allTranslations = translationsData?.items ?? [];
    const byKeyExport = new Map<string, Record<string, string>>();
    for (const t of allTranslations) {
      if (!byKeyExport.has(t.key)) byKeyExport.set(t.key, {});
      byKeyExport.get(t.key)![t.language] = t.value;
    }
    const keyList = Array.from(new Set(allTranslations.map((t) => t.key))).sort();
    const wsData = [
      ['Field Id', 'Type', 'Field', ...langCodes],
      ...keyList.map((key) => {
        const langMap = byKeyExport.get(key) ?? {};
        const sourceText = allTranslations.find((t) => t.key === key)?.sourceText ?? '';
        return [key, 'title', sourceText, ...langCodes.map((lang) => langMap[lang] ?? '')];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Translations');
    XLSX.writeFile(wb, 'translations-export.xlsx');
  }, [languages, translationsData]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isTranslating = translatingKeys.size > 0;
  const showLangWarning = langData !== undefined && languages.length === 0;


  // ── Toolbar ────────────────────────────────────────────────────────────────
  const toolbar = (
    <>
      <input
        ref={importFileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImport}
      />
      {isTranslating && (
        <>
          <span className="flex items-center gap-1.5 text-sm text-sky-400">
            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Translating…
          </span>
          <button
            type="button"
            onClick={() => void handleCancelJob()}
            className="rounded-lg border border-red-700 px-3 py-1.5 text-sm text-red-400 hover:border-red-500 hover:text-red-300"
          >
            Cancel
          </button>
        </>
      )}
      <BulkMenu
        onTranslateAll={() => setTranslateModalOpen(true)}
        onImport={() => importFileRef.current?.click()}
        onExport={handleExport}
        onDeleteAll={() => void handleDeleteAll()}
        isImporting={isImporting}
        isTranslating={isTranslating}
        hasRows={(translationsData?.items.length ?? 0) > 0}
      />
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="flex h-full min-h-0 flex-col gap-3">
      {translateModalOpen && (
        <TranslateModal
          languages={languages}
          isTranslating={isTranslating}
          onClose={() => setTranslateModalOpen(false)}
          onConfirm={(langs) => {
            setTranslateModalOpen(false);
            const allKeys = Array.from(byKey.keys());
            if (allKeys.length === 0) return;
            void startJob(
              allKeys,
              [],
              `Translating ${allKeys.length} key${allKeys.length === 1 ? '' : 's'}…`,
              langs,
            );
          }}
        />
      )}
      {showLangWarning && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-300 shrink-0">
          No target languages configured. Add them in{' '}
          <span className="font-medium">Settings → Languages</span>.
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <DataGrid<KeyRow>
          columns={columns}
          fetchFn={fetchFn}
          rowKey={(row) => row.keyId}
          chunkSize={CHUNK_SIZE}
          searchPlaceholder="Search keys or source text…"
          toolbar={toolbar}
          bulkActions={bulkActions}
          emptyMessage="No translation keys yet."
          gridRef={gridRef}
          gridId="translations"
        />
      </div>
    </section>
  );
}
