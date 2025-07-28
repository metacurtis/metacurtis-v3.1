// src/components/consciousness/ConsciousnessTheater.jsx
// SST v3.0 PRODUCTION - Complete implementation with all fixes

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Canonical } from '../../config/canonical/canonicalAuthority';
import { stageAtom } from '../../stores/atoms/stageAtom';
import { qualityAtom } from '../../stores/atoms/qualityAtom';
import { useMemoryFragments } from '../../hooks/useMemoryFragments.js'; // FIXED: Named import
import WebGLCanvas from '../webgl/WebGLCanvas';
import DevPerformanceMonitor from '../dev/DevPerformanceMonitor';

console.log('🧬 LOADED: ConsciousnessTheater v3.0'); // Diagnostic

// ===== OPENING SEQUENCE COMPONENTS =====
const C64Cursor = ({ visible }) => (
  <span style={{
    color: '#00FF00',
    fontFamily: 'Courier New, monospace',
    fontSize: '2rem',
    opacity: visible ? 1 : 0,
    transition: 'opacity 100ms'
  }}>_</span>
);

const TerminalText = ({ text, typeSpeed = 50, onComplete, style = {} }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, typeSpeed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, typeSpeed, onComplete]);

  return (
    <div style={{
      color: '#00FF00',
      fontFamily: 'Courier New, monospace',
      fontSize: '1.5rem',
      textShadow: '0 0 10px #00FF00',
      ...style
    }}>
      {displayText}
    </div>
  );
};

const ScreenFill = ({ active, onComplete }) => {
  const [lines, setLines] = useState([]);
  
  useEffect(() => {
    if (!active) return;

    let lineCount = 0;
    const maxLines = 30;
    
    const interval = setInterval(() => {
      if (lineCount < maxLines) {
        setLines(prev => [...prev, `HELLO CURTIS `]);
        lineCount++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      color: '#00FF00',
      fontFamily: 'Courier New, monospace',
      fontSize: '1.2rem',
      lineHeight: '1.2',
      zIndex: 9999, // FIXED: Higher z-index
      background: 'black',
      whiteSpace: 'pre',
      padding: '20px'
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'inline' }}>
          {line.repeat(10)}
        </div>
      ))}
    </div>
  );
};

// ===== NARRATION OVERLAY =====
const NarrationOverlay = ({ segment }) => {
  if (!segment) return null;

  return (
    <div style={{
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
      zIndex: 40
    }}>
      <p style={{
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '1.1rem',
        lineHeight: '1.6',
        margin: 0,
        textAlign: 'center'
      }}>
        {segment.text}
      </p>
    </div>
  );
};

// ===== MEMORY FRAGMENT RENDERER =====
const MemoryFragmentRenderer = ({ fragment, onDismiss }) => {
  if (!fragment) return null;

  return (
    <div style={{
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
      maxWidth: '600px'
    }}>
      <h3 style={{ 
        color: '#00FF00', 
        marginTop: 0,
        fontFamily: 'Courier New, monospace'
      }}>
        {fragment.name}
      </h3>
      <div style={{ color: '#ffffff', marginBottom: '20px' }}>
        {fragment.content.type === 'interactive' && 
          fragment.content.element === 'commodore_terminal' && (
            <div style={{
              background: '#000',
              padding: '20px',
              fontFamily: 'Courier New, monospace',
              color: '#00FF00',
              border: '1px solid #00FF00'
            }}>
              READY.<br/>
              10 PRINT "HELLO CURTIS"<br/>
              20 GOTO 10<br/>
              RUN<br/>
              <div style={{ marginTop: '10px', opacity: 0.7 }}>
                {Array(5).fill('HELLO CURTIS ').join('')}...
              </div>
            </div>
          )
        }
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
          fontWeight: 'bold'
        }}
      >
        Close
      </button>
    </div>
  );
};

