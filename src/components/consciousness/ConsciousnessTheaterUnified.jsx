// src/components/consciousness/ConsciousnessTheaterUnified.jsx
// -------------------------------------------------------------
// Unified Theater: opening‑sequence + stage‑clock timeline
// -------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Canonical } from '@/config/canonical/canonicalAuthority';
import { stageClock } from '@/core/CentralStageClock';
import { beatBus, Events } from '@/orchestration/BeatBus';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { integrateUnifiedTimeline } from '@/bootstrap/integrateUnifiedTimeline';

import UnifiedNarrativeDisplay from './UnifiedNarrativeDisplay';
import WebGLCanvas from '@/components/webgl/WebGLCanvas';
import DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor';

import styles from './ConsciousnessTheater.module.css';

/* ------------------------------------------------------------------
   Opening‑sequence constants & hook  (same as legacy component)
------------------------------------------------------------------ */
const OPEN = {
  BLACK_MS: 2000,
  CURSOR_BLINK_MS: 500,
  TYPE_SPEED_MS: 50,
  FILL_LINE_DELAY: 50,
  MAX_FILL_LINES: 30,
  TERMINAL_LINES: [
    { text: 'READY.', delay: 500 },
    { text: '10 PRINT "HELLO CURTIS"', delay: 1000 },
    { text: '20 GOTO 10', delay: 1000 },
    { text: 'RUN', delay: 800 },
  ],
};

const withTimeouts = steps => {
  const ids = steps.map(({ d, fn }) => setTimeout(fn, d));
  return () => ids.forEach(clearTimeout);
};

function useOpeningSequence(onDone) {
  const [phase, setPhase] = useState('black');
  const [showCursor, setShowCursor] = useState(false);
  const [termLines, setTermLines] = useState([]);
  const [fillActive, setFillActive] = useState(false);

  useEffect(() => {
    let t = 0;
    const seq = [];

    // 0 – black screen
    t += OPEN.BLACK_MS;

    // 1 – cursor blink
    seq.push({
      d: t,
      fn: () => {
        setPhase('cursor');
      },
    });
    seq.push({
      d: t,
      fn: () => {
        setShowCursor(true);
      },
    });
    seq.push({ d: (t += OPEN.CURSOR_BLINK_MS), fn: () => setShowCursor(false) });
    seq.push({ d: (t += OPEN.CURSOR_BLINK_MS), fn: () => setShowCursor(true) });

    // 2 – terminal typing lines
    t += OPEN.CURSOR_BLINK_MS;
    seq.push({
      d: t,
      fn: () => {
        setPhase('terminal');
        setShowCursor(false);
      },
    });

    OPEN.TERMINAL_LINES.forEach(line => {
      t += line.delay;
      seq.push({
        d: t,
        fn: () => setTermLines(prev => [...prev, line]),
      });
    });

    // 3 – fill
    t += 1000;
    seq.push({
      d: t,
      fn: () => {
        setPhase('fill');
        setFillActive(true);
      },
    });

    // 4 – complete
    t += 2000;
    seq.push({
      d: t,
      fn: () => {
        setPhase('complete');
        onDone?.();
      },
    });

    return withTimeouts(seq);
  }, [onDone]);

  return { phase, showCursor, termLines, fillActive };
}

/* ------------------------------------------------------------------ */
/* Tiny presentational pieces for the opening screen                  */
/* ------------------------------------------------------------------ */
const C64Cursor = ({ visible }) => (
  <span className={`${styles.cursor} ${visible ? styles.visible : ''}`}>_</span>
);

const TerminalText = ({ text, typeSpeed = 50 }) => {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i <= text.length) {
        setDisplay(text.slice(0, i));
        i++;
      } else clearInterval(id);
    }, typeSpeed);
    return () => clearInterval(id);
  }, [text, typeSpeed]);

  return <div className={styles.terminalText}>{display}</div>;
};

