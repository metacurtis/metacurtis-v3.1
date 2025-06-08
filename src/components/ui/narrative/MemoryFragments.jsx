// src/components/ui/narrative/MemoryFragments.jsx
import { useState, useEffect } from 'react';
import { narrativeTransition } from '@/config/narrativeParticleConfig';

function MemoryFragments({ currentStage }) {
  const [fragments, setFragments] = useState([]);
  const [activeFragment, setActiveFragment] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const preset = narrativeTransition.getCurrentDisplayPreset();
    setFragments(preset.memoryFragments || []);
  }, [currentStage]);

  useEffect(() => {
    const handleMouseMove = e => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (fragments.length === 0) return null;

  return (
    <>
      {/* Memory Fragment Triggers */}
      {fragments.map((fragment, index) => (
        <div
          key={`${currentStage}-${index}`}
          className="memory-trigger"
          style={{
            position: 'fixed',
            width: '12px',
            height: '12px',
            background:
              'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 70%, transparent 100%)',
            borderRadius: '50%',
            zIndex: 15,
            cursor: 'pointer',
            left: `${20 + index * 25}%`,
            top: `${30 + index * 15}%`,
            animation: `memory-pulse-${index} ${2 + index * 0.5}s ease-in-out infinite`,
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={() => setActiveFragment({ fragment, index })}
          onMouseLeave={() => setActiveFragment(null)}
          onMouseMove={e => e.stopPropagation()}
        />
      ))}

      {/* Active Memory Fragment Tooltip */}
      {activeFragment && (
        <div
          className="memory-fragment"
          style={{
            position: 'fixed',
            left: mousePosition.x + 15,
            top: mousePosition.y - 10,
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            lineHeight: '1.4',
            maxWidth: '250px',
            zIndex: 25,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            fontFamily: 'system-ui, sans-serif',
            pointerEvents: 'none',
            animation: 'memory-fade-in 0.2s ease-out',
          }}
        >
          {activeFragment.fragment}
        </div>
      )}

      {/* CSS Animations */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx="true">{`
        @keyframes memory-pulse-0 {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }

        @keyframes memory-pulse-1 {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.9);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }

        @keyframes memory-pulse-2 {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1.1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.3);
          }
        }

        @keyframes memory-fade-in {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .memory-trigger:hover {
          transform: scale(1.5) !important;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(255, 255, 255, 0.4) 70%,
            transparent 100%
          ) !important;
        }

        @media (max-width: 768px) {
          .memory-trigger {
            width: 10px !important;
            height: 10px !important;
          }

          .memory-fragment {
            max-width: 200px !important;
            font-size: 0.75rem !important;
            padding: 0.5rem 0.75rem !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .memory-trigger {
            animation: none !important;
          }

          .memory-fragment {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}

export default MemoryFragments;
