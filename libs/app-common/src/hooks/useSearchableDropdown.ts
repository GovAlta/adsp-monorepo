import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Fetcher<T> = (args: { query: string; signal: AbortSignal }) => Promise<T[]>;

export type UseSearchableDropdownOptions<T> = {
  /** Initial input value */
  initialQuery?: string;

  /** Minimum query length to start searching / showing results (default 1) */
  minChars?: number;

  /** Debounce time for query changes (default 200ms) */
  debounceMs?: number;

  /** Async suggestions (optional). If provided, async mode is enabled. */
  fetcher?: Fetcher<T>;

  /** Local suggestions (optional). If provided (and no fetcher), local mode is enabled. */
  getLocalItems?: (query: string) => T[];

  /** Optional post-processing (filter/sort/limit) */
  transformItems?: (items: T[], query: string) => T[];

  /** Cache key for async mode (default: trimmed query) */
  cacheKey?: (query: string) => string;

  /** Enable caching for async mode (default true) */
  enableCache?: boolean;

  /** Delay showing spinner for async mode (default 150ms) */
  spinnerDelayMs?: number;

  /** Close dropdown after select (default true) */
  closeOnSelect?: boolean;

  /** Called when selection occurs (mouse or Enter) */
  onSelect?: (item: T) => void;

  /** Show full list on focus when query is empty / too short (default false) */
  showAllOnFocus?: boolean;
  openAll?: () => T[];
  /** Provide “full list” items when query is empty (recommended for local mode) */
  allItemsOnEmptyQuery?: () => T[];
};

