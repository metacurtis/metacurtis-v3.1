import { useState, useEffect, useRef } from 'react';

/**
 * Typewriter narration fragment - bottom-positioned subtitle
 * Extends memory fragment system for narrative text
 */
export function NarrationFragment({
  text,
  isActive,
  onComplete,
  charsPerSecond = 15,
  segmentKey,
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const charIndexRef = useRef(0);
  const intervalRef = useRef(null);
  const holdTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isActive || !text) {
      setDisplayedText('');
      charIndexRef.current = 0;
      setIsComplete(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
      return;
    }

    const safeCharsPerSecond =
      Number(charsPerSecond) && Number(charsPerSecond) > 0
        ? Number(charsPerSecond)
        : 15;
    const msPerChar = 1000 / safeCharsPerSecond;
    const fullText = String(text);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    charIndexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);

    intervalRef.current = setInterval(() => {
      if (charIndexRef.current < fullText.length) {
        charIndexRef.current += 1;
        setDisplayedText(fullText.slice(0, charIndexRef.current));
      } else {
        setIsComplete(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        holdTimeoutRef.current = setTimeout(() => {
          holdTimeoutRef.current = null;
          onComplete?.(segmentKey);
        }, 2000);
      }
    }, msPerChar);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
    };
  }, [isActive, text, charsPerSecond, onComplete, segmentKey]);

  if (!isActive) return null;

  return (
    <div
      className="narration-fragment"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        pointerEvents: 'none',
        padding: '0 2rem 3rem 2rem',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '200px',
          background:
            'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            lineHeight: 1.6,
            color: '#ffffff',
            fontWeight: 300,
            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
            margin: 0,
            minHeight: '2.4rem',
          }}
        >
          {displayedText}
          {!isComplete && <span className="cursor">|</span>}
        </p>
      </div>

      {!isComplete && (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.875rem',
            zIndex: 10,
          }}
        >
          Press SPACE to skip
        </div>
      )}

      <style>{`
        .cursor {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
