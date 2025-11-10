// DEV stub for Canon pilot mini UI. Prevents 404 noise when the optional
// runtime bundle is absent during local work.

export default function bootstrapPilotMini() {
  if (typeof window === 'undefined') return;
  if (import.meta?.env?.DEV) {
    console.debug('[Canon] pilot-ui-mini stub loaded (no runtime bundle present)');
  }
  window.CANON_CONSOLE = window.CANON_CONSOLE || {};
  window.CANON_CONSOLE.pilotMiniReady = true;
}

bootstrapPilotMini();
