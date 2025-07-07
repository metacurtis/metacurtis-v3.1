// src/components/sections/GenesisCodeExperience.jsx
// ✅ CONSOLIDATED ARCHITECTURE - MC3V Single Source of Truth Compliant
// ✅ STAGENAVIGATION INTEGRATION - Progressive Disclosure System Active

import { useEffect, useState, useRef } from 'react';
import { useNarrativeStore } from '@/stores/narrativeStore';
import StageNavigation from '@/components/ui/narrative/StageNavigation';
import MemoryFragments from '@/components/ui/narrative/MemoryFragments';
import AdvancedContactPortal from '@/components/ui/AdvancedContactPortal';

function GenesisCodeExperience() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showContactPortal, setShowContactPortal] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const _holdTimeoutRef = useRef(null);
  const holdIntervalRef = useRef(null);

  // ✅ CONSOLIDATED ARCHITECTURE: Use single source of truth
  const { currentStage, jumpToStage, isStageFeatureEnabled, trackUserEngagement } =
    useNarrativeStore();

  // ✅ DEFENSIVE: Fallback for trackUserEngagement if not available
  const safeTrackEngagement = (event, data) => {
    if (typeof trackUserEngagement === 'function') {
      trackUserEngagement(event, data);
    } else {
      console.log('📊 User Engagement:', event, data);
    }
  };

  // ✅ FEATURE GATES: Progressive interface unlocking
  const showInterface = isStageFeatureEnabled('stageNavigation');
  const showMemoryFragments = isStageFeatureEnabled('memoryFragments');
  const showContactTrigger = isStageFeatureEnabled('contactPortal');

  // Initialize narrative system
  useEffect(() => {
    console.log('🎮 Genesis Code Experience: Initializing narrative system');

    // ✅ CONSOLIDATED ARCHITECTURE: Use store for initialization
    jumpToStage('genesis');

    // ✅ ANALYTICS: Track component initialization
    safeTrackEngagement('genesis_experience_initialized', {
      timestamp: Date.now(),
      sessionStart: true,
    });
  }, [jumpToStage]);

  // ✅ HOLD TO AWAKEN: Progress tracking and completion
  const triggerAwakening = () => {
    if (!hasScrolled) {
      console.log('🎮 Genesis Code: Awakening sequence triggered');
      setHasScrolled(true);

      // ✅ CONSOLIDATED ARCHITECTURE: Use store for stage transition
      jumpToStage('awakening');

      // ✅ ANALYTICS: Track awakening trigger
      safeTrackEngagement('awakening_triggered', {
        triggerMethod: isHolding ? 'hold_to_awaken' : 'scroll',
        holdProgress: holdProgress,
        timestamp: Date.now(),
      });

      // Progressive interface reveal
      setTimeout(() => {
        console.log('🎮 Genesis Code: Interface fully active');
        safeTrackEngagement('interface_activated', {
          stage: currentStage,
          timestamp: Date.now(),
        });
      }, 2000);
    }
  };

  // ✅ HOLD TO AWAKEN: Hold detection logic
  const startHold = () => {
    if (hasScrolled) return;

    setIsHolding(true);
    setHoldProgress(0);

    safeTrackEngagement('hold_awakening_started', {
      timestamp: Date.now(),
    });

    // Progressive charging over 3 seconds
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        const newProgress = prev + 100 / 30; // 30 intervals over 3 seconds
        if (newProgress >= 100) {
          clearInterval(holdIntervalRef.current);
          setIsHolding(false);
          triggerAwakening();
          return 100;
        }
        return newProgress;
      });
    }, 100);
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }

    if (isHolding && holdProgress < 100) {
      safeTrackEngagement('hold_awakening_cancelled', {
        progress: holdProgress,
        timestamp: Date.now(),
      });
    }

    setIsHolding(false);
    setHoldProgress(0);
  };

  // CSS-only scroll detection for awakening (alternative method)
  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolled && window.scrollY > 50) {
        triggerAwakening();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [hasScrolled]);

  // ✅ HOLD TO AWAKEN: Keyboard support (spacebar)
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.code === 'Space' && !hasScrolled && !isHolding) {
        e.preventDefault();
        startHold();
      }
    };

    const handleKeyUp = e => {
      if (e.code === 'Space' && isHolding) {
        e.preventDefault();
        endHold();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, [isHolding, hasScrolled]);

  return (
    <>
      {/* Genesis Code Landing */}
      <section
        id="genesis"
        className={`genesis-landing ${hasScrolled ? 'awakened' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'transparent',
          pointerEvents: hasScrolled ? 'none' : 'auto',
        }}
      >
        {/* C64 Terminal Prompt */}
        <div className="c64-terminal">
          <div className="terminal-line">
            <span className="terminal-text">READY.</span>
          </div>
          <div className="terminal-line">
            <span className="terminal-text">
              10 PRINT &quot;CURTIS WHORTON DIGITAL AWAKENING&quot;
            </span>
          </div>
          <div className="terminal-line">
            <span className="terminal-text">20 GOTO 10</span>
          </div>
          <div className="terminal-line">
            <span className="terminal-text">RUN</span>
          </div>
          <div className="terminal-line run-line">
            <span className="terminal-text">CURTIS WHORTON DIGITAL AWAKENING</span>
          </div>
        </div>

        {/* Scroll Prompt */}
        <div className="scroll-prompt">
          <div className="prompt-text">SCROLL TO AWAKEN</div>
          <div className="scroll-arrow">↓</div>
        </div>

        {/* ✅ HOLD TO AWAKEN: Interactive charging button */}
        <div className="hold-awaken-container">
          <div className="hold-prompt">OR HOLD TO CHARGE CONSCIOUSNESS</div>
          <button
            className={`hold-awaken-button ${isHolding ? 'charging' : ''}`}
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            style={{
              '--hold-progress': `${holdProgress}%`,
            }}
          >
            <div className="hold-button-core">
              <div className="hold-button-text">
                {isHolding ? Math.round(holdProgress) + '%' : 'HOLD'}
              </div>
              <div className="hold-progress-ring"></div>
            </div>
          </button>
          <div className="hold-hint">Hold button or press spacebar</div>
        </div>

        {/* Timeline Overlay */}
        <div className="timeline-overlay">
          <span className="year">1983</span>
          <span className="year-desc">The Genesis Code</span>
        </div>
      </section>

      {/* ✅ FEATURE GATE: Stage Navigation (progressive unlock) */}
      {showInterface && <StageNavigation />}

      {/* ✅ FEATURE GATE: Memory Fragments (progressive unlock) */}
      {showMemoryFragments && <MemoryFragments />}

      {/* ✅ FEATURE GATE: Contact Trigger (transcendence stage only) */}
      {showContactTrigger && currentStage === 'transcendence' && (
        <button
          onClick={() => {
            // ✅ ANALYTICS: Track contact portal trigger
            safeTrackEngagement('contact_portal_triggered', {
              currentStage,
              triggerMethod: 'transcendence_button',
              timestamp: Date.now(),
            });
            setShowContactPortal(true);
          }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 25,
            background: 'linear-gradient(135deg, #0D9488, #D97706)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            cursor: 'pointer',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(13, 148, 136, 0.4)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            animation: 'contact-pulse 2s ease-in-out infinite',
          }}
          onMouseEnter={e => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 30px rgba(13, 148, 136, 0.6)';
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 20px rgba(13, 148, 136, 0.4)';
          }}
        >
          🚀
        </button>
      )}

      {/* ✅ ADVANCED CONTACT PORTAL: Integrated with proper props */}
      <AdvancedContactPortal
        isOpen={showContactPortal}
        onClose={() => setShowContactPortal(false)}
        triggerStage={currentStage}
      />

      {/* CSS Styles */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        .genesis-landing {
          font-family: 'Courier New', monospace;
          transition:
            opacity 0.8s ease-out,
            transform 0.8s ease-out;
        }

        .genesis-landing.awakened {
          opacity: 0;
          transform: translateY(-20px);
          pointer-events: none;
        }

        /* C64 Terminal Styling */
        .c64-terminal {
          background: #000;
          color: #00ff00;
          padding: 2rem;
          border: 2px solid #00ff00;
          border-radius: 0;
          font-size: clamp(0.875rem, 2vw, 1.25rem);
          line-height: 1.4;
          text-shadow: 0 0 5px #00ff00;
          max-width: 90vw;
          margin-bottom: 3rem;
          animation: terminal-glow 2s ease-in-out infinite alternate;
        }

        .terminal-line {
          margin: 0.5rem 0;
          display: flex;
          align-items: center;
        }

        .terminal-text {
          display: inline-block;
        }

        .run-line {
          animation: text-scroll 3s linear infinite;
          overflow: hidden;
          white-space: nowrap;
        }

        /* Scroll Prompt */
        .scroll-prompt {
          text-align: center;
          color: rgba(255, 255, 255, 0.8);
          animation: pulse-prompt 2s ease-in-out infinite;
          margin-bottom: 2rem;
        }

        .prompt-text {
          font-size: clamp(1rem, 3vw, 1.5rem);
          font-weight: 600;
          margin-bottom: 1rem;
          letter-spacing: 0.1em;
        }

        .scroll-arrow {
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          animation: bounce-arrow 1.5s ease-in-out infinite;
        }

        /* ✅ HOLD TO AWAKEN: Interactive charging button */
        .hold-awaken-container {
          text-align: center;
          color: rgba(255, 255, 255, 0.8);
        }

        .hold-prompt {
          font-size: clamp(0.875rem, 2vw, 1.125rem);
          font-weight: 500;
          margin-bottom: 1.5rem;
          letter-spacing: 0.05em;
          opacity: 0.7;
        }

        .hold-awaken-button {
          position: relative;
          width: 120px;
          height: 120px;
          border: none;
          border-radius: 50%;
          background: linear-gradient(135deg, #001122, #003344);
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          margin: 0 auto 1rem;
          display: block;
          box-shadow:
            0 0 20px rgba(0, 255, 0, 0.3),
            inset 0 0 20px rgba(0, 0, 0, 0.5);
        }

        .hold-awaken-button:hover {
          background: linear-gradient(135deg, #002244, #004466);
          box-shadow:
            0 0 30px rgba(0, 255, 0, 0.5),
            inset 0 0 20px rgba(0, 0, 0, 0.5);
        }

        .hold-awaken-button.charging {
          animation: charging-pulse 0.5s ease-in-out infinite alternate;
        }

        .hold-button-core {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          overflow: hidden;
        }

        .hold-button-text {
          color: #00ff00;
          font-family: 'Courier New', monospace;
          font-size: clamp(0.875rem, 2vw, 1rem);
          font-weight: bold;
          text-shadow: 0 0 10px #00ff00;
          z-index: 2;
          position: relative;
        }

        .hold-progress-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #00ff00 0deg,
            #00ff00 calc(var(--hold-progress) * 3.6deg),
            transparent calc(var(--hold-progress) * 3.6deg),
            transparent 360deg
          );
          opacity: 0.8;
          transition: all 0.1s ease;
        }

        .hold-hint {
          font-size: clamp(0.75rem, 1.5vw, 0.875rem);
          opacity: 0.6;
          margin-top: 0.5rem;
        }

        /* Timeline Overlay */
        .timeline-overlay {
          position: absolute;
          bottom: 2rem;
          left: 2rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: clamp(0.875rem, 2vw, 1.125rem);
        }

        .year {
          display: block;
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          font-weight: bold;
          color: #00ff00;
          text-shadow: 0 0 10px #00ff00;
        }

        .year-desc {
          display: block;
          margin-top: 0.25rem;
          font-size: clamp(0.75rem, 2vw, 1rem);
        }

        /* CSS-Only Animations */
        @keyframes terminal-glow {
          0% {
            box-shadow: 0 0 10px #00ff00;
          }
          100% {
            box-shadow:
              0 0 20px #00ff00,
              0 0 40px #00ff0044;
          }
        }

        @keyframes text-scroll {
          0% {
            width: 0;
          }
          50% {
            width: 100%;
          }
          100% {
            width: 0;
          }
        }

        @keyframes pulse-prompt {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes bounce-arrow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes charging-pulse {
          0% {
            box-shadow:
              0 0 20px rgba(0, 255, 0, 0.5),
              inset 0 0 20px rgba(0, 0, 0, 0.5);
          }
          100% {
            box-shadow:
              0 0 40px rgba(0, 255, 0, 0.9),
              0 0 60px rgba(0, 255, 0, 0.5),
              inset 0 0 20px rgba(0, 0, 0, 0.5);
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .c64-terminal {
            padding: 1.5rem;
            font-size: clamp(0.75rem, 3vw, 1rem);
          }

          .timeline-overlay {
            bottom: 1rem;
            left: 1rem;
          }
        }

        @media (max-width: 480px) {
          .c64-terminal {
            padding: 1rem;
            margin-bottom: 2rem;
          }
        }

        /* High Performance - GPU Acceleration */
        .genesis-landing,
        .c64-terminal,
        .scroll-prompt,
        .timeline-overlay {
          will-change: auto;
          transform: translateZ(0);
        }

        /* Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
          .c64-terminal,
          .scroll-prompt,
          .scroll-arrow,
          .run-line,
          .hold-awaken-button.charging {
            animation: none;
          }

          .genesis-landing {
            transition: opacity 0.3s ease;
          }

          .hold-awaken-button {
            transition: none;
          }
        }

        /* Contact Button Animation */
        @keyframes contact-pulse {
          0%,
          100% {
            box-shadow: 0 4px 20px rgba(13, 148, 136, 0.4);
          }
          50% {
            box-shadow: 0 8px 40px rgba(13, 148, 136, 0.8);
          }
        }
      `}</style>
    </>
  );
}

