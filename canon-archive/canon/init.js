// src/canon/init.js — DEV boot shim (injector v3 only)
export function bootCanonDevOs() {
  if (typeof window === 'undefined') return;
  if (import.meta?.env?.DEV) {
    import('../../canon-console/browser/inject.js');
  }
}
export default bootCanonDevOs;
