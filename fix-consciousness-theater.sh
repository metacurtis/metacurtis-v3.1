#!/bin/bash
# Fix ConsciousnessTheater.jsx ESLint errors

cat > src/components/consciousness/ConsciousnessTheater.jsx << 'EOFILE'
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

// ===== MEMORY FRAGMENT RENDERER (Kept from original) =====
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
              10 PRINT &quot;HELLO CURTIS&quot;<br/>
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
  const stageConfig = Canonical.stages[currentStage];
  const narrative = Canonical.dialogue?.[currentStage];

  // Memory fragments
  const { 
    activeFragments, 
    fragmentStates, 
    triggerFragment, 
    dismissFragment 
  } = useMemoryFragments(currentStage, scrollProgress * 100, activeNarrative?.id);

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
      })
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
        case '7': {
          const index = parseInt(e.key) - 1;
          const stages = Object.keys(Canonical.stages);
          if (stages[index]) {
            stageAtom.jumpToStage(stages[index]);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInitialized, scrollEnabled]);

  // ===== STAGE SUBSCRIPTION =====
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

  // ===== SCROLL HANDLING (Only when enabled by Director) =====
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
      <div style={{
        position: 'absolute',
        width: '1px',
        height: '700vh',
        pointerEvents: 'none',
        zIndex: -1
      }} />

      {/* WebGL Canvas - Always visible, particles appear after opening */}
      {showCanvas && (
        <WebGLCanvas 
          stage={currentStage}
          morphProgress={morphProgress}
          scrollProgress={scrollProgress}
        />
      )}

      {/* Narrative Overlay - Only when enabled by Director */}
      {narrativeEnabled && activeNarrative && (
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

      {/* Director Status (Dev only) */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#00FF00',
          fontFamily: 'Courier New, monospace',
          fontSize: '0.8rem',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #00FF00',
          zIndex: 100
        }}>
          <div>🎬 Director: {window.theaterDirector?.phase || 'idle'}</div>
          <div>📜 Scroll: {scrollEnabled ? '✅' : '🔒'}</div>
          <div>🎭 Narrative: {narrativeEnabled ? '✅' : '⏳'}</div>
          <div>🎨 Particles: {showCanvas ? '✅' : '⏳'}</div>
        </div>
      )}

      {/* Dev Performance Monitor */}
      <DevPerformanceMonitor />

      {/* Dev controls */}
      {import.meta.env.DEV && scrollEnabled && (
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
EOFILE

echo "✅ Fixed ConsciousnessTheater.jsx"
echo "   - Removed unused React import"
echo "   - Fixed unescaped quotes"
echo "   - Removed unused variables"
echo "   - Added missing dependencies"
echo "   - Fixed case block declarations"
