export function trace(ev, data = {}) {
  try {
    const t = window.__trace || (window.__trace = []);
    t.push({ t: performance.now(), ev, ...data });
  } catch (err) {
    if (import.meta?.env?.DEV) {
      console.warn('[trace] failed', err);
    }
  }
}

export function dumpTrace() {
  try {
    return (window.__trace || []).slice();
  } catch {
    return [];
  }
}

export function clearTrace() {
  try {
    window.__trace = [];
  } catch {
    window.__trace = [];
  }
}

if (typeof window !== 'undefined') {
  const api = { trace, dumpTrace, clearTrace };
  window.__traceAPI = { ...(window.__traceAPI || {}), ...api };
  window.clearTrace = window.clearTrace || clearTrace;
  window.dumpTrace = window.dumpTrace || dumpTrace;
}
