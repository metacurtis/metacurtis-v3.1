import { TELEMETRY, ringPush } from '@/runtime/telemetryConfig.js';

export function trace(ev, data = {}) {
  try {
    const buffer = window.__trace || (window.__trace = []);
    ringPush(buffer, { t: performance.now(), ev, ...data }, TELEMETRY.TRACE_MAX);
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

  window.pushTrace = window.pushTrace || function pushTrace(entry = {}) {
    try {
      const buffer = window.__trace || (window.__trace = []);
      ringPush(
        buffer,
        {
          t: (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()),
          ...entry,
        },
        TELEMETRY.TRACE_MAX,
      );
    } catch (err) {
      if (import.meta?.env?.DEV) console.warn('[pushTrace] failed', err);
    }
  };
}
