// src/components/theater/OpeningSequence.jsx
// SST v3.x Opening Sequence — event-driven (Director owns clock), progressive fill, strict mono

import { useEffect, useRef, useState } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const STRICT_MONO_STACK = "'Courier New', Courier, 'Lucida Console', 'DejaVu Sans Mono', monospace";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default function OpeningSequence() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState('black'); // 'black' | 'cursor' | 'typing' | 'fill' | 'complete'
  const [cursorVisible, setCursorVisible] = useState(false);
  const [lines, setLines] = useState([]);
  const [currentTypingLine, setCurrentTypingLine] = useState(-1);
  const [screenFillLines, setScreenFillLines] = useState([]);

  // Audio refs
  const humAudioRef = useRef(null);
  const keyClickAudioRef = useRef(null);

  // Housekeeping
  const timers = useRef(new Set());
  const intervals = useRef(new Set());
  const typingToken = useRef(0);
  const mounted = useRef(false);

  const addTimeout = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.add(id); return id; };
  const addInterval = (fn, ms) => { const id = setInterval(fn, ms); intervals.current.add(id); return id; };
  const clearAllTimers = () => {
    for (const id of timers.current) clearTimeout(id);
    for (const id of intervals.current) clearInterval(id);
    timers.current.clear(); intervals.current.clear();
  };

  // Director-driven event handlers
  useEffect(() => {
    mounted.current = true;
    setVisible(true);
    setPhase('black');
    // one-time gesture gate (autoplay safety)
    const __unlockAudio = () => {
      try { humAudioRef.current?.play?.().catch(()=>{}); } catch {}
      window.removeEventListener('pointerdown', __unlockAudio);
      window.removeEventListener('touchstart', __unlockAudio);
      window.removeEventListener('keydown', __unlockAudio);
    };
    window.addEventListener('pointerdown', __unlockAudio, { once: true });
    window.addEventListener('touchstart', __unlockAudio, { once: true });
    window.addEventListener('keydown', __unlockAudio, { once: true });

    const offs = [
      BeatBus.on(EVENTS.CURSOR_SHOW, () => { setPhase('cursor'); setCursorVisible(true); }),
      BeatBus.on(EVENTS.CURSOR_BLINK, async ({ count = 2, interval = 500 } = {}) => {
        for (let i = 0; i < count && mounted.current; i++) {
          setCursorVisible(false); await sleep(interval);
          if (!mounted.current) break;
          setCursorVisible(true);  await sleep(interval);
        }
        setCursorVisible(false);
      }),
      BeatBus.on(EVENTS.TERMINAL_TYPE, async ({ lines: toType = [], typeSpeed = 50, lineDelay = 300 } = {}) => {
        setPhase('typing'); setCursorVisible(false);
        typingToken.current += 1; const token = typingToken.current;
        setLines([]);
        for (let lineIdx = 0; lineIdx < toType.length; lineIdx++) {
          if (!mounted.current || token !== typingToken.current) return;
          const line = toType[lineIdx];
          setCurrentTypingLine(lineIdx);
          setLines(prev => [...prev, '']);
          for (let charIdx = 0; charIdx < line.length; charIdx++) {
            if (!mounted.current || token !== typingToken.current) return;
            try {
              if (keyClickAudioRef.current) {
                keyClickAudioRef.current.currentTime = 0;
                keyClickAudioRef.current.play().catch(()=>{});
              }
            } catch {}
            setLines(prev => { const updated = [...prev];
              updated[lineIdx] = (updated[lineIdx] || '') + line[charIdx]; return updated; });
            await sleep(typeSpeed);
          }
          if (lineIdx < toType.length - 1) await sleep(lineDelay);
        }
        setCurrentTypingLine(-1);
      }),
      // Progressive fill (no flash)
      BeatBus.on(EVENTS.SCREEN_FILL, ({ text = 'HELLO CURTIS ', scrollSpeed = 50 } = {}) => {
        setPhase('fill');
        const fillText = text.repeat(10);
        try { window.__opening_fill_start_lines = 0; } catch {}
        setScreenFillLines([]); // seed []
        addInterval(() => {
          setScreenFillLines(prev => prev.length >= 30 ? [...prev.slice(1), fillText] : [...prev, fillText]);
        }, scrollSpeed);
      }),
      BeatBus.on(EVENTS.AUDIO_COMPUTER_HUM, ({ volume = 0.3 } = {}) => {
        if (!humAudioRef.current) {
          humAudioRef.current = new Audio('/audio/computer-hum.mp3');
          humAudioRef.current.loop = true;
        }
        humAudioRef.current.volume = volume;
        humAudioRef.current.play().catch(()=>{});
      }),
      BeatBus.on(EVENTS.AUDIO_KEY_CLICK, () => {
        if (!keyClickAudioRef.current) keyClickAudioRef.current = new Audio('/audio/key-click.mp3');
        keyClickAudioRef.current.volume = 0.5;
        keyClickAudioRef.current.currentTime = 0;
        keyClickAudioRef.current.play().catch(()=>{});
      }),
      // fade out on emergence
      BeatBus.on(EVENTS.PARTICLES_START_EMERGING, () => {
        addTimeout(() => {
          setVisible(false);
          addTimeout(() => {
            setPhase('complete');
            clearAllTimers();
            try { humAudioRef.current?.pause?.(); humAudioRef.current = null; } catch {}
            try { keyClickAudioRef.current?.pause?.(); keyClickAudioRef.current = null; } catch {}
          }, 700);
        }, 100);
      }),
      BeatBus.on(EVENTS.DIRECTOR_CANCEL, () => {
        setVisible(false);
        setPhase('complete');
        clearAllTimers();
        try { humAudioRef.current?.pause?.(); humAudioRef.current = null; } catch {}
        try { keyClickAudioRef.current?.pause?.(); keyClickAudioRef.current = null; } catch {}
      }),
    ];

    return () => {
      mounted.current = false;
      clearAllTimers();
      offs.forEach(off => off && off());
      try { humAudioRef.current?.pause?.(); } catch {}
      try { keyClickAudioRef.current?.pause?.(); } catch {}
    };
  }, []);

  if (phase === 'complete') return null;

  return (
    <div
      className="opening-sequence"
      style={{
        position: 'fixed', inset: 0,
        background: '#000',
        color: '#00FF00',
        fontFamily: STRICT_MONO_STACK,
        fontSize: '1.5rem', lineHeight: 1.4,
        zIndex: 9999, overflow: 'hidden',
        transition: 'opacity 0.7s',
        opacity: visible ? 1 : 0
      }}
    >
      {/* CURSOR */}
      {phase === 'cursor' && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
          <span style={{
            fontSize:'2rem', color:'#0f0',
            opacity: cursorVisible ? 1 : 0,
            transition:'opacity 100ms'
          }}>_</span>
        </div>
      )}

      {/* TYPING */}
      {phase === 'typing' && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', padding:'2rem' }}>
          <div style={{ maxWidth: 800, width: '100%' }}>
            <pre style={{ color:'#0f0', whiteSpace:'pre-wrap', fontFamily: STRICT_MONO_STACK }}>
              {lines.map((line, idx) => (
                <div key={idx}>
                  {line}
                  {idx === currentTypingLine && <span style={{ animation:'blink 1s step-end infinite' }}>_</span>}
                </div>
              ))}
            </pre>
          </div>
        </div>
      )}

      {/* FILL */}
      {phase === 'fill' && (
        <div style={{ position:'absolute', inset:0, padding:'1rem', overflow:'hidden', background:'#000' }}>
          <pre style={{ color:'#0f0', whiteSpace:'pre', fontFamily: STRICT_MONO_STACK }}>
            {screenFillLines.map((line, idx) => (
              <div key={idx} style={{ whiteSpace:'nowrap' }}>{line}</div>
            ))}
          </pre>
        </div>
      )}

      {/* Scoped mono CSS (belt-and-suspenders) */}
      <style>{`
        .opening-sequence, .opening-sequence * {
          font-family: ${STRICT_MONO_STACK} !important;
          font-variant-ligatures: none;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
