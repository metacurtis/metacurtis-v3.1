// src/components/sections/GenesisCodeExperience.jsx
import { useEffect, useState, useRef } from 'react';
import { narrativeTransition } from '@/config/narrativeParticleConfig';
import StageNavigation from '@/components/ui/narrative/StageNavigation';
import MemoryFragments from '@/components/ui/narrative/MemoryFragments';
import AdvancedContactPortal from '@/components/ui/AdvancedContactPortal';

function GenesisCodeExperience() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [currentStage, setCurrentStage] = useState('genesis');
  const [showInterface, setShowInterface] = useState(false);
  const [showContactPortal, setShowContactPortal] = useState(false);
  const scrollTimeoutRef = useRef(null);

  // Initialize narrative system
  useEffect(() => {
    console.log('🎮 Genesis Code Experience: Initializing narrative system');
    narrativeTransition.setStage('genesis');

    // Subscribe to narrative changes
    const unsubscribe = narrativeTransition.subscribe(() => {
      const stageInfo = narrativeTransition.getCurrentStageInfo();
      setCurrentStage(stageInfo.stage);
    });

    return () => unsubscribe();
  }, []);

  // CSS-only scroll detection for awakening
  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolled && window.scrollY > 50) {
        console.log('🎮 Genesis Code: Awakening sequence triggered');
        setHasScrolled(true);
        setShowInterface(true);
        narrativeTransition.setStage('awakening');

        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Show full interface after transition
        scrollTimeoutRef.current = setTimeout(() => {
          console.log('🎮 Genesis Code: Interface fully active');
        }, 2000);
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

        {/* Timeline Overlay */}
        <div className="timeline-overlay">
          <span className="year">1983</span>
          <span className="year-desc">The Genesis Code</span>
        </div>
      </section>

      {/* Stage Navigation (appears after awakening) */}
      {showInterface && (
        <StageNavigation
          currentStage={currentStage}
          onStageChange={stage => narrativeTransition.setStage(stage)}
        />
      )}

      {/* Memory Fragments (appears after awakening) */}
      {showInterface && <MemoryFragments currentStage={currentStage} />}

      {/* Advanced Contact Portal */}
      <AdvancedContactPortal
        isOpen={showContactPortal}
        onClose={() => setShowContactPortal(false)}
        triggerStage={currentStage}
      />

      {/* Contact Trigger Button (appears in transcendence stage) */}
      {showInterface && currentStage === 'transcendence' && (
        <button
          onClick={() => setShowContactPortal(true)}
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

      {/* CSS Styles */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx="true">{`
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
          .run-line {
            animation: none;
          }

          .genesis-landing {
            transition: opacity 0.3s ease;
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
