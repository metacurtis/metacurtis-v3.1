import '@/modules/state/index.js';
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Canon amplified (BeatBus boundary + HUD + contracts)
import './canon/init-amplified.js';

const rootEl = document.getElementById('root');

if (!rootEl) {
  console.error('❌ Could not find #root element');
} else {
  const root = ReactDOM.createRoot(rootEl);
  // Avoid StrictMode to prevent double-mount during dev visuals
  root.render(<App />);
}

/* ──────────────────────────────────────────────────────────────
   DEV-only optional helpers (safe: will not crash if missing)
   ────────────────────────────────────────────────────────────── */
if (import.meta.env.DEV) {
  (async () => {
    try {
      await import(/* @vite-ignore */ './dev/renderHealthcheck.js');
      console.log('✅ Render Healthcheck loaded');
    } catch {
      console.warn('ℹ️ renderHealthcheck not found (optional).');
    }
  })();
}

/* ──────────────────────────────────────────────────────────────
   CANON:STATE-CONTROLLER BEGIN
   - No top-level await
   - Wires keyboard controls
   - Works with global SC if present, else dynamic import
   ────────────────────────────────────────────────────────────── */
(async () => {
  try {
    const BeatBus = window.BeatBus; // from Canon init-amplified
    if (!BeatBus) {
      console.warn('⚠️ BeatBus not found yet; controller will still try to boot.');
    }

    // Resolve StateCore (prefer global SC)
    let StateCore = (window.SC && typeof window.SC.get === 'function') ? window.SC : null;
    if (!StateCore) {
      try {
        // Try default export
        const mod = await import(/* @vite-ignore */ '@/modules/state/core/StateCore.js');
        StateCore = mod.default || mod.StateCore || mod;
      } catch (e) {
        console.warn('StateCore not found (./state/core/StateCore.js).', e?.message || e);
      }
    }

    // Resolve StateController (prefer global)
    let StateControllerCtor = window.StateController || null;
    if (!StateControllerCtor) {
      try {
        const mod = await import(/* @vite-ignore */ './state/controller/StateController.js');
        StateControllerCtor = mod.default || mod.StateController || mod;
      } catch (e) {
        console.warn('StateController not found (./state/controller/StateController.js).', e?.message || e);
      }
    }

    if (!StateCore || !StateControllerCtor) {
      throw new Error('Missing StateCore or StateController module');
    }

    // Instantiate controller
    const controller = new StateControllerCtor({ StateCore, BeatBus });
    window.__stateController = controller;

    // Keyboard wiring:
    //  - 1..9 -> go to stage index (0-based)
    //  - ArrowUp/Down -> morph ±0.05
    //  - ArrowRight/Left -> next/prev stage
    const onKey = (e) => {
      try {
        if (e.key >= '1' && e.key <= '9') {
          controller.toStageIndex?.(Number(e.key) - 1);
          return;
        }
        switch (e.key) {
          case 'ArrowUp':    controller.bumpMorph?.(+0.05); break;
          case 'ArrowDown':  controller.bumpMorph?.(-0.05); break;
          case 'ArrowRight': controller.nextStage?.();      break;
          case 'ArrowLeft':  controller.prevStage?.();      break;
        }
      } catch (err) {
        console.warn('StateController key handler error:', err);
      }
    };
    window.addEventListener('keydown', onKey);

    // Clean up on HMR
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        window.removeEventListener('keydown', onKey);
      });
    }

    console.log('🎛️ StateController wired', {
      stages: StateCore.getStages?.()?.length ?? 'unknown',
      bus: !!BeatBus,
    });
  } catch (err) {
    // Non-fatal: state wiring is optional until files exist
    console.warn('StateController wiring skipped (optional):', err?.message || err);
  }
})();
/* ──────────────────────────────────────────────────────────────
   CANON:STATE-CONTROLLER END
   ────────────────────────────────────────────────────────────── */
