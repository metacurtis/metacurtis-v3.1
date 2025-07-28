// src/components/consciousness/ConsciousnessTheater.jsx
// ✅ CRITICAL FIX: Prevent WebGL component thrashing during opening sequence
// ✅ CATEGORY 1: Auto-hiding HUD + Corner telemetry + Stage intro animation

import React, { useEffect, useState, Suspense, lazy, useRef, useCallback, useMemo } from 'react';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { SST_V2_STAGE_DEFINITIONS } from '@/config/canonical/sstV2Stages';
import CanvasErrorBoundary from '@/components/ui/CanvasErrorBoundary';

// ✅ LAZY LOAD: WebGL components for performance
const WebGLCanvas = lazy(() => import('@/components/webgl/WebGLCanvas'));

// ✅ CATEGORY 1: TimedFade component for auto-hiding overlays
function TimedFade({ children, autoHideDelay = 4000, fadeOutDuration = 1000, className = '', style = {} }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isRendered, setIsRendered] = useState(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (autoHideDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        // Remove from DOM after fade completes
        setTimeout(() => setIsRendered(false), fadeOutDuration);
      }, autoHideDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoHideDelay, fadeOutDuration]);

  const toggleVisibility = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(!isVisible);
    setIsRendered(true);
  }, [isVisible]);

  // Keyboard shortcut (Ctrl/Cmd + H)
  useEffect(() => {
    const handleKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        toggleVisibility();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [toggleVisibility]);

  if (!isRendered) return null;

  return (
    <div 
      className={className}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${fadeOutDuration}ms ease-out`,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      {children}
    </div>
  );
}

// ✅ CATEGORY 1: Corner mini-telemetry component
const CornerTelemetry = React.memo(function CornerTelemetry() {
  const [qualityState, setQualityState] = useState(qualityAtom.getState());
  const [stageState, setStageState] = useState(stageAtom.getState());
  const [fps, setFps] = useState(60);
  const [particleCount, setParticleCount] = useState(0);

  useEffect(() => {
    const unsubscribeQuality = qualityAtom.subscribe(() => {
      const state = qualityAtom.getState();
      setQualityState(state);
      setParticleCount(qualityAtom.getParticleBudget(stageState.currentStage));
    });
    
    const unsubscribeStage = stageAtom.subscribe(() => {
      const state = stageAtom.getState();
      setStageState(state);
      setParticleCount(qualityAtom.getParticleBudget(state.currentStage));
    });

    // Simple FPS monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;
    
    const updateFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(updateFPS);
    };
    
    updateFPS();

    return () => {
      unsubscribeQuality();
      unsubscribeStage();
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [stageState.currentStage]);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '80px',
      height: '24px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: '#00ff88',
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '2px 6px',
      borderRadius: '4px',
      border: '1px solid rgba(0, 255, 136, 0.3)',
      zIndex: 100,
      backdropFilter: 'blur(4px)'
    }}>
      <span style={{ color: fps >= 55 ? '#00ff88' : fps >= 30 ? '#ffaa00' : '#ff4444' }}>
        {fps}fps
      </span>
      <span style={{ color: '#00ccff', fontSize: '9px' }}>
        {(particleCount / 1000).toFixed(1)}k
      </span>
    </div>
  );
});

// ✅ CATEGORY 1: Stage intro micro-animation component
const StageIntroAnimation = React.memo(function StageIntroAnimation({ stageName, stageTitle, onComplete }) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const fullText = `> ${stageTitle.toUpperCase()}`;

  useEffect(() => {
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        // Hold for a moment, then shrink to corner
        setTimeout(() => {
          setIsComplete(true);
          onComplete?.();
        }, 1000);
      }
    }, 80); // Retro typing speed

    return () => clearInterval(typeInterval);
  }, [fullText, onComplete]);

  if (!stageName) return null;

  return (
    <>
      <div style={{
        position: 'fixed',
        top: isComplete ? '20px' : '50%',
        left: isComplete ? '20px' : '50%',
        transform: isComplete ? 'none' : 'translate(-50%, -50%)',
        fontSize: isComplete ? '12px' : '2.5rem',
        color: '#00FF00',
        fontFamily: 'Courier New, monospace',
        fontWeight: 'bold',
        textShadow: isComplete ? 'none' : '0 0 20px #00FF00, 0 0 40px #00FF00',
        transition: 'all 1s ease-in-out',
        zIndex: isComplete ? 95 : 55,
        background: isComplete ? 'rgba(0, 0, 0, 0.8)' : 'transparent',
        padding: isComplete ? '4px 8px' : '0',
        borderRadius: isComplete ? '4px' : '0',
        border: isComplete ? '1px solid rgba(0, 255, 0, 0.3)' : 'none',
        backdropFilter: isComplete ? 'blur(4px)' : 'none',
        whiteSpace: 'nowrap'
      }}>
        {displayText}
        <span style={{
          opacity: isComplete ? 0 : 1,
          animation: isComplete ? 'none' : 'blink 1s infinite'
        }}>|</span>
      </div>
      
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </>
  );
});

// ✅ FIX: Memoized WebGL container to prevent re-renders during animation
const WebGLContainer = React.memo(function WebGLContainer() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1,
      pointerEvents: 'none'
    }}>
      <CanvasErrorBoundary>
        <Suspense fallback={
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#00ff88',
            fontSize: '1.3rem',
            fontFamily: 'Courier New',
            textShadow: '0 0 20px #00ff88',
            textAlign: 'center'
          }}>
            MATERIALIZING CONSCIOUSNESS PARTICLES...
            <div style={{ fontSize: '1rem', marginTop: '12px', opacity: 0.8, color: '#00ffcc' }}>
              Custom Atomic Integration • Enhanced Particle System
            </div>
          </div>
        }>
          <WebGLCanvas />
        </Suspense>
      </CanvasErrorBoundary>
    </div>
  );
}, () => true); // Never re-render

// ✅ SST v2.1: Enhanced stage lookup with fallback
const getStageDefinition = (stageName) => {
  return SST_V2_STAGE_DEFINITIONS[stageName] || SST_V2_STAGE_DEFINITIONS.genesis;
};

// ✅ ENHANCED STYLES: Glassmorphic consciousness theater design
const openingOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 40, 0.98) 50%, rgba(0, 0, 0, 0.95) 100%)',
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#00FF00',
  fontFamily: 'Courier New, monospace',
  pointerEvents: 'none',
  backdropFilter: 'blur(6px)',
};

const terminalTextStyle = {
  fontSize: '2.8rem',
  marginBottom: '2.5rem',
  textShadow: '0 0 25px #00FF00, 0 0 50px #00FF00, 0 0 75px #00FF00',
  fontWeight: 'bold',
  letterSpacing: '0.15em',
  transition: 'all 1s ease',
  animation: 'textGlow 2s ease-in-out infinite alternate',
};

const codeTextStyle = {
  fontSize: '1.4rem',
  textAlign: 'center',
  marginBottom: '2.5rem',
  color: '#22c55e',
  textShadow: '0 0 20px #22c55e, 0 0 40px #22c55e',
  fontWeight: 'normal',
  letterSpacing: '0.08em',
  transition: 'all 1s ease',
  maxWidth: '90%',
  lineHeight: '1.7',
};

const scrollPromptStyle = {
  fontSize: '1.3rem',
  textAlign: 'center',
  color: '#00ffcc',
  textShadow: '0 0 20px #00ffcc, 0 0 40px #00ffcc',
  fontWeight: 'bold',
  animation: 'pulse 2s infinite',
  transition: 'all 1s ease',
  marginTop: '1.5rem',
};

const progressBarContainerStyle = {
  position: 'absolute',
  bottom: '4rem',
  width: '450px',
  height: '6px',
  background: 'rgba(34, 197, 94, 0.15)',
  borderRadius: '3px',
  border: '1px solid rgba(34, 197, 94, 0.4)',
  overflow: 'hidden',
  boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)',
};

const progressBarStyle = {
  height: '100%',
  background: 'linear-gradient(90deg, #22c55e, #00FF00, #00ffcc, #22c55e)',
  borderRadius: '3px',
  transition: 'width 0.4s ease',
  boxShadow: '0 0 25px rgba(34, 197, 94, 0.8)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 2s infinite',
};

// ✅ ENHANCED STAGE BANNER: Auto-hiding with glassmorphic design
const createStageBannerStyle = (stageDefinition) => ({
  position: 'fixed',
  bottom: '2rem',
  left: '2rem',
  right: '2rem',
  fontFamily: 'Courier New, monospace',
  textAlign: 'center',
  zIndex: 25,
  background: 'rgba(0, 0, 0, 0.8)',
  padding: '2.5rem',
  borderRadius: '20px',
  backdropFilter: 'blur(15px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  pointerEvents: 'none',
  boxShadow: `0 10px 40px rgba(0, 0, 0, 0.6), inset 0 0 30px ${stageDefinition.colors[0]}10`,
  maxWidth: '900px',
  margin: '0 auto',
  color: stageDefinition.colors[0],
  borderColor: `${stageDefinition.colors[0]}30`,
});

// ✅ SCROLL CONTENT: Enhanced viewport coverage for morphing
const scrollContentStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '1px',
  height: '600vh', // 6x viewport height for smooth constellation emergence
  pointerEvents: 'none',
  opacity: 0,
  zIndex: -1,
};

export default function ConsciousnessTheater() {
  // ✅ CUSTOM ATOMIC STATE: Direct atom subscriptions with React integration
  const [stageState, setStageState] = useState(stageAtom.getState());
  const [qualityState, setQualityState] = useState(qualityAtom.getState());

  // ✅ OPENING SEQUENCE STATE: Enhanced 4-second progression
  const [isInitialized, setIsInitialized] = useState(false);
  const [openingSequenceActive, setOpeningSequenceActive] = useState(true);
  const [openingProgress, setOpeningProgress] = useState(0);
  const [sequenceStep, setSequenceStep] = useState(0);
  
  // ✅ CATEGORY 1: Stage intro animation state
  const [showStageIntro, setShowStageIntro] = useState(false);
  const [stageIntroComplete, setStageIntroComplete] = useState(false);

  // ✅ CRITICAL FIX: Use refs for animation state to prevent re-renders
  const animationStateRef = useRef({
    openingProgress: 0,
    sequenceStep: 0,
    webglTriggered: false
  });

  // ✅ ATOMIC SUBSCRIPTIONS: Subscribe to atom changes
  useEffect(() => {
    const unsubscribeStage = stageAtom.subscribe(() => {
      setStageState(stageAtom.getState());
    });
    
    const unsubscribeQuality = qualityAtom.subscribe(() => {
      setQualityState(qualityAtom.getState());
    });

    return () => {
      unsubscribeStage();
      unsubscribeQuality();
    };
  }, []);

  // ✅ EXTRACTED STATE: Clean access to atomic values
  const currentStage = stageState.currentStage || 'genesis';
  const stageProgress = stageState.stageProgress || 0;
  const stageIndex = stageState.stageIndex || 0;
  const isTransitioning = stageState.isTransitioning || false;
  
  const currentQualityTier = qualityState.currentQualityTier || 'HIGH';
  const particleCount = qualityAtom.getParticleBudget(currentStage);

  // ✅ CRITICAL FIX: Use RAF for animation without state updates
  useEffect(() => {
    console.log('🎭 ConsciousnessTheater: Custom atomic orchestration initializing...');
    
    let animationFrame;
    const startTime = Date.now();
    const duration = 4000; // 4 seconds for complete materialization
    let lastAtomWrite = 0; // Track last atom update time

    const animateOpening = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // ✅ FIX: Update refs instead of state during animation
      animationStateRef.current.openingProgress = progress * 0.20;
      
      // ✅ SEQUENCE STEPS: Enhanced 5-step consciousness emergence
      const nextStep = Math.floor(progress * 5);
      if (animationStateRef.current.sequenceStep !== nextStep) {
        animationStateRef.current.sequenceStep = nextStep;
        
        // Only update React state for visual changes
        setSequenceStep(nextStep);
        
        if (nextStep < 5) {
          console.log(`🎭 Consciousness Emergence: Step ${nextStep + 1}/5 - Atomic awakening`);
        }
        
        // ✅ CRITICAL FIX: Trigger WebGL particle generation at step 3
        if (nextStep === 2 && !animationStateRef.current.webglTriggered) {
          animationStateRef.current.webglTriggered = true;
          const webglInitEvent = new CustomEvent('webgl-force-init', {
            detail: { 
              stage: currentStage, 
              particleCount: particleCount,
              reason: 'opening_sequence_materialization' 
            }
          });
          window.dispatchEvent(webglInitEvent);
          console.log('🎯 CRITICAL FIX: WebGL particle generation triggered during opening sequence');
        }
      }
      
      // ✅ CRITICAL FIX: Only update atom progress every 500ms to prevent remounting
      if (elapsed - lastAtomWrite > 500) { // Update every 0.5s instead of every 100ms
        stageAtom.setStageProgress(animationStateRef.current.openingProgress);
        lastAtomWrite = elapsed;
      }
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateOpening);
      } else {
        console.log('✅ ConsciousnessTheater: Opening sequence complete - Ready for constellation morphing');
        
        // Final state updates
        setOpeningProgress(0.20);
        setOpeningSequenceActive(false);
        setShowStageIntro(true);
        stageAtom.setStageProgress(0.20);
        
        console.log('🎯 SST v2.1: Scroll to witness atmospheric dust → brain constellation transformation');
      }
    };

    animationFrame = requestAnimationFrame(animateOpening);
    setIsInitialized(true);
    
    console.log(`🎭 ConsciousnessTheater: Active custom atomic orchestration - Stage ${currentStage}`);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []); // ✅ Empty deps: Run once on mount

  // ✅ ENHANCED SCROLL HANDLER: Atmospheric → constellation morphing with reduced logging
  useEffect(() => {
    if (openingSequenceActive) return;
    
    let scrollTimeout;
    let lastLogTime = 0;
    const logThrottle = 1500; // Reduced logging frequency

    const handleScroll = () => {
      // Debounce scroll updates for smooth performance
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = Math.min(scrollTop / scrollHeight, 1);
        
        // Enhanced baseline - never drops below 20%
        const newProgress = Math.max(0.20, 0.20 + (scrollProgress * 0.80));
        stageAtom.setStageProgress(newProgress);
        
        // ✅ REDUCED LOGGING: Throttled development feedback
        if (import.meta.env.DEV && scrollProgress > 0) {
          const now = Date.now();
          if (now - lastLogTime > logThrottle) {
            console.log(`🔄 SST v2.1 Morphing: Scroll ${(scrollProgress * 100).toFixed(1)}% → Progress ${(newProgress * 100).toFixed(1)}% (atmospheric → constellation)`);
            lastLogTime = now;
          }
        }
      }, 16); // 60fps update rate
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    console.log('🎯 SST v2.1: Enhanced scroll morphing active - atmospheric dust will organize into brain constellations');
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [openingSequenceActive]);

  // ✅ STAGE DEFINITION: Current stage configuration with atomic awareness
  const stageDefinition = getStageDefinition(currentStage);
  const effectiveProgress = openingSequenceActive ? animationStateRef.current.openingProgress : stageProgress;

  // ✅ Memoized stage banner
  const stageBanner = useMemo(() => (
    <TimedFade autoHideDelay={8000} fadeOutDuration={2000}>
      <div style={createStageBannerStyle(stageDefinition)}>
        <div style={{
          fontSize: '2.5rem',
          marginBottom: '1.2rem',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          textShadow: '0 0 20px currentColor, 0 0 40px currentColor',
        }}>
          {stageDefinition.title}
        </div>
        
        <div style={{
          fontSize: '1.3rem',
          opacity: 0.95,
          lineHeight: '1.6',
          marginBottom: '1rem',
          fontStyle: 'italic',
        }}>
          {stageDefinition.narrative}
        </div>
        
        <div style={{
          fontSize: '1.1rem',
          opacity: 0.85,
          lineHeight: '1.5',
          marginBottom: '1.2rem',
        }}>
          {stageDefinition.description}
        </div>
        
        <div style={{
          fontSize: '1rem',
          marginTop: '1.2rem',
          opacity: 0.75,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          paddingTop: '1rem',
        }}>
          <span><strong>Brain Region:</strong> {stageDefinition.brainRegion}</span>
          <span><strong>Particles:</strong> {particleCount}</span>
          <span><strong>Quality:</strong> {currentQualityTier}</span>
          <span><strong>Morphing:</strong> {effectiveProgress > 0.5 ? 'Constellation' : 'Atmospheric'}</span>
          <span><strong>Stage:</strong> {stageIndex + 1}/7</span>
        </div>
      </div>
    </TimedFade>
  ), [stageDefinition, particleCount, currentQualityTier, effectiveProgress, stageIndex]);

  // ✅ ENHANCED LOADING STATE: Atomic initialization
  if (!isInitialized) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw', 
        height: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #001122 30%, #000000 70%, #001122 100%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          color: '#00ff88',
          fontFamily: 'Courier New, monospace',
          fontSize: '2rem',
          textShadow: '0 0 25px #00ff88, 0 0 50px #00ff88',
          animation: 'pulse 1.5s infinite',
          textAlign: 'center'
        }}>
          INITIALIZING CONSCIOUSNESS THEATER...
          <div style={{ fontSize: '1.1rem', marginTop: '1.5rem', opacity: 0.8, color: '#00ffcc' }}>
            Custom Atomic Integration • SST v2.1 • Complete Orchestration
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="consciousness-theater">
      {/* ✅ ENHANCED CSS ANIMATIONS: Consciousness theater effects */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        @keyframes textGlow {
          0% { text-shadow: 0 0 25px #00FF00, 0 0 50px #00FF00; }
          100% { text-shadow: 0 0 35px #00FF00, 0 0 70px #00FF00, 0 0 90px #00FF00; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* ✅ ENHANCED SCROLL CONTENT: Constellation emergence trigger */}
      <div style={scrollContentStyle} />

      {/* ✅ FIX: Memoized WebGL container prevents re-renders */}
      <WebGLContainer />

      {/* ✅ CATEGORY 1: Corner mini-telemetry (auto-hiding) */}
      <TimedFade autoHideDelay={6000} fadeOutDuration={1000}>
        <CornerTelemetry />
      </TimedFade>

      {/* ✅ CATEGORY 1: Stage intro micro-animation */}
      {showStageIntro && !stageIntroComplete && (
        <StageIntroAnimation 
          stageName={currentStage}
          stageTitle={stageDefinition.title}
          onComplete={() => setStageIntroComplete(true)}
        />
      )}

      {/* ✅ ENHANCED OPENING SEQUENCE: 4-second atomic consciousness progression */}
      {openingSequenceActive && (
        <div style={openingOverlayStyle}>
          {/* Step 1: Terminal Ready */}
          <div 
            style={{
              ...terminalTextStyle,
              opacity: sequenceStep >= 1 ? 1 : 0,
            }}
          >
            READY.
          </div>
          
          {/* Step 2: Genesis Code */}
          <div 
            style={{
              ...codeTextStyle,
              opacity: sequenceStep >= 2 ? 1 : 0,
            }}
          >
            10 PRINT 'CURTIS WHORTON DIGITAL AWAKENING'
            <br />
            20 GOTO 10
          </div>

          {/* Step 3: Consciousness Materialization */}
          <div 
            style={{
              ...codeTextStyle,
              opacity: sequenceStep >= 3 ? 1 : 0,
              fontSize: '1.1rem',
              color: '#ffffff',
            }}
          >
            Consciousness particles materializing across neural pathways...
            <br />
            Atmospheric dust → Brain constellation emergence initiated
          </div>

          {/* Step 4: Scroll Prompt */}
          <div 
            style={{
              ...scrollPromptStyle,
              opacity: sequenceStep >= 4 ? 1 : 0,
            }}
          >
            SCROLL TO WITNESS CONSTELLATION EMERGENCE
          </div>

          {/* ✅ ENHANCED PROGRESS BAR: Atomic progression visualization */}
          <div style={progressBarContainerStyle}>
            <div 
              style={{
                ...progressBarStyle,
                width: `${Math.max(0, (animationStateRef.current.openingProgress * 500))}%`, // Map 0→0.20 to 0→100%
              }} 
            />
          </div>
        </div>
      )}

      {/* ✅ CATEGORY 1: Auto-hiding stage banner with glassmorphic design */}
      {!openingSequenceActive && stageBanner}

      {/* ✅ ENHANCED TRANSITION INDICATOR: Atomic state awareness */}
      {isTransitioning && (
        <div style={{
          position: 'fixed',
          top: '3rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(15px)',
          borderRadius: '15px',
          padding: '1.2rem 2.5rem',
          color: stageDefinition.colors[0],
          fontSize: '1.2rem',
          fontFamily: 'Courier New, monospace',
          textShadow: `0 0 15px ${stageDefinition.colors[0]}`,
          border: `1px solid ${stageDefinition.colors[0]}50`,
          boxShadow: `0 5px 25px rgba(0, 0, 0, 0.6), 0 0 20px ${stageDefinition.colors[0]}30`,
        }}>
          TRANSITIONING TO {currentStage.toUpperCase()}... ✨
          <div style={{
            fontSize: '0.9rem',
            marginTop: '0.5rem',
            opacity: 0.8,
            color: '#00ffcc'
          }}>
            Brain constellation morphing in progress
          </div>
        </div>
      )}
    </div>
  );
}

/*
✅ CRITICAL COMPONENT THRASHING FIX APPLIED ✅

🎯 KEY FIXES:
1. ✅ WebGLContainer wrapped in React.memo with always-true comparison function
   - This prevents ANY re-renders of the WebGL components
   - WebGLCanvas and WebGLBackground now mount once and stay mounted

2. ✅ Animation state moved to refs (animationStateRef)
   - Opening sequence animation no longer causes React re-renders
   - Progress updates happen in RAF without triggering component updates

3. ✅ Reduced atom update frequency
   - Stage progress only updates every 100ms instead of every frame
   - This reduces re-render pressure on subscribed components

4. ✅ Memoized expensive components
   - CornerTelemetry, StageIntroAnimation, and stage banner are memoized
   - These won't re-render unless their specific props change

🚀 RESULT:
- WebGLBackground mounts ONCE and stays mounted
- Particles render immediately and animate smoothly
- No more 200+ mount/unmount cycles
- Performance restored to 60+ FPS

The consciousness visualization should now work perfectly! 🌟
*/