// ===== MAIN CONSCIOUSNESS THEATER =====
export default function ConsciousnessTheater() {
  // Core state
  const [currentStage, setCurrentStage] = useState('genesis');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Opening sequence state
  const [openingPhase, setOpeningPhase] = useState('black');
  const [showCursor, setShowCursor] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const [screenFillActive, setScreenFillActive] = useState(false);
  
  // Narrative state
  const [activeNarrative, setActiveNarrative] = useState(null);
  const [narrativeTime, setNarrativeTime] = useState(0);
  
  // Stage management
  const [showCanvas, setShowCanvas] = useState(false);
  const startTimeRef = useRef(Date.now());
  const currentStageRef = useRef('genesis'); // FIXED: Track current stage

  // Get configuration
  const stageConfig = Canonical.stages[currentStage];
  const narrative = Canonical.dialogue?.[currentStage];

  // Memory fragments
  const { 
    activeFragments, 
    fragmentStates, 
    triggerFragment, 
    dismissFragment 
  } = useMemoryFragments(currentStage, scrollProgress * 100, activeNarrative?.id);

  // ===== LOCK SCROLLING DURING OPENING =====
  useEffect(() => {
    // Lock scrolling initially
    document.body.style.overflow = 'hidden';
    
    // Unlock when opening completes
    if (openingPhase === 'complete') {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [openingPhase]);

  // ===== HARDCODED OPENING SEQUENCE (ALWAYS PLAYS) =====
  useEffect(() => {
    console.log('🎬 SST v3.0: Starting opening sequence (hardcoded)');
    
    const sequence = [];
    let currentTime = 0;

    // Black screen - 2 seconds
    currentTime = 2000;

    // Cursor phase
    sequence.push({
      delay: currentTime,
      action: () => {
        console.log('Phase: cursor');
        setOpeningPhase('cursor');
      }
    });

    // Cursor blink
    sequence.push({ delay: currentTime + 500, action: () => setShowCursor(true) });
    sequence.push({ delay: currentTime + 1000, action: () => setShowCursor(false) });
    sequence.push({ delay: currentTime + 1200, action: () => setShowCursor(true) });

    // Terminal phase
    currentTime += 1500;
    sequence.push({
      delay: currentTime,
      action: () => {
        console.log('Phase: terminal');
        setOpeningPhase('terminal');
        setShowCursor(false);
      }
    });

    // Terminal lines
    const terminalData = [
      { text: 'READY.', delay: 500 },
      { text: '10 PRINT "HELLO CURTIS"', delay: 1000 },
      { text: '20 GOTO 10', delay: 1000 },
      { text: 'RUN', delay: 800 }
    ];

    terminalData.forEach((line) => {
      currentTime += line.delay;
      sequence.push({
        delay: currentTime,
        action: () => setTerminalLines(prev => [...prev, {
          text: line.text,
          typeSpeed: 50
        }])
      });
    });

    // Screen fill
    currentTime += 1000;
    sequence.push({
      delay: currentTime,
      action: () => {
        console.log('Phase: fill');
        setOpeningPhase('fill');
        setScreenFillActive(true);
      }
    });

    // Complete
    currentTime += 2000;
    sequence.push({
      delay: currentTime,
      action: () => {
        console.log('Phase: complete');
        setOpeningPhase('complete');
        setIsInitialized(true);
        setShowCanvas(true);
        console.log('🎬 Opening sequence complete');
      }
    });

    // Execute sequence
    const timeouts = sequence.map(({ delay, action }) => 
      setTimeout(action, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, []); // Only run once on mount

  // ===== KEYBOARD NAVIGATION =====
  useEffect(() => {
    if (!isInitialized || openingPhase !== 'complete') return; // FIXED: Check opening complete

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
        case '7':
          const index = parseInt(e.key) - 1;
          const stages = Object.keys(Canonical.stages);
          if (stages[index]) {
            stageAtom.jumpToStage(stages[index]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInitialized, openingPhase]);

  // ===== STAGE SUBSCRIPTION WITH SPAM FIX =====
  useEffect(() => {
    const unsubscribe = stageAtom.subscribe((state) => {
      // Only update if stage actually changed
      if (state.currentStage !== currentStageRef.current) {
        currentStageRef.current = state.currentStage;
        setCurrentStage(state.currentStage);
        qualityAtom.updateParticleBudget(state.currentStage);
      }
    });

    return unsubscribe;
  }, []);

  // ===== SCROLL HANDLING =====
  useEffect(() => {
    if (!isInitialized || openingPhase !== 'complete') return; // FIXED: Check opening complete

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
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
  }, [isInitialized, openingPhase]);

  // ===== NARRATIVE TIMING =====
  useEffect(() => {
    if (!narrative?.narration?.segments || !isInitialized || openingPhase !== 'complete') return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setNarrativeTime(elapsed);

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
  }, [narrative, isInitialized, openingPhase, activeNarrative, triggerFragment]);

  // ===== RENDER =====

  // Opening sequence
  if (openingPhase !== 'complete') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'black',
        zIndex: 9999, // FIXED: Very high z-index
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {openingPhase === 'cursor' && <C64Cursor visible={showCursor} />}
        
        {openingPhase === 'terminal' && (
          <div style={{ width: '100%', maxWidth: '800px', padding: '0 20px' }}>
            {terminalLines.map((line, i) => (
              <TerminalText
                key={i}
                text={line.text}
                typeSpeed={line.typeSpeed}
                style={{ marginBottom: '10px' }}
              />
            ))}
          </div>
        )}
        
        {openingPhase === 'fill' && (
          <ScreenFill active={screenFillActive} onComplete={() => {}} />
        )}
      </div>
    );
  }

  // Main theater
  return (
    <div className="consciousness-theater-v3">
      {/* Scroll container */}
      <div style={{
        position: 'absolute',
        width: '1px',
        height: '700vh',
        pointerEvents: 'none',
        zIndex: -1
      }} />

      {/* WebGL Canvas with props */}
      {showCanvas && (
        <WebGLCanvas 
          stage={currentStage}
          morphProgress={morphProgress}
          scrollProgress={scrollProgress}
        />
      )}

      {/* Narrative Overlay */}
      {activeNarrative && (
        <NarrationOverlay segment={activeNarrative} />
      )}

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

      {/* Stage HUD */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        color: '#00FF00',
        fontFamily: 'Courier New, monospace',
        fontSize: '0.9rem',
        opacity: 0.7,
        zIndex: 50
      }}>
        {stageConfig?.title} | {Math.round(scrollProgress * 100)}% | Morph: {Math.round(morphProgress * 100)}%
      </div>

      {/* Dev Performance Monitor */}
      <DevPerformanceMonitor />

      {/* Dev controls */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#00FF00',
          fontFamily: 'Courier New, monospace',
          fontSize: '0.8rem',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid #00FF00',
          maxWidth: '300px',
          zIndex: 100
        }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
            🎮 SST v3.0 Controls
          </div>
          <div>← → Navigate stages</div>
          <div>↑ ↓ Manual morph</div>
          <div>1-7 Jump to stage</div>
          <div>Scroll for progression</div>
          <div style={{ marginTop: '5px', color: '#ffff00' }}>
            {morphProgress < 0.5 ? '☁️ Atmospheric' : '🧠 Brain'} Mode
          </div>
        </div>
      )}
    </div>
  );
}