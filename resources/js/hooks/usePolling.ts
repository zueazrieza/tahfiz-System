import { useEffect, useRef, useCallback } from 'react';

/**
 * usePolling — runs `callback` immediately on mount, then again every `intervalMs`.
 * Cleans up the interval on unmount or when deps change.
 *
 * @param callback  async or sync function to call on each tick
 * @param intervalMs  polling interval in milliseconds (default: 30_000 = 30 s)
 * @param enabled  set to false to pause polling (e.g. while a modal is open)
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number = 30_000,
  enabled: boolean = true
) {
  // Keep a stable reference so we don't restart the interval when the
  // callback closure changes (e.g. after every render).
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Fire immediately so the UI doesn't wait for the first tick.
    cbRef.current();

    const id = setInterval(() => cbRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
