// src/components/consciousness/NarrativeDisplay.jsx
// Clean narrative display component for SST v3.0

import React, { useEffect, useState, useRef } from 'react';
import { NARRATIVE_DIALOGUE } from '@/config/sst3/narrative-dialogue.js';
import { MEMORY_FRAGMENTS } from '@/config/sst3/memory-fragments.js';

export function NarrativeDisplay({ stage, isActive = true, onMemoryTrigger }) {
  const [activeSegment, setActiveSegment] = useState(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!isActive) return;

    // Reset timer on stage change
    startTimeRef.current = Date.now();
    setActiveSegment(null);

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const narrative = NARRATIVE_DIALOGUE[stage];

      if (!narrative?.segments) return;

      // Find current segment
      const segment = narrative.segments.find(seg => {
        return elapsed >= seg.start && elapsed < seg.start + seg.duration;
      });

      // Update if changed
      if (segment?.id !== activeSegment?.id) {
        setActiveSegment(segment || null);

        // Trigger memory fragment
        if (segment?.memoryTrigger && onMemoryTrigger) {
          onMemoryTrigger(segment.memoryTrigger);
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [stage, isActive, onMemoryTrigger]);

  if (!activeSegment) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: '800px',
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '20px 30px',
        borderRadius: '10px',
        border: '1px solid rgba(0, 255, 0, 0.3)',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)',
        zIndex: 40,
        animation: 'fadeIn 0.5s ease-in',
      }}
    >
      <p
        style={{
          color: '#ffffff',
          fontFamily: 'Georgia, serif',
          fontSize: '1.2rem',
          lineHeight: '1.8',
          margin: 0,
          textAlign: 'center',
          letterSpacing: '0.5px',
        }}
      >
        {activeSegment.text}
      </p>
      {activeSegment.note && (
        <p
          style={{
            color: '#00FF00',
            fontSize: '0.8rem',
            marginTop: '10px',
            opacity: 0.6,
            textAlign: 'center',
            fontFamily: 'Courier New, monospace',
          }}
        >
          {activeSegment.note}
        </p>
      )}
    </div>
  );
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;
document.head.appendChild(style);
