import { useCallback, useEffect, useRef, useState } from 'react';
import { listTranslationKeys } from '../../translation-keys/api/translation-keys.api';
import type { TranslationKey } from '../../translation-keys/types';

const CHUNK_SIZE = 100;

export function useInfiniteKeys(projectId: string | undefined, search: string) {
  const [page, setPage] = useState(1);
  const [keys, setKeys] = useState<TranslationKey[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(false);

  useEffect(() => {
    setPage(1);
    setKeys([]);
    setTotal(0);
  }, [projectId, search]);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;
    isLoadingRef.current = true;
    setIsLoading(true);

    listTranslationKeys(projectId, page, CHUNK_SIZE, search)
      .then((data) => {
        if (cancelled) return;
        const t = data.meta.total;
        setTotal(t);
        setKeys((prev) => {
          const next = page === 1 ? data.items : [...prev, ...data.items];
          hasMoreRef.current = next.length < t;
          return next;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, page, search, refreshKey]);

  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || isLoadingRef.current) return;
    setPage((p) => p + 1);
  }, []);

  const refetch = useCallback(() => {
    setKeys([]);
    setTotal(0);
    hasMoreRef.current = false;
    setPage((prev) => {
      if (prev === 1) {
        setRefreshKey((k) => k + 1);
        return 1;
      }
      return 1;
    });
  }, []);

  return { keys, total, isLoading, hasMore: hasMoreRef.current, loadMore, refetch };
}
