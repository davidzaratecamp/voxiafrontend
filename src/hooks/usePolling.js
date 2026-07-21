import { useEffect, useRef, useState } from 'react';

/**
 * Ejecuta `fetchFn` inmediatamente y luego cada `intervalMs`. Suficiente
 * para el Live Monitor del MVP sin necesidad de un canal WebSocket propio
 * en el frontend (el backend ya expone /calls/live como snapshot).
 */
export function usePolling(fetchFn, intervalMs = 4000, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const result = await fetchFnRef.current();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}
