// src/components/ui/narrative/MemoryFragments.jsx
// ✅ UPDATED: Works with consolidated narrativeStore architecture
// ✅ INTEGRATED: Feature gates, memory fragment management, canonical stages

import { useState, useEffect, useMemo } from 'react';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { getPreset } from '@/config/narrativeParticleConfig';

function MemoryFragments() {
  const [activeFragment, setActiveFragment] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // ✅ UPDATED: Use consolidated store
  const {
    currentStage,
    isStageFeatureEnabled,
    activateMemoryFragment,
    activeMemoryFragment,
    userEngagement,
  } = useNarrativeStore();

  // ✅ INTEGRATED: Feature gate check
  const memoryFragmentsEnabled = isStageFeatureEnabled('memoryFragments');

  // ✅ UPDATED: Get fragments from current stage preset
  const stageFragments = useMemo(() => {
    if (!memoryFragmentsEnabled) return [];

    const preset = getPreset(currentStage);
    const fragments = preset?.memoryFragments || [];

    // Enhanced fragment data with metadata
    return fragments.map((fragment, index) => ({
      id: `${currentStage}-fragment-${index}`,
      content: fragment,
      stageOrigin: currentStage,
      index,
      isExplored: userEngagement.fragmentsExplored.includes(`${currentStage}-fragment-${index}`),
    }));
  }, [currentStage, memoryFragmentsEnabled, userEngagement.fragmentsExplored]);

  // ✅ ENHANCED: Mouse tracking for tooltip positioning
  useEffect(() => {
    const handleMouseMove = e => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (memoryFragmentsEnabled && stageFragments.length > 0) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [memoryFragmentsEnabled, stageFragments.length]);

  // ✅ NEW: Fragment interaction handlers
  const handleFragmentHover = fragment => {
    setActiveFragment(fragment);
  };

  const handleFragmentLeave = () => {
    setActiveFragment(null);
  };

  const handleFragmentClick = fragment => {
    // ✅ INTEGRATED: Use store's fragment management
    activateMemoryFragment(fragment.id);

    // Add haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    console.log(`🧠 Memory fragment activated: ${fragment.content}`);
  };

  // ✅ FEATURE GATE: Don't render if feature not enabled
  if (!memoryFragmentsEnabled || stageFragments.length === 0) {
    return null;
  }

  // ✅ ENHANCED: Stage-specific positioning
  const getFragmentPosition = (fragment, index) => {
    const basePositions = {
      genesis: [
        { left: '15%', top: '25%' },
        { left: '85%', top: '30%' },
        { left: '50%', top: '70%' },
      ],
      silent: [
        { left: '20%', top: '40%' },
        { left: '80%', top: '20%' },
        { left: '60%', top: '75%' },
      ],
      awakening: [
        { left: '25%', top: '20%' },
        { left: '75%', top: '35%' },
        { left: '45%', top: '65%' },
      ],
      acceleration: [
        { left: '30%', top: '30%' },
        { left: '70%', top: '25%' },
        { left: '50%', top: '60%' },
      ],
      transcendence: [
        { left: '35%', top: '15%' },
        { left: '65%', top: '40%' },
        { left: '50%', top: '75%' },
      ],
    };

    const positions = basePositions[currentStage] || basePositions.genesis;
    return positions[index] || { left: `${20 + index * 25}%`, top: `${30 + index * 15}%` };
  };

  return (
    <>
      {/* ✅ ENHANCED: Memory Fragment Triggers */}
      {stageFragments.map(fragment => {
        const position = getFragmentPosition(fragment, fragment.index);
        const isExplored = fragment.isExplored;
        const isActive = activeMemoryFragment === fragment.id;

        return (
          <div
            key={fragment.id}
            className={`memory-trigger ${isExplored ? 'explored' : ''} ${isActive ? 'active' : ''}`}
            style={{
              position: 'fixed',
              width: '14px',
              height: '14px',
              background: isExplored
                ? 'radial-gradient(circle, rgba(13, 148, 136, 0.8) 0%, rgba(13, 148, 136, 0.3) 70%, transparent 100%)'
                : 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 70%, transparent 100%)',
              borderRadius: '50%',
              zIndex: 15,
              cursor: 'pointer',
              left: position.left,
              top: position.top,
              animation: `memory-pulse-${fragment.index} ${2 + fragment.index * 0.5}s ease-in-out infinite`,
              transition: 'all 0.3s ease',
              border: isActive ? '2px solid rgba(13, 148, 136, 0.8)' : 'none',
              boxShadow: isExplored
                ? '0 0 10px rgba(13, 148, 136, 0.4)'
                : '0 0 8px rgba(255, 255, 255, 0.2)',
            }}
            onMouseEnter={() => handleFragmentHover(fragment)}
            onMouseLeave={handleFragmentLeave}
            onClick={() => handleFragmentClick(fragment)}
            onMouseMove={e => e.stopPropagation()}
            title={`Memory Fragment: ${fragment.content.substring(0, 50)}...`}
          />
        );
      })}

      {/* ✅ ENHANCED: Active Memory Fragment Tooltip */}
      {activeFragment && (
        <div
          className="memory-fragment-tooltip"
          style={{
            position: 'fixed',
            left: Math.min(mousePosition.x + 15, window.innerWidth - 280),
            top: Math.max(mousePosition.y - 10, 10),
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            maxWidth: '280px',
            zIndex: 25,
            border: activeFragment.isExplored
              ? '1px solid rgba(13, 148, 136, 0.5)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(15px)',
            fontFamily: '"Courier New", monospace',
            pointerEvents: 'none',
            animation: 'memory-fade-in 0.3s ease-out',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              marginBottom: '0.5rem',
              fontSize: '0.75rem',
              opacity: 0.7,
              color: activeFragment.isExplored ? '#0D9488' : '#999',
            }}
          >
            {activeFragment.isExplored ? '✓ Explored' : 'Click to explore'} • Stage: {currentStage}
          </div>
          <div>{activeFragment.content}</div>
        </div>
      )}

      {/* ✅ ENHANCED: Stage-specific notification */}
      {memoryFragmentsEnabled && stageFragments.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'rgba(13, 148, 136, 0.9)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            zIndex: 20,
            animation: 'memory-notification-pulse 3s ease-in-out',
            backdropFilter: 'blur(10px)',
          }}
        >
          💭 {stageFragments.length} memory fragment{stageFragments.length !== 1 ? 's' : ''}{' '}
          available
        </div>
      )}

      {/* ✅ ENHANCED: CSS Animations with stage awareness */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
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
            transform: translateY(10px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes memory-notification-pulse {
          0%,
          100% {
            opacity: 0;
            transform: translateY(10px);
          }
          10%,
          90% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .memory-trigger:hover {
          transform: scale(1.6) !important;
          background: radial-gradient(
            circle,
            rgba(13, 148, 136, 0.9) 0%,
            rgba(13, 148, 136, 0.4) 70%,
            transparent 100%
          ) !important;
          box-shadow: 0 0 15px rgba(13, 148, 136, 0.6) !important;
        }

        .memory-trigger.explored:hover {
          background: radial-gradient(
            circle,
            rgba(13, 148, 136, 1) 0%,
            rgba(13, 148, 136, 0.6) 70%,
            transparent 100%
          ) !important;
        }

        .memory-trigger.active {
          animation-play-state: paused !important;
          transform: scale(1.4) !important;
        }

        @media (max-width: 768px) {
          .memory-trigger {
            width: 12px !important;
            height: 12px !important;
          }

          .memory-fragment-tooltip {
            max-width: 220px !important;
            font-size: 0.8rem !important;
            padding: 0.75rem 1rem !important;
          }
        }

        @media (max-width: 480px) {
          .memory-trigger {
            width: 10px !important;
            height: 10px !important;
          }

          .memory-fragment-tooltip {
            max-width: 200px !important;
            font-size: 0.75rem !important;
            padding: 0.5rem 0.75rem !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .memory-trigger {
            animation: none !important;
          }

          .memory-fragment-tooltip {
            animation: none !important;
          }
        }

        @media (hover: none) {
          .memory-trigger:hover {
            transform: scale(1.2) !important;
          }
        }
      `}</style>
    </>
  );
}

export default MemoryFragments;

/*
🎯 CONSOLIDATION UPDATES COMPLETE

✅ INTEGRATED WITH CONSOLIDATED ARCHITECTURE:
- Uses narrativeStore instead of deprecated narrativeTransition
- Integrated with feature gate system (memoryFragments)
- Connected to store's memory fragment management
- Works with canonical stage system

✅ ENHANCED FUNCTIONALITY:
- Stage-specific fragment positioning
- Visual distinction for explored fragments
- Active fragment highlighting
- Improved accessibility and mobile support
- Stage-aware notification system

✅ PERFORMANCE OPTIMIZED:
- Memoized fragment data
- Conditional event listeners
- Reduced re-renders with proper state management

✅ USER EXPERIENCE:
- Better visual feedback for interactions
- Haptic feedback on supported devices
- Responsive design for all screen sizes
- Accessibility considerations

✅ INTEGRATION READY:
- Automatically unlocks at awakening+ stages
- Tracks user engagement in store
- Provides fragment exploration analytics
- Seamless integration with existing UI
*/
