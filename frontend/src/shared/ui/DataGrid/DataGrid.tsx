import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  BulkActionDef,
  ColumnDef,
  DataGridProps,
  GridFetchParams,
  GridPage,
  GridSort,
} from './types';

const DEFAULT_ROW_HEIGHT = 52;
const OVERSCAN = 5;
const DEFAULT_CHUNK = 50;
const MIN_COL_WIDTH = 48;

// ─── Filter types ─────────────────────────────────────────────────────────────
type FilterCondition = 'contains' | 'not_contains' | 'equals' | 'not_equals' | 'starts_with' | 'ends_with';
type ColFilter = { condition: FilterCondition; value: string };

const CONDITION_LABELS: Record<FilterCondition, string> = {
  contains: 'Contains',
  not_contains: 'Does not contain',
  equals: 'Equals',
  not_equals: 'Not equals',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
};

function applyCondition(cell: string, f: ColFilter): boolean {
  const c = cell.toLowerCase();
  const v = f.value.toLowerCase();
  if (!v) return true;
  switch (f.condition) {
    case 'contains':     return c.includes(v);
    case 'not_contains': return !c.includes(v);
    case 'equals':       return c === v;
    case 'not_equals':   return c !== v;
    case 'starts_with':  return c.startsWith(v);
    case 'ends_with':    return c.endsWith(v);
  }
}

