import { useCallback, useEffect, useRef, useState } from "react";

/** Loads data for a screen and exposes a reload. `key` null means "nothing to load yet". */
export function useLoad<T>(key: string | null, load: () => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: key !== null,
    error: null,
  });
  const [tick, setTick] = useState(0);
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (key === null) return setState({ data: null, loading: false, error: null });
    let cancelled = false;
    // A reload keeps the current rows on screen, so forms and messages inside them survive.
    // A new key means different data, so the old rows are dropped.
    const sameKey = lastKey.current === key;
    lastKey.current = key;
    setState((s) => ({ data: sameKey ? s.data : null, loading: !sameKey || s.data === null, error: null }));
    load()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((e) => !cancelled && setState({ data: null, loading: false, error: e instanceof Error ? e.message : "Loading failed." }));
    return () => {
      cancelled = true;
    };
    // `load` is recreated each render; the key says when to run it again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
