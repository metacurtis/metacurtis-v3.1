// src/App.jsx
// SST v3.0 PRODUCTION - Minimal app shell

import React, { useEffect } from 'react';
import ConsciousnessTheater from './components/consciousness/ConsciousnessTheater';
import { clockAtom } from './stores/atoms/clockAtom';
import consciousnessEngine from './engine/ConsciousnessEngine'; // Import to initialize

export default function App() {
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
}
