// src/App.jsx
// SST v3.0 PRODUCTION - Minimal app shell

import React, { useEffect } from 'react';
import ConsciousnessTheater from './components/consciousness/ConsciousnessTheater';
import { clockAtom } from './stores/atoms/clockAtom';
import consciousnessEngine from './engine/ConsciousnessEngine'; // Import to initialize
// @doctor:4b-disposers
const __doctorDisposers = [];export default function App() {
  useEffect(() => {
    const clock = clockAtom.getState();
    if (!clock.isRunning) {
      clockAtom.start?.();
    }

    // Engine initializes itself on import
    console.log('🚀 App initialized with ConsciousnessEngine');

    return () => {
      if (clockAtom.getState().isRunning) {
        clockAtom.stop?.();
      }
    };
  }, []);

  return <ConsciousnessTheater />;
} // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}