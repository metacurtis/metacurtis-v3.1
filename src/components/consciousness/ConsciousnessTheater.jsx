// src/components/consciousness/ConsciousnessTheater.jsx
// SST v3.0 PRODUCTION – Narrative fixed to source from Canonical.dialogue
// - Tiered particle system driven elsewhere; this file orchestrates UI, opening, narrative, and fragments.

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Canonical } from '@/config/canonical/canonicalAuthority';
import { MEMORY_FRAGMENTS } from '@/config/sst3/memory-fragments.js';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { useMemoryFragments } from '@/hooks/useMemoryFragments.js';
import WebGLCanvas from '@/components/webgl/WebGLCanvas';
import DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor';
import styles from './ConsciousnessTheater.module.css';

// ===== CONSTANTS =====
const THEATER_CONSTANTS = {
  // Timing
  OPENING_BLACK_DURATION: 2000,
  CURSOR_BLINK_DELAY: 500,
  TERMINAL_TYPE_SPEED: 50,
  SCREEN_FILL_DELAY: 50,
  NARRATIVE_UPDATE_INTERVAL: 100, // kept for reference; we use rAF but align to this cadence
  SCREEN_FILL_COMPLETE_DELAY: 500,

  // Interaction
  MORPH_STEP: 0.1,
  SCROLL_MORPH_MULTIPLIER: 2,
  SCROLL_DEBOUNCE_MS: 16, // ~60fps

  // Visual
  MAX_SCREEN_FILL_LINES: 30,
  STAGE_HUD_OPACITY: 0.7,
  SCROLL_CONTAINER_HEIGHT: '700vh',

  // Terminal text
  TERMINAL_LINES: [
    { text: 'READY.', delay: 500 },
    { text: '10 PRINT "HELLO CURTIS"', delay: 1000 },
    { text: '20 GOTO 10', delay: 1000 },
    { text: 'RUN', delay: 800 },
  ],
};

if (import.meta.env.DEV) console.log('🧬 LOADED: ConsciousnessTheater v3.0');

// ===== UTILITY =====
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ===== OPENING SEQUENCE HOOK =====
const useOpeningSequence = (onComplete) => {
  const [phase, setPhase] = useState('black');
  const [showCursor, setShowCursor] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const [screenFillActive, setScreenFillActive] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) console.log('🎬 Starting opening sequence');
    const sequence = [];
    let currentTime = THEATER_CONSTANTS.OPENING_BLACK_DURATION;

    // Cursor phase
    sequence.push({ delay: currentTime, action: () => setPhase('cursor') });
    sequence.push({ delay: currentTime + THEATER_CONSTANTS.CURSOR_BLINK_DELAY, action: () => setShowCursor(true) });
    sequence.push({ delay: currentTime + THEATER_CONSTANTS.CURSOR_BLINK_DELAY * 2, action: () => setShowCursor(false) });
    sequence.push({ delay: currentTime + THEATER_CONSTANTS.CURSOR_BLINK_DELAY * 2.4, action: () => setShowCursor(true) });

    // Terminal phase
    currentTime += THEATER_CONSTANTS.CURSOR_BLINK_DELAY * 3;
    sequence.push({
      delay: currentTime,
      action: () => {
        setPhase('terminal');
        setShowCursor(false);
      },
    });

    // Terminal lines
    THEATER_CONSTANTS.TERMINAL_LINES.forEach((line) => {
      currentTime += line.delay;
      sequence.push({
        delay: currentTime,
        action: () =>
          setTerminalLines((prev) => [
            ...prev,
            {
              text: line.text,
              typeSpeed: THEATER_CONSTANTS.TERMINAL_TYPE_SPEED,
            },
          ]),
      });
    });

    // Screen fill
    currentTime += 1000;
    sequence.push({
      delay: currentTime,
      action: () => {
        setPhase('fill');
        setScreenFillActive(true);
      },
    });

    // Complete
    currentTime += 2000;
    sequence.push({
      delay: currentTime,
      action: () => {
        setPhase('complete');
        onComplete?.();
        if (import.meta.env.DEV) console.log('🎬 Opening sequence complete');
      },
    });

    const timeouts = sequence.map(({ delay, action }) => setTimeout(action, delay));
    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return {
    phase,
    showCursor,
    terminalLines,
    screenFillActive,
    isComplete: phase === 'complete',
  };
};

