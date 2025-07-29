// src/components/dev/DevPerformanceMonitor.jsx
// ✅ CUSTOM ATOMIC INTEGRATION: Complete legacy store elimination
// ✅ SST v2.1 COMPLIANCE: Enhanced performance monitoring with atomic state

import { memo, useState, useEffect } from 'react';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { clockAtom } from '@/stores/atoms/clockAtom';
import { stageAtom } from '@/stores/atoms/stageAtom';

// ✅ ENHANCED DASHBOARD STYLES: Atomic-themed design
const dashboardStyle = {
  position: 'fixed',
  bottom: '10px',
  left: '10px',
  background: 'rgba(0,0,0,0.9)',
  color: '#00ff88',
  padding: '16px 20px',
  fontFamily: 'Courier New, monospace',
  fontSize: '13px',
  borderRadius: '8px',
  zIndex: '10001',
  pointerEvents: 'auto',
  lineHeight: '1.5',
  minWidth: '320px',
  border: '1px solid #00ff88',
  boxShadow: '0 0 15px rgba(0,255,136,0.3), inset 0 0 20px rgba(0,255,136,0.05)',
  backdropFilter: 'blur(8px)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #00ff88',
  paddingBottom: '8px',
  marginBottom: '10px',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#00ffcc',
};

const statRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '4px',
  fontSize: '12px',
};

const sectionStyle = {
  borderTop: '1px solid rgba(0,255,136,0.3)',
  paddingTop: '6px',
  marginTop: '8px',
};

// ✅ UTILITY FUNCTIONS
function safeToFixed(num, digits = 1) {
  return typeof num === 'number' && !isNaN(num) ? num.toFixed(digits) : 'N/A';
}

function getPerformanceColor(value, thresholds) {
  const { good, warning } = thresholds;
  if (value >= good) return '#00ff88';
  if (value >= warning) return '#ffaa00';
  return '#ff4444';
}