const ScreenFill = ({ active }) => {
  const [lines, setLines] = useState([]);
  useEffect(() => {
    if (!active) return;
    let count = 0;
    const id = setInterval(() => {
      if (count < OPEN.MAX_FILL_LINES) {
        setLines(p => [...p, 'HELLO CURTIS ']);
        count++;
      } else clearInterval(id);
    }, OPEN.FILL_LINE_DELAY);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;
  return (
    <div className={styles.screenFill}>
      {lines.map((l, i) => (
        <div key={i} className={styles.screenFillLine}>
          {l.repeat(10)}
        </div>
      ))}
    </div>
  );
};

/* ================================================================== */
/* MAIN COMPONENT                                                     */
/* ================================================================== */
export default function ConsciousnessTheaterUnified() {
  /* ---------------- core state ---------------- */
  const [currentStage, setCurrentStage] = useState('genesis');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);

  const [isInit, setIsInit] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [fragments, setFragments] = useState([]);

  const cleanRef = useRef(null);

  /* ---------- bootstrap unified timeline once ---------- */
  useEffect(() => {
    cleanRef.current = integrateUnifiedTimeline();
    return () => cleanRef.current?.();
  }, []);

  /* ---------- opening sequence ---------- */
  const openingDone = useCallback(() => {
    setIsInit(true);
    setShowCanvas(true);
    document.body.style.overflow = '';
  }, []);

  const {
    phase: openingPhase,
    showCursor,
    termLines,
    fillActive,
  } = useOpeningSequence(openingDone);

  /* ---------- memory fragment event tap ---------- */
  useEffect(() => {
    const h = e => {
      const { fragmentId } = e.detail;
      setFragments(p => [...p, fragmentId]);
      setTimeout(() => setFragments(p => p.filter(id => id !== fragmentId)), 10000);
    };
    window.addEventListener('memoryFragment:trigger', h);
    return () => window.removeEventListener('memoryFragment:trigger', h);
  }, []);

  /* ---------- subscribe stage atom ---------- */
  useEffect(() => {
    const unsub = stageAtom.subscribe(state => {
      if (state.currentStage !== currentStage) {
        setCurrentStage(state.currentStage);
        qualityAtom.updateParticleBudget(state.currentStage);
      }
    });
    return unsub;
  }, [currentStage]);

  /* ---------- opening render ---------- */
  if (openingPhase !== 'complete') {
    return (
      <div className={styles.openingContainer}>
        {openingPhase === 'cursor' && <C64Cursor visible={showCursor} />}
        {openingPhase === 'terminal' && (
          <div className={styles.terminalContainer}>
            {termLines.map((l, i) => (
              <TerminalText key={i} text={l.text} typeSpeed={OPEN.TYPE_SPEED_MS} />
            ))}
          </div>
        )}
        {openingPhase === 'fill' && <ScreenFill active={fillActive} />}
      </div>
    );
  }

  /* ---------- main theater ---------- */
  return (
    <div className={styles.theater}>
      <div className={styles.scrollContainer} />

      {showCanvas && (
        <WebGLCanvas
          stage={currentStage}
          morphProgress={morphProgress}
          scrollProgress={scrollProgress}
        />
      )}

      <UnifiedNarrativeDisplay />

      {/* Memory fragments (placeholder visual) */}
      {fragments.map(id => (
        <div key={id} className={styles.memoryFragment}>
          Fragment: {id}
        </div>
      ))}

      <div className={styles.stageHud}>
        {Canonical.stages[currentStage]?.title} | {Math.round(scrollProgress * 100)}% | Morph:{' '}
        {Math.round(morphProgress * 100)}%
      </div>

      <DevPerformanceMonitor />

      {import.meta.env.DEV && (
        <div className={styles.devControls}>
          <div className={styles.devTitle}>🎮 SST Timeline Controls</div>
          <div>← → Navigate stages</div>
          <div>↑ ↓ Manual morph</div>
          <div>1‑7 Jump to stage</div>
          <div>P Pause/Resume timeline</div>
          <button onClick={() => window.timelineTools.nudge(-2)}>-2 s</button>
          <button onClick={() => window.timelineTools.nudge(2)}>+2 s</button>
          <button onClick={() => (stageClock.isPaused ? stageClock.resume() : stageClock.pause())}>
            {stageClock.isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      )}
    </div>
  );
}
