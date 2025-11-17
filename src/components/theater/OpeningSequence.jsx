// src/components/theater/OpeningSequence.jsx
// SST v3.0 Compliant - Pure event-driven overlay (no self-boot)

import { useEffect, useRef, useState } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const GENESIS_STAGE_WORD = Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS';
const SCREEN_FILL_MS = 2000;
const SCREEN_FILL_MIN_VISUAL_MS = 1400;
const MONO_STACK =
  "SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace";

export default function OpeningSequence() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState('black');
  const [cursorVisible, setCursorVisible] = useState(false);
  const [lines, setLines] = useState([]);
  const [currentTypingLine, setCurrentTypingLine] = useState(-1);
  const [screenFillLines, setScreenFillLines] = useState([]);

  // Audio refs
  const humAudioRef = useRef(null);

  // Cleanup tracking
  const timers = useRef(new Set());
  const intervals = useRef(new Set());
  const typingToken = useRef(0);
  const mounted = useRef(true);
  const audioUnlocked = useRef(false);
  const fadedRef = useRef(false);
  const fillStartRef = useRef(0);
  const fillTextRef = useRef('');
  const fillProgressRef = useRef(0);
  const fillIntervalRef = useRef(null);

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

  const triggerFadeOut = (reason = 'unknown', delayMs = 100) => {
    if (fadedRef.current) return;
    fadedRef.current = true;
    console.log(`   OpeningSequence: fade out (${reason})`);
    const startId = addTimeout(() => {
      setVisible(false);
      addTimeout(() => {
        setPhase('complete');
        clearAllTimers();
        if (humAudioRef.current) {
          humAudioRef.current.pause();
          humAudioRef.current = null;
        }
      }, 700);
    }, delayMs);
    return startId;
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
        fillStartRef.current =
          (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

        const baseWord = text || `${GENESIS_STAGE_WORD} `;

        // Rough viewport-based estimates for line sizing
        let approxCharsPerLine = 80;
        let approxLinesToFill = 20;
        if (typeof window !== 'undefined') {
          const vw = window.innerWidth || 1200;
          const vh = window.innerHeight || 800;
          approxCharsPerLine = Math.max(40, Math.floor(vw / 10));   // ~10px per char
          approxLinesToFill = Math.max(10, Math.floor(vh / 24));    // ~24px per line
        }

        // Build one full-width line template
        const repeatsForLine = Math.ceil(approxCharsPerLine / baseWord.length) + 1;
        const longLine = baseWord.repeat(repeatsForLine);
        const lineTemplate = longLine.slice(0, approxCharsPerLine);

        // Reset fill state
        setScreenFillLines([]);
        fillTextRef.current = lineTemplate;
        fillProgressRef.current = 0;

        // Clean up any prior fill interval
        if (fillIntervalRef.current) {
          clearInterval(fillIntervalRef.current);
          intervals.current.delete(fillIntervalRef.current);
          fillIntervalRef.current = null;
        }

        // Drop full lines rapidly to flood the viewport
        const targetLines = approxLinesToFill + 4;
        let producedLines = 0;
        const intervalMs = Math.max(15, Math.min(scrollSpeed, 80));
        const intervalId = addInterval(() => {
          producedLines += 1;
          setScreenFillLines(prev => {
            const next = [...prev, lineTemplate];
            if (next.length > targetLines + 10) {
              return next.slice(-targetLines);
            }
            return next;
          });
          if (producedLines >= targetLines) {
            clearInterval(intervalId);
            intervals.current.delete(intervalId);
            fillIntervalRef.current = null;
          }
        }, intervalMs);

        fillIntervalRef.current = intervalId;
      }),

      // AUDIO COMPUTER HUM
      BeatBus.on(EVENTS.AUDIO_COMPUTER_HUM, ({ volume = 0.3 }) => {
        console.log(`   OpeningSequence: Computer hum at volume ${volume}`);
        if (!humAudioRef.current) {
          const audio = new Audio('/audio/computer-hum.mp3');
          audio.preload = 'none';
          audio.loop = true;
          audio.volume = volume;
          humAudioRef.current = audio;
        }
        
        if (audioUnlocked.current) {
          humAudioRef.current.play().catch(e => 
            console.log('Audio playback waiting for user interaction')
          );
        }
      }),

      // PARTICLES START EMERGING
      BeatBus.on(EVENTS.PARTICLES_START_EMERGING, () => {
        triggerFadeOut('particles-start-emerging', 100);
      }),

      BeatBus.on(EVENTS.PARTICLES_EMERGED, () => {
        const now =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        const start = fillStartRef.current || now;
        const elapsed = now - start;
        const wait = Math.max(0, SCREEN_FILL_MIN_VISUAL_MS - elapsed);
        triggerFadeOut('particles-emerged', wait);
      }),

      BeatBus.on(EVENTS.OPENING_COMPLETE, () => {
        const now =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        const start = fillStartRef.current || now;
        const elapsed = now - start;
        const wait = Math.max(0, SCREEN_FILL_MIN_VISUAL_MS - elapsed);
        triggerFadeOut('opening-complete', wait);
      }),

      // DIRECTOR CANCEL
      BeatBus.on(EVENTS.DIRECTOR_CANCEL, () => {
        console.log('   OpeningSequence: Director cancelled');
        setVisible(false);
        setPhase('complete');
        clearAllTimers();
        fadedRef.current = true;

        if (humAudioRef.current) {
          humAudioRef.current.pause();
          humAudioRef.current = null;
        }
      }),
    ];

    // Cleanup
    return () => {
      mounted.current = false;
      fadedRef.current = true;
      clearAllTimers();
      eventHandlers.forEach(off => off && off());
      fillStartRef.current = 0;
      fillTextRef.current = '';
      fillProgressRef.current = 0;
      if (fillIntervalRef.current) {
        clearInterval(fillIntervalRef.current);
        intervals.current.delete(fillIntervalRef.current);
        fillIntervalRef.current = null;
      }

      if (humAudioRef.current) {
        humAudioRef.current.pause();
        humAudioRef.current = null;
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
        fontFamily: MONO_STACK,
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
                fontFamily: MONO_STACK,
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
            background: 'rgba(0, 0, 0, 0.9)',
            opacity: screenFillLines.length ? 1 : 0,
            transition: 'opacity 200ms ease-out',
          }}
        >
          <pre
            style={{
              color: '#00FF00',
              fontFamily: MONO_STACK,
              fontSize: '1.2rem',
              lineHeight: 1.2,
              opacity: 0.8,
              textShadow: 'none', // NO GLOW
              whiteSpace: 'pre',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {screenFillLines.join('\n')}
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
