import { useEffect, useRef, useState } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const promptStyle = {
  position: 'fixed',
  bottom: '15%',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  zIndex: 1000,
  pointerEvents: 'none',
  color: 'rgba(255, 255, 255, 0.75)',
  fontFamily: 'Courier New, monospace',
  fontSize: '12px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
};

const captionStyle = {
  position: 'fixed',
  bottom: '10%',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1000,
  pointerEvents: 'none',
  fontFamily: 'Courier New, monospace',
  fontSize: '16px',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  color: 'rgba(255, 255, 255, 0.9)',
  transition: 'opacity 600ms ease',
};

export default function DemoOverlay() {
  const [promptVisible, setPromptVisible] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [captionVisible, setCaptionVisible] = useState(false);
  const promptVisibleRef = useRef(false);
  const captionTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.__DEMO_MODE__) return undefined;

    const handleInteractive = (payload = {}) => {
      if (payload.demo && payload.demo !== window.__DEMO_KEY__) return;
      setPromptVisible(true);
      promptVisibleRef.current = true;
    };

    const handleCaption = (payload = {}) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      if (!text) return;
      setCaptionText(text);
      setCaptionVisible(true);
      if (captionTimerRef.current) {
        clearTimeout(captionTimerRef.current);
      }
      captionTimerRef.current = setTimeout(() => {
        setCaptionVisible(false);
      }, 3000);
    };

    const handleScroll = () => {
      if (!promptVisibleRef.current) return;
      promptVisibleRef.current = false;
      setPromptVisible(false);
    };

    const offInteractive = BeatBus.on('DEMO_INTERACTIVE_READY', handleInteractive);
    const offCaption = BeatBus.on('DEMO_SHOW_CAPTION', handleCaption);
    const offScroll = BeatBus.on(EVENTS.SCROLL_PROGRESS, handleScroll);

    return () => {
      offInteractive && offInteractive();
      offCaption && offCaption();
      offScroll && offScroll();
      if (captionTimerRef.current) {
        clearTimeout(captionTimerRef.current);
        captionTimerRef.current = null;
      }
    };
  }, []);

  if (typeof window === 'undefined' || !window.__DEMO_MODE__) return null;

  return (
    <>
      {promptVisible ? (
        <div style={promptStyle}>SCROLL TO INTERACT</div>
      ) : null}
      {captionText ? (
        <div
          style={{
            ...captionStyle,
            opacity: captionVisible ? 1 : 0,
          }}
        >
          {captionText}
        </div>
      ) : null}
    </>
  );
}
