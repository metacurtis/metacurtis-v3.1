// src/components/consciousness/ConsciousnessTheater.jsx
// Director-integrated Theater — start AFTER viewport hint; race-free opening (DEV-safe cancel guard)

import { useEffect, useState, useRef } from 'react';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { stageAtom } from '@/state/atoms/stageAtom.js';
import { qualityAtom } from '@/state/atoms/qualityAtom.js';
import { useMemoryFragments } from '@/hooks/useMemoryFragments.js';
import WebGLCanvas from '@/components/webgl/WebGLCanvas.jsx';
// import _DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor'; // optional

import director from '@/theater/TheaterDirector.js';
import OpeningSequence from '@/components/theater/OpeningSequence.jsx';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

console.log('🧬 LOADED: ConsciousnessTheater — race-free opening (DEV-safe cancel)');

const NarrationOverlay = ({ segment }) => {
  if (!segment) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: '800px',
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '20px 30px',
        borderRadius: '10px',
        border: '1px solid rgba(0, 255, 0, 0.3)',
        zIndex: 40,
      }}
    >
      <p
        style={{
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '1.1rem',
          lineHeight: '1.6',
          margin: 0,
          textAlign: 'center',
        }}
      >
        {segment.text}
      </p>
    </div>
  );
};

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
              10 PRINT &quot;HELLO CURTIS&quot;<br />
              20 GOTO 10<br />
              RUN<br />
              <div style={{ marginTop: '10px', opacity: 0.7 }}>
                {Array(5)
                  .fill('HELLO CURTIS ')
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
  const [currentStage, setCurrentStage] = useState('genesis');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [narrativeEnabled, setNarrativeEnabled] = useState(false);
  const [activeNarrative, setActiveNarrative] = useState(null);
  const [showCanvas] = useState(true);

  const startTimeRef = useRef(Date.now());
  const currentStageRef = useRef('genesis');
  const morphProgressRef = useRef(0);
  const directorStartedRef = useRef(false);
  const viewportReadyRef = useRef(false);

  const _stageConfig = Canonical.stages[currentStage];
  const narrative = Canonical.dialogue?.[currentStage];

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
        setNarrativeEnabled(true);
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
        const before = stageAtom.getState?.();
        const narrationSkipped = skipNarrationIfActive();

        if (key === 'ArrowRight') {
          stageAtom.nextStage();
        } else {
          stageAtom.prevStage();
        }

        const after = stageAtom.getState?.();
        console.log('🎬 [KEY NAV]', {
          key,
          from: before?.currentStage,
          to: after?.currentStage,
          narrationSkipped,
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
          setMorphProgress(next);
          morphProgressRef.current = next;

          const engine = typeof window !== 'undefined' ? window.consciousnessEngine : null;
          if (engine?.setMorphOverride) {
            try {
              engine.setMorphOverride(next);
            } catch (err) {
              console.warn('⚠️ [KEY NAV] setMorphOverride failed', err);
            }
          }

          BeatBus.emit?.(EVENTS.MORPH_PROGRESS, {
            value: next,
            stage: currentStageRef.current,
            manual: true,
          });

          console.log('🎬 [KEY NAV]', {
            key,
            action: key === 'ArrowUp' ? 'increase' : 'decrease',
            from: current.toFixed(2),
            to: next.toFixed(2),
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
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        e.stopPropagation();

        const numeric = parseInt(key, 10);
        const targetIndex =
          numeric === 0 ? 0 : Math.max(0, Math.min(stageNames.length - 1, numeric - 1));
        const targetStage = stageNames[targetIndex];
        if (targetStage) {
          const before = stageAtom.getState?.();
          const narrationSkipped = skipNarrationIfActive();
          stageAtom.jumpToStage(targetStage);
          const after = stageAtom.getState?.();
          console.log('🎬 [KEY NAV]', {
            key,
            targetStage,
            from: before?.currentStage,
            to: after?.currentStage,
            narrationSkipped,
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
        stageAtom.nextStage();
        const after = stageAtom.getState?.();
        console.log('🎬 [KEY NAV]', {
          key: 'Space',
          from: before?.currentStage,
          to: after?.currentStage,
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
        case 'M':
          setMorphProgress((p) => (p > 0.5 ? 0 : 1));
          break;
        case 'r':
        case 'R':
          stageAtom.jumpToStage('genesis');
          setMorphProgress(0);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isInitialized, setMorphProgress]);

  // ───────────────── Stage subscription
  useEffect(() => {
    const unsubscribe = stageAtom.subscribe((state) => {
      if (state.currentStage !== currentStageRef.current) {
        currentStageRef.current = state.currentStage;
        setCurrentStage(state.currentStage);
        qualityAtom.updateParticleBudget(state.currentStage);
      }
    });
    return unsubscribe;
  }, []);

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

      setScrollProgress(progress);
      setMorphProgress(Math.min(progress * 2, 1)); // 0–50% maps to 0–1

      const stageProgress = progress * 100;
      const newStageCfg = Canonical.getStageByScroll?.(stageProgress);
      const atomStage = stageAtom.getState().currentStage;
      if (newStageCfg && newStageCfg.name !== atomStage) {
        stageAtom.jumpToStage(newStageCfg.name);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInitialized, scrollEnabled]);

  // ───────────────── Narrative timing
  useEffect(() => {
    if (!narrative?.narration?.segments || !isInitialized || !narrativeEnabled) return;
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const seg = narrative.narration.segments.find((s) => {
        const start = s.timing.start;
        const end = s.timing.start + s.timing.duration;
        return elapsed >= start && elapsed < end;
      });
      setActiveNarrative((prev) =>
        seg && seg.id !== prev?.id ? seg : !seg ? null : prev
      );
    }, 100);
    return () => clearInterval(timer);
  }, [narrative, isInitialized, narrativeEnabled]);

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

      {/* Narrative overlay (optional) */}
      {/* {narrativeEnabled && activeNarrative && (
        <NarrationOverlay segment={activeNarrative} />
      )} */}

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
