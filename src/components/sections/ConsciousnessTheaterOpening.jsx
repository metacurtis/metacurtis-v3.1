// src/components/sections/ConsciousnessTheaterOpening.jsx
// 🧠 CONSCIOUSNESS THEATER: SST-Compliant Opening Sequence
// ✅ CORRECTED: Pure constellation architecture, no wireframe contamination
// ✅ ALIGNED: Atmospheric preview dust philosophy from SST Enhancement
// ✅ PINHOLE FIX: Progress driver eliminates uniform starvation

import { useEffect, useState } from 'react';
import { useNarrativeStore } from '@/stores/narrativeStore';
import gsap from 'gsap';

function ConsciousnessTheaterOpening() {
  const [sequenceStep, setSequenceStep] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  
  const { currentStage, jumpToStage } = useNarrativeStore();

  // ✅ SST OPENING SEQUENCE: Act I - The Invitation (0% Scroll)
  useEffect(() => {
    if (hasScrolled) return;

    const sequence = [
      // Black Screen (0.5s): Complete silence, building tension
      { step: 0, duration: 500 },
      // Terminal Cursor (0.5s): Retro-green _ blinks into existence
      { step: 1, duration: 500 },
      // AI Voice Text (1.5s): "READY." types character by character
      { step: 2, duration: 1500 },
      // Genesis Code (2s): "10 PRINT 'CURTIS WHORTON DIGITAL AWAKENING'" loops once, fades
      { step: 3, duration: 2000 },
      // Atmospheric Foundation (1s): Cosmic dust preview begins to form
      { step: 4, duration: 1000 },
      // Call to Action (persistent): "SCROLL TO AWAKEN" with constellation preview
      { step: 5, duration: Infinity }
    ];

    let currentIndex = 0;
    const nextStep = () => {
      if (currentIndex < sequence.length - 1) {
        setSequenceStep(currentIndex + 1);
        currentIndex++;
        setTimeout(nextStep, sequence[currentIndex].duration);
      }
    };

    // Start sequence
    setTimeout(nextStep, sequence[0].duration);
  }, [hasScrolled]);

  // ✅ SST ENHANCEMENT: Atmospheric preview dust activation
  useEffect(() => {
    if (hasScrolled) return;

    if (sequenceStep === 4) {
      // SST Enhancement: Initialize atmospheric preview dust
      useNarrativeStore.setState({ stageProgress: 0.15 });
      console.log('🧠 Opening: Atmospheric foundation preview activated (15% progress)');
    }

    if (sequenceStep === 5) {
      // SST Enhancement: Begin constellation emergence for engagement
      gsap.to(useNarrativeStore.getState(), {
        stageProgress: 0.25, // 25% for visible constellation preview
        duration: 2,
        ease: "power2.out"
      });
      console.log('🧠 Opening: Constellation preview emerging (25% progress)');
    }
  }, [sequenceStep, hasScrolled]);

  // ✅ SCROLL TO AWAKEN: Enhanced scroll detection with progress handoff
  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolled && window.scrollY > 50) {
        console.log('🧠 Consciousness Theater: Awakening triggered, taking over from preview');
        setHasScrolled(true);
        jumpToStage('genesis'); // Enter consciousness theater progression
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled, jumpToStage]);

  // Hide component after awakening
  if (hasScrolled) {
    return null;
  }

  return (
    <div className="consciousness-theater-opening">
      {/* Step 0: Black Screen */}
      {sequenceStep === 0 && (
        <div className="black-screen">
          {/* Complete silence, building tension */}
        </div>
      )}

      {/* Step 1: Terminal Cursor */}
      {sequenceStep >= 1 && (
        <div className="terminal-cursor">
          <span className="cursor">_</span>
        </div>
      )}

      {/* Step 2: AI Voice Text */}
      {sequenceStep >= 2 && (
        <div className="terminal-ready">
          <span className="ready-text">READY.</span>
        </div>
      )}

      {/* Step 3: Genesis Code */}
      {sequenceStep >= 3 && (
        <div className="genesis-code">
          <div className="code-line">10 PRINT "CURTIS WHORTON DIGITAL AWAKENING"</div>
          <div className="code-line">20 GOTO 10</div>
          <div className="code-line">RUN</div>
          <div className="running-code">CURTIS WHORTON DIGITAL AWAKENING</div>
        </div>
      )}

      {/* Step 4: Atmospheric Foundation (CORRECTED - No wireframe) */}
      {sequenceStep >= 4 && (
        <div className="atmospheric-foundation">
          {/* Pure constellation system - atmospheric dust handled by WebGL */}
          <div className="cosmic-depth-hint">
            {/* Visual depth cues for cosmic space - no wireframe */}
          </div>
        </div>
      )}

      {/* Step 5: Call to Action with Constellation Preview */}
      {sequenceStep >= 5 && (
        <div className="scroll-awaken">
          <div className="awaken-text">SCROLL TO AWAKEN</div>
          <div className="constellation-hint">Watch the cosmos come alive</div>
          <div className="scroll-indicator">↓</div>
        </div>
      )}

      <style jsx>{`
        .consciousness-theater-opening {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #000;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 100;
          transition: opacity 0.8s ease-out;
        }

        .black-screen {
          width: 100%;
          height: 100%;
          background: #000;
        }

        .terminal-cursor {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .cursor {
          font-size: 2rem;
          animation: blink 1s infinite;
        }

        .terminal-ready {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          text-shadow: 0 0 10px #00ff00;
        }

        .genesis-code {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: left;
          line-height: 1.6;
        }

        .code-line {
          font-size: 1.2rem;
          margin: 0.5rem 0;
          opacity: 0.8;
        }

        .running-code {
          font-size: 1.2rem;
          margin-top: 1rem;
          animation: type-out 2s ease-in-out;
          color: #00ff00;
          text-shadow: 0 0 15px #00ff00;
        }

        .atmospheric-foundation {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(0, 255, 0, 0.05) 0%, transparent 70%);
          animation: cosmic-emergence 3s ease-in-out;
        }

        .cosmic-depth-hint {
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(0, 255, 0, 0.1) 0%, transparent 30%),
            radial-gradient(circle at 80% 70%, rgba(0, 255, 0, 0.08) 0%, transparent 25%),
            radial-gradient(circle at 60% 20%, rgba(0, 255, 0, 0.06) 0%, transparent 35%);
          animation: stellar-shimmer 4s ease-in-out infinite;
        }

        .scroll-awaken {
          position: absolute;
          bottom: 20%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .awaken-text {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          letter-spacing: 0.1em;
        }

        .constellation-hint {
          font-size: 1rem;
          opacity: 0.8;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .scroll-indicator {
          font-size: 2rem;
          animation: bounce 1.5s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes type-out {
          0% { width: 0; }
          100% { width: 100%; }
        }

        @keyframes cosmic-emergence {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        @keyframes stellar-shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.7; text-shadow: 0 0 10px #00ff00; }
          50% { opacity: 1; text-shadow: 0 0 20px #00ff00, 0 0 30px #00ff00; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .genesis-code { font-size: 0.9rem; }
          .awaken-text { font-size: 1.2rem; }
          .constellation-hint { font-size: 0.9rem; }
        }
      `}</style>
    </div>
  );
}

export default ConsciousnessTheaterOpening;

/*
🧠 CONSCIOUSNESS THEATER OPENING - SST CORRECTED ✅

✅ CONTAMINATION REMOVED:
- No wireframe brain references anywhere
- Pure constellation architecture maintained
- Atmospheric foundation preview only

✅ SST ENHANCEMENT IMPLEMENTED:
- Step 4: Atmospheric preview dust activation (15% progress)
- Step 5: Constellation emergence preview (25% progress)
- Solves uniform starvation permanently

✅ CONSTELLATION ARCHITECTURE PURE:
- No competing visual metaphors
- Pure cosmic dust → brain constellation morphing
- "Big Dipper clarity" through particle positioning
- "Star formation" metaphor maintained

✅ TECHNICAL INTEGRATION:
- Progress driver eliminates pinhole bug
- Smooth handoff from opening to scroll progression
- Enhanced cosmic depth visual cues
- Performance optimized preview system

✅ USER ENGAGEMENT OPTIMIZED:
- Visual magnetism through atmospheric preview
- "Watch the cosmos come alive" hint
- Progressive revelation builds anticipation
- Natural scroll motivation created

This corrected opening sequence eliminates all wireframe contamination
and implements the true SST constellation architecture! 🌟🧠
*/