// ===== OPENING COMPONENTS =====
const C64Cursor = ({ visible }) => (
  <span className={`${styles.cursor} ${visible ? styles.visible : ''}`}>_</span>
);

const TerminalText = ({ text, typeSpeed = 50, style = {} }) => {
  const [displayText, setDisplayText] = useState('');
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, typeSpeed);
    return () => clearInterval(interval);
  }, [text, typeSpeed]);

  return (
    <div className={styles.terminalText} style={style}>
      {displayText}
    </div>
  );
};

const ScreenFill = ({ active }) => {
  const [lines, setLines] = useState([]);
  useEffect(() => {
    if (!active) return;
    let lineCount = 0;
    const interval = setInterval(() => {
      if (lineCount < THEATER_CONSTANTS.MAX_SCREEN_FILL_LINES) {
        setLines((prev) => [...prev, `HELLO CURTIS `]);
        lineCount++;
      } else {
        clearInterval(interval);
      }
    }, THEATER_CONSTANTS.SCREEN_FILL_DELAY);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className={styles.screenFill}>
      {lines.map((line, i) => (
        <div key={i} className={styles.screenFillLine}>
          {line.repeat(10)}
        </div>
      ))}
    </div>
  );
};

// ===== NARRATIVE DISPLAY (FIXED to Canonical.dialogue) =====
const NarrativeDisplay = ({ stage, isActive, onMemoryTrigger }) => {
  const [activeSegment, setActiveSegment] = useState(null);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef();
  const lastTickRef = useRef(0);
  const currentSegmentIdRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      setActiveSegment(null);
      currentSegmentIdRef.current = null;
      return;
    }

    startTimeRef.current = Date.now();
    currentSegmentIdRef.current = null;
    if (import.meta.env.DEV) console.log(`🎭 Starting narrative for stage: ${stage}`);

    const loop = (t) => {
      // throttle to ~NARRATIVE_UPDATE_INTERVAL
      if (t - lastTickRef.current < THEATER_CONSTANTS.NARRATIVE_UPDATE_INTERVAL) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastTickRef.current = t;

      const elapsed = Date.now() - startTimeRef.current;
      const narrative = Canonical.dialogue?.[stage];

      if (!narrative?.segments || !Array.isArray(narrative.segments)) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const seg = narrative.segments.find(
        (s) => elapsed >= s.start && elapsed < s.start + s.duration
      );

      if (seg) {
        if (seg.id !== currentSegmentIdRef.current) {
          currentSegmentIdRef.current = seg.id;
          setActiveSegment(seg);

          if (seg.memoryTrigger && typeof onMemoryTrigger === 'function') {
            try {
              onMemoryTrigger(seg.memoryTrigger);
            } catch (e) {
              if (import.meta.env.DEV)
                console.warn('Memory trigger failed:', seg.memoryTrigger, e);
            }
          }

          if (import.meta.env.DEV) {
            console.log(
              `🎭 Segment ${seg.id}: "${(seg.text || '').slice(0, 80)}" (${seg.start}-${seg.start + seg.duration}ms)`
            );
          }
        }
      } else {
        if (currentSegmentIdRef.current !== null) {
          currentSegmentIdRef.current = null;
          setActiveSegment(null);
          if (import.meta.env.DEV) console.log('🎭 No active segment');
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stage, isActive, onMemoryTrigger]);

  if (!activeSegment) return null;

  return (
    <div className={styles.narrativeOverlay}>
      <p className={styles.narrativeText}>{activeSegment.text}</p>
      {activeSegment.note && <p className={styles.narrativeNote}>{activeSegment.note}</p>}
    </div>
  );
};

// ===== MEMORY FRAGMENT RENDERER =====
const MemoryFragmentRenderer = ({ fragment, onDismiss }) => {
  if (!fragment) return null;

  const renderContent = () => {
    switch (fragment.type) {
      case 'terminal':
        return (
          <div className={styles.terminalContent}>
            READY.<br />
            10 PRINT "HELLO CURTIS"
            <br />
            20 GOTO 10
            <br />
            RUN
            <br />
            <div className={styles.terminalOutput}>
              {Array(5).fill('HELLO CURTIS ').join('')}...
            </div>
          </div>
        );
      case 'emblem':
        return <div className={styles.emblemContent}>🦅 Adapt and Overcome</div>;
      case 'chat':
        return (
          <div className={styles.chatContent}>
            <div className={styles.chatMessage}>You: Hello</div>
            <div className={styles.chatMessage}>AI: Hello! How can I help you today?</div>
          </div>
        );
      case 'graph':
        return <div className={styles.graphContent}>📈 Velocity increasing...</div>;
      case 'metrics':
        return (
          <div className={styles.metricsContent}>
            <div>FPS: 15 → 84</div>
            <div className={styles.metricsImprovement}>+460% Performance</div>
          </div>
        );
      case 'code_flow':
        return <div className={styles.codeFlowContent}>✨ Code flows like water...</div>;
      case 'counter':
        return (
          <div className={styles.counterContent}>
            <div className={styles.counterNumber}>15,000</div>
            <div className={styles.counterLabel}>Conscious Moments</div>
          </div>
        );
      default:
        return <div>Memory Fragment</div>;
    }
  };

  return (
    <div className={styles.memoryFragment}>
      <h3 className={styles.fragmentTitle}>
        {fragment.stage.charAt(0).toUpperCase() + fragment.stage.slice(1)} Memory
      </h3>
      <div className={styles.fragmentContent}>{renderContent()}</div>
      <button className={styles.fragmentClose} onClick={onDismiss}>
        Close
      </button>
    </div>
  );
};

// ===== MAIN =====
export default function ConsciousnessTheater() {
  // Core state
  const [currentStage, setCurrentStage] = useState('genesis');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  // Refs
  const startTimeRef = useRef(Date.now());
  const scrollHandlerRef = useRef();

  // Expose for debugging
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.CANONICAL = Canonical;
      window.NARRATIVE_DIALOGUE = Canonical.dialogue; // for console tests the user ran
      window.MEMORY_FRAGMENTS = MEMORY_FRAGMENTS;
    }
  }, []);

  // Stage config
  const stageConfig = useMemo(() => Canonical.stages[currentStage], [currentStage]);

  // Opening sequence
  const openingComplete = useCallback(() => {
    setIsInitialized(true);
    setShowCanvas(true);
    document.body.style.overflow = '';
  }, []);

  const {
    phase: openingPhase,
    showCursor,
    terminalLines,
    screenFillActive,
  } = useOpeningSequence(openingComplete);

  // Memory fragments
  const { activeFragments, fragmentStates, triggerFragment, dismissFragment } = useMemoryFragments(
    currentStage,
    scrollProgress * 100
  );

  // Lock scrolling during opening
  useEffect(() => {
    document.body.style.overflow = openingPhase === 'complete' ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [openingPhase]);

  // Keyboard navigation
  useEffect(() => {
    if (!isInitialized || openingPhase !== 'complete') return;

    const handleKeyPress = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          stageAtom.nextStage();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stageAtom.prevStage();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setMorphProgress((prev) => Math.min(prev + THEATER_CONSTANTS.MORPH_STEP, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setMorphProgress((prev) => Math.max(prev - THEATER_CONSTANTS.MORPH_STEP, 0));
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7': {
          const index = parseInt(e.key) - 1;
          const stages = Object.keys(Canonical.stages);
          if (stages[index]) stageAtom.jumpToStage(stages[index]);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInitialized, openingPhase]);

  // Stage subscription
  useEffect(() => {
    const unsubscribe = stageAtom.subscribe((state) => {
      if (state.currentStage !== currentStage) {
        setCurrentStage(state.currentStage);
        qualityAtom.updateParticleBudget(state.currentStage);
        startTimeRef.current = Date.now();
      }
    });
    return unsubscribe;
  }, [currentStage]);

  // Debounced scroll handler
  scrollHandlerRef.current = useMemo(
    () =>
      debounce(() => {
        const scrollTop = window.scrollY;
        const scrollHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const progress = Math.min(scrollTop / scrollHeight, 1);

        setScrollProgress(progress);
        setMorphProgress(Math.min(progress * THEATER_CONSTANTS.SCROLL_MORPH_MULTIPLIER, 1));

        const stageProgress = progress * 100;
        const newStageCfg = Canonical.getStageByScroll?.(stageProgress);
        if (newStageCfg && newStageCfg.name !== currentStage) {
          stageAtom.jumpToStage(newStageCfg.name);
        }
      }, THEATER_CONSTANTS.SCROLL_DEBOUNCE_MS),
    [currentStage]
  );

  // Scroll handling
  useEffect(() => {
    if (!isInitialized || openingPhase !== 'complete') return;
    const handleScroll = scrollHandlerRef.current;
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInitialized, openingPhase]);

  // Opening render
  if (openingPhase !== 'complete') {
    return (
      <div className={styles.openingContainer}>
        {openingPhase === 'cursor' && <C64Cursor visible={showCursor} />}

        {openingPhase === 'terminal' && (
          <div className={styles.terminalContainer}>
            {terminalLines.map((line, i) => (
              <TerminalText key={i} text={line.text} typeSpeed={line.typeSpeed} />
            ))}
          </div>
        )}

        {openingPhase === 'fill' && <ScreenFill active={screenFillActive} />}
      </div>
    );
  }

  // Main theater
  return (
    <div className={styles.theater}>
      {/* Scroll container */}
      <div className={styles.scrollContainer} />

      {/* WebGL Canvas */}
      {showCanvas && (
        <WebGLCanvas stage={currentStage} morphProgress={morphProgress} scrollProgress={scrollProgress} />
      )}

      {/* Narrative */}
      <NarrativeDisplay
        stage={currentStage}
        isActive={isInitialized && openingPhase === 'complete'}
        onMemoryTrigger={triggerFragment}
      />

      {/* Memory Fragments */}
      {activeFragments.map((fragment) => {
        const state = fragmentStates[fragment.id];
        if (state?.state === 'active') {
          return (
            <MemoryFragmentRenderer
              key={fragment.id}
              fragment={MEMORY_FRAGMENTS[fragment.id]}
              onDismiss={() => dismissFragment(fragment.id)}
            />
          );
        }
        return null;
      })}

      {/* Stage HUD */}
      <div className={styles.stageHud}>
        {stageConfig?.title} | {Math.round(scrollProgress * 100)}% | Morph: {Math.round(morphProgress * 100)}%
      </div>

      {/* Dev Performance Monitor */}
      <DevPerformanceMonitor />

      {/* Dev controls */}
      {import.meta.env.DEV && (
        <div className={styles.devControls}>
          <div className={styles.devTitle}>🎮 SST v3.0 Controls</div>
          <div>← → Navigate stages</div>
          <div>↑ ↓ Manual morph</div>
          <div>1-7 Jump to stage</div>
          <div>Scroll for progression</div>
          <div className={styles.devStatus}>{morphProgress < 0.5 ? '☁️ Atmospheric' : '🧠 Brain'} Mode</div>
        </div>
      )}
    </div>
  );
}
