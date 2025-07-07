// src/App.jsx
// ✅ CONTENT INTEGRITY FIXED: Pure State-Driven Architecture + Global Navigation + Phantom Functions Eliminated

import { Suspense, lazy, useEffect, useState } from 'react';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { usePerformanceStore } from '@/stores/performanceStore';
import CanvasErrorBoundary from '@/components/ui/CanvasErrorBoundary';
import GenesisCodeExperience from '@/components/sections/GenesisCodeExperience';
import DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor';

// Lazy load WebGL components for performance
const WebGLCanvas = lazy(() => import('@/components/webgl/WebGLCanvas'));

export default function App() {
  const isDevelopment = import.meta.env.DEV;
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // ✅ PURE STATE-DRIVEN: Access narrative store for global navigation
  const {
    currentStage,
    stageProgress,
    isTransitioning,
    enableNarrativeMode,
    nextStage,
    prevStage,
    jumpToStage,
    toggleAutoAdvance,
    isStageFeatureEnabled,
    getNavigationState,
  } = useNarrativeStore();

  // CONTENT INTEGRITY: Removed phantom logPerformanceEvent - using addEventLog for analytics

  console.log('🚀 MetaCurtis Digital Awakening: Pure state-driven architecture initialized');
  console.log(`🔧 Development mode: ${isDevelopment}`);
  console.log(`🎯 Current stage: ${currentStage} (${Math.round(stageProgress * 100)}%)`);

  // ✅ ENHANCED GLOBAL KEYBOARD NAVIGATION SYSTEM
  useEffect(() => {
    const handleGlobalKeydown = event => {
      // Prevent keyboard navigation if user is typing in inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter': {
          event.preventDefault();
          nextStage();
          // CONTENT INTEGRITY: Use addEventLog for analytics (with safety check)
          const addEventLog = usePerformanceStore.getState().addEventLog;
          if (addEventLog) {
            addEventLog('keyboard_navigation', { action: 'next_stage', stage: currentStage });
          }
          if (isDevelopment) {
            console.log('🎮 Navigation: Next stage triggered via keyboard');
          }
          break;
        }

        case 'ArrowLeft': {
          event.preventDefault();
          prevStage();
          // CONTENT INTEGRITY: Use addEventLog for analytics (with safety check)
          const addEventLogPrev = usePerformanceStore.getState().addEventLog;
          if (addEventLogPrev) {
            addEventLogPrev('keyboard_navigation', { action: 'prev_stage', stage: currentStage });
          }
          if (isDevelopment) {
            console.log('🎮 Navigation: Previous stage triggered via keyboard');
          }
          break;
        }

        case 'Home': {
          event.preventDefault();
          jumpToStage('genesis');
          // CONTENT INTEGRITY: Use addEventLog for analytics (with safety check)
          const addEventLogHome = usePerformanceStore.getState().addEventLog;
          if (addEventLogHome) {
            addEventLogHome('keyboard_navigation', { action: 'jump_to_genesis' });
          }
          if (isDevelopment) {
            console.log('🎮 Navigation: Jumped to genesis stage');
          }
          break;
        }

        case 'End': {
          event.preventDefault();
          jumpToStage('transcendence');
          // CONTENT INTEGRITY: Use addEventLog for analytics (with safety check)
          const addEventLogEnd = usePerformanceStore.getState().addEventLog;
          if (addEventLogEnd) {
            addEventLogEnd('keyboard_navigation', { action: 'jump_to_transcendence' });
          }
          if (isDevelopment) {
            console.log('🎮 Navigation: Jumped to transcendence stage');
          }
          break;
        }

        case 'p':
        case 'P': {
          if (event.ctrlKey && event.shiftKey) {
            // Ctrl+Shift+P for performance monitor
            event.preventDefault();
            setShowPerformanceMonitor(!showPerformanceMonitor);
            const addEventLogMonitor = usePerformanceStore.getState().addEventLog;
            if (addEventLogMonitor) {
              addEventLogMonitor('debug_toggle', { monitor: !showPerformanceMonitor });
            }
            if (isDevelopment) {
              console.log('🔧 Debug: Performance monitor toggled');
            }
          } else if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            toggleAutoAdvance();
            const addEventLogToggle = usePerformanceStore.getState().addEventLog;
            if (addEventLogToggle) {
              addEventLogToggle('keyboard_navigation', { action: 'toggle_auto_advance' });
            }
            if (isDevelopment) {
              console.log('🎮 Navigation: Auto-advance toggled');
            }
          }
          break;
        }

        // ✅ ENHANCED: Development shortcuts (Ctrl+0-4) + Navigation debug
        case '0':
        case '1':
        case '2':
        case '3':
        case '4': {
          if ((event.ctrlKey || event.metaKey) && isDevelopment) {
            event.preventDefault();
            const stageNames = ['genesis', 'silent', 'awakening', 'acceleration', 'transcendence'];
            const targetStage = stageNames[parseInt(event.key)];
            if (targetStage) {
              jumpToStage(targetStage);
              // CONTENT INTEGRITY: Use addEventLog for analytics (with safety check)
              const addEventLogDebug = usePerformanceStore.getState().addEventLog;
              if (addEventLogDebug) {
                addEventLogDebug('keyboard_navigation', {
                  action: 'debug_jump',
                  stage: targetStage,
                  index: parseInt(event.key),
                });
              }
              console.log(`🎮 Dev Navigation: Jumped to ${targetStage} (${event.key})`);
            }
          }
          break;
        }

        // ✅ ENHANCED: Navigation state debug (Ctrl+Shift+N)
        case 'N': {
          if (event.ctrlKey && event.shiftKey && isDevelopment) {
            event.preventDefault();
            const navState = getNavigationState();
            console.group('🎯 MC3V Navigation State Debug');
            console.log('Current Stage:', navState.currentStage);
            console.log('Stage Progress:', navState.stageProgress);
            console.log('Is Transitioning:', navState.isTransitioning);
            console.log('Enable Narrative Mode:', enableNarrativeMode);
            console.log('Feature Gates:', {
              terminalBoot: isStageFeatureEnabled('terminalBoot'),
              scrollHints: isStageFeatureEnabled('scrollHints'),
              memoryFragments: isStageFeatureEnabled('memoryFragments'),
              metacurtisEmergence: isStageFeatureEnabled('metacurtisEmergence'),
              contactPortal: isStageFeatureEnabled('contactPortal'),
            });
            console.log('Debug: Alt+D for particle debug modes, Alt+O for overlay');
            console.groupEnd();
            // CONTENT INTEGRITY: Use addEventLog for analytics (with safety check)
            const addEventLogNavDebug = usePerformanceStore.getState().addEventLog;
            if (addEventLogNavDebug) {
              addEventLogNavDebug('debug_navigation_state', navState);
            }
          }
          break;
        }

        default:
          // No action for other keys
          break;
      }
    };

    // Add global keyboard listener
    window.addEventListener('keydown', handleGlobalKeydown);

    // ✅ ENHANCED: Log comprehensive keyboard controls
    if (isDevelopment) {
      console.log('🎮 Enhanced Global Keyboard Navigation Active:');
      console.log('  STAGE NAVIGATION:');
      console.log('    → / Space / Enter = Next stage');
      console.log('    ← = Previous stage');
      console.log('    Home = Jump to genesis');
      console.log('    End = Jump to transcendence');
      console.log('  ADVANCED CONTROLS:');
      console.log('    Ctrl+P = Toggle auto-advance');
      console.log('    Ctrl+Shift+P = Toggle performance monitor');
      console.log('    Ctrl+0-4 = Dev stage jumping');
      console.log('    Ctrl+Shift+N = Navigation state debug');
      console.log('  PARTICLE DEBUG:');
      console.log('    Alt+D = Cycle debug modes');
      console.log('    Alt+O = Toggle debug overlay');
      console.log('    Alt+I/Shift+I = Adjust debug intensity');
    }

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('keydown', handleGlobalKeydown);
    };
  }, [
    nextStage,
    prevStage,
    jumpToStage,
    toggleAutoAdvance,
    getNavigationState,
    currentStage,
    enableNarrativeMode,
    isStageFeatureEnabled,
    isDevelopment,
    showPerformanceMonitor,
  ]);

  // ✅ ATMOSPHERIC: Stage-aware background gradients
  const getAtmosphericBackgroundClass = () => {
    const baseClasses = 'fixed inset-0 transition-colors duration-1000 pointer-events-none';
    switch (currentStage) {
      case 'genesis': {
        return `${baseClasses} bg-gradient-to-br from-slate-900 via-green-900/10 to-slate-900`;
      }
      case 'silent': {
        return `${baseClasses} bg-gradient-to-br from-slate-900 via-blue-900/10 to-slate-900`;
      }
      case 'awakening': {
        return `${baseClasses} bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900`;
      }
      case 'acceleration': {
        return `${baseClasses} bg-gradient-to-br from-slate-900 via-cyan-900/10 to-slate-900`;
      }
      case 'transcendence': {
        return `${baseClasses} bg-gradient-to-br from-slate-900 via-yellow-900/10 to-slate-900`;
      }
      default: {
        return `${baseClasses} bg-slate-900`;
      }
    }
  };

  return (
    <div className="metacurtis-app">
      {/* ✅ ATMOSPHERIC: Stage-aware background gradient */}
      <div className={getAtmosphericBackgroundClass()} />

      {/* ✅ ATMOSPHERIC: WebGL Particle Layer - Responds to narrative state */}
      <div
        className="webgl-layer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <CanvasErrorBoundary>
          <Suspense
            fallback={
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#00ff00',
                  fontSize: '18px',
                  fontFamily: '"Courier New", monospace',
                  textShadow: '0 0 10px #00ff00',
                  textAlign: 'center',
                }}
              >
                INITIALIZING DIGITAL AWAKENING...
                <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                  Loading atmospheric particle system
                </div>
              </div>
            }
          >
            <WebGLCanvas />
          </Suspense>
        </CanvasErrorBoundary>
      </div>

      {/* ✅ PURE STATE-DRIVEN: Complete Interface Layer */}
      <div
        className="interface-layer"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden', // ✅ NO SCROLLING: Pure state-driven navigation
        }}
      >
        <GenesisCodeExperience />
      </div>

      {/* ✅ ENHANCED: Development Tools & Debug Overlays */}
      {isDevelopment && showPerformanceMonitor && <DevPerformanceMonitor />}

      {/* ✅ ATMOSPHERIC: Stage transition indicator */}
      {isTransitioning && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#00ff00',
            fontSize: '14px',
            fontFamily: '"Courier New", monospace',
            textShadow: '0 0 5px #00ff00',
            border: '1px solid rgba(0,255,0,0.3)',
          }}
        >
          TRANSITIONING TO {currentStage.toUpperCase()}...
        </div>
      )}

      {/* ✅ ENHANCED: Navigation help overlay */}
      {isDevelopment && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 50,
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            fontFamily: '"Courier New", monospace',
            lineHeight: '1.4',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div>← → Navigate stages</div>
          <div>Space/Enter: Next</div>
          <div>Home/End: First/Last</div>
          <div>Alt+D: Debug modes</div>
          <div>Ctrl+Shift+N: Nav debug</div>
          <div>Ctrl+Shift+P: Performance</div>
        </div>
      )}

      {/* ✅ STAGE INDICATOR: Current stage display */}
      {isDevelopment && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 50,
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#00ff00',
            fontFamily: '"Courier New", monospace',
            textShadow: '0 0 5px #00ff00',
            border: '1px solid rgba(0,255,0,0.3)',
          }}
        >
          STAGE: {currentStage.toUpperCase()} ({Math.round(stageProgress * 100)}%)
        </div>
      )}
    </div>
  );
}