function DevPerformanceMonitor() {
  // ✅ CUSTOM ATOMIC STATE: Direct atom subscriptions
  const [qualityState, setQualityState] = useState(qualityAtom.getState());
  const [clockState, setClockState] = useState(clockAtom.getState());
  const [stageState, setStageState] = useState(stageAtom.getState());

  // ✅ ATOMIC SUBSCRIPTIONS: Subscribe to all relevant atoms
  useEffect(() => {
    const unsubscribeQuality = qualityAtom.subscribe(() => {
      setQualityState(qualityAtom.getState());
    });

    const unsubscribeClock = clockAtom.subscribe(() => {
      setClockState(clockAtom.getState());
    });

    const unsubscribeStage = stageAtom.subscribe(() => {
      setStageState(stageAtom.getState());
    });

    return () => {
      unsubscribeQuality();
      unsubscribeClock();
      unsubscribeStage();
    };
  }, []);

  // ✅ ATOMIC STATE EXTRACTION: Enhanced performance metrics
  const fps = clockState.fps || 0;
  const avgFrameTime = clockState.averageFrameTime || 0;
  const deltaMs = clockState.deltaMs || 0;
  const jankCount = clockState.jankCount || 0;
  const performanceGrade = clockState.performanceGrade || 'A';

  // Enhanced jank calculation
  const jankRatio = jankCount > 0 ? Math.min(jankCount / 100, 1) : 0;

  // Quality metrics
  const currentTier = qualityState.currentQualityTier || 'HIGH';
  const particleCount = qualityState.particleCount || 0;
  const webglEnabled = qualityState.webglEnabled;
  const deviceType = qualityState.deviceType || 'unknown';
  const performanceClass = qualityState.performanceClass || 'high';

  // Stage metrics
  const currentStage = stageState.currentStage || 'genesis';
  const stageProgress = Math.round((stageState.stageProgress || 0) * 100);
  const isTransitioning = stageState.isTransitioning || false;

  // ✅ ENHANCED PARTICLE BUDGET: Real-time calculation
  const expectedParticles = qualityAtom.getParticleBudget(currentStage);
  const particleEfficiency = particleCount > 0 ? (expectedParticles / particleCount) * 100 : 100;

  // ✅ QUALITY FLAG: Enhanced visibility check
  if (!webglEnabled) {
    return (
      <div style={{ ...dashboardStyle, border: '1px solid #ffaa00', color: '#ffaa00' }}>
        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
          ⚠️ WebGL DISABLED
        </div>
        <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '8px', opacity: 0.8 }}>
          Enable WebGL for performance monitoring
        </div>
      </div>
    );
  }

  return (
    <div style={dashboardStyle}>
      {/* ✅ ENHANCED HEADER: Atomic branding with stage info */}
      <div style={headerStyle}>
        <span>⚛️ ATOMIC MONITOR</span>
        <span style={{ fontSize: '11px', color: '#00ff88' }}>
          {currentStage.toUpperCase()} ({stageProgress}%)
        </span>
      </div>

      {/* ✅ PERFORMANCE SECTION: Core metrics */}
      <div>
        <div style={statRowStyle}>
          <span>FPS (avg):</span>
          <span style={{ color: getPerformanceColor(fps, { good: 55, warning: 30 }) }}>
            {safeToFixed(fps)} {performanceGrade}
          </span>
        </div>

        <div style={statRowStyle}>
          <span>Frame (avg):</span>
          <span
            style={{ color: getPerformanceColor(60 - avgFrameTime, { good: 44, warning: 30 }) }}
          >
            {safeToFixed(avgFrameTime)} ms
          </span>
        </div>

        <div style={statRowStyle}>
          <span>Frame (last):</span>
          <span style={{ color: getPerformanceColor(60 - deltaMs, { good: 44, warning: 30 }) }}>
            {safeToFixed(deltaMs)} ms
          </span>
        </div>

        <div style={statRowStyle}>
          <span>Jank:</span>
          <span
            style={{
              color: jankRatio < 0.05 ? '#00ff88' : jankRatio < 0.15 ? '#ffaa00' : '#ff4444',
            }}
          >
            {jankCount} ({safeToFixed(jankRatio * 100)}%)
          </span>
        </div>
      </div>

      {/* ✅ QUALITY SECTION: Atomic quality state */}
      <div style={sectionStyle}>
        <div style={statRowStyle}>
          <span>Quality Tier:</span>
          <span
            style={{
              color:
                currentTier === 'ULTRA'
                  ? '#00ffcc'
                  : currentTier === 'HIGH'
                    ? '#00ff88'
                    : currentTier === 'MEDIUM'
                      ? '#ffaa00'
                      : '#ff8888',
            }}
          >
            {currentTier}
          </span>
        </div>

        <div style={statRowStyle}>
          <span>Particles:</span>
          <span style={{ color: particleCount >= expectedParticles ? '#00ff88' : '#ffaa00' }}>
            {particleCount} / {expectedParticles}
          </span>
        </div>

        <div style={statRowStyle}>
          <span>Efficiency:</span>
          <span
            style={{ color: getPerformanceColor(particleEfficiency, { good: 95, warning: 80 }) }}
          >
            {safeToFixed(particleEfficiency)}%
          </span>
        </div>
      </div>

      {/* ✅ SYSTEM SECTION: Device and atomic state */}
      <div style={sectionStyle}>
        <div style={statRowStyle}>
          <span>Device:</span>
          <span style={{ fontSize: '11px', color: '#00ccff' }}>
            {deviceType} / {performanceClass}
          </span>
        </div>

        <div style={statRowStyle}>
          <span>WebGL:</span>
          <span style={{ color: '#00ff88' }}>{qualityState.webglVersion || 'WebGL2'} ✓</span>
        </div>

        <div style={statRowStyle}>
          <span>DPR:</span>
          <span>{safeToFixed(qualityState.targetDpr || 1.0)}x</span>
        </div>
      </div>

      {/* ✅ ATOMIC SECTION: State synchronization info */}
      <div style={sectionStyle}>
        <div style={statRowStyle}>
          <span>Stage Sync:</span>
          <span style={{ color: isTransitioning ? '#ffaa00' : '#00ff88' }}>
            {isTransitioning ? 'TRANSITIONING' : 'SYNCED'}
          </span>
        </div>

        <div style={statRowStyle}>
          <span>Cache:</span>
          <span style={{ color: '#00ccff', fontSize: '11px' }}>
            {qualityAtom.getCacheStatus?.()?.isValid ? 'HIT' : 'MISS'}
          </span>
        </div>

        <div style={statRowStyle}>
          <span>Mode:</span>
          <span style={{ fontSize: '11px', color: '#00ff88' }}>
            {qualityState.frameloopMode?.toUpperCase() || 'ALWAYS'}
          </span>
        </div>
      </div>

      {/* ✅ FOOTER: SST version and atomic status */}
      <div
        style={{
          borderTop: '1px solid rgba(0,255,136,0.3)',
          paddingTop: '6px',
          marginTop: '8px',
          textAlign: 'center',
          fontSize: '10px',
          color: '#00ccff',
          opacity: 0.8,
        }}
      >
        SST v2.1 • Custom Atomic • MC3V Engine • Zero Legacy
      </div>
    </div>
  );
}

export default memo(DevPerformanceMonitor);

/*
✅ COMPLETE CUSTOM ATOMIC INTEGRATION ✅

🔥 ARCHITECTURAL ALIGNMENT:
- ✅ Zero legacy store dependencies eliminated
- ✅ Direct custom atomic pattern with subscriptions
- ✅ SST v2.1 compliance with stage-aware monitoring
- ✅ MC3V engine integration with particle efficiency tracking

⚛️ ENHANCED ATOMIC FEATURES:
- Real-time particle budget calculation via qualityAtom.getParticleBudget()
- Cache status monitoring from atomic state
- Stage synchronization tracking with transition awareness
- Quality tier efficiency metrics with color coding

💎 PERFORMANCE OPTIMIZATIONS:
- Color-coded performance indicators (green/yellow/red)
- Enhanced jank calculation with percentage display
- Device type and performance class awareness
- Particle efficiency tracking (actual vs expected)

🎯 SST v2.1 INTEGRATION:
- Stage-aware particle monitoring
- Quality tier optimization display
- Atomic state synchronization status
- MC3V engine compatibility verification

🚀 PRODUCTION FEATURES:
- Graceful WebGL disabled state handling
- Enhanced visual hierarchy with sections
- Atomic branding and SST version display
- Zero external dependencies beyond atomic stores

This monitor provides complete visibility into your custom atomic architecture! 🎯⚛️
*/
