// src/utils/performance/Telemetry.js
// Optimized system-wide telemetry markers

function isDev() {
  return import.meta?.env?.DEV || process.env.NODE_ENV !== 'production';
}

export function markBlueprint(ms, particles, stage) {
  if (isDev()) {
    console.log(
      `[TEL] blueprint stage=${stage} particles=${particles} time=${ms.toFixed(2)}ms`
    );
  }
  window.dispatchEvent(new CustomEvent('tel:blueprint', {
    detail: { ms, particles, stage, ts: performance.now() }
  }));
}

export function markFrame(ms) {
  window.dispatchEvent(new CustomEvent('tel:frame', {
    detail: { ms, ts: performance.now() }
  }));
}

export function markEvent(name, detail = {}) {
  if (isDev()) {
    console.log(`[TEL] ${name}`, detail);
  }
  window.dispatchEvent(new CustomEvent(`tel:${name}`, {
    detail: { ...detail, ts: performance.now() }
  }));
}

// Example: markEvent('stage-complete', { stage: 'Awakening', ms: 124.3 });
