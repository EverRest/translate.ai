import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../../../features/auth/store/auth.store';
import { useToast } from '../../../shared/ui/use-toast';
import { createJob } from '../../translation-jobs/api/jobs.api';
import { useProjectLanguages } from '../../project-settings/hooks/useProjectSettings';
import { bulkImportKeys } from '../../translation-keys/api/translation-keys.api';
import {
  useDeleteTranslationKey,
  useRefetchTranslationKeys,
} from '../../translation-keys/hooks/useTranslationKeys';
import { useInfiniteKeys } from '../hooks/useInfiniteKeys';
import type { Project } from '../../projects/types';
import { deleteAllTranslations } from '../api/translations.api';
import {
  useTranslations,
  useRefetchTranslations,
} from '../hooks/useTranslations';
import type {
  GridFilters,
  SortField,
  Translation,
  TranslationRow,
} from '../types';

const ROW_HEIGHT = 52;
const OVERSCAN = 5;

const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';

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
        | {
            type: 'translation';
            key: string;
            sourceText: string;
            language: string;
            value: string;
            status: string;
          }
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

function BulkMenu({
  onImport,
  onExport,
  onDeleteAll,
  isImporting,
  hasRows,
}: {
  onImport: () => void;
  onExport: () => void;
  onDeleteAll: () => void;
  isImporting: boolean;
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
        <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
          <button
            type="button"
            disabled={isImporting}
            onClick={() => {
              close();
              onImport();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            ↑ Import Excel
          </button>
          <button
            type="button"
            disabled={!hasRows}
            onClick={() => {
              close();
              onExport();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            ↓ Export Excel
          </button>
          <div className="my-1 border-t border-slate-700" />
          <button
            type="button"
            onClick={() => {
              close();
              onDeleteAll();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-slate-700"
          >
            ✕ Delete all translations
          </button>
        </div>
      )}
    </div>
  );
}

export function ProjectTranslationsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();

  const toast = useToast();
  const refetchTranslations = useRefetchTranslations(projectId ?? '');
  const refetchKeys = useRefetchTranslationKeys(projectId ?? '');

  const { data: langData } = useProjectLanguages(projectId);
  const { data: translationsData, isLoading: translationsLoading } =
    useTranslations(projectId);
  const deleteKey = useDeleteTranslationKey(projectId ?? '');

  const languages = useMemo(
    () => (langData ?? []).filter((l) => !l.isDefault),
    [langData],
  );
  const defaultLang = useMemo(
    () => langData?.find((l) => l.isDefault),
    [langData],
  );

  const [filters, setFilters] = useState<GridFilters>({
    search: '',
    status: '',
    sortField: 'key',
    sortDir: 'asc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setFilters((f) => ({ ...f, search: searchInput }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    keys: allKeys,
    total: keysTotal,
    isLoading: keysLoading,
    hasMore: keysHasMore,
    loadMore: loadMoreKeys,
    refetch: refetchInfiniteKeys,
  } = useInfiniteKeys(projectId, debouncedSearch);

  const [translatingKeys, setTranslatingKeys] = useState<Set<string>>(
    new Set(),
  );
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const activeToastRef = useRef<string | null>(null);
  const [liveTranslations, setLiveTranslations] = useState<
    Map<string, Translation>
  >(new Map());

  const handleSseTranslation = (t: Translation) => {
    setLiveTranslations((prev) => {
      const next = new Map(prev);
      next.set(`${t.key}:${t.language}`, t);
      return next;
    });
  };

  const rows = useMemo<TranslationRow[]>(() => {
    const allTranslations = translationsData?.items ?? [];
    const byKey = new Map<string, Record<string, Translation>>();
    for (const t of allTranslations) {
      if (!byKey.has(t.key)) byKey.set(t.key, {});
      byKey.get(t.key)![t.language] = t;
    }
    for (const [pairKey, t] of liveTranslations) {
      const [key] = pairKey.split(':');
      if (!byKey.has(key)) byKey.set(key, {});
      byKey.get(key)![t.language] = t;
    }
    return allKeys.map((k) => ({
      keyId: k.id,
      key: k.key,
      sourceText: k.sourceText,
      translations: byKey.get(k.key) ?? {},
      translating: translatingKeys.has(k.id),
    }));
  }, [allKeys, translationsData, liveTranslations, translatingKeys]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (filters.status) {
      result = result.filter((r) =>
        Object.values(r.translations).some((t) => t?.status === filters.status),
      );
    }
    return [...result].sort((a, b) => {
      const field = filters.sortField;
      const cmp =
        a[field].toLowerCase() < b[field].toLowerCase()
          ? -1
          : a[field].toLowerCase() > b[field].toLowerCase()
            ? 1
            : 0;
      return filters.sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, filters]);

  // ─── Virtual scroll ────────────────────────────────────────────────────────
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const scrollEl = useRef<HTMLDivElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  // ref callback — fires whenever the div mounts/unmounts
  const containerRefCb = useCallback((el: HTMLDivElement | null) => {
    // cleanup previous
    if (scrollEl.current) {
      scrollEl.current.removeEventListener('scroll', onScrollHandler);
      roRef.current?.disconnect();
    }
    scrollEl.current = el;
    if (!el) return;
    setContainerHeight(el.clientHeight);
    setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScrollHandler, { passive: true });
    roRef.current = new ResizeObserver(() =>
      setContainerHeight(el.clientHeight),
    );
    roRef.current.observe(el);
  }, []);

  function onScrollHandler(this: HTMLDivElement) {
    setScrollTop(this.scrollTop);
  }

  useEffect(() => {
    return () => {
      if (scrollEl.current)
        scrollEl.current.removeEventListener('scroll', onScrollHandler);
      roRef.current?.disconnect();
    };
  }, []);

  // Total virtual height uses server total (for correct scrollbar)
  const virtualTotal = filters.status
    ? filteredRows.length
    : Math.max(keysTotal, filteredRows.length);
  const totalHeight = virtualTotal * ROW_HEIGHT;
  const visibleStart = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN,
  );
  const visibleEnd = Math.min(
    virtualTotal - 1,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN,
  );
  const offsetY = visibleStart * ROW_HEIGHT;
  const visibleRows = filteredRows.slice(visibleStart, visibleEnd + 1);

  // Load next chunk when approaching end of loaded keys
  useEffect(() => {
    if (visibleEnd >= allKeys.length - 20 && keysHasMore && !keysLoading) {
      loadMoreKeys();
    }
  }, [visibleEnd, allKeys.length, keysHasMore, keysLoading, loadMoreKeys]);

  // ─── Job / SSE ─────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    await refetchTranslations();
    setLiveTranslations(new Map());
    setTranslatingKeys(new Set());
    if (activeToastRef.current) {
      toast.update(activeToastRef.current, 'Translation complete ✓', 'success');
      activeToastRef.current = null;
    }
    setActiveJobId(null);
  };
  const handleError = (msg: string) => {
    setLiveTranslations(new Map());
    setTranslatingKeys(new Set());
    if (activeToastRef.current) {
      toast.update(activeToastRef.current, msg, 'error');
      activeToastRef.current = null;
    }
    setActiveJobId(null);
  };
  useJobSSE(
    activeJobId,
    projectId ?? '',
    handleSseTranslation,
    handleComplete,
    handleError,
  );

  const startJob = async (
    keyNames: string[],
    keyIds: string[],
    label: string,
  ) => {
    if (!projectId) return;
    const targetLangs = languages.map((l) => l.code);
    if (targetLangs.length === 0) {
      toast.error('No target languages configured. Add languages in Settings.');
      return;
    }
    const toastId = toast.loading(label);
    activeToastRef.current = toastId;
    setTranslatingKeys(new Set(keyIds));
    try {
      const job = await createJob({
        projectId,
        languages: targetLangs,
        keys: keyNames,
      });
      setActiveJobId(job.jobId);
    } catch (err) {
      toast.update(
        toastId,
        err instanceof Error ? err.message : 'Failed to start translation job.',
        'error',
      );
      activeToastRef.current = null;
      setTranslatingKeys(new Set());
    }
  };

  const handleTranslateAll = () => {
    if (filteredRows.length === 0) return;
    void startJob(
      filteredRows.map((r) => r.key),
      filteredRows.map((r) => r.keyId),
      `Translating ${filteredRows.length} key${filteredRows.length === 1 ? '' : 's'}…`,
    );
  };
  const handleTranslateRow = (row: TranslationRow) =>
    void startJob([row.key], [row.keyId], `Translating "${row.key}"…`);
  const handleDeleteRow = (row: TranslationRow) => {
    if (
      !window.confirm(
        `Delete key "${row.key}"? All translations will be removed.`,
      )
    )
      return;
    deleteKey.mutate(row.keyId, {
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : 'Failed to delete key.',
        ),
    });
  };

  const toggleSort = (field: SortField) => {
    setFilters((f) => ({
      ...f,
      sortField: field,
      sortDir: f.sortField === field && f.sortDir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDeleteAll = async () => {
    if (!projectId) return;
    if (
      !window.confirm(
        'Delete ALL translations for this project? This cannot be undone.',
      )
    )
      return;
    const toastId = toast.loading('Deleting all translations…');
    try {
      const result = await deleteAllTranslations(projectId);
      toast.update(
        toastId,
        `Deleted ${result.deleted} translations`,
        'success',
      );
      setLiveTranslations(new Map());
      await refetchTranslations();
    } catch (err) {
      toast.update(
        toastId,
        err instanceof Error ? err.message : 'Delete failed.',
        'error',
      );
    }
  };

  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    e.target.value = '';
    setIsImporting(true);
    const toastId = toast.loading('Parsing Excel file…');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const sheetRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
        defval: '',
      });
      const keys = sheetRows
        .filter(
          (r) =>
            (r['Type'] ?? r['type'] ?? '').toString().toLowerCase() === 'title',
        )
        .map((r) => ({
          key: (r['Field Id'] ?? r['field_id'] ?? r['FieldId'] ?? '')
            .toString()
            .trim(),
          sourceText: (r['Field'] ?? r['field'] ?? '').toString().trim(),
        }))
        .filter((k) => k.key && k.sourceText);
      if (keys.length === 0) {
        toast.update(toastId, 'No valid title rows found in file.', 'error');
        return;
      }
      toast.update(toastId, `Importing ${keys.length} keys…`, 'loading');
      const result = await bulkImportKeys(projectId, keys);
      toast.update(
        toastId,
        `Imported ${result.created} of ${result.total} keys`,
        'success',
      );
      await Promise.all([
        refetchInfiniteKeys(),
        refetchKeys(),
        refetchTranslations(),
      ]);
    } catch (err) {
      toast.update(
        toastId,
        err instanceof Error ? err.message : 'Import failed.',
        'error',
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    const langCodes = languages.map((l) => l.code);
    const wsData = [
      ['Field Id', 'Type', 'Field', ...langCodes],
      ...rows.map((r) => [
        r.key,
        'title',
        r.sourceText,
        ...langCodes.map((lang) => r.translations[lang]?.value ?? ''),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Translations');
    XLSX.writeFile(wb, `translations-export.xlsx`);
  };

  const isInitialLoading =
    (keysLoading && allKeys.length === 0) || translationsLoading;
  const isTranslating = translatingKeys.size > 0;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (filters.sortField !== field)
      return <span className="ml-1 text-slate-600">↕</span>;
    return (
      <span className="ml-1 text-sky-400">
        {filters.sortDir === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <section className="flex h-[calc(100vh-200px)] flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-white">Translations</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {allKeys.length}
            {keysHasMore ? ` / ${keysTotal}` : ''} key
            {keysTotal === 1 ? '' : 's'}
            {debouncedSearch && ` matching "${debouncedSearch}"`}
            {keysLoading && allKeys.length > 0 && (
              <span className="ml-2 text-slate-500">loading…</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={importFileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
          <button
            type="button"
            disabled={isTranslating || filteredRows.length === 0}
            onClick={handleTranslateAll}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {isTranslating ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Translating…
              </>
            ) : (
              'Translate all'
            )}
          </button>
          <BulkMenu
            onImport={() => importFileRef.current?.click()}
            onExport={handleExport}
            onDeleteAll={() => void handleDeleteAll()}
            isImporting={isImporting}
            hasRows={rows.length > 0}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search keys or source text…"
          className="w-64 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500"
        />
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
        </select>
      </div>

      {!isInitialLoading && languages.length === 0 && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
          No target languages configured. Add them in{' '}
          <span className="font-medium">Settings → Languages</span>.
        </div>
      )}

      {/* Grid — always mounted so scroll listener is attached */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-800">
        {/* Sticky header */}
        <div className="flex shrink-0 border-b border-slate-800 bg-slate-900">
          <div className="flex w-48 shrink-0 items-center gap-1 border-r border-slate-800 px-4 py-3">
            <button
              type="button"
              onClick={() => toggleSort('key')}
              className="flex items-center text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-white"
            >
              Key <SortIcon field="key" />
            </button>
          </div>
          <div className="flex w-56 shrink-0 items-center gap-1 border-r border-slate-800 px-4 py-3">
            <button
              type="button"
              onClick={() => toggleSort('sourceText')}
              className="flex items-center text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-white"
            >
              {defaultLang?.code.toUpperCase() ?? 'Source'}{' '}
              <SortIcon field="sourceText" />
            </button>
          </div>
          {languages.map((lang) => (
            <div
              key={lang.id}
              className="flex w-48 shrink-0 items-center border-r border-slate-800 px-4 py-3 last:border-r-0"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {lang.code}
              </span>
            </div>
          ))}
          <div className="flex w-28 shrink-0 items-center px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Actions
            </span>
          </div>
        </div>

        {/* Scrollable body — ALWAYS in DOM */}
        <div
          ref={containerRefCb}
          className="relative flex-1 overflow-x-auto overflow-y-auto bg-slate-900/40"
          style={{ overflowAnchor: 'none' }}
        >
          {isInitialLoading && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-400">Loading translations…</p>
            </div>
          )}

          {!isInitialLoading && filteredRows.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-slate-400">
                {filters.search
                  ? 'No keys match your search.'
                  : 'No translation keys yet.'}
              </p>
            </div>
          )}

          {!isInitialLoading && filteredRows.length > 0 && (
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${offsetY}px)`,
                }}
              >
                {visibleRows.map((row) => (
                  <GridRow
                    key={row.keyId}
                    row={row}
                    languages={languages.map((l) => l.code)}
                    onTranslate={handleTranslateRow}
                    onDelete={handleDeleteRow}
                    isDeleting={
                      deleteKey.isPending && deleteKey.variables === row.keyId
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type GridRowProps = {
  row: TranslationRow;
  languages: string[];
  onTranslate: (row: TranslationRow) => void;
  onDelete: (row: TranslationRow) => void;
  isDeleting: boolean;
};

function GridRow({
  row,
  languages,
  onTranslate,
  onDelete,
  isDeleting,
}: GridRowProps) {
  return (
    <div
      className={[
        'flex border-b border-slate-800 transition-colors hover:bg-slate-800/30',
        isDeleting && 'opacity-40',
        row.translating && 'bg-sky-950/10',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height: ROW_HEIGHT }}
    >
      <div className="flex w-48 shrink-0 items-center border-r border-slate-800 px-4">
        <span
          className="truncate font-mono text-xs text-slate-300"
          title={row.key}
        >
          {row.key}
        </span>
      </div>
      <div className="flex w-56 shrink-0 items-center border-r border-slate-800 px-4">
        <span
          className="truncate text-sm text-slate-200"
          title={row.sourceText}
        >
          {row.sourceText}
        </span>
      </div>
      {languages.map((lang) => {
        const t = row.translations[lang];
        return (
          <div
            key={lang}
            className="flex w-48 shrink-0 items-center border-r border-slate-800 px-2 last:border-r-0"
          >
            {row.translating && !t ? (
              <span className="flex items-center gap-1.5 text-xs text-sky-500">
                <svg
                  className="h-3 w-3 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                translating…
              </span>
            ) : t ? (
              <TranslationCell translation={t} />
            ) : (
              <span className="text-xs text-slate-600">—</span>
            )}
          </div>
        );
      })}
      <div className="flex w-28 shrink-0 items-center gap-1 px-2">
        <button
          type="button"
          disabled={row.translating || isDeleting}
          onClick={() => onTranslate(row)}
          title="Translate this key"
          className="rounded px-2 py-1 text-xs text-sky-400 hover:bg-sky-950/40 hover:text-sky-300 disabled:opacity-30"
        >
          Translate
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => onDelete(row)}
          title="Delete key"
          className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-30"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function TranslationCell({
  translation,
}: {
  translation: NonNullable<TranslationRow['translations'][string]>;
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(translation.value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setLocalValue(translation.value), [translation.value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

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
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') setEditing(false);
        }}
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
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[translation.status] ?? 'bg-slate-500'}`}
      />
      <span className="truncate text-sm text-slate-200">{localValue}</span>
    </button>
  );
}
