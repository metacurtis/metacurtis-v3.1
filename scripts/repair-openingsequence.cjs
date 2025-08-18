#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/components/theater/OpeningSequence.jsx');
const dir  = path.dirname(file);

if (!fs.existsSync(dir)) {
  console.error('✖ Missing directory:', dir);
  process.exit(1);
}
if (!fs.existsSync(file + '.bak')) {
  try { if (fs.existsSync(file)) fs.copyFileSync(file, file + '.bak'); } catch {}
}

const clean = `// SST v3.0 Opening Sequence — stable, with audio unlock fallback
import { useEffect, useRef, useState } from 'react';
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS } from '@/theater/events.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default function OpeningSequence() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState('black'); // black | cursor | typing | fill | complete
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

  // ========== HAND-OFF HANDLER ==========
  const handleHandOff = () => {
    if (handedOff.current || phase === 'complete') return;
    handedOff.current = true;

    addTimeout(() => {
      setVisible(false);
      addTimeout(() => {
        setPhase('complete');
        clearAllTimers();

        // stop audio
        try { humAudioRef.current?.pause(); } catch {}
        try { keyClickAudioRef.current?.pause(); } catch {}
        humAudioRef.current = null;
        keyClickAudioRef.current = null;
      }, 700);
    }, 100);
  };

  // ========== BELT & SUSPENDERS: auto hand-off when Points appear ==========
  useEffect(() => {
    const checkForPoints = setInterval(() => {
      const scene = (window.__r3f || window).scene;
      if (!scene) return;
      let hasPoints = false;
      scene.traverse?.(o => { if (o?.isPoints || o?.type === 'Points') hasPoints = true; });
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
    console.log('🎬 OpeningSequence: Ready for Director signals');

    const unsubs = [
      // CURSOR SHOW
      BeatBus.on(EVENTS.CURSOR_SHOW, () => {
        setPhase('cursor');
        setCursorVisible(true);
      }),

      // CURSOR BLINK (exact N blinks)
      BeatBus.on(EVENTS.CURSOR_BLINK, async ({ count = 2, interval = 500 } = {}) => {
        for (let i = 0; i < count && mounted.current; i++) {
          setCursorVisible(false);
          await sleep(interval);
          if (!mounted.current) break;
          setCursorVisible(true);
          await sleep(interval);
        }
        setCursorVisible(false);
      }),

      // TERMINAL TYPE (exact text)
      BeatBus.on(
        EVENTS.TERMINAL_TYPE,
        async ({ lines: toType = [], typeSpeed = 50, lineDelay = 300 } = {}) => {
          setPhase('typing');
          setCursorVisible(false);
          typingToken.current += 1;
          const token = typingToken.current;

          // Clear previous content
          setLines([]);

          for (let lineIdx = 0; lineIdx < toType.length; lineIdx++) {
            if (!mounted.current || token !== typingToken.current) return;

            const line = toType[lineIdx];
            setCurrentTypingLine(lineIdx);
            let currentText = '';

            // add empty line first
            setLines(prev => [...prev, '']);

            // type character by character
            for (let charIdx = 0; charIdx < line.length; charIdx++) {
              if (!mounted.current || token !== typingToken.current) return;

              currentText += line[charIdx];

              // key click sound
              if (keyClickAudioRef.current) {
                try {
                  keyClickAudioRef.current.currentTime = 0;
                  // fire-and-forget, ignore NotAllowedError
                  keyClickAudioRef.current.play().catch(() => {});
                } catch {}
              }

              // update the current line
              setLines(prev => {
                const updated = [...prev];
                updated[lineIdx] = currentText;
                return updated;
              });

              await sleep(typeSpeed);
            }

            // pause between lines
            if (lineIdx < toType.length - 1) {
              await sleep(lineDelay);
            }
          }

          setCurrentTypingLine(-1);
        }
      ),

      // SCREEN FILL
      BeatBus.on(
        EVENTS.SCREEN_FILL,
        ({ text = 'HELLO CURTIS ', scrollSpeed = 50 } = {}) => {
          setPhase('fill');
          const fillText = text.repeat(10);
          setScreenFillLines([fillText]);
          addInterval(() => {
            setScreenFillLines(prev => {
              if (prev.length >= 30) return [...prev.slice(1), fillText];
              return [...prev, fillText];
            });
          }, scrollSpeed);
        }
      ),

      // AUDIO HUM (with unlock fallback)
      BeatBus.on(EVENTS.AUDIO_COMPUTER_HUM, ({ volume = 0.3 } = {}) => {
        if (!humAudioRef.current) {
          humAudioRef.current = new Audio('/audio/computer-hum.mp3');
          humAudioRef.current.loop = true;
          humAudioRef.current.volume = volume;
        }
        humAudioRef.current.play().catch(() => {
          const unlock = () => {
            humAudioRef.current?.play().catch(() => {});
            window.removeEventListener('pointerdown', unlock, { once: true });
            window.removeEventListener('keydown', unlock, { once: true });
          };
          window.addEventListener('pointerdown', unlock, { once: true });
          window.addEventListener('keydown', unlock, { once: true });
        });
      }),

      // AUDIO KEY CLICK (preload on first)
      BeatBus.on(EVENTS.AUDIO_KEY_CLICK, () => {
        if (!keyClickAudioRef.current) {
          keyClickAudioRef.current = new Audio('/audio/key-click.mp3');
          keyClickAudioRef.current.volume = 0.5;
        }
        try {
          keyClickAudioRef.current.currentTime = 0;
          keyClickAudioRef.current.play().catch(() => {});
        } catch {}
      }),

      // PARTICLES → hand-off
      BeatBus.on(EVENTS.PARTICLES_START_EMERGING, handleHandOff),
      BeatBus.on(EVENTS.PARTICLES_EMERGED, handleHandOff),

      // safety: hand off when narrative/scroll starts
      BeatBus.on(EVENTS.ENABLE_SCROLL, () => addTimeout(handleHandOff, 300)),
      BeatBus.on(EVENTS.START_NARRATIVE, () => addTimeout(handleHandOff, 300)),

      // cancel
      BeatBus.on(EVENTS.DIRECTOR_CANCEL, () => {
        setVisible(false);
        setPhase('complete');
        clearAllTimers();
        try { humAudioRef.current?.pause(); } catch {}
        try { keyClickAudioRef.current?.pause(); } catch {}
      }),
    ];

    return () => {
      mounted.current = false;
      clearAllTimers();
      unsubs.forEach(off => { try { off && off(); } catch {} });
      try { humAudioRef.current?.pause(); } catch {}
      try { keyClickAudioRef.current?.pause(); } catch {}
    };
  }, []);

  if (phase === 'complete') return null;

  return (
    <div
      className="opening-sequence"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        backgroundColor: '#000',
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
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', padding:'2rem' }}>
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
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', padding:'2rem' }}>
          <div style={{ maxWidth:'800px', width:'100%' }}>
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
                    <span style={{ animation:'blink 1s step-end infinite', textShadow:'0 0 10px #00FF00' }}>_</span>
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
            position:'absolute', top:0, left:0, width:'100%', height:'100%',
            padding:'1rem', overflow:'hidden',
            background:'linear-gradient(180deg, rgba(0,255,0,0.1) 0%, rgba(0,0,0,0.9) 100%)',
          }}
        >
          <pre
            style={{
              color:'#00FF00',
              fontFamily:"'Courier New', monospace",
              fontSize:'1.2rem',
              lineHeight:1.2,
              opacity:0.8,
              textShadow:'0 0 3px #00FF00',
              whiteSpace:'pre',
            }}
          >
            {screenFillLines.map((line, idx) => (
              <div key={idx} style={{ whiteSpace:'nowrap' }}>{line}</div>
            ))}
          </pre>
        </div>
      )}

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
`;

try {
  fs.writeFileSync(file, clean, 'utf8');
  console.log('✍️  Rewrote', path.relative(process.cwd(), file));
  console.log('   • Backup:', path.relative(process.cwd(), file + '.bak'));
  console.log('✅ OpeningSequence.jsx repaired.');
} catch (e) {
  console.error('✖ Failed to write OpeningSequence.jsx:', e.message);
  process.exit(1);
}
