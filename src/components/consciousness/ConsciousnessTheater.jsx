// src/components/consciousness/ConsciousnessTheater.jsx
// Director-integrated Theater — start AFTER viewport hint; race-free opening.

import { useEffect, useState, useRef } from 'react';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { stageAtom } from '@/state/atoms/stageAtom.js';
import { qualityAtom } from '@/state/atoms/qualityAtom.js';
import { useMemoryFragments } from '@/hooks/useMemoryFragments.js';
import WebGLCanvas from '@/components/webgl/WebGLCanvas.jsx';
import _DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor';

import director from '@/theater/TheaterDirector.js';
import OpeningSequence from '@/components/theater/OpeningSequence.jsx';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

console.log('🧬 LOADED: ConsciousnessTheater — race-free opening');

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
      <p style={{
        color: '#ffffff', fontFamily: 'Arial, sans-serif',
        fontSize: '1.1rem', lineHeight: '1.6', margin: 0, textAlign: 'center'
      }}>
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
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.95)', border: '2px solid #00FF00',
        borderRadius: '10px', padding: '30px', zIndex: 100, minWidth: '400px', maxWidth: '600px',
      }}
    >
      <h3 style={{ color: '#00FF00', marginTop: 0, fontFamily: 'Courier New, monospace' }}>
        {fragment.name}
      </h3>

      <div style={{ color: '#ffffff', marginBottom: '20px' }}>
        {fragment.content?.type === 'interactive' &&
          fragment.content?.element === 'commodore_terminal' && (
            <div
              style={{
                background: '#000', padding: '20px',
                fontFamily: 'Courier New, monospace', color: '#00FF00',
                border: '1px solid #00FF00',
              }}
            >
              READY.<br />
              10 PRINT &quot;HELLO CURTIS&quot;<br />
              20 GOTO 10<br />
              RUN<br />
              <div style={{ marginTop: '10px', opacity: 0.7 }}>
                {Array(5).fill('HELLO CURTIS ').join('')}...
              </div>
            </div>
          )}
      </div>

      <button
        onClick={onDismiss}
        style={{
          padding: '10px 20px', background: '#00FF00', color: '#000',
          border: 'none', borderRadius: '5px', cursor: 'pointer',
          fontFamily: 'Courier New, monospace', fontWeight: 'bold',
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
  const [showCanvas] = useState(true);

  const startTimeRef = useRef(Date.now());
  const currentStageRef = useRef('genesis');
  const directorStartedRef = useRef(false);
const viewportReadyRef = useRef(false);

  const _stageConfig = Canonical.stages[currentStage];
  const narrative = Canonical.dialogue?.[currentStage];

  const { activeFragments, fragmentStates, triggerFragment, dismissFragment } =
    useMemoryFragments(currentStage, scrollProgress * 100, null);
  const triggerFragmentRef = useRef(triggerFragment);
  triggerFragmentRef.current = triggerFragment;

  // ───────────────── Director start AFTER viewport hint; scroll locked until ENABLE_SCROLL
  useEffect(() => {
    // 1) Listen for viewport hint sent by WebGLBackground
    const offHint = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => {
      viewportReadyRef.current = true;
    });

    // 2) Start Director once, after hint
    const tick = setInterval(() => {
      if (!directorStartedRef.current && viewportReadyRef.current) {
        // Lock scroll until Director enables it
        document.body.style.overflow = 'hidden';
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
        document.body.style.overflow = '';
      }),
      BeatBus.on(EVENTS.START_NARRATIVE, ({ stage }) => {
        console.log(`   Theater: Starting ${stage} narrative`);
        setNarrativeEnabled(true);
        setIsInitialized(true);
      }),
    ];

    return () => {
      clearInterval(tick);
      offHint && offHint();
      offs.forEach(off => off && off());
      document.body.style.overflow = '';
      director.cancel();
      directorStartedRef.current = false;
      viewportReadyRef.current = false;
    };
  }, []);

  // ───────────────── Keyboard navigation (after handoff)
  useEffect(() => {
    if (!isInitialized || !scrollEnabled) return;
    const handleKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) {
        e.preventDefault(); e.stopPropagation();
      }
      switch (e.key) {
        case "ArrowRight": stageAtom.nextStage(); break;
        case "ArrowLeft":  stageAtom.prevStage(); break;
        case "ArrowUp":    setMorphProgress(p => Math.min(p + 0.1, 1)); break;
        case "ArrowDown":  setMorphProgress(p => Math.max(p - 0.1, 0)); break;
        case " ":          stageAtom.nextStage(); break;
        case "1": case "2": case "3": case "4": case "5": case "6": case "7": {
          const idx = parseInt(e.key, 10) - 1;
          const names = Object.keys(Canonical.stages);
          if (names[idx]) stageAtom.jumpToStage(names[idx]);
          break;
        }
        case "h": case "H": window.SHOW_DIRECTOR = !window.SHOW_DIRECTOR; window.location.reload(); break;
        case "m": case "M": setMorphProgress(p => (p > 0.5 ? 0 : 1)); break;
        case "r": case "R": stageAtom.jumpToStage("genesis"); setMorphProgress(0); break;
        default: break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isInitialized, scrollEnabled]);

  // ───────────────── Stage subscription
  useEffect(() => {
    const unsubscribe = stageAtom.subscribe(state => {
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
      const scrollHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
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
      const seg = narrative.narration.segments.find(s => {
        const start = s.timing.start, end = s.timing.start + s.timing.duration;
        return elapsed >= start && elapsed < end;
      });
      setActiveNarrative(prev => (seg && seg.id !== prev?.id ? seg : (!seg ? null : prev)));
    }, 100);
    return () => clearInterval(timer);
  }, [narrative, isInitialized, narrativeEnabled]);

  // ───────────────── Render
  return (
    <div className="consciousness-theater-v3">
      <OpeningSequence />

      {/* a tall spacer to allow scrolling once enabled */}
      <div style={{ position: 'absolute', width: '1px', height: '700vh', pointerEvents: 'none', zIndex: -1 }} />

      {showCanvas && (
        <WebGLCanvas stage={currentStage} morphProgress={morphProgress} scrollProgress={scrollProgress} />
      )}

      {/* Narrative overlay */}
      {/* Add when you wire Canonical.dialogue for each stage */}
      {/* {narrativeEnabled && activeNarrative && <NarrationOverlay segment={activeNarrative} />} */}

      {/* Memory fragments (kept) */}
      {activeFragments.map(fragment => {
        const state = fragmentStates[fragment.id];
        return state?.state === 'active' ? (
          <MemoryFragmentRenderer key={fragment.id} fragment={fragment} onDismiss={() => dismissFragment(fragment.id)} />
        ) : null;
      })}
    </div>
  );
}
