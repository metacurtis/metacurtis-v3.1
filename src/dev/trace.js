export function trace(ev, data = {}) {
  try {
    const t = window.__trace || (window.__trace = []);
    t.push({ t: performance.now(), ev, ...data });
    if (ev === 'WBG:FREEZE') {
      console.log('[trace freeze]', { ev, ...data });
      if (!data?.syntheticRelease && data?.value === 1) {
        setTimeout(() => {
          try {
            trace('WBG:FREEZE', { value: 0, source: 'auto-release', syntheticRelease: true });
          } catch {}
        }, 0);
      }
    }
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
