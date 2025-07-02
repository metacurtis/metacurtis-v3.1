// src/components/consciousness/ConsciousnessTheater.jsx
// ✅ CONSCIOUSNESS THEATER MAIN CONTAINER - SST v2.0 Implementation
// MetaCurtis Consciousness Theater: Complete consciousness evolution system

import { useEffect, useState } from 'react';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { CONSCIOUSNESS_STAGES, MC3V_STAGE_ORDER } from '@/config/consciousness/consciousnessStages';

function ConsciousnessTheater() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ✅ STORE INTEGRATION: Use existing narrative store with 7-stage enhancement
  const { 
    currentStage, 
    stageProgress, 
    jumpToStage 
  } = useNarrativeStore();

  // ✅ CONSCIOUSNESS THEATER INITIALIZATION
  useEffect(() => {
    console.log('🧠 Consciousness Theater: Initializing...');
    
    // Validate current stage against SST v2.0
    const validStage = MC3V_STAGE_ORDER.includes(currentStage) ? currentStage : 'genesis';
    
    if (validStage !== currentStage) {
      console.log(`🔄 Consciousness Theater: Correcting stage ${currentStage} → ${validStage}`);
      jumpToStage(validStage);
    }
    
    setIsInitialized(true);
    console.log(`🎭 Consciousness Theater: Active - Stage ${validStage}`);
  }, [currentStage, jumpToStage]);

  // ✅ STAGE CONFIGURATION
  const stageIndex = MC3V_STAGE_ORDER.indexOf(currentStage);
  const stageConfig = CONSCIOUSNESS_STAGES[stageIndex] || CONSCIOUSNESS_STAGES[0];

  if (!isInitialized) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw', 
        height: '100vh',
        background: '#000',
        zIndex: 10
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#00FF00',
          fontFamily: 'Courier New, monospace'
        }}>
          Initializing Consciousness Theater...
        </div>
      </div>
    );
  }

  return (
    <div className="consciousness-theater">
      {/* ✅ CONSCIOUSNESS THEATER MAIN CONTAINER */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#000',
          zIndex: 1
        }}
      >
        {/* ✅ STAGE DEBUG INFO (Development) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            color: stageConfig.colors[0],
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            zIndex: 20,
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '0.5rem',
            borderRadius: '4px'
          }}>
            <div>Stage: {stageConfig.name} ({stageIndex})</div>
            <div>Progress: {Math.round(stageProgress * 100)}%</div>
            <div>Brain Region: {stageConfig.brainRegion}</div>
            <div>Particles: {stageConfig.particles}</div>
          </div>
        )}

        {/* ✅ PARTICLE SYSTEM PLACEHOLDER */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: stageConfig.colors[0],
          fontFamily: 'Courier New, monospace',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            {stageConfig.title}
          </div>
          <div style={{ fontSize: '1rem', opacity: 0.8 }}>
            {stageConfig.narrative}
          </div>
          <div style={{ fontSize: '0.875rem', marginTop: '1rem', opacity: 0.6 }}>
            Brain Region: {stageConfig.brainRegion}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsciousnessTheater;
