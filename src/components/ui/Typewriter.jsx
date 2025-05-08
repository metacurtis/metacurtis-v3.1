// src/components/ui/Typewriter.jsx
import { useEffect, useState } from 'react';
import { useInteractionStore } from '../../stores/useInteractionStore';

export default function Typewriter({
  text = '',
  speed = 50, // ms per character
  onComplete, // optional callback
  style = {},
}) {
  const [index, setIndex] = useState(0);
  const setProgress = useInteractionStore(s => s.setTypewriterProgress);

  useEffect(() => {
    if (index < text.length) {
      const id = window.setTimeout(() => setIndex(i => i + 1), speed);
      // update store [0 → 1]
      setProgress((index + 1) / text.length);
      return () => window.clearTimeout(id);
    } else {
      setProgress(1);
      onComplete?.();
    }
  }, [index, text, speed, setProgress, onComplete]);

  return (
    <h2
      style={{
        fontFamily: 'sans-serif',
        fontSize: '1.5rem',
        lineHeight: 1.3,
        margin: '2rem 0',
        ...style,
      }}
    >
      {text.slice(0, index)}
      <span
        style={{
          display: 'inline-block',
          width: '1ch',
          animation: index < text.length ? 'blink 1s step-end infinite' : 'none',
        }}
      >
        |
      </span>
      <style>
        {`
          @keyframes blink {
            from, to { opacity: 0 }
            50% { opacity: 1 }
          }
        `}
      </style>
    </h2>
  );
}
