// src/components/consciousness/ConsciousnessTheater.jsx
// Director-integrated Theater — start AFTER viewport hint; race-free opening (DEV-safe cancel guard)

import { useEffect, useState, useRef } from 'react';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { stageAtom } from '@/state/atoms/stageAtom.js';
import { qualityAtom } from '@/state/atoms/qualityAtom.js';
import { useMemoryFragments } from '@/hooks/useMemoryFragments.js';
import WebGLCanvas from '@/components/webgl/WebGLCanvas.jsx';
import { useAtomValue } from '@/state/atoms/createAtom.js';
import { narrativeAtom } from '@/state/atoms/narrativeAtom.js';
import stateCommands from '@/state/commands/StateCommands.js';
// import _DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor'; // optional

import '@/theater/disableDirectorAutostart.js';
import director from '@/theater/TheaterDirector.js';
import OpeningSequence from '@/components/theater/OpeningSequence.jsx';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { emitMorphProgress, emitRenderDirective } from '@/theater/bus/emitters.js';
import NavigationGate from '@/theater/NavigationGate.js';
import { NarrativeChoreography } from '@/components/narrative/NarrativeChoreography.jsx';

console.log('🧬 LOADED: ConsciousnessTheater — race-free opening (DEV-safe cancel)');

const GENESIS_STAGE_WORD = Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS';

// Debounce helper to prevent rapid-fire navigation (default 150ms)
function createDebouncer(minInterval = 150) {
  let lastCall = 0;
  let timeoutId = null;

  return function debounce(fn) {
    const now = performance.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall < minInterval) {
      if (timeoutId) clearTimeout(timeoutId);

      const remainingTime = minInterval - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCall = performance.now();
        fn();
      }, remainingTime);

      console.log('⏱️ [DEBOUNCE]', {
        action: 'delayed',
        timeSinceLastCall: Math.round(timeSinceLastCall),
        remainingTime: Math.round(remainingTime),
      });

      return false;
    }

    if (timeoutId) clearTimeout(timeoutId);
    lastCall = now;
    fn();

    return true;
  };
}

const MemoryFragmentRenderer = ({ fragment, onDismiss }) => {
  if (!fragment) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.95)',
        border: '2px solid #00FF00',
        borderRadius: '10px',
        padding: '30px',
        zIndex: 100,
        minWidth: '400px',
        maxWidth: '600px',
      }}
    >
      <h3
        style={{
          color: '#00FF00',
          marginTop: 0,
          fontFamily: 'Courier New, monospace',
        }}
      >
        {fragment.name}
      </h3>

      <div style={{ color: '#ffffff', marginBottom: '20px' }}>
        {fragment.content?.type === 'interactive' &&
          fragment.content?.element === 'commodore_terminal' && (
            <div
              style={{
                background: '#000',
                padding: '20px',
                fontFamily: 'Courier New, monospace',
                color: '#00FF00',
                border: '1px solid #00FF00',
              }}
            >
              READY.<br />
              {'10 PRINT "'}{GENESIS_STAGE_WORD}{'"'}<br />
              {'20 GOTO 10'}<br />
              RUN<br />
              <div style={{ marginTop: '10px', opacity: 0.7 }}>
                {Array(5)
                  .fill(`${GENESIS_STAGE_WORD} `)
                  .join('')}
                ...
              </div>
            </div>
          )}
      </div>

      <button
        onClick={onDismiss}
        style={{
          padding: '10px 20px',
          background: '#00FF00',
          color: '#000',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
        }}
      >
        Close
      </button>
    </div>
  );
};

