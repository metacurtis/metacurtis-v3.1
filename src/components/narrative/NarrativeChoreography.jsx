import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from '@/state/atoms/createAtom.js';
import { stageAtom } from '@/state/atoms/stageAtom.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const CONFIG = {
  timing: {
    msPerWord: 340,
    baseBuffer: 1800,
    minHold: 2800,
    maxHold: 9200,
    fadeInDuration: 1400,
    fadeOutDuration: 2000,
    crossfadeOverlap: 1200,
  },
  ghostOpacity: 0.18,
  positions: {
    chapter: {
      style: {
        top: '8%',
        left: '50%',
        maxWidth: '70vw',
        textAlign: 'center',
        wordBreak: 'keep-all',
        overflowWrap: 'normal',
        whiteSpace: 'pre-wrap',
      },
      transform: 'translateX(-50%)',
      scale: 3.6,
    },
    important: {
      style: {
        top: '20%',
        left: '6%',
        maxWidth: '55vw',
        textAlign: 'left',
        wordBreak: 'keep-all',
        overflowWrap: 'normal',
        whiteSpace: 'pre-wrap',
      },
      transform: 'translateX(-4%)',
      scale: 2.4,
    },
    context: {
      style: {
        bottom: '14%',
        left: '50%',
        maxWidth: '52vw',
        textAlign: 'center',
        wordBreak: 'keep-all',
        overflowWrap: 'normal',
        whiteSpace: 'pre-wrap',
      },
      transform: 'translateX(-50%)',
      scale: 2.2,
    },
  },
  palette: {
    chapter: {
      color: 'rgba(255, 244, 214, 0.98)',
      glow: '0 0 42px rgba(255, 184, 108, 0.6)',
    },
    important: {
      color: 'rgba(198, 239, 255, 0.96)',
      glow: '0 0 32px rgba(64, 196, 255, 0.5)',
    },
    context: {
      color: 'rgba(210, 205, 255, 0.92)',
      glow: '0 0 28px rgba(142, 123, 255, 0.45)',
    },
  },
};

