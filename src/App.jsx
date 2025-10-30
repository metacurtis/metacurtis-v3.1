// src/App.jsx
// SST v3.0 PRODUCTION - Complete app shell with Canon console

import React, { useEffect } from 'react';
import ConsciousnessTheater from './components/consciousness/ConsciousnessTheater';
import LCPHero from './components/ui/LCPHero.jsx';
import AmbientFragmentManager from '@/components/fragments/AmbientFragmentManager.jsx';
import ClimaxSequenceController from '@/components/fragments/ClimaxSequenceController.jsx';
import NarrationController from '@/components/narrative/NarrationController.jsx';
import NarrativeUIControls from '@/components/ui/NarrativeUIControls.jsx';
import { clockAtom } from '@/state/atoms';

import '@/orchestration/navigation/narrativeNavigation.js';

// Import engine as side-effect to ensure initialization
import './engine/ConsciousnessEngine';

// 🔬 DIAGNOSTIC: App initialization
if (typeof window !== 'undefined') {
  console.log('🔬 [APP] Initializing MetaCurtis App');
  window.__appDiagnostic = {
    componentsMount: [],
    initialized: Date.now(),
  };
}

// DEV: Canon Dev-OS injector (idempotent, order-aware)
if (import.meta.env.DEV && typeof window !== 'undefined') {
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

  return (
    <div className="relative min-h-screen">
      {/* STEP 0: Instant LCP hero – fades once particles emerge */}
      <LCPHero />
      <ConsciousnessTheater />
      <AmbientFragmentManager />
      <ClimaxSequenceController />
      <NarrationController />
      {(() => {
        if (typeof window !== 'undefined') {
          window.__appDiagnostic?.componentsMount.push({
            component: 'NarrativeUIControls',
            time: Date.now(),
          });
        }
        console.log('🔬 [APP] Mounting NarrativeUIControls');
        return <NarrativeUIControls />;
      })()}
    </div>
  );
}
