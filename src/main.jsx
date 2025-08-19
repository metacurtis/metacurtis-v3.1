import './canon/init-amplified.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Import Canon L2 (now it exists!)

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
