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

import director from '@/theater/TheaterDirector.js';
import OpeningSequence from '@/components/theater/OpeningSequence.jsx';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import NavigationGate from '@/theater/NavigationGate.js';
import NarrationOverlayBus from '@/components/narrative/NarrationOverlayBus.jsx';

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
    // 1) Listen for viewport hint sent by WebGLBackground
    const offHint = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => {
      viewportReadyRef.current = true;
    });

    // 2) Start Director once, after hint
    const tick = setInterval(() => {
      if (!directorStartedRef.current && viewportReadyRef.current) {
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
      try { document.body.style.overflow = ''; } catch {}
      if (!import.meta.env.DEV || window.__HARD_UNMOUNT__) {
        try { director.cancel(); } catch {}
      }
      directorStartedRef.current = false;
      viewportReadyRef.current = false;
    };
  }, []);

  // --- viewport hint fallback + director start — __VIEWPORT_HINT_FALLBACK__
  useEffect(() => {
    let gotHint = false, started = false;
    const off = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => { gotHint = true; });
    const startDirector = () => {
      if (started) return;
      try { document.body.style.overflow = 'hidden'; } catch {}
      try { director?.start?.(); } catch {}
      started = true;
    };
    // if no hint in 800ms, synthesize one and start
    const t = setTimeout(() => {
      if (!gotHint) {
        try {
          const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
          const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
          BeatBus.emit(EVENTS.ENGINE_VIEWPORT_HINT, { width: w, height: h, aspect: w / Math.max(1, h) });
          console.log('📐 Theater: synthetic ENGINE_VIEWPORT_HINT emitted');
        } catch {}
      }
      startDirector();
    }, 800);
    // also start when the first real hint arrives
    const offStart = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => startDirector());
    return () => { clearTimeout(t); off && off(); offStart && offStart(); };
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

      // Morph controls (retain existing behaviour)
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();

        const current = typeof morphProgressRef.current === 'number' ? morphProgressRef.current : 0;
        const delta = key === 'ArrowUp' ? 0.1 : -0.1;
        const next = Math.max(0, Math.min(1, Number((current + delta).toFixed(3))));

        if (next !== current) {
          const updated = stateCommands.setMorphProgress(next, { origin: 'keyboard' });
          morphProgressRef.current = updated;
          console.log('🎬 [KEY NAV]', {
            key,
            action: key === 'ArrowUp' ? 'increase' : 'decrease',
            from: current.toFixed(2),
            to: updated.toFixed(2),
          });
        } else {
          console.log('🎬 [KEY NAV]', {
            key,
            action: key === 'ArrowUp' ? 'increase' : 'decrease',
            ignored: 'clamped',
            value: current.toFixed(2),
          });
        }
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

          // PHASE 2: Always use UnifiedNavigationAPI (no fallback)
          if (!window.unifiedNav) {
            console.error('🚨 UnifiedNavigationAPI not available - cannot navigate');
            return;
          }

          window.unifiedNav.navigateToStage(targetStage, {
            smooth: true,
            skipNarration: false,
            source: 'keyboard_number',
          });
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
          stageAtom.nextStage();
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
        case 'm':
        case 'M': {
          const current = morphProgressRef.current ?? 0;
          const target = current > 0.5 ? 0 : 1;
          morphProgressRef.current = stateCommands.setMorphProgress(target, {
            origin: 'developer-toggle',
          });
          break;
        }
        case 'r':
        case 'R':
          // PHASE 2: Use UnifiedNavigationAPI for reset
          if (!window.unifiedNav) {
            console.error('🚨 UnifiedNavigationAPI not available - cannot reset');
            return;
          }

          window.unifiedNav.navigateToStage('genesis', {
            smooth: true,
            skipNarration: false,
            source: 'keyboard_reset',
          });

          setTimeout(() => {
            morphProgressRef.current = stateCommands.setMorphProgress(0, { origin: 'reset' });
          }, 100);
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
      if (!NavigationGate.isInFlight()) {
        stateCommands.setMorphProgress(Math.min(progress * 2, 1), { origin: 'scroll' });
      }
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

      {/* Narrative overlay (bus-driven) */}
      <NarrationOverlayBus />

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
