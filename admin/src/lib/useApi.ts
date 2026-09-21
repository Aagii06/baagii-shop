"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ApiState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

/**
 * Minimal fetch-on-mount hook. `key` identifies the request — when it
 * changes (e.g. a route param) the fetcher runs again. `reload()` re-runs it
 * on demand, keeping the previous data visible while loading.
 */
export function useApi<T>(fetcher: () => Promise<T>, key = "") {
  const [state, setState] = useState<ApiState<T>>({
    data: undefined,
    error: undefined,
    loading: true,
  });
  const [version, setVersion] = useState(0);

  // Latest fetcher without making it an effect dependency (callers pass
  // inline closures that change identity on every render).
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    fetcherRef.current().then(
      (data) => {
        if (!cancelled) setState({ data, error: undefined, loading: false });
      },
      (error: unknown) => {
        if (cancelled) return;
        setState((prev) => ({
          data: prev.data,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
        }));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [key, version]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }));
    setVersion((v) => v + 1);
  }, []);

  return { ...state, reload };
}
