#!/bin/bash
# Strategic debug panel consolidation

cat > src/components/consciousness/ConsciousnessTheater-consolidated.jsx << 'EOFILE'
// ... existing imports ...

// ADD THIS AT TOP - Debug control flag
const DEBUG_CONFIG = {
  showUnified: true,      // Master unified panel
  showPerformance: false, // Separate performance monitor
  showControls: false,    // Keyboard shortcuts
  position: 'top-left'    // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
};

// ... rest of component code until render ...

  // ===== RENDER =====
  return (
    <div className="consciousness-theater-v3">
      {/* Director-controlled Opening Sequence */}
      <OpeningSequence />

      {/* Scroll container */}
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '700vh',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* WebGL Canvas */}
      {showCanvas && (
        <WebGLCanvas
          stage={currentStage}
          morphProgress={morphProgress}
          scrollProgress={scrollProgress}
        />
      )}

      {/* Narrative Overlay */}
      {narrativeEnabled && activeNarrative && <NarrationOverlay segment={activeNarrative} />}

      {/* Memory Fragments */}
      {activeFragments.map(fragment => {
        const state = fragmentStates[fragment.id];
        if (state?.state === 'active') {
          return (
            <MemoryFragmentRenderer
              key={fragment.id}
              fragment={fragment}
              onDismiss={() => dismissFragment(fragment.id)}
            />
          );
        }
        return null;
      })}

      {/* ========== UNIFIED DEBUG PANEL ========== */}
      {import.meta.env.DEV && DEBUG_CONFIG.showUnified && (
        <div
          style={{
            position: 'fixed',
            top: DEBUG_CONFIG.position.includes('top') ? '20px' : 'auto',
            bottom: DEBUG_CONFIG.position.includes('bottom') ? '20px' : 'auto',
            left: DEBUG_CONFIG.position.includes('left') ? '20px' : 'auto',
            right: DEBUG_CONFIG.position.includes('right') ? '20px' : 'auto',
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#00FF00',
            fontFamily: 'Courier New, monospace',
            fontSize: '0.75rem',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #00FF00',
            boxShadow: '0 0 10px rgba(0,255,0,0.2)',
            backdropFilter: 'blur(5px)',
            minWidth: '200px',
            maxWidth: '280px',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div style={{
            borderBottom: '1px solid #00FF00',
            paddingBottom: '6px',
            marginBottom: '8px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>🎬 DIRECTOR CONSOLE</span>
            <span style={{fontSize: '0.7rem', opacity: 0.7}}>SST v3.0</span>
          </div>

          {/* Director Status */}
          <div style={{marginBottom: '8px'}}>
            <div>Phase: <span style={{color: '#00FFCC'}}>{window.theaterDirector?.phase || 'idle'}</span></div>
            <div>Stage: <span style={{color: '#00FFCC'}}>{currentStage} ({Math.round(scrollProgress * 100)}%)</span></div>
            <div>Morph: <span style={{color: morphProgress > 0.5 ? '#FF00FF' : '#00FFCC'}}>{Math.round(morphProgress * 100)}%</span></div>
          </div>

          {/* System Status */}
          <div style={{borderTop: '1px solid rgba(0,255,0,0.3)', paddingTop: '6px', marginTop: '6px'}}>
            <div>Scroll: {scrollEnabled ? '✅ Enabled' : '🔒 Locked'}</div>
            <div>Narrative: {narrativeEnabled ? '✅ Active' : '⏳ Waiting'}</div>
            <div>Canvas: {showCanvas ? '✅ Rendering' : '⏳ Loading'}</div>
          </div>

          {/* Quick Actions */}
          <div style={{borderTop: '1px solid rgba(0,255,0,0.3)', paddingTop: '6px', marginTop: '6px'}}>
            <div style={{fontSize: '0.65rem', opacity: 0.7, marginBottom: '4px'}}>QUICK ACTIONS:</div>
            <div style={{fontSize: '0.7rem'}}>
              <span style={{cursor: 'pointer', marginRight: '8px'}} 
                    onClick={() => window.theaterDirector.restart()}>🔄 Restart</span>
              <span style={{cursor: 'pointer', marginRight: '8px'}}
                    onClick={() => window.showPerformance = !window.showPerformance}>📊 Perf</span>
              <span style={{cursor: 'pointer'}}
                    onClick={() => console.log(window.theaterDirector.getStatus())}>📋 Log</span>
            </div>
          </div>

          {/* Keyboard hint */}
          <div style={{fontSize: '0.6rem', opacity: 0.5, marginTop: '8px', textAlign: 'center'}}>
            Press H to hide • D for details
          </div>
        </div>
      )}

      {/* Performance Monitor - Optional separate panel */}
      {import.meta.env.DEV && (DEBUG_CONFIG.showPerformance || window.showPerformance) && (
        <DevPerformanceMonitor />
      )}

      {/* Controls Helper - Optional */}
      {import.meta.env.DEV && DEBUG_CONFIG.showControls && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#00FF00',
          fontFamily: 'Courier New, monospace',
          fontSize: '0.65rem',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid rgba(0,255,0,0.5)',
          opacity: 0.6,
          zIndex: 100,
        }}>
          <div>← → Stages</div>
          <div>↑ ↓ Morph</div>
          <div>1-7 Jump</div>
        </div>
      )}
    </div>
  );
}
EOFILE

echo "✅ Consolidated debug panels into unified Director Console"
