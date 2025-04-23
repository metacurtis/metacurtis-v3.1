import { useState, useEffect } from 'react';
import usePerformanceStore from '@/stores/performanceStore.js';

const LEVELS = ['ultra', 'high', 'medium', 'low'];

/**
 * Plain-DOM overlay to lock or auto quality.
 * Must live *outside* the Canvas.
 */
export default function QualitySelector() {
  const quality = usePerformanceStore(s => s.quality);
  const setQuality = usePerformanceStore(s => s.setQuality);
  const [locked, setLocked] = useState(false);
  const [local, setLocal] = useState(quality);

  // Keep local in sync until user locks it
  useEffect(() => {
    if (!locked) setLocal(quality);
  }, [quality, locked]);

  const onChange = e => {
    const q = e.target.value;
    setLocal(q);
    setQuality(q);
    setLocked(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 4,
        fontFamily: 'sans-serif',
        zIndex: 1000,
      }}
    >
      <label>
        Quality:
        <select value={local} onChange={onChange} style={{ marginLeft: 8 }}>
          {LEVELS.map(l => (
            <option key={l} value={l}>
              {l[0].toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>
      </label>
      {locked && (
        <button onClick={() => setLocked(false)} style={{ marginLeft: 12, padding: '2px 6px' }}>
          Auto
        </button>
      )}
    </div>
  );
}