const MATERIALIZE = Object.freeze({
  baseDelay: 40,
  delayStep: 18,
  randomWindow: 240,
  maxOffsetX: 28,
  maxOffsetY: 34,
  minScale: 0.65,
  maxScale: 1.1,
  maxBlur: 6,
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const computeHoldDuration = (text = '') => {
  const { msPerWord, baseBuffer, minHold, maxHold } = CONFIG.timing;
  const words = text.trim() ? text.trim().split(/\s+/).length : 1;
  const raw = words * msPerWord + baseBuffer;
  return clamp(raw, minHold, maxHold);
};

function useParticleMaterialization(text) {
  const memoizedParticles = useMemo(() => {
    if (!text) return { units: [], tokens: [] };

    const units = [];
    let charCounter = 0;

    const pushUnit = (unit) => {
      units.push({ ...unit, flatIndex: units.length });
    };

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (char === '\n') {
        pushUnit({ type: 'break', id: `break-${i}` });
        continue;
      }
      if (char === ' ') {
        pushUnit({ type: 'space', id: `space-${i}` });
        continue;
      }

      const unit = {
        type: 'char',
        char,
        id: `char-${i}-${char}-${Math.random().toString(36).slice(2)}`,
        delay:
          MATERIALIZE.baseDelay +
          charCounter * MATERIALIZE.delayStep +
          Math.random() * MATERIALIZE.randomWindow,
        offsetX: (Math.random() - 0.5) * MATERIALIZE.maxOffsetX,
        offsetY: (Math.random() - 0.5) * MATERIALIZE.maxOffsetY,
        scale: MATERIALIZE.minScale + Math.random() * (MATERIALIZE.maxScale - MATERIALIZE.minScale),
        blur: Math.random() * MATERIALIZE.maxBlur,
      };
      charCounter += 1;
      pushUnit(unit);
    }

    const tokens = [];
    let wordBuffer = [];

    const flushWord = () => {
      if (!wordBuffer.length) return;
      tokens.push({
        type: 'word',
        id: `word-${tokens.length}-${Math.random().toString(36).slice(2)}`,
        chars: wordBuffer,
      });
      wordBuffer = [];
    };

    units.forEach((unit) => {
      if (unit.type === 'char') {
        wordBuffer.push(unit);
      } else {
        flushWord();
        tokens.push(unit);
      }
    });

    flushWord();

    return { units, tokens };
  }, [text]);

  const { units, tokens } = memoizedParticles;
  const [revealed, setRevealed] = useState(() =>
    units.map((unit) => (unit.type === 'char' ? false : true)),
  );

  useEffect(() => {
    if (!units.length) {
      setRevealed([]);
      return undefined;
    }

    setRevealed(units.map((unit) => (unit.type === 'char' ? false : true)));

    const handles = units.map((unit) => {
      if (unit.type !== 'char') return null;
      return setTimeout(() => {
        setRevealed((prev) => {
          const next = prev.slice();
          next[unit.flatIndex] = true;
          return next;
        });
      }, unit.delay);
    });

    return () => {
      handles.forEach((handle) => {
        if (handle) clearTimeout(handle);
      });
    };
  }, [units]);

  return useMemo(
    () =>
      tokens.map((token) => {
        if (token.type !== 'word') {
          return token;
        }
        return {
          ...token,
          chars: token.chars.map((charUnit) => ({
            ...charUnit,
            revealed: Boolean(revealed[charUnit.flatIndex]),
          })),
        };
      }),
    [tokens, revealed],
  );
}

function NarrativeCue({ cue, state }) {
  const palette = CONFIG.palette[cue.kind] || CONFIG.palette.context;
  const position = CONFIG.positions[cue.kind] || CONFIG.positions.context;
  const particleTokens = useParticleMaterialization(cue.text || '');
  const baseTransform = position.transform || '';

  return (
    <div
      style={{
        position: 'absolute',
        ...position.style,
        color: palette.color,
        textShadow: palette.glow,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', system-ui, sans-serif",
        fontWeight: 300,
        letterSpacing: '0.04em',
        fontSize: `calc(${position.scale}vw)`,
        opacity: state === 'ghost' ? CONFIG.ghostOpacity : 1,
        transition: `opacity ${CONFIG.timing.fadeOutDuration}ms ease-in-out,
          transform 650ms cubic-bezier(0.34, 1.56, 0.64, 1)` ,
        pointerEvents: 'none',
        userSelect: 'none',
        transform: baseTransform || 'none',
      }}
    >
      {particleTokens.map((unit) => {
        if (unit.type === 'break') return <br key={unit.id} />;
        if (unit.type === 'space') {
          return (
            <span
              key={unit.id}
              style={{ display: 'inline-block', width: '0.44em', minWidth: '0.44em' }}
            >
              &nbsp;
            </span>
          );
        }

        if (unit.type === 'word') {
          return (
            <span
              key={unit.id}
              style={{
                display: 'inline-flex',
                whiteSpace: 'nowrap',
                gap: '0.02em',
              }}
            >
              {unit.chars.map((charUnit) => (
                <span
                  key={charUnit.id}
                  style={{
                    display: 'inline-block',
                    opacity: charUnit.revealed ? 1 : 0,
                    filter: charUnit.revealed ? 'blur(0px)' : `blur(${charUnit.blur}px)`,
                    transform: charUnit.revealed
                      ? 'translate3d(0, 0, 0) scale(1)'
                      : `translate3d(${charUnit.offsetX}px, ${charUnit.offsetY}px, 0) scale(${charUnit.scale})`,
                    transition:
                      'opacity 360ms ease-out, transform 620ms cubic-bezier(0.22, 1, 0.36, 1), filter 480ms ease-out',
                  }}
                >
                  {charUnit.char}
                </span>
              ))}
            </span>
          );
        }

        return null;
      })}
    </div>
  );
}

export function NarrativeChoreography() {
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage || 'genesis');
  const [activeCue, setActiveCue] = useState(null);
  const [ghostCue, setGhostCue] = useState(null);

  const queueRef = useRef([]);
  const holdTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const activeCueRef = useRef(null);
  const stageSequenceRef = useRef({ stage: currentStage, count: 0 });

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    queueRef.current = [];
    activeCueRef.current = null;
    setActiveCue(null);
    setGhostCue(null);
    clearTimers();
  }, [clearTimers]);

  const dispatchNext = useCallback(() => {
    if (!queueRef.current.length) {
      setGhostCue(null);
      setActiveCue(null);
      activeCueRef.current = null;
      return;
    }

    const next = queueRef.current.shift();
    const holdMs = computeHoldDuration(next.text);
    setGhostCue(activeCueRef.current);
    setActiveCue(next);
    activeCueRef.current = next;

    clearTimers();

    holdTimerRef.current = setTimeout(() => {
      setGhostCue(next);
      setActiveCue(null);
      activeCueRef.current = null;

      fadeTimerRef.current = setTimeout(() => {
        setGhostCue(null);
        dispatchNext();
      }, Math.max(0, CONFIG.timing.fadeOutDuration - CONFIG.timing.crossfadeOverlap));
    }, holdMs);
  }, [clearTimers]);

  useEffect(() => {
    const handleLine = (payload = {}) => {
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (!text) return;
      let kindKey = payload.type || payload.kind || null;
      if (!kindKey || !CONFIG.positions[kindKey]) {
        if (stageSequenceRef.current.stage !== currentStage) {
          stageSequenceRef.current = { stage: currentStage, count: 0 };
        }
        const idx = stageSequenceRef.current.count;
        stageSequenceRef.current.count += 1;
        if (idx === 0) kindKey = 'chapter';
        else if (idx === 1) kindKey = 'important';
        else kindKey = 'context';
      } else if (stageSequenceRef.current.stage !== currentStage) {
        stageSequenceRef.current = { stage: currentStage, count: 1 };
      } else {
        stageSequenceRef.current.count += 1;
      }
      const normalizedKind = CONFIG.positions[kindKey] ? kindKey : 'context';

      queueRef.current.push({
        text,
        kind: normalizedKind,
        stage: currentStage,
        timestamp: Date.now(),
      });

      if (!activeCueRef.current) {
        dispatchNext();
      }
    };

    const offLine = BeatBus.on?.(EVENTS.NARRATIVE_LINE, handleLine);
    return () => offLine?.();
  }, [currentStage, dispatchNext]);

  useEffect(() => {
    const offStage = BeatBus.on?.(EVENTS.STAGE_CHANGE, (payload = {}) => {
      stageSequenceRef.current = {
        stage: payload?.to || payload?.stage || currentStage,
        count: 0,
      };
      resetState();
    });
    return () => offStage?.();
  }, [resetState]);

  useEffect(() => () => resetState(), [resetState]);

  useEffect(() => {
    stageSequenceRef.current = { stage: currentStage, count: 0 };
  }, [currentStage]);

  if (!activeCue && !ghostCue) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {ghostCue && <NarrativeCue cue={ghostCue} state="ghost" />}
      {activeCue && <NarrativeCue cue={activeCue} state="active" />}
    </div>
  );
}
