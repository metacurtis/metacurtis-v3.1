import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtomValue, stageAtom } from '@/state/atoms';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { NARRATIVE_DIALOGUE } from '@/config/sst3/narrative-dialogue.js';
import { NarrationFragment } from '../fragments/NarrationFragment.jsx';

const DEBUG_NARRATION = true;
const DEFAULT_CHARS_PER_SECOND = 15;
const SKIP_KEYS = new Set([' ', 'Spacebar', 'Space']);

function normalizeSegments(segments = []) {
  return segments
    .filter(Boolean)
    .map((segment) => ({
      ...segment,
      timing: {
        start: Math.max(0, Number(segment?.timing?.start) || 0),
        duration: Math.max(0, Number(segment?.timing?.duration) || 0),
      },
    }))
    .sort((a, b) => (a.timing.start ?? 0) - (b.timing.start ?? 0));
}

export default function NarrationController({ defaultCharsPerSecond = DEFAULT_CHARS_PER_SECOND }) {
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
  const [activeNarration, setActiveNarration] = useState(null);

  const timersRef = useRef(new Set());
  const activeStageRef = useRef(null);
  const activeSegmentRef = useRef(null);
  const totalSegmentsRef = useRef(0);
  const completedSegmentsRef = useRef(0);
  const skipRequestedRef = useRef(false);
  const previousOverflowRef = useRef(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current.clear();
  }, []);

  const unlockScroll = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (previousOverflowRef.current !== null) {
      try {
        document.body.style.overflow = previousOverflowRef.current || '';
      } catch {}
      if (DEBUG_NARRATION) {
        console.log('🔓 [SCROLL UNLOCKED]');
      }
      previousOverflowRef.current = null;
    }
  }, []);

  const lockScroll = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (previousOverflowRef.current !== null) return;
    try {
      previousOverflowRef.current = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    } catch {}
    if (DEBUG_NARRATION) {
      console.log('🔒 [SCROLL LOCKED]');
    }
  }, []);

  const resetState = useCallback(
    ({ unlock = true, preserveStage = false } = {}) => {
      const hadActiveStage = !!activeStageRef.current;
      clearTimers();
      setActiveNarration(null);
      activeSegmentRef.current = null;
      totalSegmentsRef.current = 0;
      completedSegmentsRef.current = 0;
      skipRequestedRef.current = false;
      if (!preserveStage) {
        if (hadActiveStage && DEBUG_NARRATION) {
          console.log('🎙️ [NarrationController] STOPPED');
        }
        activeStageRef.current = null;
      }
      if (unlock) {
        unlockScroll();
      }
    },
    [clearTimers, unlockScroll]
  );

  const handleNarrationComplete = useCallback(() => {
    if (!activeStageRef.current || !activeSegmentRef.current) return;
    completedSegmentsRef.current += 1;
    activeSegmentRef.current = null;
    setActiveNarration(null);

    const stageName = activeStageRef.current;

    if (completedSegmentsRef.current >= totalSegmentsRef.current) {
      if (DEBUG_NARRATION) {
        console.log(`✅ Narration complete: ${stageName}`);
      }
      activeStageRef.current = null;
      unlockScroll();
    }
  }, [unlockScroll]);

  const scheduleSegment = useCallback(
    (stageName, segment, segmentIndex = 0) => {
      const startDelay = Math.max(0, segment?.timing?.start ?? 0);
      const timerId = setTimeout(() => {
        timersRef.current.delete(timerId);
        if (skipRequestedRef.current || activeStageRef.current !== stageName) return;

        const text = segment?.text ?? '';
        const charsPerSecond = Number(segment?.charsPerSecond) > 0
          ? Number(segment.charsPerSecond)
          : defaultCharsPerSecond;

        if (DEBUG_NARRATION) {
          const preview = text.length > 50 ? `${text.slice(0, 50)}…` : text;
          console.log('🎙️ [BEAT FIRED]', {
            stage: stageName,
            segmentIndex,
            time: segment?.timing?.start ?? 0,
            duration: segment?.timing?.duration ?? 0,
            narration: preview,
            visual: segment?.visual ?? null,
          });
        }

        activeSegmentRef.current = segment;
        setActiveNarration({
          stage: stageName,
          segmentId: segment?.id ?? null,
          text,
          isActive: true,
          charsPerSecond,
        });

        if (segment?.memoryFragmentTrigger) {
          BeatBus.emit?.(EVENTS.MEMORY_FRAGMENT_TRIGGER, {
            stage: stageName,
            id: segment.memoryFragmentTrigger,
            origin: 'narration',
            segmentId: segment?.id ?? null,
          });
        }

        BeatBus.emit?.(EVENTS.NARRATIVE_LINE, {
          stage: stageName,
          segmentId: segment?.id ?? null,
          text,
        });
      }, startDelay);

      timersRef.current.add(timerId);
    },
    [defaultCharsPerSecond]
  );

  const startNarration = useCallback(
    (stageName) => {
      if (!stageName) return;

      const stageKey = stageName in NARRATIVE_DIALOGUE ? stageName : currentStage;
      const stageConfig = NARRATIVE_DIALOGUE[stageKey];
      const segments = normalizeSegments(stageConfig?.narration?.segments);
      if (!segments.length) return;

      resetState({ preserveStage: true });
      activeStageRef.current = stageKey;
      totalSegmentsRef.current = segments.length;
      completedSegmentsRef.current = 0;
      skipRequestedRef.current = false;

      if (DEBUG_NARRATION) {
        console.log('🎙️ [NarrationController] Playing beat sheet:', {
          stage: stageKey,
          segmentCount: segments.length,
          isPlaying: true,
          defaultCharsPerSecond,
        });
        console.log(`📖 Starting narration for: ${stageKey}`);
      }
      lockScroll();

      segments.forEach((segment, index) => scheduleSegment(stageKey, segment, index));
    },
    [currentStage, defaultCharsPerSecond, lockScroll, resetState, scheduleSegment]
  );

  const skipNarration = useCallback(
    (origin = 'skip') => {
      if (!activeStageRef.current) return;
      const stageName = activeStageRef.current;
      skipRequestedRef.current = true;
      resetState({ unlock: true });
      if (DEBUG_NARRATION) {
        console.log(`⏭️ Narration skipped via ${origin}: ${stageName}`);
      }
    },
    [resetState]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const startNarrationHandler = startNarration;
    const skipNarrationHandler = skipNarration;

    const controllerApi = {
      playNarration: (stage) => {
        startNarrationHandler(stage);
      },
      skipNarration: () => {
        skipNarrationHandler('external');
      },
    };

    Object.defineProperties(controllerApi, {
      isPlaying: {
        enumerable: true,
        get() {
          return activeStageRef.current !== null;
        },
      },
      currentStage: {
        enumerable: true,
        get() {
          return activeStageRef.current;
        },
      },
    });

    window.narrationController = controllerApi;

    const statusFn = () => ({
      isPlaying: activeStageRef.current !== null,
      activeStage: activeStageRef.current,
      completedSegments: completedSegmentsRef.current,
      totalSegments: totalSegmentsRef.current,
      scrollLocked:
        typeof document !== 'undefined'
          ? (document.body?.style?.overflow || '') === 'hidden'
          : false,
    });
    window.narrationStatus = statusFn;

    if (DEBUG_NARRATION) {
      console.log('🎙️ [NarrationController] Exposed controller API');
    }

    return () => {
      if (window.narrationController === controllerApi) {
        window.narrationController = null;
        if (DEBUG_NARRATION) {
          console.log('🎙️ [NarrationController] Controller API removed');
        }
      }
      if (window.narrationStatus === statusFn) {
        window.narrationStatus = undefined;
      }
    };
  }, [skipNarration, startNarration]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStart = (payload = {}) => {
      const stageName = payload?.stage || currentStage || activeStageRef.current;
      startNarration(stageName);
    };

    const handleStageChange = (payload = {}) => {
      const nextStage = payload?.to || payload?.stage;
      if (!activeStageRef.current) return;
      if (nextStage && nextStage !== activeStageRef.current) {
        resetState();
      }
    };

    const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
    const offStageChange = BeatBus.on?.(EVENTS.STAGE_CHANGE, handleStageChange);

    const keyHandler = (event) => {
      if (!activeStageRef.current || skipRequestedRef.current) return;
      if (event?.defaultPrevented) return;
      const targetTag = event?.target?.tagName;
      if (targetTag && ['INPUT', 'TEXTAREA'].includes(targetTag)) return;
      if (!SKIP_KEYS.has(event.key) && event.code !== 'Space') return;
      event.preventDefault?.();
      event.stopPropagation?.();
      skipNarration('space');
    };

    window.addEventListener('keydown', keyHandler);

    return () => {
      offStart?.();
      offStageChange?.();
      window.removeEventListener('keydown', keyHandler);
      resetState();
    };
  }, [currentStage, resetState, skipNarration, startNarration]);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  if (!activeNarration?.isActive) return null;

  return (
    <NarrationFragment
      text={activeNarration.text}
      isActive={activeNarration.isActive}
      onComplete={handleNarrationComplete}
      charsPerSecond={activeNarration.charsPerSecond}
    />
  );
}
