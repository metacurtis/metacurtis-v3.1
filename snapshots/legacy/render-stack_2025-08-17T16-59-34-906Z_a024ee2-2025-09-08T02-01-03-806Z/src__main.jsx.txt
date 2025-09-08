// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

const rootEl = document.getElementById('root');

if (!rootEl) {
  console.error('❌ Could not find #root element');
} else {
  const root = ReactDOM.createRoot(rootEl);
  // 🔥 No React.StrictMode wrapper here to avoid double-mount in DEV
  root.render(<App />);
}

if (import.meta.env.DEV) {
  // Optionally load Canon Console in development.
  // Using /* @vite-ignore */ keeps this optional — if the file doesn't exist,
  // Vite won't fail the build; the dynamic import will just reject.
  const injectPath = '../canon-console/browser/inject.js';
  import(/* @vite-ignore */ injectPath)
    .then(() => console.log('✅ Canon Console loaded'))
    .catch((err) => {
      const msg = String(err?.message || err);
      if (
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('ERR_MODULE_NOT_FOUND') ||
        msg.includes('404')
      ) {
        console.warn('ℹ️ Canon Console not found (optional). Skipping.');
      } else {
        console.error('❌ Canon Console failed to load:', err);
      }
    });
}
