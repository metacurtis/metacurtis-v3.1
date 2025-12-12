// Canon Console Entry Point
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  import('./browser/inject.js').then(() => {
    console.log('[Canon Console] Browser module loaded');
  });
}

export { default as CanonConsole } from './browser/inject.js';
export { Incident } from './model/incident.js';
export { incidentStore } from './store/incidentStore.js';