export function useSearchableDropdown<T>(opts: UseSearchableDropdownOptions<T>) {
  const {
    initialQuery = '',
    minChars = 1,
    debounceMs = 200,
    fetcher,
    getLocalItems,
    transformItems,
    cacheKey,
    enableCache = true,
    spinnerDelayMs = 150,
    closeOnSelect = true,
    onSelect,
    showAllOnFocus = false,
    allItemsOnEmptyQuery,
  } = opts;

  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<T[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // --- async controls
  const abortRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string>('');
  const cacheRef = useRef<Map<string, T[]>>(new Map());
  const spinnerTimerRef = useRef<number | null>(null);

  const fetcherRef = useRef(fetcher);
  const getLocalItemsRef = useRef(getLocalItems);
  const transformItemsRef = useRef(transformItems);
  const cacheKeyRef = useRef(cacheKey);
  const onSelectRef = useRef(onSelect);
  const allItemsOnEmptyQueryRef = useRef(allItemsOnEmptyQuery);

  const suppressOpenOnceRef = useRef(false);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    getLocalItemsRef.current = getLocalItems;
  }, [getLocalItems]);

  useEffect(() => {
    transformItemsRef.current = transformItems;
  }, [transformItems]);

  useEffect(() => {
    cacheKeyRef.current = cacheKey;
  }, [cacheKey]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    allItemsOnEmptyQueryRef.current = allItemsOnEmptyQuery;
  }, [allItemsOnEmptyQuery]);

  // -----------------------------
  // Debounce query
  // -----------------------------
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => window.clearTimeout(t);
  }, [query, debounceMs]);

  const effectiveKey = useMemo(() => {
    const raw = debouncedQuery.trim();
    const fn = cacheKeyRef.current;
    return fn ? fn(raw) : raw;
  }, [debouncedQuery]);

  // -----------------------------
  // Ensure active item visible
  // -----------------------------
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLLIElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, items]);

  const clearSpinnerTimer = useCallback(() => {
    if (spinnerTimerRef.current) {
      window.clearTimeout(spinnerTimerRef.current);
      spinnerTimerRef.current = null;
    }
  }, []);

  const stopInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);
  const openAll = useCallback(() => {
    const all = allItemsOnEmptyQueryRef.current?.() ?? (getLocalItemsRef.current ? getLocalItemsRef.current('') : []);

    const final = transformItemsRef.current ? transformItemsRef.current(all, '') : all;

    setItems(final);
    setActiveIndex(0);
    setOpen(true);
    setLoading(false);
    setError(null);
  }, []);
  const reset = useCallback(() => {
    stopInFlight();
    clearSpinnerTimer();
    suppressOpenOnceRef.current = false;
    setOpen(false);
    setLoading(false);
    setItems([]);
    setActiveIndex(0);
    setError(null);
    setQuery('');
    lastKeyRef.current = '';
  }, [clearSpinnerTimer, stopInFlight]);

  const selectItem = useCallback(
    (item: T) => {
      onSelectRef.current?.(item);

      if (closeOnSelect) {
        // ✅ stop the suggestions effect from reopening due to query change
        suppressOpenOnceRef.current = true;
        setOpen(false);
      }
    },
    [closeOnSelect],
  );

  // -----------------------------
  // Suggestions pipeline
  // -----------------------------
  useEffect(() => {
    const q = debouncedQuery.trim();

    if (!q || q.length < minChars) {
      stopInFlight();
      clearSpinnerTimer();
      setItems([]);
      setOpen(false);
      setLoading(false);
      setError(null);
      lastKeyRef.current = '';
      suppressOpenOnceRef.current = false;
      return;
    }

    if (suppressOpenOnceRef.current) {
      suppressOpenOnceRef.current = false;
      setLoading(false);
      setError(null);
      return;
    }

    setOpen(true);
    setError(null);

    if (!fetcherRef.current && getLocalItemsRef.current) {
      const local = getLocalItemsRef.current(q);
      const final = transformItemsRef.current ? transformItemsRef.current(local, q) : local;
      setItems(final);
      setActiveIndex(0);
      setLoading(false);
      return;
    }

    if (!fetcherRef.current) return;

    if (effectiveKey === lastKeyRef.current) return;
    lastKeyRef.current = effectiveKey;

    if (enableCache) {
      const cached = cacheRef.current.get(effectiveKey);
      if (cached) {
        const final = transformItemsRef.current ? transformItemsRef.current(cached, q) : cached;
        setItems(final);
        setActiveIndex(0);
        setLoading(false);
        return;
      }
    }

    stopInFlight();
    const controller = new AbortController();
    abortRef.current = controller;

    clearSpinnerTimer();
    spinnerTimerRef.current = window.setTimeout(() => setLoading(true), spinnerDelayMs);

    (async () => {
      try {
        const res = await fetcherRef.current!({ query: q, signal: controller.signal });
        const finalRaw = transformItemsRef.current ? transformItemsRef.current(res, q) : res;

        if (enableCache) cacheRef.current.set(effectiveKey, res);

        setItems(finalRaw);
        setActiveIndex(0);
        // eslint-disable-next-line
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError(e?.message ?? 'Search failed');
        }
      } finally {
        clearSpinnerTimer();
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
      clearSpinnerTimer();
    };
  }, [debouncedQuery, minChars, enableCache, effectiveKey, spinnerDelayMs, clearSpinnerTimer, stopInFlight]);

  // -----------------------------
  // Keyboard navigation helper
  // -----------------------------
  const onKeyDown = useCallback(
    (key: string) => {
      if (!open) return;

      if (key === 'Escape') {
        setOpen(false);
        return;
      }
      if (key === 'Tab') {
        setOpen(false);
        return;
      }
      if (key === 'ArrowDown') {
        setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
        return;
      }
      if (key === 'ArrowUp') {
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (key === 'Enter') {
        const item = items[activeIndex];
        if (item) selectItem(item);
      }
    },
    [activeIndex, items, open, selectItem],
  );

  // -----------------------------
  // Focus behavior: show all list
  // -----------------------------
  const onFocus = useCallback(() => {
    const q = query.trim();

    // If selection just happened and we closed, don't reopen on refocus glitches
    if (suppressOpenOnceRef.current) return;

    // Normal case: query meets minChars
    if (q.length >= minChars) {
      setOpen(true);
      return;
    }

    // If empty/short: optionally show full list (local recommended)
    if (showAllOnFocus) {
      const all = allItemsOnEmptyQueryRef.current?.() ?? (getLocalItemsRef.current ? getLocalItemsRef.current('') : []);

      const final = transformItemsRef.current ? transformItemsRef.current(all, '') : all;

      setItems(final);
      setActiveIndex(0);
      setOpen(true);
      setLoading(false);
      setError(null);
    }
  }, [minChars, query, showAllOnFocus]);

  return {
    // state
    query,
    setQuery,
    open,
    setOpen,
    loading,
    items,
    activeIndex,
    setActiveIndex,
    error,
    setError,

    // refs
    inputRef,
    listRef,

    // actions
    reset,
    selectItem,
    openAll,
    // helpers
    onKeyDown,
    onFocus,
  };
}
