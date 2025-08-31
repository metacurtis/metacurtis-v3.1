// src/App.jsx
// SST v3.0 — Minimal app shell with debug harness toggle

import { useEffect, useMemo, useRef } from 'react';
import OpeningDebugHarness from '@/debug/opening-debug/OpeningDebugHarness.jsx';
import ConsciousnessTheater from '@/components/consciousness/ConsciousnessTheater.jsx';
import { clockAtom } from '@/state/atoms/clockAtom.js';         // ← note: '/state/atoms', not '/stores/atoms'
import engine from '@/engine/ConsciousnessEngine.js';           // keep for side-effects
import RepoDoctorOverlay from '@/dev/RepoDoctorOverlay.jsx';

export default function App() {
  const didInitRef = useRef(false);

  // Enable the harness if:
  //  - you add ?debug=opening to the URL, or
  //  - set localStorage.OPENING_DEBUG = "1", or
  //  - set VITE_OPENING_DEBUG=1 in your env
  const openingDebug = useMemo(() => {
    const qp = new URLSearchParams(window.location.search);
    return import.meta.env.DEV && (
      qp.get('debug') === 'opening' ||
      localStorage.getItem('OPENING_DEBUG') === '1' ||
      import.meta.env.VITE_OPENING_DEBUG === '1'
    );
  }, []);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    // expose engine for dev tools
    if (typeof window !== 'undefined') window.engine ??= engine;

    // start clock if available
    clockAtom.start?.();

    return () => {
      clockAtom.stop?.();
    };
  }, []);

  return (
    <>
      {openingDebug ? <OpeningDebugHarness /> : <ConsciousnessTheater />}
      {import.meta.env.DEV && <RepoDoctorOverlay />}
    </>
  );
}
