import React from 'react';
// Import Canon Dev-OS (dev only)
if (import.meta.env.DEV) {
  import("/canon-console/browser/inject.js");
}
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import { showToast } from './utils/toast.js';

// Trace system for dev event monitoring
if (typeof window !== 'undefined' && !window.__trace) {
  const traceBuffer = [];
  const maxTraceLength = 500;

  window.__trace = traceBuffer;
  window.dumpTrace = () => [...traceBuffer];
  window.clearTrace = () => {
    traceBuffer.length = 0;
    console.log('[TRACE] Cleared');
  };
  window.pushTrace = (event = {}) => {
    traceBuffer.push({
      t: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
      ...event
    });
    if (traceBuffer.length > maxTraceLength) traceBuffer.shift();
  };

  console.log('✅ Trace system initialized');
}

if (import.meta.hot) {
  import.meta.hot.on('glsl-update', (data) => {
    const file = data?.file || 'shader';
    console.log(`[HMR] Shader updated: ${file}`);
    if (typeof showToast === 'function') {
      const name = file.split('/').pop();
      showToast(`Shader updated: ${name}`, { type: 'success' });
    }
  });
}

// Initialize state bridge
import _StateCommands from "@/state/commands/StateCommands";

// Import Canon L2 (now it exists!)

// DEV-only: dynamic visual probes for ad-hoc inspection
if (import.meta?.env?.DEV) {
  import('./dev/visual-probes.js').catch(() => {});
}

const rootEl = document.getElementById('root');

if (!rootEl) {
  console.error('❌ Could not find #root element');
} else {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
  console.log('✅ React app mounted');
}

// DEV helpers
if (import.meta.env.DEV) {
  // Canon is already attached via init.js
  console.log('📦 Canon Status:');
  console.log('  Guard:', !!window.__CANON_GUARD_ACTIVE);
  console.log('  Console:', !!window.__CANON_CONSOLE_ACTIVE);
  console.log('  BeatBus:', !!window.BeatBus);

  // Global debug helpers
  window.canonDebug = {
    guard: () => window.canon?.guard?.getViolations(),
    console: () => window.canon?.panel?.patterns,
    bus: () => window.BeatBus?.getDebugInfo(),
    emit: (evt, data) => window.BeatBus?.emit(evt, data),
  };
}
