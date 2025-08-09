// src/components/ExperienceShell.jsx
import { useEffect, useState } from 'react';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import BeatBus from '@modules/orchestration/core/BeatBus';
import { EVENTS } from '@theater/events.js';
import director from '@theater/TheaterDirector.js';
import WebGLCanvas from '@components/webgl/WebGLCanvas';
import OpeningSequence from '@components/theater/OpeningSequence';
import { Canonical } from '@config/canonical/canonicalAuthority';
import { stageAtom } from '@stores/atoms/stageAtom';

export default function ExperienceShell() {
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [currentStage, setCurrentStage] = useState('genesis');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const [directorStarted, setDirectorStarted] = useState(false);

  // START THE DIRECTOR - CRITICAL!
  useEffect(() => {
    console.log('🎬 ExperienceShell: Mounted and starting Director');
    
    // Start Director immediately
    if (!directorStarted) {
      console.log('🚀 Starting Director NOW!');
      try {
        director.start();
        setDirectorStarted(true);
        console.log('✅ Director started successfully');
      } catch (e) {
        console.error('❌ Director start error:', e);
      }
    }
    
    // Listen for Director events
    const handlers = [
      BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
        console.log('📜 Scroll enabled by Director');
        setScrollEnabled(true);
        document.body.style.overflow = '';
      }),
      BeatBus.on(EVENTS.START_NARRATIVE, () => {
        console.log('🎭 Narrative started');
      }),
    ];
    
    // Lock scroll initially
    document.body.style.overflow = 'hidden';
    
    // Safety retry after 1 second
    const retryTimer = setTimeout(() => {
      if (window.theaterDirector && !window.theaterDirector.isRunning) {
        console.log('🔄 Director not running, retrying...');
        try {
          director.start();
        } catch (e) {
          console.error('Retry failed:', e);
        }
      }
    }, 1000);
    
    return () => {
      clearTimeout(retryTimer);
      handlers.forEach(off => off && off());
      document.body.style.overflow = '';
    };
  }, []);

  // Subscribe to stage changes
  useEffect(() => {
    const unsubscribe = stageAtom.subscribe(state => {
      if (state?.currentStage) {
        setCurrentStage(state.currentStage);
      }
    });
    return unsubscribe;
  }, []);

  
  // Scroll handling with debouncing
  useEffect(() => {
    if (!scrollEnabled) return;
    
    const lastStageRef = { current: stageAtom.getCurrentStage() || 'genesis' };
    let lastEmit = 0;
    let ticking = false;
    
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const progress = Math.min(scrollTop / maxScroll, 1);
        
        setScrollProgress(progress);
        setMorphProgress(Math.min(progress * 2, 1));
        
        const scrollPercent = progress * 100;
        const stageCfg = Canonical.getStageByScroll(scrollPercent);
        
        // Debounce stage changes (120ms minimum between changes)
        const now = performance.now();
        if (stageCfg && stageCfg.name !== lastStageRef.current && now - lastEmit > 120) {
          lastStageRef.current = stageCfg.name;
          lastEmit = now;
          stageAtom.setStage(stageCfg.name);
        }
        
        ticking = false;
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollEnabled]); // Only depend on scrollEnabled

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      
      switch(e.key) {
        case 'ArrowRight':
          stageAtom.nextStage();
          break;
        case 'ArrowLeft':
          stageAtom.prevStage();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
          const idx = parseInt(e.key) - 1;
          stageAtom.goToStage(idx);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="experience-shell" style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Opening Sequence - handles Director signals */}
      <OpeningSequence />
      
      {/* Scroll container */}
      <div style={{ 
        position: 'absolute', 
        width: 1, 
        height: '700vh', 
        pointerEvents: 'none', 
        zIndex: -1 
      }} />
      
      {/* WebGL Canvas */}
      <WebGLCanvas 
        stage={currentStage} 
        morphProgress={morphProgress} 
        scrollProgress={scrollProgress} 
      />
      
      {/* Dev Info */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: 'rgba(0,0,0,0.9)',
          color: '#0f0',
          padding: 10,
          fontFamily: 'monospace',
          fontSize: 11,
          borderRadius: 5,
          border: '1px solid #0f0'
        }}>
          <div>Stage: {currentStage}</div>
          <div>Director: {directorStarted ? '✅' : '❌'}</div>
          <div>Scroll: {scrollEnabled ? 'Enabled' : 'Locked'}</div>
        </div>
      )}
    </div>
  );
}