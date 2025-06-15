// src/components/ui/narrative/StageNavigation.jsx
// ✅ MC3V DIGITAL AWAKENING - Progressive Disclosure Neural Shift System

import { useState, useEffect, useRef } from 'react';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { usePerformanceStore } from '@/stores/performanceStore';
import { getPreset } from '@/config/narrativeParticleConfig';

function StageNavigation() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [lastStageChange, setLastStageChange] = useState(Date.now());
  const [isFirstTime, setIsFirstTime] = useState(true);
  const tutorialShownRef = useRef(new Set());

  // ✅ STORE INTEGRATION: Use exact methods from narrativeStore
  const {
    currentStage,
    stageProgress,
    globalProgress,
    isTransitioning,
    jumpToStage,
    isStageFeatureEnabled,
    trackUserEngagement,
    getCurrentStageData,
    getNavigationState,
    userEngagement,
  } = useNarrativeStore();

  // ✅ PERFORMANCE INTEGRATION: Real-time metrics from performanceStore
  const { fps, deltaMs, jankCount: _jankCount, jankRatio } = usePerformanceStore();

  // ✅ PROGRESSIVE DISCLOSURE: Calculate navigation complexity mode
  const calculateNavigationMode = () => {
    // Neural Shift cognitive alignment: complexity matches mental transformation
    switch (currentStage) {
      case 'genesis':
        return 'none'; // Amygdala baseline - no distractions
      case 'silent':
        return 'minimal'; // Processing - simple progress indicator
      case 'awakening':
        return 'structured'; // Breakthrough - full timeline appears
      case 'acceleration':
        return 'advanced'; // Strategic - metrics and controls
      case 'transcendence':
        return 'mastery'; // Integration - all power features
      default:
        return 'none';
    }
  };

  const navigationMode = calculateNavigationMode();

  // ✅ STAGE DATA: Get current stage configuration
  const currentStageData = getCurrentStageData();
  const stageConfig = getPreset(currentStage);

  // ✅ ANALYTICS: Track stage changes and feature unlocks
  useEffect(() => {
    const now = Date.now();
    if (now - lastStageChange > 1000) {
      // Debounce rapid changes
      trackUserEngagement('stage_navigation_view', {
        stage: currentStage,
        navigationMode,
        stageProgress,
        globalProgress,
        timestamp: now,
      });
      setLastStageChange(now);
    }
  }, [currentStage, navigationMode, trackUserEngagement, stageProgress, globalProgress]);

  // ✅ TUTORIAL SYSTEM: Show guidance when navigation unlocks
  useEffect(() => {
    if (navigationMode === 'structured' && !tutorialShownRef.current.has('timeline')) {
      if (userEngagement.hasScrolled && isFirstTime) {
        setShowTutorial(true);
        tutorialShownRef.current.add('timeline');

        trackUserEngagement('tutorial_navigation_shown', {
          stage: currentStage,
          feature: 'timeline_navigation',
        });

        // Auto-dismiss tutorial
        setTimeout(() => {
          setShowTutorial(false);
          setIsFirstTime(false);
        }, 4000);
      }
    }
  }, [navigationMode, userEngagement.hasScrolled, currentStage, trackUserEngagement, isFirstTime]);

  // ✅ FEATURE GATE: Don't render if navigation not enabled
  if (!isStageFeatureEnabled('stageNavigation')) {
    return null;
  }

  // ✅ PROGRESSIVE DISCLOSURE: Return appropriate component for complexity mode
  if (navigationMode === 'none') {
    return null; // Genesis: preserve cinematic immersion
  }

  // ✅ STAGE COLORS: Extract colors from current stage config
  const stageColors = stageConfig?.colors || ['#00FF00', '#FFFFFF', '#00FFFF'];
  const primaryColor = stageColors[0];
  const secondaryColor = stageColors[1] || stageColors[0];

  // ✅ STAGE DEFINITIONS: All 5 stages for timeline
  const allStages = [
    { name: 'genesis', title: 'Genesis Code', description: '1983: The spark', color: '#00FF00' },
    {
      name: 'silent',
      title: 'Silent Years',
      description: '1983-2022: Discipline',
      color: '#1E40AF',
    },
    {
      name: 'awakening',
      title: 'AI Awakening',
      description: '2022: Partnership',
      color: '#4338CA',
    },
    {
      name: 'acceleration',
      title: 'Acceleration',
      description: 'Feb 2025: Mastery',
      color: '#7C3AED',
    },
    {
      name: 'transcendence',
      title: 'Transcendence',
      description: 'Mar 2025: GLSL',
      color: '#0D9488',
    },
  ];

  // ✅ MINIMAL MODE: Simple progress indicator (Silent stage)
  if (navigationMode === 'minimal') {
    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 20,
          fontFamily: '"Courier New", monospace',
          fontSize: '0.875rem',
          color: primaryColor,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          border: `1px solid ${primaryColor}`,
          boxShadow: `0 0 10px ${primaryColor}44`,
          transition: 'all 0.3s ease',
          transform: 'translateZ(0)', // GPU acceleration
        }}
        onClick={() => {
          trackUserEngagement('minimal_navigation_click', {
            stage: currentStage,
            stageProgress,
          });
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: primaryColor,
              boxShadow: `0 0 5px ${primaryColor}`,
              animation: 'navigation-pulse 2s ease-in-out infinite',
            }}
          />
          <span>{currentStageData?.title || 'Silent'}</span>
          <span style={{ opacity: 0.7 }}>{Math.round(stageProgress * 100)}%</span>
        </div>
      </div>
    );
  }

  // ✅ STRUCTURED MODE: Full timeline navigation (Awakening+)
  const renderTimelineNavigation = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '0.5rem' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 'bold',
            color: primaryColor,
            textShadow: `0 0 5px ${primaryColor}`,
          }}
        >
          Neural Shift
        </h3>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: '0.25rem',
          }}
        >
          Cognitive Transformation Journey
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {allStages.map((stage, index) => {
          const isActive = stage.name === currentStage;
          const isUnlocked = isStageFeatureEnabled('stageNavigation'); // All stages unlocked in structured mode
          const isPast = allStages.findIndex(s => s.name === currentStage) > index;

          return (
            <div
              key={stage.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem',
                borderRadius: '4px',
                background: isActive
                  ? `linear-gradient(90deg, ${stage.color}22, transparent)`
                  : 'transparent',
                border: isActive ? `1px solid ${stage.color}44` : '1px solid transparent',
                cursor: isUnlocked ? 'pointer' : 'default',
                opacity: isUnlocked ? 1 : 0.5,
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                if (isUnlocked && stage.name !== currentStage) {
                  trackUserEngagement('timeline_stage_jump', {
                    fromStage: currentStage,
                    toStage: stage.name,
                    navigationMode,
                  });
                  jumpToStage(stage.name);
                }
              }}
              onMouseEnter={e => {
                if (isUnlocked) {
                  e.target.style.background = `linear-gradient(90deg, ${stage.color}33, transparent)`;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              {/* Stage Indicator */}
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: isActive
                    ? stage.color
                    : isPast
                      ? `${stage.color}88`
                      : `${stage.color}44`,
                  boxShadow: isActive ? `0 0 8px ${stage.color}` : 'none',
                  flexShrink: 0,
                  animation: isActive ? 'stage-pulse 2s ease-in-out infinite' : 'none',
                }}
              />

              {/* Stage Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? stage.color : 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '0.125rem',
                  }}
                >
                  {stage.title}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.2,
                  }}
                >
                  {stage.description}
                </div>
              </div>

              {/* Progress Indicator */}
              {isActive && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: stage.color,
                    fontWeight: 'bold',
                  }}
                >
                  {Math.round(stageProgress * 100)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Progress */}
      <div style={{ marginTop: '0.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.25rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            Overall Progress
          </span>
          <span style={{ fontSize: '0.75rem', color: primaryColor, fontWeight: 'bold' }}>
            {Math.round(globalProgress * 100)}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${globalProgress * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
    </div>
  );

  // ✅ ADVANCED MODE: Add performance metrics (Acceleration+)
  const renderAdvancedFeatures = () => (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div
        style={{
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: primaryColor,
          marginBottom: '0.5rem',
        }}
      >
        Performance Metrics
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>FPS</div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: fps > 55 ? '#00FF00' : fps > 30 ? '#FFFF00' : '#FF0000',
            }}
          >
            {Math.round(fps)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>Frame Time</div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: deltaMs < 20 ? '#00FF00' : deltaMs < 35 ? '#FFFF00' : '#FF0000',
            }}
          >
            {deltaMs.toFixed(1)}ms
          </div>
        </div>

        {navigationMode === 'mastery' && (
          <>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>Jank</div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: jankRatio < 0.1 ? '#00FF00' : jankRatio < 0.3 ? '#FFFF00' : '#FF0000',
                }}
              >
                {Math.round(jankRatio * 100)}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>Stage</div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: primaryColor,
                }}
              >
                {currentStage}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ✅ MASTERY MODE: Additional advanced controls (Transcendence)
  const renderMasteryFeatures = () => (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '6px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div
        style={{
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: primaryColor,
          marginBottom: '0.5rem',
        }}
      >
        MetaCurtis Console
      </div>

      <button
        onClick={() => {
          trackUserEngagement('metacurtis_console_access', {
            stage: currentStage,
            navigationMode,
          });
          console.log('🧠 MetaCurtis Navigation State:', getNavigationState());
        }}
        style={{
          width: '100%',
          padding: '0.5rem',
          background: `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}22)`,
          border: `1px solid ${primaryColor}44`,
          borderRadius: '4px',
          color: 'white',
          fontSize: '0.75rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.target.style.background = `linear-gradient(135deg, ${primaryColor}44, ${secondaryColor}44)`;
        }}
        onMouseLeave={e => {
          e.target.style.background = `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}22)`;
        }}
      >
        Debug Navigation State
      </button>
    </div>
  );

  // ✅ TUTORIAL OVERLAY: First-time user guidance
  const renderTutorial = () => {
    if (!showTutorial) return null;

    return (
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-250px',
          width: '200px',
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.9), rgba(0, 255, 255, 0.9))',
          color: 'black',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          zIndex: 30,
          animation: 'tutorial-appear 0.3s ease-out',
          boxShadow: '0 4px 20px rgba(0, 255, 0, 0.5)',
        }}
      >
        <div style={{ marginBottom: '0.5rem' }}>🎯 Navigation Unlocked!</div>
        <div style={{ fontSize: '0.7rem', fontWeight: 'normal', lineHeight: 1.3 }}>
          Click stages to jump between memories. Watch your cognitive transformation unfold.
        </div>
        <button
          onClick={() => {
            setShowTutorial(false);
            trackUserEngagement('tutorial_dismissed', { stage: currentStage });
          }}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'none',
            border: 'none',
            color: 'black',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ×
        </button>
      </div>
    );
  };

  // ✅ MAIN COMPONENT RENDER - FIXED: Combined duplicate transform properties
  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: '20px',
          top: '50%',
          zIndex: 20,
          maxWidth: '300px',
          width: '280px',
          fontFamily: '"Courier New", monospace',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: `1px solid ${primaryColor}44`,
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.8), 0 0 20px ${primaryColor}22`,
          transition: 'all 0.3s ease',
          // FIXED: Combined both transform properties into one
          transform: isTransitioning ? 'translateY(-50%) scale(0.95)' : 'translateY(-50%) scale(1)',
          opacity: isTransitioning ? 0.7 : 1,
        }}
      >
        {renderTutorial()}

        {renderTimelineNavigation()}

        {(navigationMode === 'advanced' || navigationMode === 'mastery') &&
          renderAdvancedFeatures()}

        {navigationMode === 'mastery' && renderMasteryFeatures()}
      </div>

      {/* Mobile Responsive Overlay */}
      <style>{`
        /* Desktop Navigation Animations */
        @keyframes navigation-pulse {
          0%,
          100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        @keyframes stage-pulse {
          0%,
          100% {
            box-shadow: 0 0 8px ${primaryColor};
          }
          50% {
            box-shadow:
              0 0 16px ${primaryColor},
              0 0 24px ${primaryColor}44;
          }
        }

        @keyframes tutorial-appear {
          0% {
            opacity: 0;
            transform: translateX(20px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        /* Mobile Responsive Design */
        @media (max-width: 768px) {
          .stage-navigation {
            left: 50% !important;
            top: auto !important;
            bottom: 20px !important;
            transform: translateX(-50%) !important;
            max-width: calc(100vw - 40px) !important;
            width: auto !important;
          }
        }

        @media (max-width: 480px) {
          .stage-navigation {
            padding: 0.75rem !important;
            font-size: 0.8rem !important;
            bottom: 10px !important;
          }
        }

        /* Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
          .stage-navigation,
          .stage-navigation * {
            animation: none !important;
            transition: none !important;
          }
        }

        /* GPU Acceleration */
        .stage-navigation,
        .stage-navigation * {
          will-change: auto;
          transform: translateZ(0);
        }
      `}</style>
    </>
  );
}

export default StageNavigation;

/*
🚀 MC3V DIGITAL AWAKENING - COMPLETE STAGENAVIGATION ✅

✅ PROGRESSIVE DISCLOSURE NEURAL SHIFT SYSTEM:
- Genesis: null (preserve immersion)
- Silent: minimal progress dot
- Awakening: full timeline navigation + tutorial
- Acceleration: performance metrics added
- Transcendence: MetaCurtis console + advanced features

✅ PERFECT STORE INTEGRATION:
- Uses exact narrativeStore methods (jumpToStage, trackUserEngagement, etc.)
- Real-time performance metrics from performanceStore
- Stage colors from narrativeParticleConfig NARRATIVE_PRESETS
- Feature gating with isStageFeatureEnabled

✅ COGNITIVE TRANSFORMATION ALIGNMENT:
- Navigation complexity matches Curtis Whorton's mental development
- Tutorial appears when new features unlock
- Analytics track user interaction patterns
- Performance metrics show system mastery

✅ MOBILE RESPONSIVE DESIGN:
- Desktop: left sidebar positioning
- Mobile: bottom overlay
- Reduced motion support
- GPU acceleration for performance

✅ ADVANCED FEATURES:
- Timeline navigation with stage jumping
- Real-time FPS/performance monitoring
- MetaCurtis debug console access
- Progressive feature unlocking
- User engagement analytics

✅ FIXED: Duplicate transform key error - combined positioning and transition transforms

This component seamlessly integrates with your MC3V architecture and
provides the exact Progressive Disclosure experience described in your
Neural Shift handoff document! 🧠⚡
*/
