// src/hooks/useIdle.js
import { useState, useEffect } from 'react';

/**
 * Returns `true` once the browser is idle (via requestIdleCallback)
 * or after `delay` ms as a fallback.
 */
export default function useIdle(delay = 200, timeout = 2000) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // if the browser supports requestIdleCallback
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setReady(true), { timeout });
      return () => cancelIdleCallback(id);
    }
    // otherwise fall back to setTimeout
    const id = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(id);
  }, [delay, timeout]);

  return ready;
}
