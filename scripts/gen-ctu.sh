#!/usr/bin/env bash
# scripts/gen-ctu.sh
# ------------------------------------------------------------------
# Re‑generate src/components/consciousness/ConsciousnessTheaterUnified.jsx
# in a *safe* way – zero copy‑paste in the terminal, always formatted,
# and previous versions are backed up automatically.
# ------------------------------------------------------------------
set -euo pipefail

TARGET_DIR="src/components/consciousness"
TARGET_FILE="$TARGET_DIR/ConsciousnessTheaterUnified.jsx"
BACKUP_DIR=".backup/$(date +%Y%m%d_%H%M%S)"

echo "▶️  Generating ConsciousnessTheaterUnified.jsx …"

# 1. make sure directory exists
mkdir -p "$TARGET_DIR"

# 2. backup old file if present
if [[ -f "$TARGET_FILE" ]]; then
  echo "🗄️  Found existing file – backing it up to $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
  mv "$TARGET_FILE" "$BACKUP_DIR/"
fi

# 3. write the fresh file
cat >"$TARGET_FILE"<<'EOF'
// src/components/consciousness/ConsciousnessTheaterUnified.jsx
// SST v3 unified theater – contains opening sequence, narrative overlay,
// WebGL canvas and memory fragment logic (ESLint‑clean).

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
} from 'react';
import { Canonical } from '@/config/canonical/canonicalAuthority';
import { MEMORY_FRAGMENTS } from '@/config/sst3/memory-fragments.js';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { useMemoryFragments } from '@/hooks/useMemoryFragments.js';
import WebGLCanvas from '@/components/webgl/WebGLCanvas';
import DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor';
import styles from './ConsciousnessTheater.module.css';

/* ------------------------------------------------------------------ *
 * CONSTANTS                                                          *
 * ------------------------------------------------------------------ */
const C = {
  OPENING_BLACK_MS: 2_000,
  CURSOR_BLINK_MS: 500,
  TYPE_SPEED_MS: 50,
  SCREEN_FILL_DELAY_MS: 50,
  NARRATIVE_TICK_MS: 100,
  MAX_FILL_LINES: 30,
  HUD_OPACITY: 0.7,
  SCROLL_CONTAINER_HEIGHT: '700vh',
  MORPH_STEP: 0.1,
  SCROLL_MORPH_MULTIPLIER: 2,
  SCROLL_DEBOUNCE_MS: 16,
};

const TERMINAL_SCRIPT = [
  { text: 'READY.',      pause: 500 },
  { text: '10 PRINT "HELLO CURTIS"', pause: 1_000 },
  { text: '20 GOTO 10',  pause: 1_000 },
  { text: 'RUN',         pause: 800  },
];

/* ------------------------------------------------------------------ *
 * UTILS                                                              *
 * ------------------------------------------------------------------ */
const debounce = (fn, ms) => {
  let id;
  return (...a) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...a), ms);
  };
};

/* ------------------------------------------------------------------ *
 * OPENING‑SEQUENCE HOOK                                              *
 * ------------------------------------------------------------------ */
function useOpeningSequence(onDone) {
  const [phase, setPhase]       = useState('black');
  const [cursor, setCursor]     = useState(false);
  const [lines, setLines]       = useState([]);
  const [fill, setFill]         = useState(false);

  useEffect(() => {
    const actions = [];
    let t = C.OPENING_BLACK_MS;

    // Blinking cursor
    actions.push({ t, fn: () => setPhase('cursor') });
    [1, 2].forEach(i => {
      actions.push({ t: t + C.CURSOR_BLINK_MS * i, fn: () => setCursor(v => !v) });
    });
    t += C.CURSOR_BLINK_MS * 3;

    // Terminal typing
    actions.push({ t, fn: () => setPhase('terminal') });
    TERMINAL_SCRIPT.forEach(item => {
      t += item.pause;
      actions.push({
        t,
        fn: () => setLines(l => [...l, item.text]),
      });
    });

    // Screen fill
    t += 1_000;
    actions.push({ t, fn: () => { setPhase('fill'); setFill(true); } });

    // Complete
    t += 2_000;
    actions.push({ t, fn: () => { setPhase('done'); onDone?.(); } });

    // schedule
    const ids = actions.map(({ t, fn }) => setTimeout(fn, t));
    return () => ids.forEach(clearTimeout);
  }, [onDone]);

  return { phase, cursor, lines, fill };
}

/* ------------------------------------------------------------------ *
 * PRESENTATIONAL SUB‑COMPONENTS                                      *
 * ------------------------------------------------------------------ */
const Cursor = memo(({ show }) => (
  <span className={`${styles.cursor} ${show ? styles.visible : ''}`}>_</span>
));

function TypeLine({ text }) {
  const [visible, setVisible] = useState('');
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setVisible(text.slice(0, ++i));
      if (i > text.length) clearInterval(id);
    }, C.TYPE_SPEED_MS);
    return () => clearInterval(id);
  }, [text]);
  return <div className={styles.terminalText}>{visible}</div>;
}

