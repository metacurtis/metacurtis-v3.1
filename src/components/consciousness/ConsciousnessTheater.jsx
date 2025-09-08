// src/components/consciousness/ConsciousnessTheater.jsx
import { useEffect, useState, useRef } from 'react';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { stageAtom } from '@/state/atoms/stageAtom.js';
import { qualityAtom } from '@/state/atoms/qualityAtom.js';
import { useMemoryFragments } from '@/hooks/useMemoryFragments.js';
import WebGLCanvas from '@/components/webgl/WebGLCanvas.jsx';
import director from '@/theater/TheaterDirector.js';
import OpeningSequence from '@/components/theater/OpeningSequence.jsx';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

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
  const directorStartedRef = useRef(false);

  const { activeFragments, fragmentStates, triggerFragment, dismissFragment } =
    useMemoryFragments(currentStage, scrollProgress * 100, null);

  // Single, race-free Director start (hint or synthetic)
  useEffect(() => {
    let gotHint = false, started = false;

    const startDirector = () => {
      if (started) return;
      started = true; directorStartedRef.current = true;
      try { document.body.style.overflow = 'hidden'; } catch {}
      try { director.start(); } catch (e) { console.warn('Director.start error:', e?.message); }
    };

    const offHint = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => { gotHint = true; startDirector(); });

    const t = setTimeout(() => {
      if (!gotHint && !directorStartedRef.current) {
        try {
          const w = Math.max(document.documentElement.clientWidth,  window.innerWidth  || 0);
          const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
          BeatBus.emit(EVENTS.ENGINE_VIEWPORT_HINT, { width:w, height:h, aspect: w/Math.max(1,h) });
          console.log('�� Theater: synthetic ENGINE_VIEWPORT_HINT emitted');
        } catch {}
        startDirector();
      }
    }, 800);

    const offs = [
      BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
        setScrollEnabled(true);
        try { document.body.style.overflow = ''; } catch {}
      }),
      BeatBus.on(EVENTS.START_NARRATIVE, ({ stage }) => {
        setNarrativeEnabled(true); setIsInitialized(true); startTimeRef.current = Date.now();
      })
    ];

    return () => {
      clearTimeout(t);
      offHint && offHint();
      offs.forEach(off => off && off());
      try { document.body.style.overflow = ''; } catch {}
      try { director.cancel(); } catch {}
      directorStartedRef.current = false;
    };
  }, []);

  // keyboard nav
  useEffect(() => {
    if (!isInitialized || !scrollEnabled) return;
    const handleKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
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
        case "m": case "M": setMorphProgress(p => (p > 0.5 ? 0 : 1)); break;
        case "r": case "R": stageAtom.jumpToStage("genesis"); setMorphProgress(0); break;
        default: break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isInitialized, scrollEnabled]);

  // stage subscription
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

  // scroll → morph + stage
  useEffect(() => {
    if (!isInitialized || !scrollEnabled) return;
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(scrollTop / scrollHeight, 1);
      setScrollProgress(progress);
      setMorphProgress(Math.min(progress * 2, 1));
      const stageProgress = progress * 100;
      const cfg = Canonical.getStageByScroll?.(stageProgress);
      const atomStage = stageAtom.getState().currentStage;
      if (cfg && cfg.name !== atomStage) stageAtom.jumpToStage(cfg.name);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInitialized, scrollEnabled]);

  // optional narrative timing
  useEffect(() => {
    const narrative = Canonical.dialogue?.[currentStage];
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
  }, [currentStage, isInitialized, narrativeEnabled]);

  return (
    <div className="consciousness-theater-v3">
      <OpeningSequence />
      <div style={{ position: 'absolute', width: '1px', height: '700vh', pointerEvents: 'none', zIndex: -1 }} />
      {showCanvas && (<WebGLCanvas stage={currentStage} morphProgress={morphProgress} scrollProgress={scrollProgress} />)}
      {/* narrative overlay & fragments optional */}
      {activeFragments.map(fragment => {
        const state = fragmentStates[fragment.id];
        return state?.state === 'active'
          ? <div key={fragment.id} />
          : null;
      })}
    </div>
  );
}
