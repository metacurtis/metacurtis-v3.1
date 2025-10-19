import { useEffect, useState } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

/**
 * Ambient Fragment — scroll-triggered annotation overlay.
 * Fades in when the current stage reaches the configured trigger percent.
 */
export default function AmbientFragment({ fragment, stage }) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!fragment || !stage) return;

    let fadeInTimer = null;
    let persistTimer = null;
    let fadeOutTimer = null;
    let hasTriggered = false;

    // Reset state when fragment or stage changes
    setVisible(false);
    setOpacity(0);

    const triggerPercent =
      (fragment.trigger && typeof fragment.trigger.percent === 'number'
        ? fragment.trigger.percent
        : null)
      ?? (typeof fragment.triggerPercent === 'number' ? fragment.triggerPercent : 0);

    const fadeInMs = Math.max(0, fragment.timing?.fadeIn ?? 1000);
    const persistMs = Math.max(
      0,
      fragment.timing?.persist ??
        fragment.duration ??
        fragment.timing?.duration ??
        5000
    );
    const fadeOutMs = Math.max(0, fragment.timing?.fadeOut ?? 1000);

    const clearTimers = () => {
      if (fadeInTimer) clearTimeout(fadeInTimer);
      if (persistTimer) clearTimeout(persistTimer);
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
      fadeInTimer = persistTimer = fadeOutTimer = null;
    };

    const handleScroll = (payload = {}) => {
      const currentStage = payload.currentStage ?? payload.stage;
      if (currentStage !== stage) return;

      const stageProgress =
        typeof payload.stageProgress === 'number'
          ? payload.stageProgress
          : typeof payload.localProgress === 'number'
            ? payload.localProgress * 100
            : 0;

      if (!hasTriggered && stageProgress >= triggerPercent) {
        hasTriggered = true;
        console.log(
          `📝 Ambient fragment triggered (${fragment.id || 'unknown'}) @ ${stageProgress.toFixed?.(1) ?? stageProgress}%`
        );

        setVisible(true);

        fadeInTimer = setTimeout(() => {
          setOpacity(1);
        }, 50);

        persistTimer = setTimeout(() => {
          setOpacity(0);
          fadeOutTimer = setTimeout(() => {
            setVisible(false);
          }, fadeOutMs);
        }, fadeInMs + persistMs);
      }
    };

    const off = BeatBus.on?.(EVENTS.SCROLL_PROGRESS, handleScroll);

    return () => {
      off?.();
      clearTimers();
    };
  }, [fragment, stage]);

  if (!visible || !fragment) return null;

  const position = fragment.position || {};
  const content = fragment.content;
  const text =
    typeof content === 'string'
      ? content
      : content?.text ?? fragment.text ?? '';
  const color =
    (typeof content === 'object' && content?.color) || fragment.color || '#888888';
  const fontSize =
    (typeof content === 'object' && content?.fontSize) || fragment.fontSize || 14;

  const baseStyle = {
    position: 'fixed',
    zIndex: 100,
    transition: `opacity ${fragment.timing?.fadeIn ?? 1000}ms ease-in-out`,
    opacity,
    pointerEvents: 'none',
  };

  const anchor = position.anchor || fragment.positionAnchor || fragment.position;
  const anchorStyle = (() => {
    switch (anchor) {
      case 'topLeft':
        return { top: '2rem', left: '2rem' };
      case 'topRight':
        return { top: '2rem', right: '2rem' };
      case 'bottomRight':
        return { bottom: '2rem', right: '2rem' };
      case 'center':
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'bottomLeft':
      default:
        return { bottom: '2rem', left: '2rem' };
    }
  })();

  const offset = position?.offset;
  const offsetStyle = offset
    ? {
        transform: `translate(${offset.x || 0}px, ${offset.y || 0}px)${
          anchorStyle.transform ? ` ${anchorStyle.transform}` : ''
        }`.trim(),
      }
    : {};

  const wrapperStyle = {
    ...baseStyle,
    ...anchorStyle,
    ...(offset ? offsetStyle : {}),
  };

  return (
    <div style={wrapperStyle} className="ambient-fragment">
      <div
        style={{
          fontSize,
          color,
          fontFamily: content?.fontFamily || 'Inter, system-ui, sans-serif',
          fontWeight: content?.fontWeight ?? 400,
          letterSpacing: content?.letterSpacing ?? '0.05em',
          textShadow: content?.textShadow ?? '0 2px 8px rgba(0,0,0,0.5)',
          maxWidth: content?.maxWidth ?? '320px',
          lineHeight: content?.lineHeight ?? 1.35,
          padding: content?.padding ?? '0.5rem 0.75rem',
          background: content?.background ?? 'rgba(0, 0, 0, 0.35)',
          borderRadius: content?.borderRadius ?? '6px',
          backdropFilter: content?.backdropFilter ?? 'blur(12px)',
          border: content?.border ?? '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {text}
      </div>
    </div>
  );
}
