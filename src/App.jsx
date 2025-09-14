// src/App.jsx
// SST v3.0 PRODUCTION - Complete app shell with Canon console

import React, { useEffect } from 'react';
import ConsciousnessTheater from './components/consciousness/ConsciousnessTheater';
import { clockAtom } from '@/state/atoms';

// Import engine as side-effect to ensure initialization
import './engine/ConsciousnessEngine';

// DEV: Canon Dev-OS injector (idempotent, order-aware)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  void import('/canon-console/browser/inject.js'); // absolute from Vite root
}

export default function App() {
  useEffect(() => {
    console.log('🚀 App initializing...');
    
    // Start the clock atom if not already running
    const clock = clockAtom.getState();
    if (!clock.isRunning && typeof clockAtom.start === 'function') {
      clockAtom.start();
      console.log('⏰ Clock atom started');
    }
    
    // Log available debug tools
    console.log('🧬 MetaCurtis Consciousness Theater v3.0');
    console.log('📊 Debug tools available:');
    console.log('  - globalThis.qualityControls (performance testing)');
    console.log('  - window.theaterDirector (opening control)');
    console.log('  - window.hotdors (renderer diagnostics)');
    console.log('  - window.CANON_INJECTOR (dev console system)');
    console.log('  - BeatBus (event system)');
    console.log('');
    console.log('🎮 Quick commands:');
    console.log('  window.theaterDirector.forceStart() - Start opening');
    console.log('  window.hotdors.selfverifyATS() - Check opening sequence');
    console.log('  Alt+` - Toggle Canon HUD');
    
    // Cleanup on unmount
    return () => {
      const currentClock = clockAtom.getState();
      if (currentClock.isRunning && typeof clockAtom.stop === 'function') {
        clockAtom.stop();
        console.log('⏰ Clock atom stopped');
      }
    };
  }, []);

  return <ConsciousnessTheater />;
}