export default function ConsciousnessTheater() {
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
  const scrollProgress = useAtomValue(narrativeAtom, (state) => state.scrollProgress);
  const morphProgress = useAtomValue(narrativeAtom, (state) => state.morphProgress);
  const [isInitialized, setIsInitialized] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const showCanvas = true;

  const currentStageRef = useRef(currentStage || 'genesis');
  const morphProgressRef = useRef(0);
  const directorStartedRef = useRef(false);
  const viewportReadyRef = useRef(false);
  const arrowKeyDebounce = useRef(createDebouncer(150)).current;

  const _stageConfig = Canonical.stages[currentStage];
  const {
    activeFragments,
    fragmentStates,
    triggerFragment,
    dismissFragment,
  } = useMemoryFragments(currentStage, scrollProgress * 100, null);
  const triggerFragmentRef = useRef(triggerFragment);
  triggerFragmentRef.current = triggerFragment;

  useEffect(() => {
    morphProgressRef.current = morphProgress;
  }, [morphProgress]);

  useEffect(() => {
    if (!currentStage) return;
    currentStageRef.current = currentStage;
    if (typeof qualityAtom.updateParticleBudget === 'function') {
      qualityAtom.updateParticleBudget(currentStage);
    }
  }, [currentStage]);

  // ───────────────── Director start AFTER viewport hint; scroll locked until ENABLE_SCROLL
  useEffect(() => {
    const demoCleanups = [];
    // 1) Listen for viewport hint sent by WebGLBackground
    const offHint = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => {
      viewportReadyRef.current = true;
    });

    // 2) Start Director once, after hint (demo mode bypasses opening/narration)
    const tick = setInterval(() => {
      if (!directorStartedRef.current && viewportReadyRef.current) {
        // Demo mode: bypass opening, narration, scroll orchestration
        if (globalThis.__DEMO_MODE__ && globalThis.__DEMO_KEY__) {
          const demoKey = globalThis.__DEMO_KEY__;
          console.log(`[ConsciousnessTheater] Demo mode detected, running: ${demoKey}`);

          // Stop ScrollOrchestrator for non-interactive demos only
          if (director.scrollOrchestrator && demoKey !== 'demo_intent_v2') {
            director.scrollOrchestrator.stop();
          }

          const hideInstantLoader = () => {
            try {
              const el = document.getElementById('instant-loader');
              if (el) el.classList.add('hidden');
            } catch {}
          };

          // Trigger emergence so renderer binds geometry
          BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
            mode: 'emergence',
            target: 'genesis',
            targetState: 'genesis_initial',
            source: 'demo',
            count: 12000,
            fastForward: true,
            skipMorphAnimation: true,
          });

          // Wait for blueprint bind, then start demo
          let demoBlueprintReady = false;
          let rendererReady = false;
          let pendingActiveCount = null;

          const maybeStartDemo = () => {
            console.log('[DemoGate] maybeStartDemo', {
              demoBlueprintReady,
              rendererReady,
              pendingActiveCount,
              timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
            });
            if (!demoBlueprintReady || !rendererReady) return;
            try {
              hideInstantLoader();
              const loader = document.getElementById('instant-loader');
              if (loader) {
                loader.classList.add('hidden');
                loader.style.display = 'none';
              }
              const startMorph = demoKey === 'demo_intent_v2' ? 0 : 0.98;
              emitMorphProgress({ progress: startMorph, source: 'demo' });
              emitRenderDirective({
                source: 'visual_orchestrator',
                phase: 'visual_demo',
                stage: 'genesis',
                uMorphProgress: startMorph,
                uStageProgress: 1,
                uOpacityMin: 0.5,
                uOpacityMax: 1.0,
                drawCount: pendingActiveCount,
                activeCount: pendingActiveCount,
                pointSize: 48,
              });
              director.runVisualDemo(demoKey);
              console.log(`[ConsciousnessTheater] Demo started: ${demoKey}`);
            } catch (err) {
              console.error('[ConsciousnessTheater] Demo failed to start:', err);
            }
          };

          const offBlueprint = BeatBus.on(EVENTS.BLUEPRINT_READY, (p = {}) => {
            if (p.stage !== 'genesis') return;
            pendingActiveCount =
              p?.activeCount ??
              p?.blueprint?.activeCount ??
              p?.blueprint?.particleCount ??
              null;
            demoBlueprintReady = true;
            console.log('[DemoGate] BLUEPRINT_READY (genesis)', {
              pendingActiveCount,
              timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
            });
            maybeStartDemo();
          });

          const checkRendererReady = () => {
            try {
              if (window.__rendererListenersReady === true) {
                rendererReady = true;
                console.log('[DemoGate] Renderer already ready on check (__rendererListenersReady)');
                maybeStartDemo();
                return true;
              }
            } catch {}
            return false;
          };

          const offRendererReady = BeatBus.on(EVENTS.FENCEPOST_LISTENERS_READY, (payload = {}) => {
            if (payload?.channel !== 'renderer') return;
            rendererReady = true;
            console.log('[DemoGate] FENCEPOST_LISTENERS_READY (renderer)', {
              payload,
              timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
            });
            maybeStartDemo();
          });
          demoCleanups.push(offBlueprint, offRendererReady);

          // Immediate check in case renderer ready fired before listener registration
          checkRendererReady();
          // Timeout fallback if fencepost is missed
          const fallbackTimeout = setTimeout(() => {
            if (!rendererReady) {
              console.log('[DemoGate] Forcing rendererReady via timeout fallback');
              rendererReady = true;
              maybeStartDemo();
            }
          }, 1000);
          demoCleanups.push(() => clearTimeout(fallbackTimeout));

          directorStartedRef.current = true;
          clearInterval(tick);
          return;
        }

        try { document.body.style.overflow = 'hidden'; } catch {}
        director.start();
        directorStartedRef.current = true;
        clearInterval(tick);
      }
    }, 50);

    // 3) Director handoff signals
    const offs = [
      BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
        console.log('   Theater: Scroll enabled by Director');
        setScrollEnabled(true);
        try { document.body.style.overflow = ''; } catch {}
      }),
      BeatBus.on(EVENTS.START_NARRATIVE, ({ stage }) => {
        console.log(`   Theater: Starting ${stage} narrative`);
        setIsInitialized(true);
      }),
    ];

    // DEV-safe cleanup: only cancel on true unmount (prod) or when explicitly requested
    return () => {
      clearInterval(tick);
      offHint && offHint();
      offs.forEach((off) => off && off());
      demoCleanups.forEach((off) => off && off());
      try { document.body.style.overflow = ''; } catch {}
      if (!import.meta.env.DEV || window.__HARD_UNMOUNT__) {
        try { director.cancel(); } catch {}
      }
      directorStartedRef.current = false;
      viewportReadyRef.current = false;
    };
  }, []);

  // --- Viewport hint fallback — emit hint if renderer never provided one
  useEffect(() => {
    let gotHint = false;
    const off = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => { gotHint = true; });
    const timer = setTimeout(() => {
      if (!gotHint) {
        try {
          const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
          const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
          BeatBus.emit(EVENTS.ENGINE_VIEWPORT_HINT, {
            width: w,
            height: h,
            aspect: w / Math.max(1, h),
          });
          console.log('📐 Theater: synthetic ENGINE_VIEWPORT_HINT emitted');
        } catch {}
      }
    }, 800);
    return () => {
      clearTimeout(timer);
      off && off();
    };
  }, []);

  // ───────────────── Keyboard navigation (after handoff)
  useEffect(() => {
    if (!isInitialized) return;

    const stageNames =
      Array.isArray(Canonical.stageOrder) && Canonical.stageOrder.length
        ? Canonical.stageOrder
        : Object.keys(Canonical.stages || {});

    const skipNarrationIfActive = () => {
      const controller = typeof window !== 'undefined' ? window.narrationController : null;
      if (controller?.isPlaying && typeof controller.skipNarration === 'function') {
        controller.skipNarration();
        return true;
      }
      return false;
    };

    const handleKey = (e) => {
      const tagName = e.target?.tagName;
      if (tagName && ['INPUT', 'TEXTAREA'].includes(tagName)) return;

      const key = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        console.log('🔍 [KEY DEBUG]', {
          key,
          target: tagName || 'unknown',
          defaultPrevented: e.defaultPrevented,
          timestamp: performance.now(),
        });
      }

      // Stage navigation keys
      if (key === 'ArrowRight' || key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();

        arrowKeyDebounce(() => {
          const state = stageAtom.getState?.();
          const activeStage = state?.currentStage || currentStageRef.current || stageNames[0];
          const currentIndex = Math.max(0, stageNames.indexOf(activeStage));
          const maxIndex = stageNames.length - 1;
          const targetIndex =
            key === 'ArrowRight'
              ? Math.min(currentIndex + 1, maxIndex)
              : Math.max(currentIndex - 1, 0);

          if (targetIndex === currentIndex) {
            return;
          }

          const targetStage = stageNames[targetIndex];
          const targetScrollPercent =
            maxIndex > 0 ? (targetIndex / maxIndex) * 100 : 0;

          const narrationSkipped = skipNarrationIfActive();

          console.log('🎹 [UNIFIED NAV]', {
            key,
            from: activeStage,
            to: targetStage,
            targetScrollPercent: `${targetScrollPercent.toFixed(1)}%`,
            method: 'ORCHESTRATED_JUMP',
            narrationSkipped,
          });

          const scrollRange =
            typeof window !== 'undefined'
              ? Math.max(1, document.body.scrollHeight - window.innerHeight)
              : 1;
          const scrollTarget = (targetScrollPercent / 100) * scrollRange;

          if (typeof window !== 'undefined') {
            window.scrollTo({
              top: scrollTarget,
              behavior: 'smooth',
            });
          }

          console.log('🎬 [KEY NAV]', {
            key,
            from: activeStage,
            to: targetStage,
            targetScrollPercent: `${targetScrollPercent.toFixed(1)}%`,
            narrationSkipped,
            debounced: true,
          });
        });
        return;
      }

      // Numeric shortcuts
      if (/^[0-6]$/.test(key)) {
        e.preventDefault();
        e.stopPropagation();

        const numeric = parseInt(key, 10);
        const targetIndex =
          numeric === 0 ? 0 : Math.max(0, Math.min(stageNames.length - 1, numeric - 1));
        const targetStage = stageNames[targetIndex];

        if (targetStage) {
          const narrationSkipped = skipNarrationIfActive();
          console.log('🎹 [NUMBER KEY NAV]', {
            key,
            targetStage,
            method: 'UNIFIED_ORCHESTRATED',
            timestamp: performance.now(),
            narrationSkipped,
          });

          if (window.unifiedNav) {
            window.unifiedNav.navigateToStage(targetStage, {
              smooth: true,
              skipNarration: false,
              source: 'number_key',
            });
          } else {
            window.NavigationCommands?.navigateToStageCanonical?.(targetStage, {
              origin: 'number_key_fallback',
              viaScroll: false,
            });
          }
        }
        return;
      }

      // Spacebar → next stage (kept for parity with previous behaviour)
      if (key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        const before = stageAtom.getState?.();
        const narrationSkipped = skipNarrationIfActive();
        const stageNamesRef =
          stageAtom.getStageNames?.() ?? stageNames ?? Canonical?.stageOrder ?? [];
        const currentIndex = stageNamesRef.indexOf(before?.currentStage || '');
        const nextIndex = Math.min(
          currentIndex >= 0 ? currentIndex + 1 : 1,
          Math.max(stageNamesRef.length - 1, 0)
        );
        const targetStage = stageNamesRef[nextIndex] || stageNamesRef[stageNamesRef.length - 1];

        if (targetStage && window.unifiedNav?.navigateToStage) {
          window.unifiedNav.navigateToStage(targetStage, {
            smooth: true,
            source: 'keyboard_space',
          });
        } else {
          const nextStage =
            stageNamesRef[nextIndex] || stageNamesRef[stageNamesRef.length - 1];
          window.NavigationCommands?.navigateToStageCanonical?.(nextStage, {
            origin: 'keyboard_space_fallback',
            viaScroll: false,
          });
        }
        const after = stageAtom.getState?.();
        console.log('🎬 [KEY NAV]', {
          key: 'Space',
          from: before?.currentStage ?? null,
          to: after?.currentStage ?? targetStage ?? null,
          narrationSkipped,
        });
        return;
      }

      // Developer toggles / helpers preserved
      switch (key) {
        case 'h':
        case 'H':
          window.SHOW_DIRECTOR = !window.SHOW_DIRECTOR;
          window.location.reload();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isInitialized]);

  // ───────────────── Scroll → morph/stage (after handoff)
  useEffect(() => {
    if (!isInitialized || !scrollEnabled) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const progress = Math.min(scrollTop / scrollHeight, 1);

      stateCommands.setScrollProgress(progress, { origin: 'scroll' });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInitialized, scrollEnabled]);

  // ───────────────── Render
  return (
    <div className="consciousness-theater-v3">
      <OpeningSequence />

      {/* tall spacer to allow scrolling once enabled */}
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '700vh',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {showCanvas && (
        <WebGLCanvas
          stage={currentStage}
          morphProgress={morphProgress}
          scrollProgress={scrollProgress}
        />
      )}

      {/* Narrative choreography overlay */}
      <NarrativeChoreography />

      {/* Memory fragments */}
      {activeFragments.map((fragment) => {
        const state = fragmentStates[fragment.id];
        return state?.state === 'active' ? (
          <MemoryFragmentRenderer
            key={fragment.id}
            fragment={fragment}
            onDismiss={() => dismissFragment(fragment.id)}
          />
        ) : null;
      })}
    </div>
  );
}