function ScreenFill({ active }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!active) return;
    let n = 0;
    const id = setInterval(() => {
      setRows(r => [...r, 'HELLO CURTIS ']);
      if (++n >= C.MAX_FILL_LINES) clearInterval(id);
    }, C.SCREEN_FILL_DELAY_MS);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;
  return (
    <div className={styles.screenFill}>
      {rows.map((row, i) => (
        <div key={i} className={styles.screenFillLine}>
          {row.repeat(10)}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * NARRATIVE DISPLAY                                                  *
 * ------------------------------------------------------------------ */
function Narrative({ stage, playing, onTrigger }) {
  const [seg, setSeg]        = useState(null);
  const start                = useRef(Date.now());
  const lastTick             = useRef(0);
  const raf                  = useRef();

  useEffect(() => {
    if (!playing) { setSeg(null); return; }
    start.current = Date.now();
    const loop = (ts) => {
      if (ts - lastTick.current < C.NARRATIVE_TICK_MS) {
        raf.current = requestAnimationFrame(loop); return;
      }
      lastTick.current = ts;

      const elapsed = Date.now() - start.current;
      const def     = Canonical.dialogue?.[stage];
      const hit     = def?.segments?.find(s => elapsed >= s.start && elapsed < s.start + s.duration);
      if (hit && hit !== seg) {
        setSeg(hit);
        if (hit.memoryTrigger) onTrigger(hit.memoryTrigger);
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [stage, playing, onTrigger]);

  if (!seg) return null;
  return (
    <div className={styles.narrativeOverlay}>
      <p className={styles.narrativeText}>{seg.text}</p>
      {seg.note && <p className={styles.narrativeNote}>{seg.note}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * MAIN COMPONENT                                                     *
 * ------------------------------------------------------------------ */
export default function ConsciousnessTheaterUnified() {
  /* ---------- state ---------- */
  const [stage, setStage]             = useState('genesis');
  const [scroll, setScroll]           = useState(0);
  const [morph,  setMorph]            = useState(0);
  const [init,   setInit]             = useState(false);
  const [showGL, setShowGL]           = useState(false);

  /* ---------- opening ---------- */
  const { phase, cursor, lines, fill } = useOpeningSequence(() => {
    setInit(true); setShowGL(true); document.body.style.overflow = '';
  });

  /* ---------- memory fragments ---------- */
  const { activeFragments, fragmentStates, triggerFragment, dismissFragment } =
    useMemoryFragments(stage, scroll * 100);

  /* ---------- lock scroll during intro ---------- */
  useEffect(() => {
    document.body.style.overflow = phase === 'done' ? '' : 'hidden';
  }, [phase]);

  /* ---------- stage subscriptions ---------- */
  useEffect(() => stageAtom.subscribe(s => {
    if (s.currentStage !== stage) {
      setStage(s.currentStage);
      qualityAtom.updateParticleBudget(s.currentStage);
    }
  }), [stage]);

  /* ---------- scroll handler ---------- */
  useEffect(() => {
    if (!init) return;
    const onScroll = debounce(() => {
      const docH  = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
      const pct   = Math.min(scrollY / docH, 1);
      setScroll(pct);
      setMorph(Math.min(pct * C.SCROLL_MORPH_MULTIPLIER, 1));

      const cfg = Canonical.getStageByScroll?.(pct * 100);
      if (cfg && cfg.name !== stage) stageAtom.jumpToStage(cfg.name);
    }, C.SCROLL_DEBOUNCE_MS);

    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => removeEventListener('scroll', onScroll);
  }, [init, stage]);

  /* ---------- render ---------- */
  if (phase !== 'done') {
    return (
      <div className={styles.openingContainer}>
        {phase === 'cursor'   && <Cursor show={cursor} />}
        {phase === 'terminal' && (
          <div className={styles.terminalContainer}>
            {lines.map((t, i) => <TypeLine key={i} text={t} />)}
          </div>
        )}
        {phase === 'fill' && <ScreenFill active={fill} />}
      </div>
    );
  }

  return (
    <div className={styles.theater}>
      <div className={styles.scrollContainer} style={{ height: C.SCROLL_CONTAINER_HEIGHT }} />
      {showGL && <WebGLCanvas stage={stage} morphProgress={morph} scrollProgress={scroll} />}

      <Narrative
        stage={stage}
        playing={init}
        onTrigger={triggerFragment}
      />

      {activeFragments.map(f => (
        fragmentStates[f.id]?.state === 'active' ? (
          <MemoryFragmentRenderer
            key={f.id}
            fragment={MEMORY_FRAGMENTS[f.id]}
            onDismiss={() => dismissFragment(f.id)}
          />
        ) : null
      ))}

      <div className={styles.stageHud} style={{ opacity: C.HUD_OPACITY }}>
        {Canonical.stages[stage]?.title} | {Math.round(scroll * 100)}% | Morph {Math.round(morph * 100)}%
      </div>

      <DevPerformanceMonitor />
    </div>
  );
}
EOF

# 4. format with prettier if available
if npx --yes prettier --version &>/dev/null; then
  npx --yes prettier --write "$TARGET_FILE"
  echo "✨ Prettier run – file formatted."
fi

echo "✅ $TARGET_FILE generated successfully."
