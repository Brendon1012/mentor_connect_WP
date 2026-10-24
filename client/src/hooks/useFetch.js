import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api.js';

/*
 * Loads data with loading / error state and a reload() function.
 *   const { data, loading, error, reload, setData } = useFetch(() => mentorService.get(id), [id]);
 * Responses from an older request are ignored if the inputs changed meanwhile.
 */
export default function useFetch(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const callId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++callId.current;
      if (!silent) setLoading(true);
      setError('');
      try {
        const result = await fetcherRef.current();
        if (id === callId.current) setData(result);
      } catch (err) {
        if (id === callId.current && !silent) setError(getErrorMessage(err));
      } finally {
        if (id === callId.current && !silent) setLoading(false);
      }
    },
    // Re-create load() only when the caller's inputs change; the latest fetcher is read from the ref.
    deps
  );

  useEffect(() => {
    if (enabled) load();
  }, [load, enabled]);

  return { data, loading, error, reload: load, setData };
}
