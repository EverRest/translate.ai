import type React from 'react';

export type GridSort = { field: string; dir: 'asc' | 'desc' };
export type GridFetchParams = {
  offset: number;
  limit: number;
  search: string;
  sort: GridSort | null;
};
export type GridPage<T> = { items: T[]; total: number };

export type ColumnDef<T> = {
  key: string;
  header: React.ReactNode;
  width: number; // px
  sortable?: boolean;
  /** Extract comparable value for client-side sort */
  sortValue?: (row: T) => string | number;
  /** Enable filter popup on this column */
  filterable?: boolean;
  /** Extract string value used for filtering */
  filterValue?: (row: T) => string;
  /** Remove horizontal padding from the cell (useful for icon/action columns) */
  noPadding?: boolean;
  /** Allow cell content to overflow (needed for dropdown menus) */
  overflow?: 'visible';
  /** Stick the column to the right edge (always visible on horizontal scroll) */
  sticky?: 'right';
  render: (row: T) => React.ReactNode;
};

export type BulkActionDef<T> = {
  key: string;
  label: string;
  variant?: 'primary' | 'danger';
  onAction: (ctx: {
    selectedIds: string[];
    selectedRows: T[];
    isAllSelected: boolean;
    total: number;
    refetch: () => void;
    clearSelection: () => void;
  }) => void | Promise<void>;
};

export type GridRef = {
  refetch: () => void;
  clearSelection: () => void;
};

export type DataGridProps<T> = {
  columns: ColumnDef<T>[];
  fetchFn: (params: GridFetchParams) => Promise<GridPage<T>>;
  rowKey: (row: T) => string;
  rowHeight?: number;
  chunkSize?: number;
  searchPlaceholder?: string;
  filterBar?: React.ReactNode;
  toolbar?: React.ReactNode;
  bulkActions?: BulkActionDef<T>[];
  emptyMessage?: string;
  gridRef?: React.MutableRefObject<GridRef | null>;
  /** Namespace for persisting column widths and visibility to localStorage */
  gridId?: string;
};
