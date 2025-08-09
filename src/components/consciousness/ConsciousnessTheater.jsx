// src/components/consciousness/ConsciousnessTheater.jsx
// SST v3.0 Director-Integrated Consciousness Theater

import { useEffect, useState, useRef } from 'react';
import { Canonical } from '../../config/canonical/canonicalAuthority';
import { stageAtom } from '../../stores/atoms/stageAtom';
import { qualityAtom } from '../../stores/atoms/qualityAtom';
import { useMemoryFragments } from '../../hooks/useMemoryFragments.js';
import WebGLCanvas from '../webgl/WebGLCanvas';
import DevPerformanceMonitor from '../dev/DevPerformanceMonitor';

// Director-based imports
import director from '../../theater/TheaterDirector.js';
import OpeningSequence from '../theater/OpeningSequence.jsx';
import BeatBus from '../../../modules/orchestration/core/BeatBus.js';
import { EVENTS } from '../../theater/events.js';

console.log('🧬 LOADED: ConsciousnessTheater v3.0 - Director Integration');

// ===== NARRATION OVERLAY (Kept from original) =====
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

// ===== MEMORY FRAGMENT RENDERER (Kept from original) =====
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
        {fragment.content.type === 'interactive' &&
          fragment.content.element === 'commodore_terminal' && (
            <div
              style={{
                background: '#000',
                padding: '20px',
                fontFamily: 'Courier New, monospace',
                color: '#00FF00',
                border: '1px solid #00FF00',
              }}
            >
              READY.
              <br />
              10 PRINT &quot;HELLO CURTIS&quot;
              <br />
              20 GOTO 10
              <br />
              RUN
              <br />
              <div style={{ marginTop: '10px', opacity: 0.7 }}>
                {Array(5).fill('HELLO CURTIS ').join('')}...
              </div>
            </div>
          )}
      </div>
      <button
        onClick={onDismiss}
        style={{
          padding: '10px 20px',
          background: '#00FF00',
          color: '#000000',
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

// ===== MAIN CONSCIOUSNESS THEATER (Director-Integrated) =====
export default function ConsciousnessTheater() {
  // Core state
  const [currentStage, setCurrentStage] = useState('genesis');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Director state
  const [directorStarted, setDirectorStarted] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);

  // Narrative state
  const [activeNarrative, setActiveNarrative] = useState(null);
  const [narrativeEnabled, setNarrativeEnabled] = useState(false);

  // Canvas state
  const [showCanvas] = useState(true); // Show canvas immediately

  // Refs
  const startTimeRef = useRef(Date.now());
  const currentStageRef = useRef('genesis');

  // Get configuration
  const _stageConfig = Canonical.stages[currentStage]; // Prefix with _ to satisfy linter
  const narrative = Canonical.dialogue?.[currentStage];

  // Memory fragments
  const { activeFragments, fragmentStates, triggerFragment, dismissFragment } = useMemoryFragments(
    currentStage,
    scrollProgress * 100,
    activeNarrative?.id
  );

  // ===== DIRECTOR INTEGRATION =====
  useEffect(() => {
    console.log('🎭 ConsciousnessTheater: Starting Director-controlled experience');

    // Start Director if not already started
    if (!directorStarted) {
      director.start();
      setDirectorStarted(true);
    }

    // Listen for Director events
    const handlers = [
      // Enable scroll when Director says so
      BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
        console.log('   Theater: Scroll enabled by Director');
        setScrollEnabled(true);
        document.body.style.overflow = '';
      }),

      // Start narrative when Director says so
      BeatBus.on(EVENTS.START_NARRATIVE, ({ stage, _text }) => {
        console.log(`   Theater: Starting ${stage} narrative`);
        setNarrativeEnabled(true);
        setIsInitialized(true);
      }),

      // Handle memory fragment triggers
      BeatBus.on(EVENTS.TRIGGER_FRAGMENT, ({ stage, percent }) => {
        console.log(`   Theater: Triggering ${stage} fragment at ${percent}%`);
        const fragment = Canonical.fragments[stage];
        if (fragment) {
          triggerFragment(fragment.id);
        }
      }),
    ];

    // Initially lock scrolling
    document.body.style.overflow = 'hidden';

    return () => {
      director.cancel();
      setDirectorStarted(false);
      handlers.forEach(off => off && off());
      document.body.style.overflow = '';
    };
  }, [directorStarted, triggerFragment]);

  // ===== KEYBOARD NAVIGATION (Only after Director hands off) =====
  useEffect(() => {
    if (!isInitialized || !scrollEnabled) return;

    const handleKeyPress = e => {
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
          setMorphProgress(prev => Math.min(prev + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setMorphProgress(prev => Math.max(prev - 0.1, 0));
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
          if (stages[index]) {
            stageAtom.jumpToStage(stages[index]);
          }
          break;
        }
        case 'h':
        case 'H':
          // Toggle Director Console visibility
          window.SHOW_DIRECTOR = !window.SHOW_DIRECTOR;
          window.location.reload();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInitialized, scrollEnabled]);

  // ===== STAGE SUBSCRIPTION =====
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

  // ===== SCROLL HANDLING (Only when enabled by Director) =====
  useEffect(() => {
    if (!isInitialized || !scrollEnabled) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(scrollTop / scrollHeight, 1);

      setScrollProgress(progress);

      // Morph progress: 0-50% scroll = 0-1 morph
      const morph = Math.min(progress * 2, 1);
      setMorphProgress(morph);

      // Stage progression
      const stageProgress = progress * 100;
      const newStageCfg = Canonical.getStageByScroll(stageProgress);
      const atomStage = stageAtom.getState().currentStage;

      if (newStageCfg && newStageCfg.name !== atomStage) {
        stageAtom.jumpToStage(newStageCfg.name);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInitialized, scrollEnabled]);

  // ===== NARRATIVE TIMING (Only when enabled by Director) =====
  useEffect(() => {
    if (!narrative?.narration?.segments || !isInitialized || !narrativeEnabled) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;

      const segment = narrative.narration.segments.find(seg => {
        const start = seg.timing.start;
        const end = seg.timing.start + seg.timing.duration;
        return elapsed >= start && elapsed < end;
      });

      if (segment && segment.id !== activeNarrative?.id) {
        setActiveNarrative(segment);

        if (segment.memoryFragmentTrigger) {
          const fragment = Canonical.fragments[segment.memoryFragmentTrigger];
          if (fragment) {
            triggerFragment(fragment.id);
          }
        }
      } else if (!segment && activeNarrative) {
        setActiveNarrative(null);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [narrative, isInitialized, narrativeEnabled, activeNarrative, triggerFragment]);

  // ===== RENDER =====
  return (
    <div className="consciousness-theater-v3">
      {/* Director-controlled Opening Sequence */}
      <OpeningSequence />

      {/* Scroll container */}
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '700vh',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* WebGL Canvas - Always visible, particles appear after opening */}
      {showCanvas && (
        <WebGLCanvas
          stage={currentStage}
          morphProgress={morphProgress}
          scrollProgress={scrollProgress}
        />
      )}

      {/* Narrative Overlay - Only when enabled by Director */}
      {narrativeEnabled && activeNarrative && <NarrationOverlay segment={activeNarrative} />}

      {/* Memory Fragments */}
      {activeFragments.map(fragment => {
        const state = fragmentStates[fragment.id];
        if (state?.state === 'active') {
          return (
            <MemoryFragmentRenderer
              key={fragment.id}
              fragment={fragment}
              onDismiss={() => dismissFragment(fragment.id)}
            />
          );
        }
        return null;
      })}

      {/* ENHANCED DIRECTOR CONSOLE - Single consolidated debug panel */}
      {import.meta.env.DEV && window.SHOW_DIRECTOR !== false && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#00FF00',
            fontFamily: 'Courier New, monospace',
            fontSize: '0.8rem',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #00FF00',
            boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            minWidth: '240px',
            zIndex: 10000,
          }}
        >
          {/* Header */}
          <div style={{
            borderBottom: '1px solid #00FF00',
            paddingBottom: '6px',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>🎬 DIRECTOR CONSOLE</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>v3.0</span>
          </div>
          
          {/* Director Info */}
          <div style={{ marginBottom: '8px' }}>
            <div>Phase: <span style={{ color: '#00FFCC' }}>
              {window.theaterDirector?.phase || 'idle'}
            </span></div>
            <div>Time: <span style={{ color: '#00FFCC' }}>
              {window.theaterDirector?.startTime ? 
                Math.round((Date.now() - window.theaterDirector.startTime) / 1000) + 's' : 
                '0s'}
            </span></div>
          </div>
          
          {/* System Status */}
          <div style={{ 
            borderTop: '1px solid rgba(0, 255, 0, 0.3)',
            paddingTop: '6px',
            marginBottom: '8px'
          }}>
            <div>Stage: <span style={{ color: '#FFD700' }}>
              {currentStage} ({Math.round(scrollProgress * 100)}%)
            </span></div>
            <div>Morph: <span style={{ color: morphProgress > 0.5 ? '#FF00FF' : '#00FFCC' }}>
              {Math.round(morphProgress * 100)}% {morphProgress > 0.5 ? '🧠' : '☁️'}
            </span></div>
            <div>Scroll: {scrollEnabled ? '✅ Enabled' : '🔒 Locked'}</div>
            <div>Narrative: {narrativeEnabled ? '✅ Active' : '⏳ Waiting'}</div>
            <div>Canvas: {showCanvas ? '✅ Rendering' : '⏳ Loading'}</div>
          </div>
          
          {/* Quick Actions */}
          <div style={{
            borderTop: '1px solid rgba(0, 255, 0, 0.3)',
            paddingTop: '6px',
            display: 'flex',
            gap: '8px',
            fontSize: '0.7rem'
          }}>
            <button
              onClick={() => {
                window.theaterDirector.isRunning = false;
                window.theaterDirector.cancelled = false;
                window.theaterDirector.start();
              }}
              style={{
                background: '#00FF00',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.7rem'
              }}
            >
              🔄 Restart
            </button>
            <button
              onClick={() => {
                window.ENABLE_PERFORMANCE_MONITOR = !window.ENABLE_PERFORMANCE_MONITOR;
                window.location.reload();
              }}
              style={{
                background: '#FFD700',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.7rem'
              }}
            >
              📊 Perf
            </button>
            <button
              onClick={() => {
                console.log('=== MC3V System State ===');
                console.log('Director:', window.theaterDirector.getStatus());
                console.log('Stage:', currentStage, 'Progress:', scrollProgress);
                console.log('Engine:', window.engineDebug?.getCacheStats());
                console.log('Quality:', window.qualityControls?.getCacheStats());
              }}
              style={{
                background: '#00CCFF',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.7rem'
              }}
            >
              📋 Log
            </button>
          </div>
          
          {/* Keyboard Hints */}
          <div style={{
            marginTop: '8px',
            fontSize: '0.65rem',
            opacity: 0.6,
            textAlign: 'center',
            borderTop: '1px solid rgba(0, 255, 0, 0.2)',
            paddingTop: '6px'
          }}>
            H: Hide | 1-7: Jump | ←→: Nav | ↑↓: Morph
          </div>
        </div>
      )}
    </div>
  );
}