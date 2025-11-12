import { useCallback, useEffect, useRef, useState } from 'react';
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
        wordBreak: 'break-word',
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
        wordBreak: 'break-word',
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
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      },
      transform: 'translateX(-50%)',
      scale: 2.2,
    },
  },
  palette: {
    chapter: {
      color: 'rgba(255, 255, 255, 0.96)',
      glow: '0 0 35px rgba(255, 254, 219, 0.55)',
    },
    important: {
      color: 'rgba(220, 235, 255, 0.95)',
      glow: '0 0 28px rgba(140, 170, 255, 0.45)',
    },
    context: {
      color: 'rgba(190, 210, 230, 0.93)',
      glow: '0 0 24px rgba(120, 150, 200, 0.4)',
    },
  },
};

const SCRAMBLE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789▮▯▱';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const computeHoldDuration = (text = '') => {
  const { msPerWord, baseBuffer, minHold, maxHold } = CONFIG.timing;
  const words = text.trim() ? text.trim().split(/\s+/).length : 1;
  const raw = words * msPerWord + baseBuffer;
  return clamp(raw, minHold, maxHold);
};

function useScramble(text, durationMs) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplay('');
      return undefined;
    }

    const lines = text.split('\n');
    const outputs = Array(lines.length).fill('');
    let currentLine = 0;
    let intervalId = null;

    const runLine = () => {
      if (currentLine >= lines.length) {
        setDisplay(outputs.join('\n'));
        return;
      }
      const lineText = lines[currentLine];
      if (!lineText.length) {
        outputs[currentLine] = '';
        currentLine += 1;
        runLine();
        return;
      }
      const steps = Math.min(48, Math.max(16, Math.ceil(lineText.length / 5)));
      const interval = Math.max(35, durationMs / steps);
      let step = 0;

      intervalId = setInterval(() => {
        step += 1;
        const progress = step / steps;
        const revealCount = Math.floor(lineText.length * progress);
        let nextLine = '';
        for (let i = 0; i < lineText.length; i += 1) {
          const char = lineText[i];
          if (char === ' ') {
            nextLine += ' ';
          } else if (i < revealCount) {
            nextLine += char;
          } else {
            const charIndex = (i + step) % SCRAMBLE_CHARS.length;
            nextLine += SCRAMBLE_CHARS[charIndex];
          }
        }
        outputs[currentLine] = nextLine;
        setDisplay(outputs.join('\n'));
        if (step >= steps) {
          outputs[currentLine] = lineText;
          clearInterval(intervalId);
          currentLine += 1;
          runLine();
        }
      }, interval);
    };

    runLine();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, durationMs]);

  return display;
}

function NarrativeCue({ cue, state }) {
  const palette = CONFIG.palette[cue.kind] || CONFIG.palette.context;
  const position = CONFIG.positions[cue.kind] || CONFIG.positions.context;
  const scrambleDuration =
    state === 'active'
      ? CONFIG.timing.fadeInDuration * 1.25
      : CONFIG.timing.fadeOutDuration * 0.9;
  const displayText = useScramble(cue.text, scrambleDuration);
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
      {displayText}
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
