// src/components/theater/OpeningSequence.jsx
// SST v3.x Opening Sequence — event-driven + self-boot fallback (no nested hooks)

import { useEffect, useRef, useState } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

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

  // ────────────────────────────────────────────────────────────────────────────
  // Primary effect: user-gesture audio gate + Director-driven event handlers
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    mounted.current = true;
    setVisible(true);
    setPhase('black');
    console.log('🎬 OpeningSequence: Ready for Director signals');

    // 1) One-time user gesture gate (autoplay safety)
    const __unlockAudio = () => {
      try { humAudioRef.current?.play?.().catch(()=>{}); } catch {}
      window.removeEventListener('pointerdown', __unlockAudio);
      window.removeEventListener('touchstart', __unlockAudio);
      window.removeEventListener('keydown', __unlockAudio);
    };
    window.addEventListener('pointerdown', __unlockAudio, { once: true });
    window.addEventListener('touchstart', __unlockAudio, { once: true });
    window.addEventListener('keydown', __unlockAudio, { once: true });

    // 2) Director-driven sequence handlers
    const offs = [
      // Cursor show
      BeatBus.on(EVENTS.CURSOR_SHOW, () => {
        setPhase('cursor');
        setCursorVisible(true);
      }),

      // Cursor blink (exact N)
      BeatBus.on(EVENTS.CURSOR_BLINK, async ({ count = 2, interval = 500 } = {}) => {
        for (let i = 0; i < count && mounted.current; i++) {
          setCursorVisible(false); await sleep(interval);
          if (!mounted.current) break;
          setCursorVisible(true);  await sleep(interval);
        }
        setCursorVisible(false);
      }),

      // Terminal typing (character-by-character)
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
            setLines(prev => {
              const updated = [...prev];
              updated[lineIdx] = (updated[lineIdx] || '') + line[charIdx];
              return updated;
            });
            await sleep(typeSpeed);
          }
          if (lineIdx < toType.length - 1) await sleep(lineDelay);
        }
        setCurrentTypingLine(-1);
      }),

      // Screen fill (progressive; no flash)
      BeatBus.on(EVENTS.SCREEN_FILL, ({ text = 'HELLO CURTIS ', scrollSpeed = 50 } = {}) => {
        setPhase('fill');
        const fillText = text.repeat(10);
        try { window.__opening_fill_start_lines = 0; } catch {}
        setScreenFillLines([]);
        addInterval(() => {
          setScreenFillLines(prev => prev.length >= 30 ? [...prev.slice(1), fillText] : [...prev, fillText]);
        }, scrollSpeed);
      }),

      // Audio bed
      BeatBus.on(EVENTS.AUDIO_COMPUTER_HUM, ({ volume = 0.3 } = {}) => {
        if (!humAudioRef.current) {
          humAudioRef.current = new Audio('/audio/computer-hum.mp3');
          humAudioRef.current.loop = true;
        }
        humAudioRef.current.volume = volume;
        humAudioRef.current.play().catch(()=>{});
      }),

      // Key click (optional)
      BeatBus.on(EVENTS.AUDIO_KEY_CLICK, () => {
        if (!keyClickAudioRef.current) keyClickAudioRef.current = new Audio('/audio/key-click.mp3');
        keyClickAudioRef.current.volume = 0.5;
        keyClickAudioRef.current.currentTime = 0;
        keyClickAudioRef.current.play().catch(()=>{});
      }),

      // Emergence → fade out
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

      // Director cancel (escape hatch)
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

  // ────────────────────────────────────────────────────────────────────────────
  // Self-boot fallback: show the intro if Director never emits early beats
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let sawDirector = false, cancelled = false;

    const taps = [
      BeatBus.on(EVENTS.CURSOR_SHOW,   () => { sawDirector = true; }),
      BeatBus.on(EVENTS.TERMINAL_TYPE, () => { sawDirector = true; }),
      BeatBus.on(EVENTS.SCREEN_FILL,   () => { sawDirector = true; }),
    ];

    const boot = async () => {
      setPhase('black'); await sleep(200);
      setPhase('cursor'); setCursorVisible(true);
      for (let i = 0; i < 2 && !cancelled; i++) {
        setCursorVisible(false); await sleep(500);
        setCursorVisible(true);  await sleep(500);
      }
      setCursorVisible(false);

      const defaults = ['READY.','10 PRINT "HELLO CURTIS"','20 GOTO 10','RUN'];
      setPhase('typing'); setLines([]); const token = ++typingToken.current;

      for (let li = 0; li < defaults.length && !cancelled; li++) {
        setCurrentTypingLine(li);
        setLines(prev => [...prev, '']);
        const line = defaults[li];
        for (let ci = 0; ci < line.length && !cancelled; ci++) {
          if (token !== typingToken.current) break;
          setLines(prev => { const n=[...prev]; n[li] = (n[li] || '') + line[ci]; return n; });
          await sleep(50);
        }
        if (li < defaults.length - 1) await sleep(300);
      }
      setCurrentTypingLine(-1);

      try { window.__opening_fill_start_lines = 0; } catch {}
      setPhase('fill'); setScreenFillLines([]);
      const fillText = 'HELLO CURTIS '.repeat(10);
      const iv = setInterval(() => {
        if (cancelled) return clearInterval(iv);
        setScreenFillLines(prev => prev.length >= 30 ? [...prev.slice(1), fillText] : [...prev, fillText]);
      }, 50);
      setTimeout(() => clearInterval(iv), 4000);
    };

    const t = setTimeout(() => { if (!sawDirector) boot(); }, 700);

    return () => {
      cancelled = true;
      clearTimeout(t);
      taps.forEach(off => off && off());
    };
  }, []);

  // Render guard
  if (phase === 'complete') return null;

  return (
    <div
      className="opening-sequence"
      style={{
        position: 'fixed', inset: 0,
        background: '#000',
        color: '#00FF00',
        fontFamily: "'Courier New', Courier, 'Lucida Console', 'DejaVu Sans Mono', monospace", Courier, 'Lucida Console', 'DejaVu Sans Mono', monospace",
        fontSize: '1.5rem', lineHeight: 1.4,
        zIndex: 9999, overflow: 'hidden',
        transition: 'opacity 0.7s',
        opacity: visible ? 1 : 0
      }}
    >
      {/* BLACK */}
      {phase === 'black' && <div style={{ width: '100%', height: '100%' }} />}

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
            <pre style={{ color:'#0f0', whiteSpace:'pre-wrap' }}>
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

      {/* FILL (progressive — no initial flash) */}
      {phase === 'fill' && (
        <div style={{ position:'absolute', inset:0, padding:'1rem', overflow:'hidden', background:'#000' }}>
          <pre style={{ color:'#0f0', whiteSpace:'pre' }}>
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
