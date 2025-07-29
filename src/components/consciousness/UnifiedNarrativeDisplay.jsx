// src/components/consciousness/UnifiedNarrativeDisplay.jsx
// Timeline-driven narrative display with effects

import { useState, useEffect, useRef } from 'react';
import { stageClock } from '@/core/CentralStageClock';
import { beatBus, Events } from '@/orchestration/BeatBus';
import styles from './UnifiedNarrativeDisplay.module.css';

export function UnifiedNarrativeDisplay() {
  const [activeSegment, setActiveSegment] = useState(null);
  const [fadeKey, setFadeKey] = useState(0);
  const lastSegmentId = useRef(null);

  useEffect(() => {
    const handleClock = ({ detail: { stage, t, timeline } }) => {
      // Find active segment
      const segment = timeline.find(seg => t >= seg.at && t < seg.at + seg.dur);

      // Handle segment changes
      if (segment?.id !== lastSegmentId.current) {
        if (lastSegmentId.current && segment) {
          // Segment transition
          setFadeKey(prev => prev + 1);
        }

        lastSegmentId.current = segment?.id || null;
        setActiveSegment(segment);

        // Emit segment events
        if (segment) {
          beatBus.emit(Events.SEGMENT_START, { segment, stage });

          // Auto-trigger fragment
          if (segment.fragment && t >= segment.at && t <= segment.at + 100) {
            beatBus.emit(Events.FRAGMENT_TRIGGER, {
              id: segment.fragment,
              segment: segment.id,
            });
          }

          // Trigger visual effects
          if (segment.shader) {
            beatBus.emit(Events.SHADER_UPDATE, segment.shader);
          }
          if (segment.camera) {
            beatBus.emit(Events.CAMERA_PRESET, {
              preset: segment.camera,
              duration: 2000,
            });
          }
          if (segment.particles) {
            beatBus.emit(Events.PARTICLES_EFFECT, segment.particles);
          }
        } else if (lastSegmentId.current) {
          // Segment ended
          beatBus.emit(Events.SEGMENT_END, {
            segmentId: lastSegmentId.current,
            stage,
          });
        }
      }
    };

    stageClock.addEventListener('stageClock', handleClock);
    return () => stageClock.removeEventListener('stageClock', handleClock);
  }, []);

  if (!activeSegment) return null;

  // Calculate CSS variables for effects
  const cssVars = {
    '--dur': `${activeSegment.dur}ms`,
    '--accent': activeSegment.accentColor || '#ffffff',
  };

  return (
    <div
      key={fadeKey}
      className={styles.overlay}
      data-fx={activeSegment.fx || 'fade'}
      style={cssVars}
    >
      <p className={styles.text}>{activeSegment.text}</p>
    </div>
  );
}

export default UnifiedNarrativeDisplay;