// ─── FilterPopup ──────────────────────────────────────────────────────────────
function FilterPopup({
  active, onApply, onClear, onClose,
}: {
  active: ColFilter | null;
  onApply: (f: ColFilter) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [condition, setCondition] = useState<FilterCondition>(active?.condition ?? 'contains');
  const [value, setValue] = useState(active?.value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-slate-700 bg-slate-800 p-3 shadow-2xl">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Filter</p>
      <select value={condition} onChange={e => setCondition(e.target.value as FilterCondition)}
        className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-sky-500">
        {(Object.entries(CONDITION_LABELS) as [FilterCondition, string][]).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
      <input ref={inputRef} type="text" value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { onApply({ condition, value }); onClose(); }
          if (e.key === 'Escape') onClose();
        }}
        placeholder="Value…"
        className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-500"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => { onApply({ condition, value }); onClose(); }}
          className="flex-1 rounded-lg bg-sky-600 py-1.5 text-sm font-medium text-white hover:bg-sky-500">
          Apply
        </button>
        {active && (
          <button type="button" onClick={() => { onClear(); onClose(); }}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-400 hover:border-slate-400 hover:text-white">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── RowMenu ──────────────────────────────────────────────────────────────────
export type RowMenuItem = { label: string; variant?: 'default' | 'danger'; onClick: () => void };

export function RowMenu({ items }: { items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} className="relative flex items-center justify-center w-full h-full">
      <button type="button" onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-700 hover:text-slate-200">
        <svg viewBox="0 0 4 16" fill="currentColor" className="h-4 w-4">
          <circle cx="2" cy="2" r="1.5" /><circle cx="2" cy="8" r="1.5" /><circle cx="2" cy="14" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
          {items.map(item => (
            <button key={item.label} type="button" onClick={() => { setOpen(false); item.onClick(); }}
              className={['flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slate-700',
                item.variant === 'danger' ? 'text-red-400' : 'text-slate-200'].join(' ')}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg style={{ width: size, height: size }} className="animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SortIcon({ sort, field }: { sort: GridSort | null; field: string }) {
  if (!sort || sort.field !== field) return <span className="text-[10px] text-slate-600">↕</span>;
  return <span className="text-[10px] text-sky-400">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
}

function lsGet<V>(key: string, fallback: V): V {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as V ?? fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

// ─── DataGrid ─────────────────────────────────────────────────────────────────
export function DataGrid<T>({
  columns,
  fetchFn,
  rowKey,
  rowHeight: ROW_HEIGHT = DEFAULT_ROW_HEIGHT,
  chunkSize = DEFAULT_CHUNK,
  searchPlaceholder = 'Search…',
  filterBar,
  toolbar,
  bulkActions,
  emptyMessage = 'No items found.',
  gridRef,
  gridId,
}: DataGridProps<T>) {

  // ── Column widths (pixel values, persisted) ───────────────────────────────
  const [colWidths, setColWidths] = useState<Record<string, number>>(
    () => gridId ? lsGet<Record<string, number>>(`dg:${gridId}:widths`, {}) : {},
  );
  const getWidth = useCallback((col: ColumnDef<T>) =>
    col.sticky === 'right' ? col.width : (colWidths[col.key] ?? col.width),
  [colWidths]);

  // Debounce localStorage writes — don't write on every resize frame
  const lsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!gridId) return;
    if (lsTimerRef.current) clearTimeout(lsTimerRef.current);
    lsTimerRef.current = setTimeout(() => lsSet(`dg:${gridId}:widths`, colWidths), 400);
  }, [gridId, colWidths]);

  // ── Column visibility (persisted) ─────────────────────────────────────────
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(
    () => new Set(gridId ? lsGet<string[]>(`dg:${gridId}:hidden`, []) : []),
  );
  useEffect(() => { if (gridId) lsSet(`dg:${gridId}:hidden`, [...hiddenCols]); }, [gridId, hiddenCols]);
  const toggleColVisibility = useCallback((key: string) => {
    setHiddenCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);
  const visibleColumns = useMemo(() => columns.filter(c => !hiddenCols.has(c.key)), [columns, hiddenCols]);
  const toggleableColumns = useMemo(() => columns.filter(c => c.header !== '' && c.key !== '_actions'), [columns]);

  // ── Column filters ────────────────────────────────────────────────────────
  const [colFilters, setColFilters] = useState<Record<string, ColFilter>>({});
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const filterPopupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openFilterKey) return;
    const h = (e: MouseEvent) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(e.target as Node)) setOpenFilterKey(null);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openFilterKey]);
  const activeFilterCount = Object.values(colFilters).filter(f => f.value).length;

  // ── Column resize — DOM-only during drag, single setState on mouseup ───────
  const gridElRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback((e: React.MouseEvent, col: ColumnDef<T>) => {
    e.preventDefault();
    e.stopPropagation();

    const key = col.key;
    const startX = e.clientX;
    // Read the actual rendered pixel width of the header cell at drag start.
    const headerCell = (e.currentTarget as HTMLElement).closest('[data-col]') as HTMLElement | null;
    const startWidth = headerCell ? headerCell.getBoundingClientRect().width : (colWidths[key] ?? col.width);
    let lastW = startWidth;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMove = (ev: MouseEvent) => {
      lastW = Math.max(MIN_COL_WIDTH, startWidth + (ev.clientX - startX));
      // Apply directly to DOM — zero React re-renders during drag.
      gridElRef.current?.querySelectorAll<HTMLElement>(`[data-col="${key}"]`).forEach(el => {
        el.style.flexGrow = '0';
        el.style.flexShrink = '0';
        el.style.flexBasis = 'auto';
        el.style.width = `${lastW}px`;
        el.style.minWidth = `${lastW}px`;
        el.style.maxWidth = `${lastW}px`;
      });
    };

    const onUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      // Single React state update to persist the final width.
      setColWidths(p => ({ ...p, [key]: lastW }));
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colWidths]); // colWidths only used as fallback for startWidth

  // ── Columns panel ─────────────────────────────────────────────────────────
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const colPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!colPanelOpen) return;
    const h = (e: MouseEvent) => { if (colPanelRef.current && !colPanelRef.current.contains(e.target as Node)) setColPanelOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [colPanelOpen]);

  // ── Data fetching with offset/limit chunks ────────────────────────────────
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(false);
  const fetchFnRef = useRef(fetchFn);
  const searchRef = useRef(debouncedSearch);
  const isMountedRef = useRef(false);
  fetchFnRef.current = fetchFn;
  searchRef.current = debouncedSearch;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset on search change — NOT on sort/filter (those are client-side)
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    setItems([]); setTotal(0); hasMoreRef.current = false; setPage(0); setResetKey(k => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Fetch one chunk (page * chunkSize offset)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      isLoadingRef.current = true;
      setIsLoading(true);
      const params: GridFetchParams = {
        offset: page * chunkSize,
        limit: chunkSize,
        search: searchRef.current,
        sort: null,
      };
      try {
        const result: GridPage<T> = await fetchFnRef.current(params);
        if (cancelled) return;
        setTotal(result.total);
        setItems(prev => page === 0 ? result.items : [...prev, ...result.items]);
        hasMoreRef.current = result.items.length === chunkSize && (page + 1) * chunkSize < result.total;
      } catch { /* caller handles */ }
      finally { if (!cancelled) { isLoadingRef.current = false; setIsLoading(false); } }
    };
    void load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, resetKey, chunkSize]);

  const loadMore = useCallback(() => {
    if (hasMoreRef.current && !isLoadingRef.current) setPage(p => p + 1);
  }, []);

  const refetch = useCallback(() => {
    setItems([]); setTotal(0); hasMoreRef.current = false; setPage(0); setResetKey(k => k + 1);
  }, []);

  // ── Client-side sort + filter (over loaded items) ─────────────────────────
  const [sort, setSort] = useState<GridSort | null>(null);
  const toggleSort = useCallback((field: string) => {
    setSort(prev => {
      if (!prev || prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      return null;
    });
  }, []);

  const processedItems = useMemo(() => {
    let result = items;
    for (const col of columns) {
      const f = colFilters[col.key];
      if (!f?.value || !col.filterValue) continue;
      result = result.filter(row => applyCondition(col.filterValue!(row), f));
    }
    if (sort) {
      const col = columns.find(c => c.key === sort.field);
      if (col?.sortValue) {
        result = [...result].sort((a, b) => {
          const av = col.sortValue!(a), bv = col.sortValue!(b);
          const cmp = typeof av === 'number' && typeof bv === 'number'
            ? av - bv : String(av).localeCompare(String(bv));
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return result;
  }, [items, sort, colFilters, columns]);

  // ── Virtual scroll ────────────────────────────────────────────────────────
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const onScrollHandler = useCallback(() => {
    setScrollTop(scrollElRef.current?.scrollTop ?? 0);
  }, []);

  const containerRefCb = useCallback((el: HTMLDivElement | null) => {
    if (scrollElRef.current) {
      scrollElRef.current.removeEventListener('scroll', onScrollHandler);
      roRef.current?.disconnect();
    }
    scrollElRef.current = el;
    if (!el) return;
    setContainerHeight(el.clientHeight);
    setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScrollHandler, { passive: true });
    roRef.current = new ResizeObserver(() => setContainerHeight(el.clientHeight));
    roRef.current.observe(el);
  }, [onScrollHandler]);

  useEffect(() => () => {
    scrollElRef.current?.removeEventListener('scroll', onScrollHandler);
    roRef.current?.disconnect();
  }, [onScrollHandler]);

  const n = processedItems.length;
  const totalScrollHeight = activeFilterCount > 0
    ? n * ROW_HEIGHT
    : Math.max(total, items.length) * ROW_HEIGHT;

  const visibleStart = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleEnd   = Math.min(n - 1, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  const offsetY = visibleStart * ROW_HEIGHT;
  const visibleItems = processedItems.slice(visibleStart, visibleEnd + 1);

  // Trigger load-more when near bottom of loaded items
  useEffect(() => {
    if (visibleEnd >= items.length - Math.ceil(containerHeight / ROW_HEIGHT) && hasMoreRef.current && !isLoadingRef.current) {
      loadMore();
    }
  }, [visibleEnd, items.length, containerHeight, ROW_HEIGHT, loadMore]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  const clearSelection = useCallback(() => { setSelectedIds(new Set()); setIsAllSelected(false); }, []);
  const toggleRow = useCallback((id: string) => {
    setIsAllSelected(false);
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const allPageSelected = processedItems.length > 0 && processedItems.every(r => selectedIds.has(rowKey(r)));
  const toggleAllPage = useCallback(() => {
    if (allPageSelected) clearSelection();
    else { setSelectedIds(new Set(processedItems.map(rowKey))); setIsAllSelected(false); }
  }, [allPageSelected, processedItems, rowKey, clearSelection]);
  const selectAllInDB = useCallback(() => {
    setIsAllSelected(true); setSelectedIds(new Set(items.map(rowKey)));
  }, [items, rowKey]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { clearSelection(); }, [resetKey]);
  useEffect(() => { if (gridRef) gridRef.current = { refetch, clearSelection }; }, [gridRef, refetch, clearSelection]);

  const selectedRows = useMemo(
    () => isAllSelected ? items : items.filter(i => selectedIds.has(rowKey(i))),
    [isAllSelected, items, selectedIds, rowKey],
  );
  const showBulkBar = Boolean(bulkActions?.length) && (selectedIds.size > 0 || isAllSelected);
  const hasCheckbox = Boolean(bulkActions?.length);
  const CHECKBOX_W = 32;

  // ── Total row width for horizontal scroll ─────────────────────────────────
  // minWidth of the scroll container — use saved pixel width or default col.width so columns never compress
  const totalRowWidth = useMemo(() => {
    return visibleColumns.reduce((sum, col) => {
      if (col.sticky === 'right') return sum + col.width;
      const saved = colWidths[col.key];
      return sum + (saved ?? col.width);
    }, 0) + (hasCheckbox ? CHECKBOX_W : 0);
  }, [visibleColumns, hasCheckbox, colWidths]);

  // ── Cell style helper ─────────────────────────────────────────────────────
  // Sticky cols: fixed width pinned to right.
  // Resized cols (saved in colWidths): fixed pixel width.
  // Default cols: flex-grow proportional to col.width — fill available space, no gap.
  const cellStyle = useCallback((col: ColumnDef<T>): React.CSSProperties => {
    if (col.sticky === 'right') {
      return { position: 'sticky', right: 0, zIndex: 10, width: col.width, minWidth: col.width, maxWidth: col.width, flexShrink: 0, flexGrow: 0 };
    }
    const saved = colWidths[col.key];
    if (saved !== undefined) {
      return { width: saved, minWidth: saved, maxWidth: saved, flexShrink: 0, flexGrow: 0 };
    }
    // Proportional fill — col.width is the relative weight
    return { flexGrow: col.width, flexShrink: 1, flexBasis: 0, minWidth: MIN_COL_WIDTH };
  }, [colWidths]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="search" value={searchInput} onChange={e => setSearchInput(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-64 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500"
        />
        {filterBar}
        {activeFilterCount > 0 && (
          <button type="button" onClick={() => setColFilters({})}
            className="flex items-center gap-1 rounded-lg border border-amber-700/60 px-2.5 py-1.5 text-xs text-amber-400 hover:border-amber-500 hover:text-amber-300">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor"><path d="M1 2h10l-4 5v3l-2-1V7L1 2z" /></svg>
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} · Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Bulk actions — always rendered, invisible when nothing selected so layout stays stable */}
          {hasCheckbox && (
            <div className={['flex items-center gap-2 transition-opacity', showBulkBar ? 'opacity-100' : 'pointer-events-none opacity-0'].join(' ')}>
              <span className="text-sm text-sky-300">
                {isAllSelected ? `All ${total} selected` : `${selectedIds.size} selected`}
              </span>
              {allPageSelected && !isAllSelected && total > items.length && (
                <button type="button" onClick={selectAllInDB} className="text-sm text-sky-400 underline hover:text-sky-300">
                  Select all {total}
                </button>
              )}
              {bulkActions!.map(action => (
                <button key={action.key} type="button"
                  onClick={() => void action.onAction({ selectedIds: [...selectedIds], selectedRows, isAllSelected, total, refetch, clearSelection })}
                  className={action.variant === 'danger'
                    ? 'rounded-lg border border-red-800 px-3 py-1.5 text-sm text-red-400 hover:border-red-600 hover:text-red-300'
                    : 'rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500'}>
                  {action.label}
                </button>
              ))}
              <button type="button" onClick={clearSelection} className="text-sm text-slate-500 hover:text-white">✕</button>
              <div className="h-4 w-px bg-slate-700" />
            </div>
          )}
          {toggleableColumns.length > 0 && (
            <div ref={colPanelRef} className="relative">
              <button type="button" onClick={() => setColPanelOpen(v => !v)}
                className={['flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                  colPanelOpen ? 'border-sky-600 text-sky-300' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'].join(' ')}>
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="2" width="14" height="3" rx="0.5" /><rect x="1" y="6.5" width="14" height="3" rx="0.5" />
                  <rect x="1" y="11" width="14" height="3" rx="0.5" /><line x1="5" y1="2" x2="5" y2="14" />
                </svg>
                Columns
                {hiddenCols.size > 0 && (
                  <span className="rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] leading-none text-white">{hiddenCols.size}</span>
                )}
              </button>
              {colPanelOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
                  <div className="border-b border-slate-700 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Show / hide</div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {toggleableColumns.map(col => (
                      <label key={col.key} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-700">
                        <input type="checkbox" checked={!hiddenCols.has(col.key)} onChange={() => toggleColVisibility(col.key)} className="h-3.5 w-3.5 accent-sky-500" />
                        <span className="text-sm text-slate-200">{col.header}</span>
                      </label>
                    ))}
                  </div>
                  {hiddenCols.size > 0 && (
                    <div className="border-t border-slate-700 p-2">
                      <button type="button" onClick={() => setHiddenCols(new Set())} className="w-full rounded px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white">Show all</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {toolbar}
        </div>
      </div>

      {/* Grid */}
      <div ref={gridElRef} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-800">

        {/* Scroll container — header is inside so it syncs horizontal scroll */}
        <div ref={containerRefCb} className="datagrid-scroll min-h-0 flex-1 overflow-auto">
          <div style={{ minWidth: totalRowWidth }}>

            {/* Sticky header */}
            <div className="sticky top-0 z-20 flex border-b border-slate-800 bg-slate-900 select-none">
              {hasCheckbox && (
                <div className="sticky left-0 z-30 flex shrink-0 items-center justify-center border-r border-slate-800 bg-slate-900 px-2"
                  style={{ width: CHECKBOX_W }}>
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAllPage} className="h-3.5 w-3.5 accent-sky-500" />
                </div>
              )}
              {visibleColumns.map(col => {
                const activeFilter = colFilters[col.key];
                const filterActive = Boolean(activeFilter?.value);
                const isFilterOpen = openFilterKey === col.key;
                return (
                  <div key={col.key} data-col={col.key}
                    className={['relative flex shrink-0 items-center gap-1 border-r border-slate-800 last:border-r-0',
                      col.noPadding ? '' : 'px-3 py-3',
                      col.sticky === 'right' ? 'bg-slate-900' : ''].join(' ')}
                    style={cellStyle(col)}>

                    {col.sortable ? (
                      <button type="button" onClick={() => toggleSort(col.key)}
                        className="flex min-w-0 flex-1 items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-white">
                        <span className="truncate">{col.header}</span>
                        <SortIcon sort={sort} field={col.key} />
                      </button>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wide text-slate-400">{col.header}</span>
                    )}

                    {col.filterable && (
                      <div ref={isFilterOpen ? filterPopupRef : undefined} className="relative shrink-0">
                        <button type="button"
                          onClick={e => { e.stopPropagation(); setOpenFilterKey(isFilterOpen ? null : col.key); }}
                          title="Filter"
                          className={['flex h-5 w-5 items-center justify-center rounded transition-colors',
                            filterActive ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:bg-slate-700 hover:text-slate-300'].join(' ')}>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M1 2h10l-4 5v3l-2-1V7L1 2z" />
                          </svg>
                        </button>
                        {isFilterOpen && (
                          <FilterPopup
                            active={activeFilter ?? null}
                            onApply={f => setColFilters(prev => ({ ...prev, [col.key]: f }))}
                            onClear={() => setColFilters(prev => { const n = { ...prev }; delete n[col.key]; return n; })}
                            onClose={() => setOpenFilterKey(null)}
                          />
                        )}
                      </div>
                    )}

                    {/* Resize handle — not on sticky columns */}
                    {!col.sticky && (
                      <div
                        onMouseDown={e => startResize(e, col)}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-sky-500/60"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Virtual scroll body */}
            {isLoading && items.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-20">
                <Spinner /><p className="text-sm text-slate-400">Loading…</p>
              </div>
            )}
            {!isLoading && n === 0 && (
              <div className="flex items-center justify-center py-20">
                <p className="text-slate-400">{activeFilterCount > 0 ? 'No rows match the active filters.' : emptyMessage}</p>
              </div>
            )}
            {n > 0 && (
              <div style={{ height: totalScrollHeight, position: 'relative' }}>
                <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
                  {visibleItems.map(row => {
                    const id = rowKey(row);
                    const isSelected = isAllSelected || selectedIds.has(id);
                    return (
                      <div key={id}
                        className={['flex border-b border-slate-800 hover:bg-slate-800/30',
                          isSelected ? 'bg-sky-950/20' : ''].join(' ')}
                        style={{ height: ROW_HEIGHT }}>
                        {hasCheckbox && (
                          <div className="sticky left-0 z-10 flex shrink-0 items-center justify-center border-r border-slate-800 bg-slate-900/95 px-2"
                            style={{ width: CHECKBOX_W }}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleRow(id)} className="h-3.5 w-3.5 accent-sky-500" />
                          </div>
                        )}
                        {visibleColumns.map(col => (
                          <div key={col.key} data-col={col.key}
                            className={['flex shrink-0 items-center border-r border-slate-800 last:border-r-0',
                              col.overflow === 'visible' ? 'overflow-visible' : 'overflow-hidden',
                              col.noPadding ? '' : 'px-4',
                              col.sticky === 'right' ? 'bg-slate-900/95' : ''].join(' ')}
                            style={{ ...cellStyle(col), height: ROW_HEIGHT }}>
                            <div className={col.overflow === 'visible' ? 'w-full' : 'w-full truncate'}>
                              {col.render(row)}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading && items.length > 0 && (
          <div className="flex shrink-0 items-center justify-center gap-2 border-t border-slate-800 bg-slate-900 py-2">
            <Spinner size={12} /><p className="text-xs text-slate-500">Loading more…</p>
          </div>
        )}
      </div>
    </div>
  );
}