/*
🎯 CONTENT INTEGRITY FIXED: PURE STATE-DRIVEN ARCHITECTURE + PHANTOM FUNCTIONS ELIMINATED ✅

/*
🎯 CONTENT INTEGRITY FIXED: PURE STATE-DRIVEN ARCHITECTURE + PHANTOM FUNCTIONS ELIMINATED ✅

✅ FIXED: All syntax errors corrected:
- Added missing closing braces and brackets throughout switch statement
- Added missing event.preventDefault() calls
- Fixed malformed if/else blocks
- Added missing break statements in switch cases
- Corrected JSX structure and closing tags
- Fixed dependency array in useEffect

✅ CONTENT INTEGRITY COMPLIANCE:
- ❌ ELIMINATED: All 9 phantom logPerformanceEvent calls throughout the file
- ❌ REMOVED: logPerformanceEvent import (line 30)
- ✅ REPLACED: With addEventLog calls including safety checks for QA/analytics
- ✅ CLEANED: Dependency array - removed logPerformanceEvent reference
- ✅ PRESERVED: All keyboard navigation functionality and logging capabilities

✅ PURE STATE-DRIVEN DESIGN:
- Fixed viewport dimensions (100vh/100vw)
- overflow: hidden - NO SCROLLING whatsoever
- Pure narrative state transitions for all navigation
- GenesisCodeExperience as complete state-driven interface
- Atmospheric particles respond to narrative state changes

✅ ENHANCED GLOBAL KEYBOARD NAVIGATION:
- Arrow keys, spacebar, enter for intuitive stage progression
- Home/End for first/last stage jumping with analytics logging
- Ctrl+P for auto-advance toggle
- Ctrl+Shift+P for development performance monitor
- Ctrl+0-4 for development stage jumping with logging
- Ctrl+Shift+N for comprehensive navigation state debugging
- Smart input detection (doesn't interfere with forms)

✅ ATMOSPHERIC INTEGRATION:
- Stage-aware background gradients (subtle atmospheric enhancement)
- WebGL particle layer positioned as background (zIndex: 1)
- Interface layer for interactions (zIndex: 10)
- Smooth color transitions matching particle stage progressions
- Atmospheric loading indicators with proper branding

✅ ENHANCED DEVELOPMENT EXPERIENCE:
- Comprehensive console logging for all navigation events
- Complete keyboard shortcuts reference logged to console
- Stage transition indicators with atmospheric styling
- Real-time stage and progress indicators
- Performance monitor integration
- Navigation state debugging with feature gate inspection

This maintains the pure state-driven architecture with complete Content Integrity compliance! 🌟
*/
