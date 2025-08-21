// src/components/theater/OpeningSequence.jsx
// SST v3.0 100% Compliant Opening Sequence - Zero Listener Debt

import { useEffect, useRef, useState } from 'react';
import BeatBus from '@modules/orchestration/core/BeatBus';
import { EVENTS } from '@theater/events.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  const handedOff = useRef(false);
  
  // Store all event unsubscribers
  const eventCleanup = useRef([]);

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

  // Clean up all event listeners
  const cleanupEvents = () => {
    eventCleanup.current.forEach(off => {
      try { off(); } catch (e) { console.warn('Event cleanup error:', e); }
    });
    eventCleanup.current = [];
  };

  // Hand-off handler
  const handleHandOff = () => {
    if (handedOff.current || phase === 'complete') return;
    handedOff.current = true;
    
    console.log('   OpeningSequence: Hand-off → fading overlay');
    
    addTimeout(() => {
      setVisible(false);
      
      addTimeout(() => {
        setPhase('complete');
        clearAllTimers();
        
        // Stop all audio
        if (humAudioRef.current) {
          humAudioRef.current.pause();
          humAudioRef.current = null;
        }
        if (keyClickAudioRef.current) {
          keyClickAudioRef.current.pause();
          keyClickAudioRef.current = null;
        }
      }, 700);
    }, 100);
  };

  // Auto hand-off when Points appear
  useEffect(() => {
    const checkForPoints = setInterval(() => {
      const scene = (window.__r3f || window).scene;
      if (!scene) return;
      
      let hasPoints = false;
      scene.traverse?.(o => {
        if (o?.isPoints || o?.type === 'Points') hasPoints = true;
      });
      
      if (hasPoints) {
        console.log('   OpeningSequence: Points detected, auto hand-off');
        clearInterval(checkForPoints);
        handleHandOff();
      }
    }, 500);
    
    const maxTimeout = setTimeout(() => {
      console.log('   OpeningSequence: Max timeout reached, forcing hand-off');
      handleHandOff();
    }, 15000);
    
    return () => {
      clearInterval(checkForPoints);
      clearTimeout(maxTimeout);
    };
  }, []);

  useEffect(() => {
    mounted.current = true;
    setVisible(true);
    console.log('🎬 OpeningSequence: Ready for Director signals');

    // Register all event handlers and store unsubscribers
    const offCursorShow = BeatBus.on(EVENTS.CURSOR_SHOW, () => {
      console.log('   OpeningSequence: CURSOR_SHOW received');
      setPhase('cursor');
      setCursorVisible(true);
    });
    eventCleanup.current.push(offCursorShow);

    const offCursorBlink = BeatBus.on(EVENTS.CURSOR_BLINK, async ({ count = 2, interval = 500 } = {}) => {
      console.log(`   OpeningSequence: CURSOR_BLINK received (${count} times)`);
      for (let i = 0; i < count && mounted.current; i++) {
        setCursorVisible(false);
        await sleep(interval);
        if (!mounted.current) break;
        setCursorVisible(true);
        await sleep(interval);
      }
      setCursorVisible(false);
    });
    eventCleanup.current.push(offCursorBlink);

    const offTerminalType = BeatBus.on(
      EVENTS.TERMINAL_TYPE,
      async ({ lines: toType = [], typeSpeed = 50, lineDelay = 300 } = {}) => {
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

            if (keyClickAudioRef.current) {
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
      }
    );
    eventCleanup.current.push(offTerminalType);

    const offScreenFill = BeatBus.on(
      EVENTS.SCREEN_FILL,
      ({ text = 'HELLO CURTIS ', scrollSpeed = 50 } = {}) => {
        console.log('   OpeningSequence: SCREEN_FILL received');
        setPhase('fill');

        const fillText = text.repeat(10);
        setScreenFillLines([fillText]);

        addInterval(() => {
          setScreenFillLines(prev => {
            if (prev.length >= 30) {
              return [...prev.slice(1), fillText];
            }
            return [...prev, fillText];
          });
        }, scrollSpeed);
      }
    );
    eventCleanup.current.push(offScreenFill);

    const offComputerHum = BeatBus.on(EVENTS.AUDIO_COMPUTER_HUM, ({ volume = 0.3 }) => {
      console.log(`   OpeningSequence: Computer hum at volume ${volume}`);
      if (!humAudioRef.current) {
        humAudioRef.current = new Audio('/audio/computer-hum.mp3');
        humAudioRef.current.loop = true;
        humAudioRef.current.volume = volume;
      }
      humAudioRef.current
        .play()
        .catch(e => console.log('Audio playback requires user interaction:', e));
    });
    eventCleanup.current.push(offComputerHum);

    const offKeyClick = BeatBus.on(EVENTS.AUDIO_KEY_CLICK, () => {
      if (!keyClickAudioRef.current) {
        keyClickAudioRef.current = new Audio('/audio/key-click.mp3');
        keyClickAudioRef.current.volume = 0.5;
      }
      keyClickAudioRef.current.currentTime = 0;
      keyClickAudioRef.current.play().catch(() => {});
    });
    eventCleanup.current.push(offKeyClick);

    const offParticlesStart = BeatBus.on(EVENTS.PARTICLES_START_EMERGING, handleHandOff);
    eventCleanup.current.push(offParticlesStart);

    const offParticlesEmerged = BeatBus.on(EVENTS.PARTICLES_EMERGED, handleHandOff);
    eventCleanup.current.push(offParticlesEmerged);

    const offEnableScroll = BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
      console.log('   OpeningSequence: ENABLE_SCROLL received, hand-off in 300ms');
      addTimeout(handleHandOff, 300);
    });
    eventCleanup.current.push(offEnableScroll);

    const offStartNarrative = BeatBus.on(EVENTS.START_NARRATIVE, () => {
      console.log('   OpeningSequence: START_NARRATIVE received, hand-off in 300ms');
      addTimeout(handleHandOff, 300);
    });
    eventCleanup.current.push(offStartNarrative);

    const offDirectorCancel = BeatBus.on(EVENTS.DIRECTOR_CANCEL, () => {
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
    });
    eventCleanup.current.push(offDirectorCancel);

    // Cleanup
    return () => {
      mounted.current = false;
      clearAllTimers();
      cleanupEvents();

      if (humAudioRef.current) {
        humAudioRef.current.pause();
      }
      if (keyClickAudioRef.current) {
        keyClickAudioRef.current.pause();
      }
    };
  }, []);

  // HMR cleanup
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      clearAllTimers();
      cleanupEvents();
      if (humAudioRef.current) {
        humAudioRef.current.pause();
      }
      if (keyClickAudioRef.current) {
        keyClickAudioRef.current.pause();
      }
    });
  }

  if (phase === 'complete') {
    return null;
  }

  return (
    <div className="opening-sequence"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#00FF00',
        fontFamily: "'Courier New', monospace",
        fontSize: '1.5rem',
        lineHeight: 1.4,
        zIndex: 9999,
        overflow: 'hidden',
        transition: 'opacity 0.7s',
        opacity: visible ? 1 : 0,
        pointerEvents: phase === 'complete' ? 'none' : 'auto',
      }}
    >
      {phase === 'black' && (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />
      )}

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
              textShadow: cursorVisible ? '0 0 10px #00FF00' : 'none',
              transition: 'opacity 100ms',
            }}
          >
            _
          </span>
        </div>
      )}

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
                fontFamily: "'Courier New', monospace",
                fontSize: '1.5rem',
                lineHeight: 1.6,
                textShadow: '0 0 5px #00FF00',
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
                        textShadow: '0 0 10px #00FF00',
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
              fontFamily: "'Courier New', monospace",
              fontSize: '1.2rem',
              lineHeight: 1.2,
              opacity: 0.8,
              textShadow: '0 0 3px #00FF00',
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

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}