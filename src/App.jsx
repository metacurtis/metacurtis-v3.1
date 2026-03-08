// src/App.jsx
// SST v3.0 PRODUCTION - Complete app shell with Canon console

import React, { useEffect } from 'react';
import ConsciousnessTheater from './components/consciousness/ConsciousnessTheater';
import LCPHero from './components/ui/LCPHero.jsx';
import AmbientFragmentManager from '@/components/fragments/AmbientFragmentManager.jsx';
import ClimaxSequenceController from '@/components/fragments/ClimaxSequenceController.jsx';
import NarrationController from '@/components/narrative/NarrationController.jsx';
import NarrativeUIControls from '@/components/ui/NarrativeUIControls.jsx';
import DemoOverlay from '@/components/demo/DemoOverlay.jsx';
import DemoLauncher from '@/components/dev/DemoLauncher.jsx';
import LandingOverlay from '@/components/landing/LandingOverlay.jsx';
import LandingUiOverlay from '@/components/landing/LandingUiOverlay.jsx';
import LandingPillNav from '@/components/landing/LandingPillNav.jsx';
import LandingSectionStack from '@/components/landing/LandingSectionStack.jsx';
import { clockAtom } from '@/state/atoms';
import { qualityAtom } from '@/state/atoms/qualityAtom.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';

import '@/orchestration/navigation/narrativeNavigation.js';

// Import engine as side-effect to ensure initialization
import './engine/ConsciousnessEngine';

const APP_DEBUG_ENABLED = (() => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const explicitDebug = params.get('debug') === '1';
  return import.meta.env.DEV || explicitDebug;
})();

// 🔬 DIAGNOSTIC: App initialization
if (APP_DEBUG_ENABLED && typeof window !== 'undefined') {
  console.log('🔬 [APP] Initializing MetaCurtis App');
  window.__appDiagnostic = window.__appDiagnostic || {
    componentsMount: [],
    initialized: Date.now(),
  };
}

// DEV: Canon Dev-OS injector (idempotent, order-aware)
if (import.meta.env.DEV && typeof window !== 'undefined') {
}

const landingRootStyle = {
  position: 'relative',
  minHeight: '100vh',
  height: '100vh',
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollBehavior: 'smooth',
};

function NarrativeUIControlsWithDiagnostics() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__appDiagnostic?.componentsMount?.push({
        component: 'NarrativeUIControls',
        time: Date.now(),
      });
    }
    if (APP_DEBUG_ENABLED) {
      console.log('🔬 [APP] Mounting NarrativeUIControls');
    }
  }, []);

  return <NarrativeUIControls />;
}

export default function App() {
  const appParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isLandingStageSlice =
    typeof window !== 'undefined' && appParams?.get('slice') === 'landing_stage';
  const isLandingSliceMode = isLandingStageSlice;
  const uiVariant = isLandingSliceMode
    ? (() => {
      const rawUi = (appParams?.get('ui') || 'pill').toLowerCase();
      return rawUi === 'console' ? 'console' : 'pill';
    })()
    : 'console';
  const isPillUiVariant = uiVariant === 'pill';
  const showLandingDevUi =
    import.meta.env.DEV && appParams?.get('devui') === '1';
  const showMainDevUi =
    import.meta.env.DEV && appParams?.get('devui') !== '0';
  const forcedQualityTier =
    typeof window !== 'undefined'
      ? (() => {
          const explicit = (
            window.__FORCE_QUALITY_TIER__ ||
            appParams?.get('quality') ||
            appParams?.get('landingQuality') ||
            Canonical?.landingStageSliceResolved?.quality ||
            ''
          ).toUpperCase();
          return ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'].includes(explicit)
            ? explicit
            : null;
        })()
      : null;
  useEffect(() => {
    if (!isLandingSliceMode) return;
    const loader = document.getElementById('instant-loader');
    if (!loader) return;
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }, [isLandingSliceMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('form-mode', isLandingSliceMode);
    document.body.classList.toggle('scene-mode', isLandingSliceMode);
    return () => {
      document.body.classList.remove('form-mode');
      document.body.classList.remove('scene-mode');
    };
  }, [isLandingSliceMode]);

  useEffect(() => {
    if (isLandingSliceMode) return;
    if (APP_DEBUG_ENABLED) {
      console.log('🚀 App initializing...');
    }
    
    // Start the clock atom if not already running
    const clock = clockAtom.getState();
    if (!clock.isRunning && typeof clockAtom.start === 'function') {
      clockAtom.start();
      if (APP_DEBUG_ENABLED) {
        console.log('⏰ Clock atom started');
      }
    }
    
    // Log available debug tools
    if (APP_DEBUG_ENABLED) {
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
    }
    
    // Cleanup on unmount
    return () => {
      const currentClock = clockAtom.getState();
      if (currentClock.isRunning && typeof clockAtom.stop === 'function') {
        clockAtom.stop();
        if (APP_DEBUG_ENABLED) {
          console.log('⏰ Clock atom stopped');
        }
      }
    };
  }, [isLandingSliceMode]);

  useEffect(() => {
    if (!forcedQualityTier) return;
    const currentTier = qualityAtom.getState?.()?.currentQualityTier;
    if (currentTier === forcedQualityTier) return;
    qualityAtom.setCurrentQualityTier?.(forcedQualityTier);
  }, [forcedQualityTier]);

  if (isLandingSliceMode) {
    return (
      <div className="relative min-h-screen" data-ui="landing-scroll-root" data-ui-variant={uiVariant} style={landingRootStyle}>
        {showLandingDevUi && !isPillUiVariant ? <DemoLauncher /> : null}
        <ConsciousnessTheater mode="landing_stage" />
        {showLandingDevUi && !isPillUiVariant ? <LandingOverlay /> : null}
        {isPillUiVariant ? <LandingPillNav /> : <LandingUiOverlay />}
        <LandingSectionStack />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* STEP 0: Instant LCP hero – fades once particles emerge */}
      <LCPHero />
      {showMainDevUi ? <DemoLauncher /> : null}
      <ConsciousnessTheater />
      <AmbientFragmentManager />
      <ClimaxSequenceController />
      <NarrationController />
      <NarrativeUIControlsWithDiagnostics />
      {showMainDevUi ? <DemoOverlay /> : null}
    </div>
  );
}
