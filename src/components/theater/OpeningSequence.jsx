// src/components/theater/OpeningSequence.jsx
// SST v3.0 Compliant - Pure event-driven overlay (no self-boot)

import { useEffect, useRef, useState } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const GENESIS_STAGE_WORD = Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS';

export default function OpeningSequence() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState('black');
  const [cursorVisible, setCursorVisible] = useState(false);
  const [lines, setLines] = useState([]);
  const [currentTypingLine, setCurrentTypingLine] = useState(-1);
  const [screenFillLines, setScreenFillLines] = useState([]);

  // Audio refs
  const humAudioRef = useRef(null);
  const keyClickAudioRef = useRef(null);

  // Cleanup tracking
  const timers = useRef(new Set());
  const intervals = useRef(new Set());
  const typingToken = useRef(0);
  const mounted = useRef(true);
  const audioUnlocked = useRef(false);

  const addTimeout = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.add(id);
    return id;
  };

  const addInterval = (fn, ms) => {
    const id = setInterval(fn, ms);
    intervals.current.add(id);
    return id;
  };

  const clearAllTimers = () => {
    for (const id of timers.current) clearTimeout(id);
    for (const id of intervals.current) clearInterval(id);
    timers.current.clear();
    intervals.current.clear();
  };

  // Single audio unlock gate (in useEffect, properly cleaned up)
  useEffect(() => {
    const unlockAudio = () => {
      if (audioUnlocked.current) return;
      audioUnlocked.current = true;
      
      // Try to play hum if it exists
      if (humAudioRef.current) {
        humAudioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Main event subscription effect
  useEffect(() => {
    mounted.current = true;
    setVisible(true);
    console.log('🎬 OpeningSequence: Ready for Director signals');

    const eventHandlers = [
      // CURSOR SHOW
      BeatBus.on(EVENTS.CURSOR_SHOW, () => {
        console.log('   OpeningSequence: CURSOR_SHOW received');
        setPhase('cursor');
        setCursorVisible(true);
      }),

      // CURSOR BLINK
      BeatBus.on(EVENTS.CURSOR_BLINK, async ({ count = 2, interval = 500 } = {}) => {
        console.log(`   OpeningSequence: CURSOR_BLINK received (${count} times)`);
        
        for (let i = 0; i < count && mounted.current; i++) {
          setCursorVisible(false);
          await sleep(interval);
          if (!mounted.current) break;
          setCursorVisible(true);
          await sleep(interval);
        }
        
        setCursorVisible(false);
      }),

      // TERMINAL TYPE
      BeatBus.on(EVENTS.TERMINAL_TYPE, async ({ lines: toType = [], typeSpeed = 50, lineDelay = 300 } = {}) => {
        console.log('   OpeningSequence: TERMINAL_TYPE received');
        setPhase('typing');
        setCursorVisible(false);
        typingToken.current += 1;
        const token = typingToken.current;

        setLines([]);

        for (let lineIdx = 0; lineIdx < toType.length; lineIdx++) {
          if (!mounted.current || token !== typingToken.current) return;

          const line = toType[lineIdx];
          setCurrentTypingLine(lineIdx);
          let currentText = '';

          setLines(prev => [...prev, '']);

          for (let charIdx = 0; charIdx < line.length; charIdx++) {
            if (!mounted.current || token !== typingToken.current) return;

            currentText += line[charIdx];

            if (keyClickAudioRef.current && audioUnlocked.current) {
              keyClickAudioRef.current.currentTime = 0;
              keyClickAudioRef.current.play().catch(() => {});
            }

            setLines(prev => {
              const updated = [...prev];
              updated[lineIdx] = currentText;
              return updated;
            });

            await sleep(typeSpeed);
          }

          if (lineIdx < toType.length - 1) {
            await sleep(lineDelay);
          }
        }

        setCurrentTypingLine(-1);
      }),

      // SCREEN FILL
      BeatBus.on(EVENTS.SCREEN_FILL, ({ text = `${GENESIS_STAGE_WORD} `, scrollSpeed = 50 } = {}) => {
        console.log('   OpeningSequence: SCREEN_FILL received');
        setPhase('fill');

        const fillText = text.repeat(10);
        setScreenFillLines([]);

        const intervalId = addInterval(() => {
          setScreenFillLines(prev => {
            if (prev.length >= 30) {
              return [...prev.slice(1), fillText];
            }
            return [...prev, fillText];
          });
        }, scrollSpeed);

        // Store interval ID for cleanup
        intervals.current.add(intervalId);
      }),

      // AUDIO COMPUTER HUM
      BeatBus.on(EVENTS.AUDIO_COMPUTER_HUM, ({ volume = 0.3 }) => {
        console.log(`   OpeningSequence: Computer hum at volume ${volume}`);
        if (!humAudioRef.current) {
          humAudioRef.current = new Audio('/audio/computer-hum.mp3');
          humAudioRef.current.loop = true;
          humAudioRef.current.volume = volume;
        }
        
        if (audioUnlocked.current) {
          humAudioRef.current.play().catch(e => 
            console.log('Audio playback waiting for user interaction')
          );
        }
      }),

      // AUDIO KEY CLICK
      BeatBus.on(EVENTS.AUDIO_KEY_CLICK, () => {
        if (!keyClickAudioRef.current) {
          keyClickAudioRef.current = new Audio('/audio/key-click.mp3');
          keyClickAudioRef.current.volume = 0.5;
        }
        
        if (audioUnlocked.current) {
          keyClickAudioRef.current.currentTime = 0;
          keyClickAudioRef.current.play().catch(() => {});
        }
      }),

      // PARTICLES START EMERGING
      BeatBus.on(EVENTS.PARTICLES_START_EMERGING, () => {
        console.log('   OpeningSequence: Particles emerging, fading out');

        addTimeout(() => {
          setVisible(false);

          addTimeout(() => {
            setPhase('complete');
            clearAllTimers();

            if (humAudioRef.current) {
              humAudioRef.current.pause();
              humAudioRef.current = null;
            }
          }, 700);
        }, 100);
      }),

      // DIRECTOR CANCEL
      BeatBus.on(EVENTS.DIRECTOR_CANCEL, () => {
        console.log('   OpeningSequence: Director cancelled');
        setVisible(false);
        setPhase('complete');
        clearAllTimers();

        if (humAudioRef.current) {
          humAudioRef.current.pause();
          humAudioRef.current = null;
        }
        if (keyClickAudioRef.current) {
          keyClickAudioRef.current.pause();
          keyClickAudioRef.current = null;
        }
      }),
    ];

    // Cleanup
    return () => {
      mounted.current = false;
      clearAllTimers();
      eventHandlers.forEach(off => off && off());

      if (humAudioRef.current) {
        humAudioRef.current.pause();
      }
      if (keyClickAudioRef.current) {
        keyClickAudioRef.current.pause();
      }
    };
  }, []);

  // Don't render if complete
  if (phase === 'complete') {
    return null;
  }

  return (
    <div 
      className="opening-sequence"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#00FF00',
        fontFamily: "'Courier New', Courier, 'Lucida Console', 'DejaVu Sans Mono', monospace",
        fontSize: '1.5rem',
        lineHeight: 1.4,
        zIndex: 9999,
        overflow: 'hidden',
        transition: 'opacity 0.7s',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* BLACK SCREEN PHASE */}
      {phase === 'black' && (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />
      )}

      {/* CURSOR PHASE */}
      {phase === 'cursor' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '2rem',
          }}
        >
          <span
            style={{
              fontSize: '2rem',
              color: '#00FF00',
              opacity: cursorVisible ? 1 : 0,
              textShadow: 'none', // NO GLOW
              transition: 'opacity 100ms',
            }}
          >
            _
          </span>
        </div>
      )}

      {/* TERMINAL TYPING PHASE */}
      {phase === 'typing' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '2rem',
          }}
        >
          <div style={{ maxWidth: '800px', width: '100%' }}>
            <pre
              style={{
                color: '#00FF00',
                fontFamily: "'Courier New', Courier, 'Lucida Console', 'DejaVu Sans Mono', monospace",
                fontSize: '1.5rem',
                lineHeight: 1.6,
                textShadow: 'none', // NO GLOW
                whiteSpace: 'pre-wrap',
              }}
            >
              {lines.map((line, idx) => (
                <div key={idx}>
                  {line}
                  {idx === currentTypingLine && (
                    <span
                      style={{
                        animation: 'blink 1s step-end infinite',
                        textShadow: 'none', // NO GLOW
                      }}
                    >
                      _
                    </span>
                  )}
                </div>
              ))}
            </pre>
          </div>
        </div>
      )}

      {/* SCREEN FILL PHASE */}
      {phase === 'fill' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            padding: '1rem',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(0,255,0,0.1) 0%, rgba(0,0,0,0.9) 100%)',
          }}
        >
          <pre
            style={{
              color: '#00FF00',
              fontFamily: "'Courier New', Courier, 'Lucida Console', 'DejaVu Sans Mono', monospace",
              fontSize: '1.2rem',
              lineHeight: 1.2,
              opacity: 0.8,
              textShadow: 'none', // NO GLOW
              whiteSpace: 'pre',
            }}
          >
            {screenFillLines.map((line, idx) => (
              <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                {line}
              </div>
            ))}
          </pre>
        </div>
      )}

      {/* Inline styles for animations */}
      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
