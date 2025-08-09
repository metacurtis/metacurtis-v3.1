// src/App.jsx - FIXED VERSION
import { useEffect } from 'react';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import ExperienceShell from '@/components/ExperienceShell';
import '@/engine/ConsciousnessEngine'; // Just import to initialize it
import { stageAtom } from '@/stores/atoms/stageAtom';

// ADD SMARTCONSOLE HERE - OUTSIDE THE COMPONENT!
if (import.meta.env.DEV) {
  (async () => {
    const { default: initSmartConsole } = await import('./dev/SmartConsole.js');
    initSmartConsole({ agent: 'http://localhost:6998' });
  })();
}

export default function App() {
  useEffect(() => {
    console.log('🚀 App initialized');
    console.log('🎯 ConsciousnessEngine already initialized as singleton');
    
    // The engine is already initialized and listening to BeatBus
    // It's building blueprints automatically
    
    // Expose debug tools
    if (typeof window !== 'undefined') {
      window.testFullSystem = () => {
        console.log('🧪 Testing full system...');
        
        // 1. Start Director if not running
        if (window.theaterDirector && !window.theaterDirector.isRunning) {
          console.log('Starting Director...');
          window.theaterDirector.start();
        }
        
        // 2. Test stage changes after delay
        setTimeout(() => {
          console.log('Testing stage changes...');
          const stages = ['genesis', 'discipline', 'neural', 'velocity'];
          stages.forEach((stage, i) => {
            setTimeout(() => {
              console.log(`Setting stage to ${stage}`);
              window.stageControls.goToStage(i);
            }, i * 2000);
          });
        }, 2000);
      };
      
      console.log('🔧 Test everything: window.testFullSystem()');
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  return <ExperienceShell />;
}