export default GenesisCodeExperience;

/*
🚀 COMPLETE DIGITAL AWAKENING INTEGRATION ✅

✅ STAGENAVIGATION ACTIVE:
- Imported and integrated StageNavigation component
- Progressive disclosure system fully operational
- Feature gate controlled (showInterface)
- Neural Shift cognitive alignment active

✅ ADVANCED CONTACT PORTAL INTEGRATED:
- Imported and configured with proper props
- Connected to showContactPortal state
- Triggers only in transcendence stage
- Particle integration ready for WebGL response

✅ COMPLETE FEATURE INTEGRATION:
- Genesis stage: Pure immersion (no navigation)
- Silent stage: Minimal progress indicator  
- Awakening stage: Full timeline + tutorial
- Acceleration stage: Performance metrics
- Transcendence stage: MetaCurtis console + contact portal

✅ ARCHITECTURE COMPLIANCE:
- Single source of truth (narrativeStore)
- Feature gates prevent premature activation
- Analytics tracking for all interactions
- Performance optimization maintained
- Mobile responsive design preserved

✅ HOLD TO AWAKEN PRESERVED:
- Interactive charging button functional
- Mouse/touch/keyboard support
- Analytics tracking for awakening methods
- Smooth transition to navigation system

This integration provides the complete Curtis Whorton Digital Awakening
experience with Progressive Disclosure Neural Shift navigation! 🧠⚡
*/
