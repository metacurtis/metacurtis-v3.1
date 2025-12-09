// src/components/ui/NarrativeUIControls.jsx
// 🎯 Navigation UI Controls - Uses narrativeAtom

import { useState, useEffect } from 'react';

export default function NarrativeUIControls() {
  const [navState, setNavState] = useState(null);

  // Subscribe to navigation state updates
  useEffect(() => {
    const updateNavState = () => {
      if (window.narrativeNavigation) {
        setNavState(window.narrativeNavigation.getNavigationState());
      }
    };

    // Initial update
    updateNavState();

    // Update on stage changes (listen to custom events or poll)
    const interval = setInterval(updateNavState, 100); // Light polling

    return () => clearInterval(interval);
  }, []);

  if (!navState) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          color: '#666',
          fontSize: '0.75rem',
          zIndex: 22,
        }}
      >
        Navigation loading...
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 22 }}>
      {/* Navigation Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
          }}
        >
          <button
            onClick={() => {
              console.log('🎛️ [UI CONTROLS]', {
                action: 'prevStage',
                method: 'UNIFIED_ORCHESTRATED',
                timestamp: performance.now(),
              });
              if (window.unifiedNav) {
                window.unifiedNav.prevStage({ source: 'ui_controls' });
              } else {
                window.narrativeNavigation?.prevStage();
              }
            }}
            disabled={!navState.canGoPrev || navState.isTransitioning}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              cursor: navState.canGoPrev && !navState.isTransitioning ? 'pointer' : 'not-allowed',
              opacity: navState.canGoPrev && !navState.isTransitioning ? 1 : 0.3,
            }}
          >
            ← Prev
          </button>

          <button
            onClick={() => {
              console.log('🎛️ [UI CONTROLS]', {
                action: 'nextStage',
                method: 'UNIFIED_ORCHESTRATED',
                timestamp: performance.now(),
              });
              if (window.unifiedNav) {
                window.unifiedNav.nextStage({ source: 'ui_controls' });
              } else {
                window.narrativeNavigation?.nextStage();
              }
            }}
            disabled={!navState.canGoNext || navState.isTransitioning}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              cursor: navState.canGoNext && !navState.isTransitioning ? 'pointer' : 'not-allowed',
              opacity: navState.canGoNext && !navState.isTransitioning ? 1 : 0.3,
            }}
          >
            Next →
          </button>
        </div>

        <button
          onClick={() =>
            window.narrativeNavigation?.toggleAutoAdvance(!navState.autoAdvanceEnabled)
          }
          style={{
            background: navState.autoAdvanceEnabled ? '#0D9488' : 'transparent',
            border: '1px solid #0D9488',
            color: navState.autoAdvanceEnabled ? 'white' : '#0D9488',
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {navState.autoAdvanceEnabled ? '⏸️ Auto' : '▶️ Auto'}
        </button>
      </div>

      {/* Stage Info */}
      <div
        style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.625rem',
          textAlign: 'right',
        }}
      >
        Stage {navState.currentIndex + 1} of {navState.allStages.length}
        <br />
        {navState.isTransitioning && 'Transitioning...'}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.5rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '4px',
          fontSize: '0.625rem',
          color: 'rgba(255, 255, 255, 0.5)',
          lineHeight: 1.3,
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Keyboard:</div>
        <div>→ / Space: Next</div>
        <div>← : Previous</div>
        <div>Ctrl+P: Auto-advance</div>
        <div>Home/End: First/Last</div>
      </div>
    </div>
  );
}

/*
🎯 CONSOLIDATION COMPLETE

✅ REPLACES: StageNavigation.jsx
✅ USES: narrativeAtom directly
✅ FEATURES:
  - Prev/Next navigation controls
  - Auto-advance toggle
  - Real-time state updates
  - Keyboard shortcuts help
  - Transition state awareness

✅ API INTEGRATION:
  - window.narrativeNavigation.getNavigationState()
  - window.narrativeNavigation.nextStage()
  - window.narrativeNavigation.prevStage()
  - window.narrativeNavigation.toggleAutoAdvance()

This completely replaces StageNavigation with a richer UI that uses
the consolidated navigation system underneath.
*/
