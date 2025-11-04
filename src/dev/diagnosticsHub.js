const DEV =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  Boolean(import.meta.env.DEV);

const isBrowser = typeof window !== 'undefined';

const warn = (label, error) => {
  if (!DEV || !isBrowser) return;
  console.warn(`[diagnosticsHub] ${label} failed`, error);
};

const safeCall = (label, fn, fallback = null) => {
  try {
    return fn();
  } catch (error) {
    warn(label, error);
    return fallback;
  }
};

const ensureRenderDiagnostics = () => {
  if (!isBrowser) return null;
  const install = window.installRenderDiagnostics;
  if (typeof install === 'function') {
    return safeCall('installRenderDiagnostics', () => install({ autoRefresh: true }));
  }
  return null;
};

const gatherRenderSnapshot = () => {
  ensureRenderDiagnostics();
  const renderDiag = window.__renderDiag;
  const rendererSurface = window.__rendererDiagnostics;

  const snapshot = renderDiag
    ? safeCall('renderDiag.snapshot', () => renderDiag.snapshot?.(), null)
    : null;

  const controls = rendererSurface
    ? {
        drawCount: safeCall('rendererDiagnostics.getDrawCount', () => rendererSurface.getDrawCount?.(), null),
        activeCount: safeCall('rendererDiagnostics.getActiveCount', () => rendererSurface.getActiveCount?.(), null),
        available: Object.keys(rendererSurface || {}),
      }
    : null;

  const viewportHint = window.__viewportHint || window.__webglBackground?.viewportHintRef?.current || null;
  const materialUniforms =
    window.__webglBackground?.materialRef?.current?.uniforms ||
    window.__renderDiag?.materials?.get?.('WebGLBackground.material')?.uniforms ||
    null;

  return {
    snapshot,
    viewportHint,
    controls,
    uniforms: materialUniforms ? Object.keys(materialUniforms) : null,
  };
};

const gatherAtomSnapshot = () => {
  const advanced = globalThis.atomicAdvanced || null;
  if (!advanced) {
    return null;
  }

  const cacheStats = safeCall('atomicAdvanced.selectorCache.getStats', () =>
    advanced.selectorCache?.getStats?.()
  );
  const perfStats = safeCall('atomicAdvanced.performanceMonitor.getAllMetrics', () =>
    advanced.performanceMonitor?.getAllMetrics?.()
  );

  safeCall('atomicAdvanced.diagnoseAll', () => advanced.diagnoseAll?.());

  return {
    cache: cacheStats,
    performance: perfStats,
  };
};

const gatherTraceSnapshot = () => {
  const trace = window.__trace || [];
  const size = Array.isArray(trace) ? trace.length : 0;
  return {
    size,
    last: size ? trace[size - 1] : null,
  };
};

const gatherRaycastSnapshot = () => {
  const diag = window.RAYCAST_DIAGNOSTIC;
  if (!diag) return null;
  const { lastTest = null, history = [] } = diag;
  return {
    lastTest,
    historyCount: Array.isArray(history) ? history.length : 0,
  };
};

const gatherCanonDiagnostics = () => {
  const all = window.__CANON_DIAGNOSTICS__;
  if (!all) return null;
  const entries = {};
  Object.keys(all).forEach((key) => {
    entries[key] = safeCall(`__CANON_DIAGNOSTICS__.${key}`, () => all[key]);
  });
  return {
    keys: Object.keys(all),
    entries,
  };
};

const gatherWebglBackground = () => {
  const bg = window.__webglBackground || {};
  const geometry = bg.geometry || bg.geometryRef?.current || null;
  const material = bg.material || bg.materialRef?.current || null;
  const points = bg.points || bg.pointsRef?.current || null;

  const drawCount = geometry?.drawRange?.count ?? null;
  const uniforms = material?.uniforms ? Object.keys(material.uniforms) : null;

  return {
    hasGeometry: Boolean(geometry),
    hasMaterial: Boolean(material),
    hasPoints: Boolean(points),
    drawCount,
    uniformCount: uniforms ? uniforms.length : null,
  };
};

const gatherParticleEffectState = () => {
  const state = window.__particleEffectState;
  if (!state) return null;
  return { ...state };
};

const gatherSummary = (result) => {
  const summary = [];
  if (result.render?.snapshot) {
    const drawCount = result.render.snapshot?.drawCount ?? null;
    if (drawCount != null) summary.push(`drawCount=${drawCount}`);
  }
  if (result.atoms?.cache?.metadataSize != null) {
    summary.push(`atomsCache=${result.atoms.cache.metadataSize}`);
  }
  if (result.trace?.size != null) {
    summary.push(`trace=${result.trace.size}`);
  }
  if (result.raycast?.historyCount != null) {
    summary.push(`raycasts=${result.raycast.historyCount}`);
  }
  return summary.join(' | ');
};

const diagnosticsHub = (() => {
  const history = [];
  return {
    history,
    push(report) {
      history.push(report);
      if (history.length > 10) history.shift();
    },
  };
})();

const setupDiagnosticsHub = () => {
  if (!DEV || !isBrowser) return;

  const existing = typeof window.diagnoseAll === 'function' ? window.diagnoseAll : null;

  const diagnoseAll = (options = {}) => {
    const { quiet = false, emitReports = true } = options;
    const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

    const render = gatherRenderSnapshot();
    if (emitReports && window.__renderDiag?.report) {
      safeCall('renderDiag.report', () => window.__renderDiag.report());
    }

    const atoms = gatherAtomSnapshot();
    const trace = gatherTraceSnapshot();
    const raycast = gatherRaycastSnapshot();
    const canon = gatherCanonDiagnostics();
    const webgl = gatherWebglBackground();
    const particleEffects = gatherParticleEffectState();

    const end = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

    const report = {
      timestamp: new Date().toISOString(),
      durationMs: Math.round(end - start),
      render,
      atoms,
      trace,
      raycast,
      canon,
      webgl,
      particleEffects,
    };

    diagnosticsHub.push(report);
    window.__diagnosticsHub = diagnosticsHub;

    if (!quiet) {
      const summary = gatherSummary(report);
      console.group('🩺 diagnoseAll');
      if (summary) console.log(summary);
      console.log(report);
      console.groupEnd();
    }

    return report;
  };

  const combinedDiagnoseAll =
    existing && existing !== diagnoseAll
      ? (...args) => {
          const hubReport = diagnoseAll(...args);
          try {
            const legacyResult = existing(...args);
            return hubReport ?? legacyResult;
          } catch (error) {
            warn('legacy diagnoseAll', error);
            return hubReport;
          }
        }
      : diagnoseAll;

  Object.defineProperty(window, 'diagnoseAll', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: combinedDiagnoseAll,
  });

  if (!existing) {
    console.log('🩺 Diagnostics hub ready. Run window.diagnoseAll() for a full snapshot.');
  } else {
    console.log('🩺 Diagnostics hub attached alongside existing diagnoseAll handler.');
  }
};

setupDiagnosticsHub();

export {};
